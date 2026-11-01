// TDD: 工具栏和 annotation tabs 按钮通过 data-action 驱动，不依赖 window.*
import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initToolbarActions, type ToolbarCallbacks } from '../../src/client/main-actions';

let win: Window;
let doc: Document;

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
  (globalThis as any).window = win;
  doc.body.innerHTML = '';
});

afterEach(() => {
  doc.body.innerHTML = '';
  win.close();
});

function makeCallbacks(): ToolbarCallbacks {
  return {
    switchAnnotationTab: mock((_tab: string) => {}),
    addFile: mock(() => {}),
    handleUnifiedInputSubmit: mock((_v?: string) => {}),
    dismissQuickActionConfirm: mock(() => {}),
    refreshFile: mock((_path: string) => {}),
  };
}

describe('initToolbarActions — annotation tabs', () => {
  it('点击 data-action="switch-annotation-tab" 调用 switchAnnotationTab(tab)', () => {
    doc.body.innerHTML = `<button data-action="switch-annotation-tab" data-tab="comments">评论</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="switch-annotation-tab"]') as HTMLElement).click();
    expect(cbs.switchAnnotationTab).toHaveBeenCalledWith('comments');
  });
});
