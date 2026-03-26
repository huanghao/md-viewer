import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import { stat } from "fs/promises";
import { resolve } from "path";
import { broadcastFileChanged, broadcastFileDeleted } from "./sse.ts";
import { isSupportedTextFile, invalidateFileListCache } from "./utils.ts";
import { dirname } from "path";

let watcher: FSWatcher | null = null;
const watchedPaths = new Set<string>();
const watchedWorkspaceRoots = new Set<string>();

function ensureWatcher() {
  if (watcher) return;

  watcher = chokidar.watch([], {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    }
  });

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
    // 同时失效所有祖先目录的缓存
    for (const root of watchedWorkspaceRoots) {
      if (path.startsWith(root)) invalidateFileListCache(root);
    }
  });

  // 文件删除
  watcher.on('unlink', (path: string) => {
    if (!isSupportedTextFile(path.toLowerCase())) return;
    broadcastFileDeleted(path);
    watchedPaths.delete(path);
    invalidateFileListCache(dirname(path));
    for (const root of watchedWorkspaceRoots) {
      if (path.startsWith(root)) invalidateFileListCache(root);
    }
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
