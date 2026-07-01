export interface SnapshotData {
  exists: true;
  content: string;
  savedAt: number;
}

export async function fetchSnapshot(path: string): Promise<SnapshotData | null> {
  const res = await fetch(`/api/snapshot?path=${encodeURIComponent(path)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.exists ? (data as SnapshotData) : null;
}

/** 保存快照（幂等：服务端仅首次写入）。 */
export async function saveSnapshot(path: string, content: string): Promise<void> {
  await fetch("/api/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  });
}

/** 删除快照（接受/回滚后调用）。 */
export async function deleteSnapshot(path: string): Promise<void> {
  await fetch(`/api/snapshot?path=${encodeURIComponent(path)}`, { method: "DELETE" });
}
