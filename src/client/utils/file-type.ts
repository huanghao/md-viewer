// 文件类型检测工具

export function getFileExtension(path: string): string {
  const match = path.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

export function isMarkdownFile(path: string): boolean {
  const ext = getFileExtension(path);
  return ext === 'md' || ext === 'markdown';
}

export function isHtmlFile(path: string): boolean {
  const ext = getFileExtension(path);
  return ext === 'html' || ext === 'htm';
}

export function isJsonFile(path: string): boolean {
  return getFileExtension(path) === 'json';
}

export function isJsonlFile(path: string): boolean {
  return getFileExtension(path) === 'jsonl';
}

export function isPdfFile(path: string): boolean {
  return getFileExtension(path) === 'pdf';
}

export function getFileTypeIcon(path: string): { cls: 'md' | 'html' | 'json' | 'pdf'; label: string } {
  if (isHtmlFile(path)) {
    return { cls: 'html', label: '<>' };
  }
  if (isJsonFile(path) || isJsonlFile(path)) {
    return { cls: 'json', label: '{}' };
  }
  if (isPdfFile(path)) {
    return { cls: 'pdf', label: 'P' };
  }
  return { cls: 'md', label: 'M' };
}

export function getFileTypeLabel(path: string): string | null {
  if (isMarkdownFile(path)) {
    return null;
  }
  const ext = getFileExtension(path);
  return ext ? `.${ext}` : null;
}
