// TDD: renderFileRow 生成的 HTML 不含 window.*，用 data-action 驱动
import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { renderFileRow } from '../../src/client/ui/file-row';
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

describe('renderFileRow with data-action', () => {
  it('生成的 HTML 不含 window.', () => {
    const html = renderFileRow('/a.md', 'a.md', undefined, {
      containerClass: 'file-item',
      onClickAction: 'switch-file',
      showPin: false,
      showTime: false,
      indentPx: 0,
      query: '',
      showClose: true,
    });
    expect(html).not.toContain('window.');
  });

  it('外层 div 带 data-action="switch-file" 和 data-path', () => {
    const html = renderFileRow('/a.md', 'a.md', undefined, {
      containerClass: 'file-item',
      onClickAction: 'switch-file',
      showPin: false,
      showTime: false,
      indentPx: 0,
      query: '',
      showClose: false,
    });
    expect(html).toContain('data-action="switch-file"');
    expect(html).toContain('data-path="/a.md"');
  });

  it('关闭按钮带 data-action="remove-file" 和 data-path', () => {
    const html = renderFileRow('/a.md', 'a.md', undefined, {
      containerClass: 'file-item',
      onClickAction: 'switch-file',
      showPin: false,
      showTime: false,
      indentPx: 0,
      query: '',
      showClose: true,
    });
    expect(html).toContain('data-action="remove-file"');
  });
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
      <div id="fileList">
        <div class="file-item" data-action="switch-file" data-path="/a.md">a.md</div>
      </div>`;
    const cbs = makeCallbacks();
    initFileListActions(doc.getElementById('fileList')!, cbs);
    (doc.querySelector('[data-action="switch-file"]') as HTMLElement).click();
    expect(cbs.switchFile).toHaveBeenCalledWith('/a.md');
  });

  it('点击关闭按钮调用 removeFile(path)，不触发 switchFile', () => {
    doc.body.innerHTML = `
      <div id="fileList">
        <div class="file-item" data-action="switch-file" data-path="/a.md">
          <span class="close" data-action="remove-file" data-path="/a.md">×</span>
        </div>
      </div>`;
    const cbs = makeCallbacks();
    initFileListActions(doc.getElementById('fileList')!, cbs);
    (doc.querySelector('[data-action="remove-file"]') as HTMLElement).click();
    expect(cbs.removeFile).toHaveBeenCalledWith('/a.md');
    expect(cbs.switchFile).not.toHaveBeenCalled();
  });
});
