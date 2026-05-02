// TDD: sidebar tabs 按钮通过 data-action + 回调驱动，不依赖 window.*
import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initTabsActions, type TabsCallbacks } from '../../src/client/ui/sidebar';

let win: Window;
let doc: Document;

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
  doc.body.innerHTML = '';
});

afterEach(() => {
  doc.body.innerHTML = '';
  win.close();
});

function makeCallbacks(): TabsCallbacks {
  return {
    switchFile: mock((_path: string) => {}),
    removeFile: mock((_path: string) => {}),
    applyTabBatchAction: mock((_action: string) => {}),
    toggleTabManager: mock(() => {}),
  };
}

describe('initTabsActions — tab clicks', () => {
  it('点击 tab 调用 switchFile(path)', () => {
    doc.body.innerHTML = `
      <div id="tabs">
        <div class="tabs-scroll">
          <div class="tab" data-path="/a.md" data-action="switch-file">a.md</div>
        </div>
      </div>`;
    const cbs = makeCallbacks();
    initTabsActions(doc.getElementById('tabs')!, cbs);
    (doc.querySelector('[data-action="switch-file"]') as HTMLElement).click();
    expect(cbs.switchFile).toHaveBeenCalledWith('/a.md');
  });

  it('点击 tab-close 调用 removeFile(path)，不触发 switchFile', () => {
    doc.body.innerHTML = `
      <div id="tabs">
        <div class="tabs-scroll">
          <div class="tab" data-path="/a.md" data-action="switch-file">
            <span class="tab-close" data-action="remove-file" data-path="/a.md">×</span>
          </div>
        </div>
      </div>`;
    const cbs = makeCallbacks();
    initTabsActions(doc.getElementById('tabs')!, cbs);
    (doc.querySelector('[data-action="remove-file"]') as HTMLElement).click();
    expect(cbs.removeFile).toHaveBeenCalledWith('/a.md');
    expect(cbs.switchFile).not.toHaveBeenCalled();
  });

  it('点击 tab-manager-toggle 调用 toggleTabManager()', () => {
    doc.body.innerHTML = `
      <div id="tabs">
        <button class="tab-manager-toggle" data-action="toggle-tab-manager">≡ Tabs</button>
      </div>`;
    const cbs = makeCallbacks();
    initTabsActions(doc.getElementById('tabs')!, cbs);
    (doc.querySelector('[data-action="toggle-tab-manager"]') as HTMLElement).click();
    expect(cbs.toggleTabManager).toHaveBeenCalledTimes(1);
  });

  it('点击 tab-manager-action 调用 applyTabBatchAction(action)', () => {
    doc.body.innerHTML = `
      <div id="tabs">
        <div class="tab-manager-wrap">
          <button class="tab-manager-action" data-action="batch-action" data-batch="close-others">关闭其他</button>
        </div>
      </div>`;
    const cbs = makeCallbacks();
    initTabsActions(doc.getElementById('tabs')!, cbs);
    (doc.querySelector('[data-action="batch-action"]') as HTMLElement).click();
    expect(cbs.applyTabBatchAction).toHaveBeenCalledWith('close-others');
  });
});

describe('initTabsActions — 不包含 window. 的 HTML', () => {
  it('renderTabsHTML 生成的 HTML 不含 window.', () => {
    const { renderTabsHTML } = require('../../src/client/ui/sidebar');
    const html = renderTabsHTML([
      { path: '/a.md', displayName: 'a.md', name: 'a.md' },
    ], '/a.md', false, { others: 0, right: 0, unmodified: 0, all: 1 });
    expect(html).not.toContain('window.');
  });
});
