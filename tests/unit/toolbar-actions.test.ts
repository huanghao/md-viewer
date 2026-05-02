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
    handleDiffButtonClick: mock(() => {}),
    handleRefreshButtonClick: mock(() => {}),
    showSettingsDialog: mock(() => {}),
    toggleMonitorPanel: mock(() => {}),
    switchMonitorTab: mock((_tab: string) => {}),
    switchAnnotationTab: mock((_tab: string) => {}),
    zoomIn: mock(() => {}),
    zoomOut: mock(() => {}),
    setPdfMode: mock((_mode: string) => {}),
    handleTranslateButtonClick: mock(() => {}),
    addFile: mock(() => {}),
    handleUnifiedInputSubmit: mock((_v?: string) => {}),
    dismissQuickActionConfirm: mock(() => {}),
    refreshFile: mock((_path: string) => {}),
  };
}

describe('initToolbarActions — toolbar buttons', () => {
  it('点击 data-action="show-settings" 调用 showSettingsDialog()', () => {
    doc.body.innerHTML = `<button data-action="show-settings">设置</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="show-settings"]') as HTMLElement).click();
    expect(cbs.showSettingsDialog).toHaveBeenCalledTimes(1);
  });

  it('点击 data-action="diff-button" 调用 handleDiffButtonClick()', () => {
    doc.body.innerHTML = `<button data-action="diff-button">Diff</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="diff-button"]') as HTMLElement).click();
    expect(cbs.handleDiffButtonClick).toHaveBeenCalledTimes(1);
  });

  it('点击 data-action="refresh-button" 调用 handleRefreshButtonClick()', () => {
    doc.body.innerHTML = `<button data-action="refresh-button">刷新</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="refresh-button"]') as HTMLElement).click();
    expect(cbs.handleRefreshButtonClick).toHaveBeenCalledTimes(1);
  });

  it('点击 data-action="toggle-monitor" 调用 toggleMonitorPanel()', () => {
    doc.body.innerHTML = `<button data-action="toggle-monitor">监控</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="toggle-monitor"]') as HTMLElement).click();
    expect(cbs.toggleMonitorPanel).toHaveBeenCalledTimes(1);
  });

  it('点击 data-action="switch-monitor-tab" 调用 switchMonitorTab(tab)', () => {
    doc.body.innerHTML = `<button data-action="switch-monitor-tab" data-tab="sessions">Sessions</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="switch-monitor-tab"]') as HTMLElement).click();
    expect(cbs.switchMonitorTab).toHaveBeenCalledWith('sessions');
  });

  it('点击 data-action="zoom-in" 调用 zoomIn()', () => {
    doc.body.innerHTML = `<button data-action="zoom-in">+</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="zoom-in"]') as HTMLElement).click();
    expect(cbs.zoomIn).toHaveBeenCalledTimes(1);
  });

  it('点击 data-action="zoom-out" 调用 zoomOut()', () => {
    doc.body.innerHTML = `<button data-action="zoom-out">-</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="zoom-out"]') as HTMLElement).click();
    expect(cbs.zoomOut).toHaveBeenCalledTimes(1);
  });

  it('点击 data-action="set-pdf-mode" 调用 setPdfMode(mode)', () => {
    doc.body.innerHTML = `<button data-action="set-pdf-mode" data-mode="annotate">批注</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="set-pdf-mode"]') as HTMLElement).click();
    expect(cbs.setPdfMode).toHaveBeenCalledWith('annotate');
  });
});

describe('initToolbarActions — annotation tabs', () => {
  it('点击 data-action="switch-annotation-tab" 调用 switchAnnotationTab(tab)', () => {
    doc.body.innerHTML = `<button data-action="switch-annotation-tab" data-tab="todo">Todo</button>`;
    const cbs = makeCallbacks();
    initToolbarActions(doc.body, cbs);
    (doc.querySelector('[data-action="switch-annotation-tab"]') as HTMLElement).click();
    expect(cbs.switchAnnotationTab).toHaveBeenCalledWith('todo');
  });
});
