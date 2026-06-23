import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';

// Re-implements the core navigateParagraphBlock logic in isolation
// (avoids diff-view.ts heavy imports; tests the algorithm directly)
function makeNavigator() {
  let currentIndex = -1;

  function navigate(direction: 1 | -1, container: HTMLElement, changedEls?: HTMLElement[]) {
    const blockEls: HTMLElement[] = changedEls ?? Array.from(
      container.querySelectorAll<HTMLElement>('[data-para-changed]')
    );
    const total = blockEls.length;
    if (total === 0) return { total, nextIndex: -1, reason: 'total=0' };

    const nextIndex = currentIndex === -1
      ? (direction === 1 ? 0 : total - 1)
      : Math.max(0, Math.min(total - 1, currentIndex + direction));

    if (nextIndex === currentIndex && currentIndex !== -1) {
      return { total, nextIndex, reason: 'already-there' };
    }

    container.querySelectorAll<HTMLElement>('.diff-focused').forEach(el => {
      el.classList.remove('diff-focused');
    });
    blockEls[nextIndex]?.classList.add('diff-focused');
    currentIndex = nextIndex;

    return { total, nextIndex, reason: 'ok' };
  }

  return { navigate };
}

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

describe('navigateParagraphBlock — core logic', () => {
  function setup(html: string) {
    doc.body.innerHTML = `<div id="content"><div class="markdown-body">${html}</div></div>`;
    return doc.getElementById('content')! as unknown as HTMLElement;
  }

  it('initial nav with changedEls focuses first block', () => {
    const container = setup(`
      <p data-para-changed="true">changed 1</p>
      <p>unchanged</p>
      <p data-para-changed="true">changed 2</p>
    `);
    const nav = makeNavigator();
    const changedEls = Array.from(container.querySelectorAll<HTMLElement>('[data-para-changed]')) as unknown as HTMLElement[];

    const r = nav.navigate(1, container, changedEls);
    expect(r.total).toBe(2);
    expect(r.nextIndex).toBe(0);
    expect(r.reason).toBe('ok');
    expect(container.querySelector('.diff-focused')?.textContent?.trim()).toBe('changed 1');
  });

  it('second nav WITHOUT changedEls moves focus to second block', () => {
    const container = setup(`
      <p data-para-changed="true">changed 1</p>
      <p>unchanged</p>
      <p data-para-changed="true">changed 2</p>
    `);
    const nav = makeNavigator();
    const changedEls = Array.from(container.querySelectorAll<HTMLElement>('[data-para-changed]')) as unknown as HTMLElement[];

    // Simulate initial render navigation
    nav.navigate(1, container, changedEls);

    // Simulate banner ↓ click (no changedEls passed)
    const r = nav.navigate(1, container);
    expect(r.total).toBe(2);
    expect(r.nextIndex).toBe(1);
    expect(r.reason).toBe('ok');

    const focused = container.querySelectorAll('.diff-focused');
    expect(focused.length).toBe(1);
    expect((focused[0] as HTMLElement).textContent?.trim()).toBe('changed 2');
  });

  it('at last block, ↓ stays on last', () => {
    const container = setup(`
      <p data-para-changed="true">a</p>
      <p data-para-changed="true">b</p>
    `);
    const nav = makeNavigator();
    const changedEls = Array.from(container.querySelectorAll<HTMLElement>('[data-para-changed]')) as unknown as HTMLElement[];

    nav.navigate(1, container, changedEls); // → index 0
    nav.navigate(1, container);             // → index 1 (last)
    const r = nav.navigate(1, container);  // → should stay at 1
    expect(r.reason).toBe('already-there');
    expect(container.querySelector('.diff-focused')?.textContent?.trim()).toBe('b');
  });
});
