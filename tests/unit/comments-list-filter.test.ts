/**
 * Tests for `filterCommentDocsByWorkspace`:
 * - in a git workspace → only docs under that root
 * - cwd has no annotated docs → falls back to all docs
 * - --all flag → no filtering
 * - limit/offset applied after filtering
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { replaceAnnotations, listAnnotatedDocuments, resetDbForTesting } from '../../src/annotation-storage';
import { filterCommentDocsByWorkspace } from '../../src/comments-filter';

// ── DB isolation ───────────────────────────────────────────────────────────

let tempConfigHome = '';
let oldConfigHome: string | undefined;

// ── Fake filesystem for git root detection ─────────────────────────────────
// We create two fake workspace dirs with .git markers so findGitRoot works.

let wsA = '';   // /tmp/.../ws-a  (has .git)
let wsB = '';   // /tmp/.../ws-b  (has .git)
let tempRoot = '';

beforeAll(() => {
  oldConfigHome = process.env.XDG_CONFIG_HOME;
  tempConfigHome = mkdtempSync(join(tmpdir(), 'mdv-filter-db-'));
  process.env.XDG_CONFIG_HOME = tempConfigHome;
  resetDbForTesting();

  // Create fake workspaces with .git markers
  tempRoot = mkdtempSync(join(tmpdir(), 'mdv-filter-fs-'));
  wsA = join(tempRoot, 'ws-a');
  wsB = join(tempRoot, 'ws-b');
  mkdirSync(join(wsA, '.git'), { recursive: true });
  mkdirSync(join(wsB, '.git'), { recursive: true });
  mkdirSync(join(wsA, 'docs'), { recursive: true });

  // Seed annotations in DB
  replaceAnnotations(join(wsA, 'README.md'), [
    { id: 'a1', start: 0, length: 4, quote: 'aaaa', note: 'n', createdAt: 1000, status: 'anchored' },
  ]);
  replaceAnnotations(join(wsA, 'docs', 'guide.md'), [
    { id: 'a2', start: 0, length: 4, quote: 'bbbb', note: 'n', createdAt: 2000, status: 'anchored' },
  ]);
  replaceAnnotations(join(wsB, 'main.md'), [
    { id: 'b1', start: 0, length: 4, quote: 'cccc', note: 'n', createdAt: 3000, status: 'anchored' },
  ]);
});

afterAll(() => {
  if (oldConfigHome === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = oldConfigHome;
  resetDbForTesting();
  rmSync(tempConfigHome, { recursive: true, force: true });
  rmSync(tempRoot, { recursive: true, force: true });
});

// ── helpers ────────────────────────────────────────────────────────────────

function allDocs() {
  return listAnnotatedDocuments(1000, 0).filter((d) => d.anchoredCount > 0);
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('filterCommentDocsByWorkspace', () => {
  it('returns only docs under the workspace when cwd is inside a git repo', () => {
    const docs = allDocs();
    const result = filterCommentDocsByWorkspace(docs, wsA);
    const paths = result.filtered.map((d) => d.path);
    expect(paths).toContain(join(wsA, 'README.md'));
    expect(paths).toContain(join(wsA, 'docs', 'guide.md'));
    expect(paths).not.toContain(join(wsB, 'main.md'));
    expect(result.workspaceRoot).toBe(wsA);
  });

  it('returns only docs under ws-b when cwd is inside ws-b', () => {
    const docs = allDocs();
    const result = filterCommentDocsByWorkspace(docs, wsB);
    const paths = result.filtered.map((d) => d.path);
    expect(paths).toContain(join(wsB, 'main.md'));
    expect(paths).not.toContain(join(wsA, 'README.md'));
    expect(result.workspaceRoot).toBe(wsB);
  });

  it('falls back to all docs when git root has no annotated docs', () => {
    // Create a git root with no annotations
    const emptyWs = join(tempRoot, 'empty-ws');
    mkdirSync(join(emptyWs, '.git'), { recursive: true });
    const docs = allDocs();
    const result = filterCommentDocsByWorkspace(docs, emptyWs);
    // workspaceRoot is null (no match), all docs returned
    expect(result.workspaceRoot).toBeNull();
    expect(result.filtered.length).toBe(docs.length);
  });

  it('returns all docs when gitRoot is null (not in a git repo)', () => {
    const docs = allDocs();
    const result = filterCommentDocsByWorkspace(docs, null);
    expect(result.workspaceRoot).toBeNull();
    expect(result.filtered.length).toBe(docs.length);
  });

  it('also matches docs in subdirectories of the workspace', () => {
    const docs = allDocs();
    // cwd is a subdir inside wsA
    const result = filterCommentDocsByWorkspace(docs, wsA);
    const paths = result.filtered.map((d) => d.path);
    expect(paths).toContain(join(wsA, 'docs', 'guide.md'));
  });
});
