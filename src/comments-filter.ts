import { existsSync } from "fs";
import { join, dirname } from "path";
import type { listAnnotatedDocuments } from "./annotation-storage.ts";

type AnnotatedDoc = ReturnType<typeof listAnnotatedDocuments>[number];

export function findGitRoot(startDir: string): string | null {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, '.git'))) return dir;
    dir = dirname(dir);
  }
  return null;
}

export function filterCommentDocsByWorkspace(
  docs: AnnotatedDoc[],
  gitRoot: string | null,
): { filtered: AnnotatedDoc[]; workspaceRoot: string | null } {
  if (!gitRoot) return { filtered: docs, workspaceRoot: null };
  const prefix = gitRoot + '/';
  const inWorkspace = docs.filter((d) => d.path === gitRoot || d.path.startsWith(prefix));
  if (inWorkspace.length === 0) return { filtered: docs, workspaceRoot: null };
  return { filtered: inWorkspace, workspaceRoot: gitRoot };
}
