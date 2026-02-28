// 文件类型检测工具

/**
 * 获取文件扩展名（小写）
 */
export function getFileExtension(path: string): string {
  const match = path.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * 检查是否为 Markdown 文件
 */
export function isMarkdownFile(path: string): boolean {
  const ext = getFileExtension(path);
  return ext === 'md' || ext === 'markdown';
}

/**
 * 获取文件类型的显示名称
 */
export function getFileTypeLabel(path: string): string | null {
  if (isMarkdownFile(path)) {
    return null; // MD 文件不显示标签
  }

  const ext = getFileExtension(path);
  return ext ? `.${ext}` : null;
}
