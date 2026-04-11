# .mdvignore Multi-level Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support `.mdvignore` files in subdirectories (gitignore-style layering), with filtering applied uniformly before all three views (focus, full tree, list).

**Architecture:** Server-side `scanDirectory` reads `.mdvignore` at each directory level and attaches patterns to that directory's `FileTreeNode`. Client-side, a new `buildIgnoredSet(tree, workspacePath)` utility traverses the tree, accumulates patterns layer by layer, and returns a `Set<string>` of ignored absolute paths. All three views call this function before rendering — the ignored set is the single source of truth.

**Tech Stack:** TypeScript, Bun, bun:test

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/handlers.ts` | Modify | `scanDirectory` reads `.mdvignore` at every dir level, attaches `ignorePatterns` to each dir node |
| `src/client/utils/ignore-filter.ts` | **Create** | `buildIgnoredSet(tree, workspacePath): Set<string>` — single source of truth for ignored paths |
| `src/client/ui/workspace-focus.ts` | Modify | `getActiveFiles` uses `buildIgnoredSet` instead of root-only `ignorePatterns` |
| `src/client/ui/sidebar-workspace.ts` | Modify | `renderTreeNode` skips ignored nodes; `buildSearchTree` filters ignored paths |
| `src/client/workspace.ts` | Modify | `scanWorkspace` / `updateWorkspaceListDiff` filters ignored paths from list diff |
| `tests/unit/ignore-filter.test.ts` | **Create** | Unit tests for `buildIgnoredSet` |
| `tests/unit/workspace-focus-logic.test.ts` | Modify | Extend `getActiveFiles` tests for multi-level ignore |

---

## Task 1: Server — attach `ignorePatterns` to every directory node

**Files:**
- Modify: `src/handlers.ts` (function `scanDirectory`, ~line 583)

- [ ] **Step 1: Write the failing test**

There's no direct unit test for `scanDirectory` (it hits the filesystem), so we verify the shape via the existing `/api/scan-workspace` integration — but we can add a unit-style test by extracting the `.mdvignore` reading logic. For now, the test will be written in Task 3 when we test `buildIgnoredSet` with a tree that has per-directory `ignorePatterns`. **Skip to Step 2.**

- [ ] **Step 2: Modify `scanDirectory` to read `.mdvignore` at every level**

In `src/handlers.ts`, replace the existing post-scan `.mdvignore` block (lines ~565–575) and add per-directory reading inside `scanDirectory`:

```typescript
function scanDirectory(dirPath: string): any {
  const name = basename(dirPath);
  const tree: any = {
    name,
    path: dirPath,
    type: 'directory',
    children: [],
    fileCount: 0
  };

  // Read .mdvignore for this directory (patterns relative to this dir)
  const mdvignorePath = join(dirPath, '.mdvignore');
  if (existsSync(mdvignorePath)) {
    try {
      const raw = readFileSync(mdvignorePath, 'utf-8');
      const patterns = raw.split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
      if (patterns.length > 0) tree.ignorePatterns = patterns;
    } catch { /* ignore */ }
  }

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') ||
          ['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
        continue;
      }

      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subTree = scanDirectory(fullPath);
        if (subTree.fileCount > 0) {
          tree.children.push(subTree);
          tree.fileCount += subTree.fileCount;
        }
      } else if (isSupportedTextFile(entry.name.toLowerCase())) {
        let lastModified = 0;
        try { lastModified = statSync(fullPath).mtimeMs; } catch { /* ignore */ }
        tree.children.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          lastModified,
        });
        tree.fileCount++;
      }
    }

    tree.children.sort((a: any, b: any) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  } catch (error) {
    console.error(`扫描目录失败: ${dirPath}`, error);
  }

  return tree;
}
```

Also **remove** the post-scan `.mdvignore` block in `handleScanWorkspace` (lines ~565–575 in the handler):

```typescript
// DELETE these lines:
// const mdvignorePath = join(resolvedPath, '.mdvignore');
// if (existsSync(mdvignorePath)) { ... tree.ignorePatterns = patterns ... }
```

- [ ] **Step 3: Commit**

```bash
git add src/handlers.ts
git commit -m "feat: read .mdvignore at every directory level during scan"
```

---

## Task 2: Client utility — `buildIgnoredSet`

**Files:**
- Create: `src/client/utils/ignore-filter.ts`
- Create: `tests/unit/ignore-filter.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/ignore-filter.test.ts`:

```typescript
import { describe, expect, it } from 'bun:test';
import type { FileTreeNode } from '../../src/client/types';
import { buildIgnoredSet } from '../../src/client/utils/ignore-filter';

function makeFile(path: string): FileTreeNode {
  return { name: path.split('/').pop()!, path, type: 'file', lastModified: 1000 };
}

