import { describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { setActiveTocItem } from '../../src/client/ui/toc-panel';

function makeContainer(html: string): { doc: Document; container: HTMLElement } {
  const win = new Window({ url: 'http://localhost/' });
  const doc = win.document as unknown as Document;
  const container = doc.createElement('div');
  container.innerHTML = html;
  doc.body.appendChild(container);
  return { doc, container };
}

describe('setActiveTocItem', () => {
  it('标题含引号时不抛异常，按标题文本高亮', () => {
    const { container } = makeContainer(
      '<a class="toc-item" data-anchor="x"><span class="toc-item-title">say "hi"</span></a>' +
      '<a class="toc-item" data-anchor="y"><span class="toc-item-title">plain</span></a>',
    );
    expect(() => setActiveTocItem(container, undefined, 'say "hi"')).not.toThrow();
    const active = container.querySelectorAll('.toc-item.active');
    expect(active.length).toBe(1);
    expect(active[0].textContent).toContain('say "hi"');
  });

  it('锚点含引号时回退到锚点匹配', () => {
    const { container } = makeContainer(
      '<a class="toc-item" data-anchor="a&quot;b"><span class="toc-item-title">t</span></a>',
    );
    setActiveTocItem(container, undefined, 'a"b');
    expect(container.querySelectorAll('.toc-item.active').length).toBe(1);
  });

  it('按页码高亮，并清除之前的高亮', () => {
    const { container } = makeContainer(
      '<a class="toc-item active" data-page="1"></a><a class="toc-item" data-page="3"></a>',
    );
    setActiveTocItem(container, 3);
    const active = container.querySelectorAll('.toc-item.active');
    expect(active.length).toBe(1);
    expect((active[0] as HTMLElement).dataset.page).toBe('3');
  });
});
