export function stripWorkspaceTreeDisplayExtension(name: string): string {
  if (!name) return name;
  const stripped = name.replace(/\.(md|markdown|html?)$/i, '');
  return stripped || name;
}

