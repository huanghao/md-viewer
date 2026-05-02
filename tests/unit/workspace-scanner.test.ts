import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir, homedir } from 'os';
import { join } from 'path';

// Reset cached global patterns between tests
function resetGlobalPatterns() {
  // The module caches _globalPatterns; re-import forces a fresh module instance.
  // Since bun caches modules, we patch the home dir env to point to the temp dir instead.
}

// We need to control the home dir so ~/.mdvignore doesn't interfere.
// Patch homedir by pointing HOME to a temp dir with no .mdvignore.
let tempHome: string;
let tempRoot: string;

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), 'mdv-scanner-home-'));
  tempRoot = mkdtempSync(join(tmpdir(), 'mdv-scanner-'));
  process.env.HOME = tempHome;
});

afterEach(() => {
  rmSync(tempHome, { recursive: true, force: true });
  rmSync(tempRoot, { recursive: true, force: true });
  process.env.HOME = homedir(); // restore
});

// Fresh import each test to reset the _globalPatterns cache
async function getScanner() {
  const mod = await import(`../../src/workspace-scanner.ts?t=${Date.now()}`);
  return mod as typeof import('../../src/workspace-scanner.ts');
}

function write(path: string, content = '') {
  mkdirSync(join(path, '..').replace(/\/\.\.$/, ''), { recursive: true });
  writeFileSync(path, content);
}

describe('collectWorkspaceMdFiles', () => {
  it('collects .md and .markdown files', async () => {
    const { collectWorkspaceMdFiles } = await getScanner();
    write(join(tempRoot, 'a.md'));
    write(join(tempRoot, 'b.markdown'));
    write(join(tempRoot, 'c.txt'));
    const files = collectWorkspaceMdFiles(tempRoot);
    expect(files).toContain(join(tempRoot, 'a.md'));
    expect(files).toContain(join(tempRoot, 'b.markdown'));
    expect(files).not.toContain(join(tempRoot, 'c.txt'));
  });

  it('skips always-skip directories', async () => {
    const { collectWorkspaceMdFiles } = await getScanner();
    write(join(tempRoot, 'node_modules', 'pkg', 'README.md'));
    write(join(tempRoot, 'dist', 'out.md'));
    write(join(tempRoot, 'src', 'doc.md'));
    const files = collectWorkspaceMdFiles(tempRoot);
    expect(files).toContain(join(tempRoot, 'src', 'doc.md'));
    expect(files.some(f => f.includes('node_modules'))).toBe(false);
    expect(files.some(f => f.includes('dist'))).toBe(false);
  });

  it('skips hidden directories', async () => {
    const { collectWorkspaceMdFiles } = await getScanner();
    write(join(tempRoot, '.cache', 'README.md'));
    write(join(tempRoot, 'visible.md'));
    const files = collectWorkspaceMdFiles(tempRoot);
    expect(files).toContain(join(tempRoot, 'visible.md'));
    expect(files.some(f => f.includes('.cache'))).toBe(false);
  });

  it('respects local .mdvignore — skips matching directory', async () => {
    const { collectWorkspaceMdFiles } = await getScanner();
    write(join(tempRoot, 'docs', 'guide.md'));
    write(join(tempRoot, 'data', 'raw.md'));
    writeFileSync(join(tempRoot, '.mdvignore'), 'data\n');
    const files = collectWorkspaceMdFiles(tempRoot);
    expect(files).toContain(join(tempRoot, 'docs', 'guide.md'));
    expect(files.some(f => f.includes('data'))).toBe(false);
  });

  it('respects nested .mdvignore without affecting siblings', async () => {
    const { collectWorkspaceMdFiles } = await getScanner();
    write(join(tempRoot, 'a', 'secret.md'));
    write(join(tempRoot, 'b', 'secret.md'));
    writeFileSync(join(tempRoot, 'a', '.mdvignore'), 'secret.md\n');
    const files = collectWorkspaceMdFiles(tempRoot);
    expect(files).toContain(join(tempRoot, 'b', 'secret.md'));
    expect(files).not.toContain(join(tempRoot, 'a', 'secret.md'));
  });

  it('respects ~/.mdvignore global patterns', async () => {
    const { collectWorkspaceMdFiles } = await getScanner();
    write(join(tempRoot, 'venv', 'notes.md'));
    write(join(tempRoot, 'src', 'main.md'));
    writeFileSync(join(tempHome, '.mdvignore'), 'venv\n');
    const files = collectWorkspaceMdFiles(tempRoot);
    expect(files).toContain(join(tempRoot, 'src', 'main.md'));
    expect(files.some(f => f.includes('venv'))).toBe(false);
  });

  it('returns empty array for non-existent path', async () => {
    const { collectWorkspaceMdFiles } = await getScanner();
    expect(collectWorkspaceMdFiles('/nonexistent/path')).toEqual([]);
  });

  it('supports glob * pattern', async () => {
    const { collectWorkspaceMdFiles } = await getScanner();
    write(join(tempRoot, 'draft-jan.md'));
    write(join(tempRoot, 'draft-feb.md'));
    write(join(tempRoot, 'final.md'));
    writeFileSync(join(tempRoot, '.mdvignore'), 'draft-*\n');
    const files = collectWorkspaceMdFiles(tempRoot);
    expect(files).toContain(join(tempRoot, 'final.md'));
    expect(files.some(f => f.includes('draft-'))).toBe(false);
  });

  it('supports glob **/* pattern for nested paths', async () => {
    const { collectWorkspaceMdFiles } = await getScanner();
    write(join(tempRoot, 'raw', 'a', 'data.md'));
    write(join(tempRoot, 'raw', 'b', 'data.md'));
    write(join(tempRoot, 'docs', 'guide.md'));
    writeFileSync(join(tempRoot, '.mdvignore'), 'raw/**\n');
    const files = collectWorkspaceMdFiles(tempRoot);
    expect(files).toContain(join(tempRoot, 'docs', 'guide.md'));
    expect(files.some(f => f.includes('/raw/'))).toBe(false);
  });
});