function makeDir(path: string, children: FileTreeNode[], ignorePatterns?: string[]): FileTreeNode {
  return { name: path.split('/').pop()!, path, type: 'directory', children, ignorePatterns };
}

const WS = '/ws';

describe('buildIgnoredSet', () => {
  it('returns empty set when no .mdvignore anywhere', () => {
    const tree = makeDir(WS, [makeFile('/ws/a.md'), makeFile('/ws/b.md')]);
    expect(buildIgnoredSet(tree, WS).size).toBe(0);
  });

  it('ignores files matching root-level patterns', () => {
    const tree = makeDir(WS, [makeFile('/ws/TODO.md'), makeFile('/ws/README.md')], ['TODO.md']);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/TODO.md')).toBe(true);
    expect(ignored.has('/ws/README.md')).toBe(false);
  });

  it('ignores files in subdirectory matching root pattern', () => {
    const sub = makeDir('/ws/bots', [makeFile('/ws/bots/exp.md')]);
    const tree = makeDir(WS, [sub], ['bots/']);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/bots/exp.md')).toBe(true);
  });

  it('subdirectory .mdvignore patterns are relative to that directory', () => {
    // /ws/sub/.mdvignore contains "draft.md" — should only match /ws/sub/draft.md
    const sub = makeDir('/ws/sub', [
      makeFile('/ws/sub/draft.md'),
      makeFile('/ws/sub/final.md'),
    ], ['draft.md']);
    const tree = makeDir(WS, [sub, makeFile('/ws/draft.md')]);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/sub/draft.md')).toBe(true);
    expect(ignored.has('/ws/sub/final.md')).toBe(false);
    // root-level draft.md is NOT ignored (no root .mdvignore)
    expect(ignored.has('/ws/draft.md')).toBe(false);
  });

  it('patterns accumulate: root patterns also apply inside subdirectories', () => {
    // Root .mdvignore: *.log — should ignore /ws/sub/app.log too
    const sub = makeDir('/ws/sub', [makeFile('/ws/sub/app.log'), makeFile('/ws/sub/app.md')]);
    const tree = makeDir(WS, [sub], ['*.log']);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/sub/app.log')).toBe(true);
    expect(ignored.has('/ws/sub/app.md')).toBe(false);
  });

  it('subdirectory pattern does NOT leak to sibling directories', () => {
    const a = makeDir('/ws/a', [makeFile('/ws/a/secret.md')], ['secret.md']);
    const b = makeDir('/ws/b', [makeFile('/ws/b/secret.md')]);
    const tree = makeDir(WS, [a, b]);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/a/secret.md')).toBe(true);
    expect(ignored.has('/ws/b/secret.md')).toBe(false);
  });

  it('deeply nested .mdvignore only affects its subtree', () => {
    const deep = makeDir('/ws/a/b', [makeFile('/ws/a/b/skip.md'), makeFile('/ws/a/b/keep.md')], ['skip.md']);
    const a = makeDir('/ws/a', [deep, makeFile('/ws/a/skip.md')]);
    const tree = makeDir(WS, [a]);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/a/b/skip.md')).toBe(true);
    expect(ignored.has('/ws/a/b/keep.md')).toBe(false);
    // /ws/a/skip.md is NOT ignored — the pattern lives in /ws/a/b/
    expect(ignored.has('/ws/a/skip.md')).toBe(false);
  });

  it('multiple patterns in one .mdvignore all apply', () => {
    const tree = makeDir(WS, [
      makeFile('/ws/TODO.md'),
      makeFile('/ws/DRAFT.md'),
      makeFile('/ws/README.md'),
    ], ['TODO.md', 'DRAFT.md']);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/TODO.md')).toBe(true);
    expect(ignored.has('/ws/DRAFT.md')).toBe(true);
    expect(ignored.has('/ws/README.md')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun test tests/unit/ignore-filter.test.ts
```

Expected: all tests fail with `Cannot find module '../../src/client/utils/ignore-filter'`

- [ ] **Step 3: Create `src/client/utils/ignore-filter.ts`**

```typescript
import type { FileTreeNode } from '../types';
import { globToRegex } from '../ui/workspace-focus';

/**
 * Given a FileTreeNode tree (with per-directory ignorePatterns attached by the server),
 * returns a Set of absolute file paths that should be hidden in all views.
 *
 * Semantics (gitignore-style):
 * - Each directory's patterns are relative to that directory.
 * - Patterns accumulate as we descend: a root pattern applies everywhere below.
 * - A subdirectory's pattern does NOT affect sibling directories.
 */
export function buildIgnoredSet(tree: FileTreeNode, workspacePath: string): Set<string> {
  const ignored = new Set<string>();
  collectIgnored(tree, workspacePath, [], ignored);
  return ignored;
}

function collectIgnored(
  node: FileTreeNode,
  dirPath: string,
  inheritedPatterns: Array<{ base: string; pattern: string }>,
  ignored: Set<string>,
): void {
  if (node.type === 'file') {
    // Test this file against all accumulated patterns
    for (const { base, pattern } of inheritedPatterns) {
      const rel = node.path.startsWith(base + '/')
        ? node.path.slice(base.length + 1)
        : node.path;
      if (globToRegex(pattern).test(rel)) {
        ignored.add(node.path);
        return;
      }
    }
    return;
  }

  // Directory: accumulate this dir's own patterns
  const ownPatterns: Array<{ base: string; pattern: string }> = (node.ignorePatterns || [])
    .map((p) => ({ base: node.path, pattern: p }));
  const patterns = [...inheritedPatterns, ...ownPatterns];

  for (const child of node.children || []) {
    collectIgnored(child, node.path, patterns, ignored);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test tests/unit/ignore-filter.test.ts
```

Expected: all tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add src/client/utils/ignore-filter.ts tests/unit/ignore-filter.test.ts
git commit -m "feat: add buildIgnoredSet utility for multi-level .mdvignore"
```

---

## Task 3: Focus view — use `buildIgnoredSet`

**Files:**
- Modify: `src/client/ui/workspace-focus.ts` (function `getActiveFiles`)
- Modify: `tests/unit/workspace-focus-logic.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/workspace-focus-logic.test.ts` inside `describe('getActiveFiles')`:

```typescript
it('respects subdirectory .mdvignore patterns (multi-level)', () => {
  const now = Date.now();
  const sub: FileTreeNode = {
    name: 'sub',
    path: '/ws/sub',
    type: 'directory',
    children: [
      { name: 'secret.md', path: '/ws/sub/secret.md', type: 'file', lastModified: now - 100 },
      { name: 'open.md',   path: '/ws/sub/open.md',   type: 'file', lastModified: now - 100 },
    ],
    ignorePatterns: ['secret.md'],
  };
  const tree: FileTreeNode = {
    name: 'root', path: '/ws', type: 'directory', children: [sub],
  };
  const result = getActiveFiles('/ws', tree, 4 * 3600 * 1000, new Set());
  expect(result.map(f => f.path)).not.toContain('/ws/sub/secret.md');
  expect(result.map(f => f.path)).toContain('/ws/sub/open.md');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun test tests/unit/workspace-focus-logic.test.ts
```

Expected: the new test fails (current code only uses root `ignorePatterns`).

- [ ] **Step 3: Update `getActiveFiles` to use `buildIgnoredSet`**

In `src/client/ui/workspace-focus.ts`:

```typescript
import { buildIgnoredSet } from '../utils/ignore-filter';

export function getActiveFiles(
  workspacePath: string,
  tree: FileTreeNode | undefined,
  windowMs: number,
  pinned: Set<string>
): FileTreeNode[] {
  if (!tree) return [];
  const cutoff = Date.now() - windowMs;
  const ignored = buildIgnoredSet(tree, workspacePath);
  const all = collectFiles(tree);
  return all.filter((f) => {
    if (ignored.has(f.path)) return false;
    if (pinned.has(f.path)) return true;
    if (typeof f.lastModified === 'number' && f.lastModified >= cutoff) return true;
    return false;
  }).sort((a, b) => {
    const aPinned = pinned.has(a.path);
    const bPinned = pinned.has(b.path);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return (b.lastModified || 0) - (a.lastModified || 0);
  });
}
```

Also remove the now-unused `isIgnored` call from `getActiveFiles` (the `isIgnored` function itself can stay — it's tested and used in tests).

- [ ] **Step 4: Run all focus tests to verify they pass**

```bash
bun test tests/unit/workspace-focus-logic.test.ts
```

Expected: all tests pass including the new one.

- [ ] **Step 5: Commit**

```bash
git add src/client/ui/workspace-focus.ts tests/unit/workspace-focus-logic.test.ts
git commit -m "feat: focus view uses buildIgnoredSet for multi-level .mdvignore"
```

---

## Task 4: Full tree view — filter ignored nodes before rendering

**Files:**
- Modify: `src/client/ui/sidebar-workspace.ts` (functions `renderWorkspaceItem`, `renderFileTree`, `renderTreeNode`)

The full tree view renders from `state.fileTree`. We filter at the `renderWorkspaceItem` level by pruning ignored nodes from the tree before passing it to `renderFileTree`. We do **not** mutate `state.fileTree` — we build a filtered copy.

- [ ] **Step 1: Add `pruneIgnored` helper and wire into `renderWorkspaceItem`**

Add a helper at the top of `sidebar-workspace.ts` (after imports):

```typescript
import { buildIgnoredSet } from '../utils/ignore-filter';

/**
 * Returns a shallow-cloned tree with ignored file nodes removed.
 * Empty directories (after pruning) are also removed.
 * Does not mutate the original tree.
 */
function pruneIgnored(node: FileTreeNode, ignored: Set<string>): FileTreeNode | null {
  if (node.type === 'file') {
    return ignored.has(node.path) ? null : node;
  }
  const prunedChildren: FileTreeNode[] = [];
  for (const child of node.children || []) {
    const pruned = pruneIgnored(child, ignored);
    if (pruned) prunedChildren.push(pruned);
  }
  if (prunedChildren.length === 0 && (node.children || []).length > 0) {
    // All children were ignored — drop this directory too
    return null;
  }
  return { ...node, children: prunedChildren };
}
```

In `renderWorkspaceItem`, apply pruning before passing to `renderFileTree`:

```typescript
function renderWorkspaceItem(workspace: Workspace, index: number, total: number, query: string): string {
  const rawTree = query ? buildSearchTree(workspace, query) : state.fileTree.get(workspace.id);

  // Apply multi-level .mdvignore filtering
  let tree: FileTreeNode | undefined = rawTree;
  if (rawTree) {
    const ignored = buildIgnoredSet(rawTree, workspace.path);
    if (ignored.size > 0) {
      tree = pruneIgnored(rawTree, ignored) ?? undefined;
    }
  }

  const shouldExpand = query ? true : workspace.isExpanded;
  // ... rest of function unchanged, uses `tree` instead of `rawTree`
```

Note: `buildSearchTree` returns paths from server search — those paths should also respect ignore. Since `pruneIgnored` runs on the resulting tree, this is handled automatically.

- [ ] **Step 2: Run all unit tests to verify nothing is broken**

```bash
bun test tests/unit/
```

Expected: all 149+ tests pass, 0 fail.

- [ ] **Step 3: Commit**

```bash
git add src/client/ui/sidebar-workspace.ts
git commit -m "feat: full tree view filters ignored files via buildIgnoredSet"
```

---

## Task 5: List view — filter ignored paths from workspace list diff

**Files:**
- Modify: `src/client/workspace.ts` (function `scanWorkspace`)

The list view shows `state.sessionFiles`. Per the design, existing session files are **not** removed (they stay until next reload). The list diff (blue dot for new files) should not mark ignored files as "new". We filter ignored paths out of `collectFilePaths` results before calling `updateWorkspaceListDiff`.

- [ ] **Step 1: Modify `scanWorkspace` to filter ignored paths from list diff**

In `src/client/workspace.ts`, after the tree is built and cached:

```typescript
import { buildIgnoredSet } from './utils/ignore-filter';

// inside scanWorkspace, replace:
updateWorkspaceListDiff(workspaceId, collectFilePaths(tree));

// with:
const ignored = buildIgnoredSet(tree, workspace.path);
const allPaths = collectFilePaths(tree).filter((p) => !ignored.has(p));
updateWorkspaceListDiff(workspaceId, allPaths);
```

- [ ] **Step 2: Run all unit tests**

```bash
bun test tests/unit/
```

Expected: all tests pass, 0 fail.

- [ ] **Step 3: Commit**

```bash
git add src/client/workspace.ts
git commit -m "feat: list view excludes ignored paths from workspace list diff"
```

---

## Task 6: Rebuild client bundle and run full test suite

- [ ] **Step 1: Rebuild the client bundle**

```bash
bun run build:client && bun run scripts/embed-client.ts
```

Expected output ends with: `✅ 客户端脚本已嵌入到: src/client/embedded-client.ts`

- [ ] **Step 2: Run all unit tests**

```bash
bun test tests/unit/
```

Expected: all tests pass, 0 fail.

- [ ] **Step 3: Commit the rebuilt bundle**

```bash
git add src/client/embedded-client.ts
git commit -m "build: rebuild client bundle for multi-level .mdvignore support"
```

---

## Self-Review

**Spec coverage:**
- ✅ Server reads `.mdvignore` at every dir level (Task 1)
- ✅ `buildIgnoredSet` is the single filtering source (Task 2)
- ✅ Focus view uses it (Task 3)
- ✅ Full tree view uses it (Task 4)
- ✅ List view uses it (Task 5)
- ✅ Session files not removed immediately — only list diff filtered (Task 5, design decision)
- ✅ Tests for `buildIgnoredSet` with all multi-level cases (Task 2)

**Placeholder scan:** None found.

**Type consistency:**
- `buildIgnoredSet(tree: FileTreeNode, workspacePath: string): Set<string>` — used consistently in Tasks 2, 3, 4, 5
- `pruneIgnored(node: FileTreeNode, ignored: Set<string>): FileTreeNode | null` — defined and used in Task 4 only
- `globToRegex` imported from `workspace-focus` in `ignore-filter.ts` — already exported there
