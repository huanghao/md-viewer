// tests/unit/diff-refresh.test.ts
// TDD: 先写失败的测试，再实现
// 测试 diff 模式期间文件再次被修改时自动刷新 diff 界面的逻辑

import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { shouldRefreshDiff, refreshDiffBannerLabel, type DiffRefreshDeps } from '../../src/client/ui/diff-refresh';

let win: Window;
let doc: Document;

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
  (globalThis as any).window = win;
});

afterEach(() => {
  doc.body.innerHTML = '';
  win.close();
});

// ==================== shouldRefreshDiff ====================

describe('shouldRefreshDiff', () => {
  it('diff 未激活时返回 false', () => {
    expect(shouldRefreshDiff({ diffViewActive: false, pendingContent: 'v3' })).toBe(false);
  });

  it('pendingContent 为 undefined 时返回 false', () => {
    expect(shouldRefreshDiff({ diffViewActive: true, pendingContent: undefined })).toBe(false);
  });

  it('diff 激活且有 pendingContent 时返回 true', () => {
    expect(shouldRefreshDiff({ diffViewActive: true, pendingContent: 'v3' })).toBe(true);
  });
});

// ==================== refreshDiffBannerLabel ====================

describe('refreshDiffBannerLabel', () => {
  it('banner 不存在时不报错', () => {
    doc.body.innerHTML = '';
    expect(() => refreshDiffBannerLabel(doc)).not.toThrow();
  });

  it('banner 存在时更新 label 文字', () => {
    doc.body.innerHTML = `
      <div id="diffBanner">
        <span class="diff-banner-label">Diff 模式 · 显示新版本变更</span>
      </div>
    `;
    refreshDiffBannerLabel(doc);
    const label = doc.querySelector('.diff-banner-label');
    expect(label?.textContent).toBe('Diff 模式 · 文件已再次更新，已刷新至最新版本');
  });

  it('多次调用仍保持正确文字', () => {
    doc.body.innerHTML = `
      <div id="diffBanner">
        <span class="diff-banner-label">Diff 模式 · 显示新版本变更</span>
      </div>
    `;
    refreshDiffBannerLabel(doc);
    refreshDiffBannerLabel(doc);
    const label = doc.querySelector('.diff-banner-label');
    expect(label?.textContent).toBe('Diff 模式 · 文件已再次更新，已刷新至最新版本');
  });
});
