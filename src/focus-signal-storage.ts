import { getDb } from "./annotation-db.ts";

export function insertFocusSignal(type: string, file: string): void {
  getDb().prepare(`INSERT INTO focus_signals (ts, type, file) VALUES (?, ?, ?)`).run(Date.now(), type, file);
}

export function queryFocusSignals(days: number): Array<{ ts: number; type: string; file: string }> {
  const cutoff = Date.now() - days * 86400 * 1000;
  return getDb()
    .query(`SELECT ts, type, file FROM focus_signals WHERE ts >= ? ORDER BY ts ASC`)
    .all(cutoff) as Array<{ ts: number; type: string; file: string }>;
}

export function pruneFocusSignals(olderThanDays = 7): void {
  const cutoff = Date.now() - olderThanDays * 86400 * 1000;
  getDb().prepare(`DELETE FROM focus_signals WHERE ts < ?`).run(cutoff);
}
