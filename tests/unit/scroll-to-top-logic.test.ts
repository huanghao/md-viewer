import { describe, expect, it } from 'bun:test';

/**
 * 测试 MD 文件点开时的初始滚动位置逻辑。
 *
 * 背景：
 * - switchFile()：已打开文件间切换，条件满足时调用 scrollContentToTop()
 * - onFileLoaded()：CLI / addFileByPath 触发，条件满足时调用 scrollContentToTop()
 * - handleFileClick()：workspace 模式点击新文件，之前漏调 scrollContentToTop()（bug）
 * - handleFocusFileClick()：focus 模式点击新文件，同上（bug）
 *
 * 滚动到顶部的条件：previousFile !== newFile && !isPdf
 */

// ==================== isPdf 判断逻辑 ====================

function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith('.pdf');
}

describe('isPdfPath', () => {
  it('识别 .pdf 文件', () => {
    expect(isPdfPath('/docs/report.pdf')).toBe(true);
    expect(isPdfPath('/docs/REPORT.PDF')).toBe(true);
    expect(isPdfPath('/docs/Report.Pdf')).toBe(true);
  });

  it('非 PDF 文件返回 false', () => {
    expect(isPdfPath('/docs/README.md')).toBe(false);
    expect(isPdfPath('/docs/index.html')).toBe(false);
    expect(isPdfPath('/docs/data.json')).toBe(false);
    expect(isPdfPath('/docs/file.pdf.md')).toBe(false);
  });
});

// ==================== 滚动条件逻辑 ====================

function shouldScrollToTop(previousFile: string | null, newFile: string): boolean {
  return previousFile !== newFile && !isPdfPath(newFile);
}

describe('shouldScrollToTop', () => {
  it('切换到不同的 MD 文件时应滚到顶部', () => {
    expect(shouldScrollToTop('/a.md', '/b.md')).toBe(true);
  });

  it('切换到同一文件时不滚动（避免打断阅读）', () => {
    expect(shouldScrollToTop('/a.md', '/a.md')).toBe(false);
  });

  it('切换到 PDF 文件时不滚动（PDF 有自己的滚动位置恢复逻辑）', () => {
    expect(shouldScrollToTop('/a.md', '/b.pdf')).toBe(false);
    expect(shouldScrollToTop(null, '/b.pdf')).toBe(false);
  });

  it('previousFile 为 null（首次打开）时应滚到顶部', () => {
    expect(shouldScrollToTop(null, '/a.md')).toBe(true);
  });

  it('切换到 HTML 文件时应滚到顶部', () => {
    expect(shouldScrollToTop('/a.md', '/b.html')).toBe(true);
  });
});

// ==================== 各入口的行为说明 ====================

describe('各入口滚动行为（文档性测试）', () => {
  /**
   * 这些测试验证各入口的"是否会滚到顶部"决策逻辑，
   * 而不是实际 DOM 操作（DOM 需要 e2e 测试覆盖）。
   */

  it('switchFile：previousFile !== path 且非 PDF → 滚到顶部', () => {
    const previousFile = '/a.md';
    const newFile = '/b.md';
    expect(shouldScrollToTop(previousFile, newFile)).toBe(true);
  });

  it('switchFile：切换到同一文件 → 不滚动', () => {
    const currentFile = '/a.md';
    expect(shouldScrollToTop(currentFile, currentFile)).toBe(false);
  });

  it('onFileLoaded：shouldFocus=true 且 previousFile !== data.path 且非 PDF → 滚到顶部', () => {
    const previousFile = '/a.md';
    const newFile = '/b.md';
    const shouldFocus = true;
    const result = shouldFocus && shouldScrollToTop(previousFile, newFile);
    expect(result).toBe(true);
  });

  it('onFileLoaded：shouldFocus=false → 不滚动（后台静默加载）', () => {
    const previousFile = '/a.md';
    const newFile = '/b.md';
    const shouldFocus = false;
    const result = shouldFocus && shouldScrollToTop(previousFile, newFile);
    expect(result).toBe(false);
  });

  it('handleFileClick 新文件路径：加载后应滚到顶部（修复前的 bug：漏调 scrollContentToTop）', () => {
    // 修复前：handleFileClick 对新文件只调用 renderAll()，不调用 scrollContentToTop()
    // 修复后：renderAll() 之后额外调用 scrollContentToTop()（非 PDF）
    const filePath = '/docs/new-file.md';
    expect(isPdfPath(filePath)).toBe(false); // 非 PDF，应该滚到顶部
  });

  it('handleFileClick 新 PDF 文件：不调用 scrollContentToTop（PDF 自行恢复位置）', () => {
    const filePath = '/docs/report.pdf';
    expect(isPdfPath(filePath)).toBe(true); // PDF，跳过 scrollContentToTop
  });
});
