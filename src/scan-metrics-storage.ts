import { getDb } from "./annotation-db.ts";

export interface ScanMetricRecord {
  workspaceId: string;
  source: string;
  force: boolean;
  startedAt: number;
  durationMs: number;
  success: boolean;
  fileCount?: number;
  error?: string;
}

export function insertScanMetric(rec: ScanMetricRecord): void {
  getDb()
    .prepare(
      `INSERT INTO scan_metrics (workspace_id, source, force, started_at, duration_ms, success, file_count, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      rec.workspaceId,
      rec.source,
      rec.force ? 1 : 0,
      rec.startedAt,
      rec.durationMs,
      rec.success ? 1 : 0,
      rec.fileCount ?? null,
      rec.error ?? null
    );
}

export function queryScanMetrics(days: number): ScanMetricRecord[] {
  const cutoff = Date.now() - days * 86400 * 1000;
  const rows = getDb()
    .query(
      `SELECT workspace_id, source, force, started_at, duration_ms, success, file_count, error
       FROM scan_metrics WHERE started_at >= ? ORDER BY started_at ASC`
    )
    .all(cutoff) as any[];
  return rows.map((row) => ({
    workspaceId: row.workspace_id,
    source: row.source,
    force: !!row.force,
    startedAt: row.started_at,
    durationMs: row.duration_ms,
    success: !!row.success,
    fileCount: row.file_count ?? undefined,
    error: row.error ?? undefined,
  }));
}

export function pruneScanMetrics(olderThanDays = 30): void {
  const cutoff = Date.now() - olderThanDays * 86400 * 1000;
  getDb().prepare(`DELETE FROM scan_metrics WHERE started_at < ?`).run(cutoff);
}