describe('scanWorkspaceTree', () => {
  it('returns a tree with correct structure', async () => {
    const { scanWorkspaceTree } = await getScanner();
    write(join(tempRoot, 'README.md'));
    write(join(tempRoot, 'docs', 'guide.md'));
    const tree = scanWorkspaceTree(tempRoot);
    expect(tree.type).toBe('directory');
    expect(tree.fileCount).toBe(2);
    const docs = tree.children?.find(c => c.name === 'docs');
    expect(docs?.type).toBe('directory');
    expect(docs?.children?.some(c => c.name === 'guide.md')).toBe(true);
  });

  it('dirs come before files in children', async () => {
    const { scanWorkspaceTree } = await getScanner();
    write(join(tempRoot, 'z.md'));
    write(join(tempRoot, 'a-dir', 'file.md'));
    const tree = scanWorkspaceTree(tempRoot);
    const first = tree.children?.[0];
    expect(first?.type).toBe('directory');
  });

  it('excludes .mdvignore-matched directories from tree', async () => {
    const { scanWorkspaceTree } = await getScanner();
    write(join(tempRoot, 'data', 'raw.md'));
    write(join(tempRoot, 'docs', 'guide.md'));
    writeFileSync(join(tempRoot, '.mdvignore'), 'data\n');
    const tree = scanWorkspaceTree(tempRoot);
    expect(tree.children?.some(c => c.name === 'data')).toBe(false);
    expect(tree.children?.some(c => c.name === 'docs')).toBe(true);
  });

  it('attaches ignorePatterns to tree node for client-side filtering', async () => {
    const { scanWorkspaceTree } = await getScanner();
    write(join(tempRoot, 'docs', 'guide.md'));
    writeFileSync(join(tempRoot, '.mdvignore'), 'draft\n');
    const tree = scanWorkspaceTree(tempRoot);
    expect(tree.ignorePatterns).toContain('draft');
  });

  it('excludes empty directories from tree', async () => {
    const { scanWorkspaceTree } = await getScanner();
    mkdirSync(join(tempRoot, 'empty-dir'), { recursive: true });
    write(join(tempRoot, 'README.md'));
    const tree = scanWorkspaceTree(tempRoot);
    expect(tree.children?.some(c => c.name === 'empty-dir')).toBe(false);
  });

  it('respects global ~/.mdvignore', async () => {
    const { scanWorkspaceTree } = await getScanner();
    write(join(tempRoot, 'venv', 'notes.md'));
    write(join(tempRoot, 'src', 'main.md'));
    writeFileSync(join(tempHome, '.mdvignore'), 'venv\n');
    const tree = scanWorkspaceTree(tempRoot);
    expect(tree.children?.some(c => c.name === 'venv')).toBe(false);
    expect(tree.children?.some(c => c.name === 'src')).toBe(true);
  });
});
