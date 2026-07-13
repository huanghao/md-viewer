import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import type { Stats } from "fs";
import { stat } from "fs/promises";
import { resolve } from "path";
import { broadcastFileChanged, broadcastFileDeleted } from "./sse.ts";
import { isSupportedTextFile, invalidateFileListCache } from "./utils.ts";
import { DEFAULT_PATTERNS } from "./workspace-scanner.ts";
import { isKnownExploded, onExploded } from "./scan-guard.ts";
import { dirname } from "path";

// watchWorkspace() 会把整个目录树交给 chokidar 递归监听；不排除的话，node_modules/.git/dist/build
// 这些目录树可能有几万到几十万个文件，usePolling 每 300ms 全部重新 stat 一遍，是服务端 CPU/内存
// 占用的主要来源。workspace-scanner.ts 的目录树展示本就排除了这些目录，这里保持一致。
// chokidar v5 的 ignored 只接受函数/正则/字面路径，不再支持 glob 字符串。
const IGNORED_SEGMENTS = new Set(DEFAULT_PATTERNS);
function isIgnoredPath(path: string, stats?: Stats): boolean {
  if (path.split(/[\\/]/).some((segment) => IGNORED_SEGMENTS.has(segment))) return true;
  if (stats?.isFile() && !isSupportedTextFile(path.toLowerCase())) return true;
  // 熔断：workspace-scanner 运行时发现的"爆炸目录"（叫不出名字、没被上面的
  // 固定名单覆盖），一旦被扫描发现，这里立刻跟着拒绝继续监听，不用等下次改名单再上线。
  return isKnownExploded(path);
}

// 扫描过程中如果动态发现新的爆炸目录，且它已经被 chokidar 加入监听，主动退订，
// 立刻停止对它的 usePolling 轮询，而不是等到下次重启才生效。
// chokidar v4+ 的 unwatch() 不会自动级联到已经发现的子路径，需要用 getWatched()
// 找出这个目录下已被单独追踪的所有子路径，一并退订。
onExploded((dir) => {
  if (!watcher) return;
  const watched = watcher.getWatched();
  const toUnwatch = [dir.path];
  for (const [parent, names] of Object.entries(watched)) {
    if (parent !== dir.path && !parent.startsWith(dir.path + "/")) continue;
    toUnwatch.push(parent);
    for (const name of names) toUnwatch.push(`${parent}/${name}`);
  }
  watcher.unwatch(toUnwatch);
});

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

// vi/vim 等编辑器用 rename 原子保存时，chokidar 的 add 事件在 macOS 上可能延迟数分钟。
// agent 用 unlink+recreate 方式整体重写文件时，网络盘/慢磁盘上两步之间的间隔可能达数秒，
// 窗口太短会把这类"假删除"误判为真删除，弹出"文件已不存在"提示。
// 对已监听文件，unlink 后主动 poll 等文件重新出现，最多等 8 秒，每 50ms 检查一次。
export async function pollForFileReturn(path: string, deadlineMs = 8000, intervalMs = 50): Promise<void> {
  const deadline = Date.now() + deadlineMs;
  const interval = intervalMs;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, interval));
    try {
      const stats = await stat(path);
      // 文件重新出现，重新加入监听并广播变更（unwatch + re-add 确保新 inode 被监听）
      watchedPaths.add(path);
      watcher?.unwatch(path);
      watcher?.add(path);
      broadcastFileChanged(path, stats.mtimeMs);
      return;
    } catch {
      // 文件还没回来，继续等
    }
  }
  // 超时仍未出现，认为是真正删除
  broadcastFileDeleted(path);
  watchedPaths.delete(path);
}

function ensureWatcher() {
  if (watcher) return;

  watcher = chokidar.watch([], {
    persistent: true,
    ignoreInitial: true,
    ignored: isIgnoredPath,
    usePolling: process.env.MDV_USE_POLLING === "1",
    interval: 1000,
    awaitWriteFinish: {
      stabilityThreshold: 200,
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
    // 对已监听文件（如 vi/vim 的 rename 式原子保存），主动 poll 等文件重新出现
    if (watchedPaths.has(path)) {
      pollForFileReturn(path);
    } else {
      atomicDetector.onUnlink(path);
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

  watcher?.add(resolved);
}

/**
 * 从监听列表移除文件
 */
export function unwatchFile(filePath: string): boolean {
  if (!watchedPaths.has(filePath)) {
    return false;
  }

  watchedPaths.delete(filePath);

  if (watcher) {
    watcher.unwatch(filePath);
  }
  return true;
}

export function getWatchedFileCountForTesting(): number {
  return watchedPaths.size;
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
