import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import { stat } from "fs/promises";
import { resolve } from "path";
import { broadcastFileChanged, broadcastFileDeleted } from "./sse.ts";
import { isSupportedTextFile, invalidateFileListCache } from "./utils.ts";
import { dirname } from "path";

/**
 * 原子保存检测器（可独立测试）
 *
 * 编辑器通常用 write-temp + rename 实现原子保存，chokidar 会先触发 unlink 再触发 add。
 * 此函数封装"等待 debounceMs 内是否有 add"的判断逻辑，避免把原子保存误报为文件删除。
 */
export function createAtomicSaveDetector(
  onChanged: (path: string, mtime: number) => void,
  onDeleted: (path: string) => void,
  debounceMs = 300,
) {
  const pending = new Set<string>();

  return {
    onUnlink(path: string) {
      pending.add(path);
      setTimeout(() => {
        if (pending.has(path)) {
          pending.delete(path);
          onDeleted(path);
        }
      }, debounceMs);
    },
    onAdd(path: string, mtime: number) {
      if (pending.has(path)) {
        pending.delete(path);
        onChanged(path, mtime);
      }
    },
  };
}

let watcher: FSWatcher | null = null;
const watchedPaths = new Set<string>();
const watchedWorkspaceRoots = new Set<string>();

function ensureWatcher() {
  if (watcher) return;

  watcher = chokidar.watch([], {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    }
  });

  const atomicDetector = createAtomicSaveDetector(
    async (path, _mtime) => {
      // 原子保存：重新监听并广播 file-changed
      watchedPaths.add(path);
      watcher?.add(path);
      try {
        const stats = await stat(path);
        broadcastFileChanged(path, stats.mtimeMs);
      } catch {
        // 文件已再次消失，忽略
      }
    },
    (path) => {
      // 真正删除
      broadcastFileDeleted(path);
      watchedPaths.delete(path);
    },
  );

  // 文件内容变化
  watcher.on('change', async (path: string) => {
    if (!isSupportedTextFile(path.toLowerCase())) return;
    try {
      const stats = await stat(path);
      broadcastFileChanged(path, stats.mtimeMs);
    } catch (err) {
      console.error(`监听文件变化失败: ${path}`, err);
    }
  });

  // 文件新增
  watcher.on('add', (path: string) => {
    if (!isSupportedTextFile(path.toLowerCase())) return;
    invalidateFileListCache(dirname(path));
    for (const root of watchedWorkspaceRoots) {
      if (path.startsWith(root)) invalidateFileListCache(root);
    }
    atomicDetector.onAdd(path, 0);
  });

  // 文件删除
  watcher.on('unlink', (path: string) => {
    if (!isSupportedTextFile(path.toLowerCase())) return;
    invalidateFileListCache(dirname(path));
    for (const root of watchedWorkspaceRoots) {
      if (path.startsWith(root)) invalidateFileListCache(root);
    }
    atomicDetector.onUnlink(path);
  });
}

/**
 * 添加文件到监听列表
 */
export function watchFile(filePath: string) {
  if (watchedPaths.has(filePath)) {
    return; // 已经在监听了
  }

  watchedPaths.add(filePath);
  ensureWatcher();

  // 添加文件到监听
  watcher?.add(filePath);
}

/**
 * 添加工作区目录到监听列表（监听其中 Markdown/HTML 文件的增删改）
 */
export function watchWorkspace(rootPath: string) {
  const resolved = resolve(rootPath);
  if (watchedWorkspaceRoots.has(resolved)) return;

  watchedWorkspaceRoots.add(resolved);
  ensureWatcher();

  watcher?.add([
    `${resolved}/**/*.md`,
    `${resolved}/**/*.markdown`,
    `${resolved}/**/*.html`,
    `${resolved}/**/*.htm`,
  ]);
}

/**
 * 从监听列表移除文件
 */
export function unwatchFile(filePath: string) {
  if (!watchedPaths.has(filePath)) {
    return;
  }

  watchedPaths.delete(filePath);

  if (watcher) {
    watcher.unwatch(filePath);
  }
}

/**
 * 关闭文件监听器
 */
export async function closeWatcher() {
  if (watcher) {
    await watcher.close();
    watcher = null;
    watchedPaths.clear();
    watchedWorkspaceRoots.clear();
  }
}
