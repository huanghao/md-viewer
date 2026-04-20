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

