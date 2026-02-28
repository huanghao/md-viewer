/**
 * SVG 图标库
 * Linear 风格：16×16px，1.5px 线宽，简洁现代
 */

/**
 * 设置图标（齿轮）
 */
export function iconSettings(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 8a1.5 1.5 0 00.3-.9l-1.2-.4a4.5 4.5 0 00-.9-1.5l.4-1.2a1.5 1.5 0 00-.6-.8l-1.1.7a4.5 4.5 0 00-1.8 0L7 2.2a1.5 1.5 0 00-.9.3l.4 1.2a4.5 4.5 0 00-1.5.9l-1.2-.4a1.5 1.5 0 00-.8.6l.7 1.1a4.5 4.5 0 000 1.8l-.7 1.1a1.5 1.5 0 00.3.9l1.2.4a4.5 4.5 0 00.9 1.5l-.4 1.2a1.5 1.5 0 00.6.8l1.1-.7a4.5 4.5 0 001.8 0l1.1.7a1.5 1.5 0 00.9-.3l-.4-1.2a4.5 4.5 0 001.5-.9l1.2.4a1.5 1.5 0 00.8-.6l-.7-1.1a4.5 4.5 0 000-1.8l.7-1.1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

/**
 * 刷新图标（圆形箭头）
 */
export function iconRefresh(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8a6 6 0 016-6m6 6a6 6 0 01-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M8 2L6 4l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

/**
 * 同步图标（云上传）
 */
export function iconSync(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 11V5m0 0L6 7m2-2l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13 10.5a3 3 0 00-2-5.5h-.5A5 5 0 003 8a3 3 0 003 5h7a3 3 0 000-2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

/**
 * 成功对勾图标
 */
export function iconCheck(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 4L6 11 3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

/**
 * 加载中图标（旋转圆圈）
 */
export function iconLoading(): string {
  return `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-loading">
      <path d="M8 2a6 6 0 100 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
}

/**
 * 状态指示器 - 橙色圆点（有更新）
 */
export function iconUpdateDot(): string {
  return `
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" class="status-dot">
      <circle cx="4" cy="4" r="3" fill="#ff9500"/>
    </svg>
  `;
}
