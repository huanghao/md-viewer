/**
 * Integration tests for workspace file watching behavior.
 *
 * Root cause (confirmed): chokidar glob patterns (e.g. "**\/*.md") only detect
 * new files via 'add', NOT changes to existing files. The fix is to watch the
 * directory itself so 'change' events fire for existing file modifications.
 *
 * These tests use real chokidar + real filesystem to prove the behavior.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import chokidar from 'chokidar';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

let tmpDirs: string[] = [];
function makeTmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mdv-watcher-'));
  tmpDirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
  tmpDirs = [];
});

// ── Documents the bug in the old approach ─────────────────────────────────

describe('glob watch (old approach) — does NOT detect existing file changes', () => {
  it('glob pattern fires no change event when an existing .md file is modified', async () => {
    const root = makeTmpDir();
    mkdirSync(join(root, 'docs'));
    const file = join(root, 'docs', 'existing.md');
    writeFileSync(file, 'v1');

    const events: string[] = [];
    const w = chokidar.watch(`${root}/**/*.md`, {
      persistent: false,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    });
    w.on('change', (p) => events.push(p));
    w.on('add', (p) => events.push(p));

    await sleep(400);
    writeFileSync(file, 'v2');
    await sleep(500);
    await w.close();

    // This is the bug: no change event fires for an existing file
    expect(events.filter(e => e === file)).toHaveLength(0);
  });
});

// ── Correct behavior: directory watch ─────────────────────────────────────

describe('directory watch (new approach) — detects existing file changes', () => {
  it('fires change event when an existing .md file in a subdirectory is modified', async () => {
    const root = makeTmpDir();
    mkdirSync(join(root, 'docs'));
    const file = join(root, 'docs', 'existing.md');
    writeFileSync(file, 'v1');

    const changes: string[] = [];
    const w = chokidar.watch(root, {
      persistent: false,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    });
    w.on('change', (p) => changes.push(p));

    await sleep(400);
    writeFileSync(file, 'v2');
    await sleep(500);
    await w.close();

    expect(changes).toContain(file);
  });

  it('fires add event when a new .md file is created', async () => {
    const root = makeTmpDir();
    mkdirSync(join(root, 'docs'));

    const adds: string[] = [];
    const w = chokidar.watch(root, {
      persistent: false,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    });
    w.on('add', (p) => adds.push(p));

    await sleep(400);
    const newFile = join(root, 'docs', 'new.md');
    writeFileSync(newFile, 'hello');
    await sleep(500);
    await w.close();

    expect(adds).toContain(newFile);
  });

  it('fires change for .html files too', async () => {
    const root = makeTmpDir();
    const file = join(root, 'index.html');
    writeFileSync(file, '<h1>v1</h1>');

    const changes: string[] = [];
    const w = chokidar.watch(root, {
      persistent: false,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    });
    w.on('change', (p) => changes.push(p));

    await sleep(400);
    writeFileSync(file, '<h1>v2</h1>');
    await sleep(500);
    await w.close();

    expect(changes).toContain(file);
  });

  it('non-md/html/json files are filtered out by isSupportedTextFile check', async () => {
    const root = makeTmpDir();
    const txtFile = join(root, 'notes.txt');
    writeFileSync(txtFile, 'v1');

    const filteredChanges: string[] = [];
    const w = chokidar.watch(root, {
      persistent: false,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    });
    // Simulate the isSupportedTextFile filter applied in the change handler
    w.on('change', (p) => {
      const lower = p.toLowerCase();
      if (lower.endsWith('.md') || lower.endsWith('.markdown') ||
          lower.endsWith('.html') || lower.endsWith('.htm') ||
          lower.endsWith('.json') || lower.endsWith('.jsonl')) {
        filteredChanges.push(p);
      }
    });

    await sleep(400);
    writeFileSync(txtFile, 'v2');
    await sleep(500);
    await w.close();

    expect(filteredChanges).toHaveLength(0);
  });
});
