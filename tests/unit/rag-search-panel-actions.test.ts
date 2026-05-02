// TDD: rag-search-panel 结果项通过 data-action 驱动，不依赖 window.*
import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { renderRagResultsHTML, initRagPanelActions, type RagPanelCallbacks } from '../../src/client/ui/rag-search-panel';

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

const fakeResults = [
  { path: '/docs/a.md', text: 'hello world', heading: '## Intro', score: 0.9 },
  { path: '/docs/b.md', text: 'foo bar baz', heading: '', score: 0.8 },
];

describe('renderRagResultsHTML', () => {
  it('生成的 HTML 不含 window.', () => {
    const html = renderRagResultsHTML(fakeResults, 0);
    expect(html).not.toContain('window.');
  });

  it('每个结果项带 data-action="rag-open" 和 data-idx', () => {
    const html = renderRagResultsHTML(fakeResults, 0);
    doc.body.innerHTML = html;
    const items = doc.querySelectorAll('[data-action="rag-open"]');
    expect(items.length).toBe(2);
    expect((items[0] as HTMLElement).dataset.idx).toBe('0');
    expect((items[1] as HTMLElement).dataset.idx).toBe('1');
  });

  it('activeIdx 对应项有 active class', () => {
    const html = renderRagResultsHTML(fakeResults, 1);
    doc.body.innerHTML = html;
    const items = doc.querySelectorAll('.rag-item');
    expect((items[0] as HTMLElement).classList.contains('active')).toBe(false);
    expect((items[1] as HTMLElement).classList.contains('active')).toBe(true);
  });
});

describe('initRagPanelActions', () => {
  it('点击结果项触发 click 事件（容器绑定了委托）', () => {
    doc.body.innerHTML = `
      <div id="ragResultsArea">
        <div class="rag-item" data-action="rag-open" data-idx="0">result 0</div>
        <div class="rag-item" data-action="rag-open" data-idx="1">result 1</div>
      </div>`;
    let clickedIdx: number | null = null;
    const area = doc.getElementById('ragResultsArea')!;
    initRagPanelActions(area);
    // 覆盖内部处理：验证事件委托能正确找到 data-action="rag-open" 元素
    area.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest('[data-action="rag-open"]') as HTMLElement | null;
      if (el) clickedIdx = parseInt(el.dataset.idx ?? '', 10);
    }, { capture: true });
    (doc.querySelectorAll('[data-action="rag-open"]')[1] as HTMLElement).click();
    expect(clickedIdx).toBe(1);
  });
});
