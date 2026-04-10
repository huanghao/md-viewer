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
