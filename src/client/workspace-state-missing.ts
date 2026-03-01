const workspaceMissingPaths = new Set<string>();

export function markWorkspacePathMissing(path: string): void {
  workspaceMissingPaths.add(path);
}

export function clearWorkspacePathMissing(path: string): void {
  workspaceMissingPaths.delete(path);
}

export function isWorkspacePathMissing(path: string): boolean {
  return workspaceMissingPaths.has(path);
}

export function getWorkspaceMissingPaths(workspacePath?: string): string[] {
  const all = Array.from(workspaceMissingPaths.values());
  if (!workspacePath) return all;
  const prefix = `${workspacePath.replace(/\/+$/, '')}/`;
  return all.filter((p) => p.startsWith(prefix));
}

