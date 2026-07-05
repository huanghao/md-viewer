// 运行时"爆炸目录"登记表：workspace-scanner 的目录树扫描发现某个目录条目数
// 超过阈值时在这里登记一次，file-watcher 的 chokidar 监听立刻据此退订该路径。
// 两边都读写这张表，但互不 import，避免循环依赖。
//
// 只在内存里，daemon 重启后会清空——重新扫到时，代价只是一次 readdir（不会递归），
// 不是真正的"重新爆炸"，可以接受。

export interface ExplodedDir {
  path: string;
  entryCount: number;
}

type ExplodedListener = (dir: ExplodedDir) => void;

const explodedPaths = new Map<string, ExplodedDir>();
const listeners: ExplodedListener[] = [];

// 登记一个爆炸目录；已登记过的路径不会重复触发监听器。
export function markExploded(path: string, entryCount: number): void {
  if (explodedPaths.has(path)) return;
  const dir: ExplodedDir = { path, entryCount };
  explodedPaths.set(path, dir);
  for (const listener of listeners) listener(dir);
}

// path 本身或其祖先目录是否已被登记为爆炸目录。
export function isKnownExploded(path: string): boolean {
  for (const p of explodedPaths.keys()) {
    if (path === p || path.startsWith(p + "/")) return true;
  }
  return false;
}

export function getExplodedDirs(): ExplodedDir[] {
  return Array.from(explodedPaths.values());
}

// 新登记一个爆炸目录时触发（用于 file-watcher 退订）。
export function onExploded(fn: ExplodedListener): void {
  listeners.push(fn);
}

// 只清空已登记的爆炸目录，不清监听器——onExploded() 注册的是模块间的永久
// 连接（比如 file-watcher.ts 只在加载时注册一次），测试间重复清空会把它冲掉。
export function resetExplodedForTesting(): void {
  explodedPaths.clear();
}
