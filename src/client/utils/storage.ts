export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T, onQuota?: () => void): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      if (onQuota) {
        onQuota();
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (retryError: any) {
          console.error(`[storage] 保存 ${key} 失败（重试后）:`, retryError?.message ?? retryError);
        }
      }
    } else {
      console.error(`[storage] 保存 ${key} 失败:`, e?.message ?? e);
    }
  }
}

export function storageGetNumber(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    const n = Number(JSON.parse(raw));
    return Number.isFinite(n) ? n : fallback;
  } catch {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
}

export function getAllStorageKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore errors
  }
}

// 已下线功能（todo / chat / rag 搜索 / translate / monitor）遗留的 localStorage key 前缀。
// 对应代码已删除，这些 key 不会再被读写，纯粹是历史包袱，开机扫一次清掉即可。
const DEAD_FEATURE_KEY_PREFIXES = [
  'md-viewer:todo',
  'md-viewer:chat-',
  'md-viewer:agent-url',
  'md-viewer:rag-',
  'md-viewer:translate',
  'md-viewer:translation:',
  'md-viewer:memory-monitor',
];

// 过去几次重构里被改名/收编、但旧 key 从没清过的 key（精确匹配，不是前缀）：
// - annotation-panel-open-by-file / toc-open-by-file：曾经按文件路径单独存一条
//   开关状态（Record<string, boolean>），2026-04-20 改成全局单条 key 后旧 key 就
//   废弃了，但旧数据一直留着——按文件数量线性增长，实测能有几十 KB
// - focus-expanded：早期"最近文件"窗口筛选用过，后来被 frecency 打分取代
// - listDiffPaths：早期把"新文件蓝点"状态持久化过，后来改成纯内存态
// - syncState：早期同步状态持久化在客户端，后来搬到服务端 SQLite
const LEGACY_RENAMED_STORAGE_KEYS = [
  'md-viewer:annotation-panel-open-by-file',
  'md-viewer:toc-open-by-file',
  'md-viewer:focus-expanded',
  'md-viewer:listDiffPaths',
  'md-viewer:syncState',
];

export function pruneDeadFeatureStorageKeys(): void {
  for (const key of getAllStorageKeys()) {
    if (
      DEAD_FEATURE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
      LEGACY_RENAMED_STORAGE_KEYS.includes(key)
    ) {
      storageRemove(key);
    }
  }
}

// pdf-zoom/pdf-scroll 是按文件路径单独存一条 key 的，在 removeFile()/cleanupOldFiles()
// 补上清理钩子之前，关闭过的 PDF 会一直留着这两条 key。这里做一次性回收：会话恢复后，
// 把不在当前 sessionPaths 里的 pdf-zoom/pdf-scroll key 全部清掉，处理历史遗留的部分。
const PER_FILE_STORAGE_PREFIXES = ['md-viewer:pdf-zoom:', 'md-viewer:pdf-scroll:'];

export function pruneStalePerFileStorage(sessionPaths: Iterable<string>): void {
  const keep = new Set(sessionPaths);
  for (const key of getAllStorageKeys()) {
    const prefix = PER_FILE_STORAGE_PREFIXES.find((p) => key.startsWith(p));
    if (!prefix) continue;
    const path = key.slice(prefix.length);
    if (!keep.has(path)) storageRemove(key);
  }
}
