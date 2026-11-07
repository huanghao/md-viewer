// tests/unit/diff-refresh.test.ts
// TDD: 先写失败的测试，再实现
// 测试 diff 模式期间文件再次被修改时自动刷新 diff 界面的逻辑

import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { shouldRefreshDiff, type DiffRefreshDeps } from '../../src/client/ui/diff-refresh';

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
