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

/** 链接的 href 经过 marked / 浏览器编码（中文会变成 %E4%BD%BF…），解析前需还原为真实文件名 */
function decodeLinkPath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export function resolveMarkdownLinkPath(href: string, currentFile: string | null): string | null {
  if (!href || !currentFile) return null;
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('pdf://') || href.startsWith('#')) return null;
  const pathOnly = decodeLinkPath(href.split('?')[0].split('#')[0]);
  const lower = pathOnly.toLowerCase();
  if (!lower.endsWith('.md') && !lower.endsWith('.markdown')) return null;
  if (pathOnly.startsWith('/')) return pathOnly;
  const baseDir = currentFile.slice(0, currentFile.lastIndexOf('/'));
  return normalizeJoinedPath(baseDir, pathOnly);
}
