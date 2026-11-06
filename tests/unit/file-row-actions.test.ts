// 列表行的点击与关闭由 data-action 委托驱动（不依赖 window.* 内联事件）
import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initFileListActions, type FileListCallbacks } from '../../src/client/ui/sidebar';

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

describe('initFileListActions', () => {
  function makeCallbacks(): FileListCallbacks {
    return {
      switchFile: mock((_path: string) => {}),
      removeFile: mock((_path: string) => {}),
    };
  }

  it('点击文件行调用 switchFile(path)', () => {
    doc.body.innerHTML = `
      <aside class="sidebar">
        <div id="fileList">
          <div class="file-item" data-action="switch-file" data-path="/a.md">a.md</div>
        </div>
      </aside>`;
    const cbs = makeCallbacks();
    initFileListActions(cbs);
    (doc.querySelector('[data-action="switch-file"]') as HTMLElement).click();
    expect(cbs.switchFile).toHaveBeenCalledWith('/a.md');
  });

  it('点击关闭按钮调用 removeFile(path)，不触发 switchFile', () => {
    doc.body.innerHTML = `
      <aside class="sidebar">
        <div id="fileList">
          <div class="file-item" data-action="switch-file" data-path="/a.md">
            <span class="close" data-action="remove-file" data-path="/a.md">×</span>
          </div>
        </div>
      </aside>`;
    const cbs = makeCallbacks();
    initFileListActions(cbs);
    (doc.querySelector('[data-action="remove-file"]') as HTMLElement).click();
    expect(cbs.removeFile).toHaveBeenCalledWith('/a.md');
    expect(cbs.switchFile).not.toHaveBeenCalled();
  });
});
