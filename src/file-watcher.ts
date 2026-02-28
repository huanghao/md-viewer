import chokidar from "chokidar";
import { stat } from "fs/promises";
import { broadcastFileChanged, broadcastFileDeleted } from "./sse.ts";

let watcher: chokidar.FSWatcher | null = null;
const watchedPaths = new Set<string>();

/**
 * 添加文件到监听列表
 */
export function watchFile(filePath: string) {
  if (watchedPaths.has(filePath)) {
    return; // 已经在监听了
  }

  watchedPaths.add(filePath);

  // 如果 watcher 还没创建，创建它
  if (!watcher) {
    watcher = chokidar.watch([], {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    });

    // 文件内容变化
    watcher.on('change', async (path) => {
      try {
        const stats = await stat(path);
        broadcastFileChanged(path, stats.mtimeMs);
      } catch (err) {
        console.error(`监听文件变化失败: ${path}`, err);
      }
    });

    // 文件删除
    watcher.on('unlink', (path) => {
      broadcastFileDeleted(path);
      watchedPaths.delete(path);
    });
  }

  // 添加文件到监听
  watcher.add(filePath);
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
  }
}
