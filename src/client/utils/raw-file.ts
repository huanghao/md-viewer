/**
 * “在浏览器打开”：把本地文件当真页面在新标签页打开。
 * 地址是相对当前页面的 /raw/<绝对路径>，本机、端口转发、反向代理下都成立，不区分环境。
 */
export function rawFileUrl(path: string): string {
  return '/raw' + path.split('/').map(encodeURIComponent).join('/');
}

export function openFileInBrowser(path: string): void {
  if (/^https?:\/\//i.test(path)) {
    window.open(path, '_blank', 'noopener,noreferrer');
    return;
  }
  window.open(rawFileUrl(path), '_blank', 'noopener');
}
