export function normalizeJoinedPath(baseDir: string, relativePath: string): string {
  const merged = `${baseDir}/${relativePath}`;
  const isAbsolute = merged.startsWith('/');
  const parts = merged.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
      continue;
    }
    stack.push(part);
  }
  return `${isAbsolute ? '/' : ''}${stack.join('/')}`;
}

export function resolveMarkdownLinkPath(href: string, currentFile: string | null): string | null {
  if (!href || !currentFile) return null;
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('pdf://') || href.startsWith('#')) return null;
  const pathOnly = href.split('?')[0].split('#')[0];
  const lower = pathOnly.toLowerCase();
  if (!lower.endsWith('.md') && !lower.endsWith('.markdown')) return null;
  if (pathOnly.startsWith('/')) return pathOnly;
  const baseDir = currentFile.slice(0, currentFile.lastIndexOf('/'));
  return normalizeJoinedPath(baseDir, pathOnly);
}
