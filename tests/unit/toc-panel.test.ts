import { describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { renderTocPanel, setActiveTocItem } from '../../src/client/ui/toc-panel';
import type { TocItem } from '../../src/client/toc-extractor';

// Each test gets a fresh Window to avoid state leakage
function makeWindow() {
  const win = new Window({ url: 'http://localhost/' });
  const doc = win.document as unknown as Document;
  return { win, doc };
}

function makeContainer(doc: Document): HTMLElement {
  const sidebar = doc.createElement('div');
  sidebar.className = 'sidebar';
  const pane = doc.createElement('div');
  pane.className = 'toc-pane';
  const panel = doc.createElement('div');
  panel.id = 'tocPanel';
  panel.className = 'toc-panel';
  pane.appendChild(panel);
  sidebar.appendChild(pane);
  doc.body.appendChild(sidebar);
  return panel;
}

const sampleMdToc: TocItem[] = [
  {
    title: 'Introduction', level: 1, anchor: 'introduction', children: [
      { title: 'Background', level: 2, anchor: 'background', children: [] },
    ],
  },
  { title: 'Conclusion', level: 1, anchor: 'conclusion', children: [] },
];

const samplePdfToc: TocItem[] = [
  { title: 'Chapter 1', level: 1, pageNum: 1, children: [
    { title: '1.1 Intro', level: 2, pageNum: 3, children: [] },
  ]},
  { title: 'Chapter 2', level: 1, pageNum: 10, children: [] },
];

describe('renderTocPanel', () => {
  it('renders toc items with correct data attributes', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    const items = panel.querySelectorAll('.toc-item');
    expect(items.length).toBe(3);
    expect((items[0] as HTMLElement).dataset.level).toBe('1');
    expect((items[1] as HTMLElement).dataset.level).toBe('2');
  });

  it('adds toc-has-content to sidebar when toc is non-empty', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    const sidebar = panel.parentElement!.parentElement!;
    expect(sidebar.classList.contains('toc-has-content')).toBe(true);
  });

  it('removes toc-has-content from sidebar when toc is empty', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    const sidebar = panel.parentElement!.parentElement!;
    sidebar.classList.add('toc-has-content', 'toc-visible');
    renderTocPanel(panel, [], () => {}, false, doc);
    expect(sidebar.classList.contains('toc-has-content')).toBe(false);
    expect(sidebar.classList.contains('toc-visible')).toBe(false);
  });

  it('shows loading state and removes toc-has-content', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    const sidebar = panel.parentElement!.parentElement!;
    sidebar.classList.add('toc-has-content');
    renderTocPanel(panel, sampleMdToc, () => {}, true, doc);
    expect(panel.querySelector('.toc-empty')?.textContent).toContain('加载');
    expect(sidebar.classList.contains('toc-has-content')).toBe(false);
  });

  it('calls onJump with correct item when toc-item is clicked', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    const jumped: TocItem[] = [];
    renderTocPanel(panel, sampleMdToc, item => jumped.push(item), false, doc);

    const items = panel.querySelectorAll<HTMLElement>('.toc-item');
    items[1].click(); // Background (index 1 in flat order)
    expect(jumped.length).toBe(1);
    expect(jumped[0].title).toBe('Background');
  });

  it('renders page badge for PDF toc items with pageNum', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, samplePdfToc, () => {}, false, doc);
    const badges = panel.querySelectorAll('.toc-page-badge');
    expect(badges.length).toBe(3);
    expect(badges[0].textContent).toBe('1');
    expect(badges[1].textContent).toBe('3');
  });

  it('does not render page badge for MD toc items without pageNum', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    const badges = panel.querySelectorAll('.toc-page-badge');
    expect(badges.length).toBe(0);
  });

  it('inserts toc-header with toggle button into toc-pane', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    const pane = panel.parentElement!;
    expect(pane.querySelector('.toc-header')).not.toBeNull();
    expect(pane.querySelector('.toc-toggle-btn')).not.toBeNull();
  });

  it('does not duplicate toc-header on re-render', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    const headers = panel.parentElement!.querySelectorAll('.toc-header');
    expect(headers.length).toBe(1);
  });

  it('toggle button removes toc-visible from sidebar', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    const sidebar = panel.parentElement!.parentElement!;
    sidebar.classList.add('toc-visible');
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    const btn = panel.parentElement!.querySelector<HTMLElement>('.toc-toggle-btn');
    btn?.click();
    expect(sidebar.classList.contains('toc-visible')).toBe(false);
  });

  it('renders level badge span for each item', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    const badges = panel.querySelectorAll('.toc-level-badge');
    expect(badges.length).toBe(3);
    expect(badges[0].textContent).toBe('#1');
    expect(badges[1].textContent).toBe('#2');
  });
});

describe('setActiveTocItem', () => {
  it('highlights item by pageNum', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, samplePdfToc, () => {}, false, doc);
    setActiveTocItem(panel, 3);
    const active = panel.querySelector('.toc-item.active') as HTMLElement | null;
    expect(active?.dataset.page).toBe('3');
  });

  it('highlights item by title text (MD case)', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    setActiveTocItem(panel, undefined, 'Background');
    const active = panel.querySelector('.toc-item.active');
    expect(active?.querySelector('.toc-item-title')?.textContent?.trim()).toBe('Background');
  });

  it('clears previous active before setting new one', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, samplePdfToc, () => {}, false, doc);
    setActiveTocItem(panel, 1);
    setActiveTocItem(panel, 10);
    const active = panel.querySelectorAll('.toc-item.active');
    expect(active.length).toBe(1);
    expect((active[0] as HTMLElement).dataset.page).toBe('10');
  });

  it('does nothing when neither pageNum nor titleOrAnchor matches', () => {
    const { doc } = makeWindow();
    const panel = makeContainer(doc);
    renderTocPanel(panel, sampleMdToc, () => {}, false, doc);
    setActiveTocItem(panel, undefined, 'Nonexistent');
    expect(panel.querySelector('.toc-item.active')).toBeNull();
  });
});
