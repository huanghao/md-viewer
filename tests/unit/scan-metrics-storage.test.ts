import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getDb, resetDbForTesting } from '../../src/annotation-db';
import { insertScanMetric, queryScanMetrics, pruneScanMetrics } from '../../src/scan-metrics-storage';

let tempConfigHome = '';
let oldConfigHome: string | undefined;

beforeAll(() => {
  oldConfigHome = process.env.XDG_CONFIG_HOME;
  tempConfigHome = mkdtempSync(join(tmpdir(), 'mdv-scan-metrics-db-'));
  process.env.XDG_CONFIG_HOME = tempConfigHome;
  resetDbForTesting();
});

afterEach(() => {
  getDb().exec('DELETE FROM scan_metrics');
});

afterAll(() => {
  resetDbForTesting();
  if (oldConfigHome === undefined) {
    delete process.env.XDG_CONFIG_HOME;
  } else {
    process.env.XDG_CONFIG_HOME = oldConfigHome;
  }
  rmSync(tempConfigHome, { recursive: true, force: true });
});

describe('scan-metrics-storage', () => {
  it('inserts and queries records within the time window', () => {
    const now = Date.now();
    insertScanMetric({
      workspaceId: '/tmp/ws-a',
      source: 'warm',
      force: false,
      startedAt: now,
      durationMs: 42,
      success: true,
      fileCount: 10,
    });
    insertScanMetric({
      workspaceId: '/tmp/ws-b',
      source: 'direct',
      force: true,
      startedAt: now,
      durationMs: 500,
      success: false,
      error: 'boom',
    });

    const records = queryScanMetrics(1);
    expect(records.length).toBe(2);

    const ok = records.find((r) => r.workspaceId === '/tmp/ws-a')!;
    expect(ok.source).toBe('warm');
    expect(ok.force).toBe(false);
    expect(ok.success).toBe(true);
    expect(ok.fileCount).toBe(10);

    const failed = records.find((r) => r.workspaceId === '/tmp/ws-b')!;
    expect(failed.force).toBe(true);
    expect(failed.success).toBe(false);
    expect(failed.error).toBe('boom');
  });

  it('excludes records outside the requested day window', () => {
    const eightDaysAgo = Date.now() - 8 * 86400 * 1000;
    insertScanMetric({
      workspaceId: '/tmp/ws-old',
      source: 'warm',
      force: false,
      startedAt: eightDaysAgo,
      durationMs: 10,
      success: true,
    });

    expect(queryScanMetrics(7).length).toBe(0);
    expect(queryScanMetrics(9).length).toBe(1);
  });

  it('prunes records older than the given threshold', () => {
    const now = Date.now();
    const oldTs = now - 40 * 86400 * 1000;
    insertScanMetric({
      workspaceId: '/tmp/ws-recent',
      source: 'warm',
      force: false,
      startedAt: now,
      durationMs: 10,
      success: true,
    });
    insertScanMetric({
      workspaceId: '/tmp/ws-ancient',
      source: 'warm',
      force: false,
      startedAt: oldTs,
      durationMs: 10,
      success: true,
    });

    pruneScanMetrics(30);

    const remaining = queryScanMetrics(365);
    expect(remaining.length).toBe(1);
    expect(remaining[0].workspaceId).toBe('/tmp/ws-recent');
  });
});
