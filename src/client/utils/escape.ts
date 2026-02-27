// HTML 转义
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// HTML 属性转义
export function escapeAttr(str: string | null | undefined): string {
  return escapeHtml(str);
}

// JavaScript 单引号字符串转义
export function escapeJsSingleQuoted(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/</g, '\\x3C');
}
