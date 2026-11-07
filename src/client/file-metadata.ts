import { state, saveState } from './state';

/** 服务端返回的文件时间信息 */
export interface CreatedTimeInfo {
  createdAt?: number;
  gitCreatedAt?: number;
}

/** 把服务端返回的时间写回已打开的文件；只填充缺失的字段。返回是否有变化。 */
export function applyCreatedTimes(
  files: Map<string, { createdAt?: number | null; gitCreatedAt?: number | null }>,
  result: Record<string, CreatedTimeInfo>,
): boolean {
  let changed = false;
  for (const [path, info] of Object.entries(result)) {
    const file = files.get(path);
    if (!file) continue;
    if (info.createdAt != null && file.createdAt == null) { file.createdAt = info.createdAt; changed = true; }
    if (info.gitCreatedAt != null && file.gitCreatedAt == null) { file.gitCreatedAt = info.gitCreatedAt; changed = true; }
  }
  return changed;
}

/** 为已打开的本地文件补全缺失的 createdAt / gitCreatedAt（后台进行，失败静默） */
export function backfillMissingCreatedTimes(): void {
  const missingTimes = Array.from(state.sessionFiles.values())
    .filter(f => !f.isRemote && (f.createdAt == null || f.gitCreatedAt == null))
    .map(f => f.path);
  if (missingTimes.length === 0) return;
  fetch('/api/file-created-at', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths: missingTimes }),
  }).then(r => r.json()).then((result: Record<string, CreatedTimeInfo>) => {
    if (applyCreatedTimes(state.sessionFiles, result)) saveState();
  }).catch(() => {});
}
