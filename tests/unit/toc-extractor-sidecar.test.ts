import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { sidecarPath, loadSidecar, saveSidecar, scanPdfHeadings, type TocItem } from '../../src/client/toc-extractor';

describe('sidecarPath', () => {
  it('appends .toc.json to pdf path', () => {
    expect(sidecarPath('/docs/report.pdf')).toBe('/docs/report.pdf.toc.json');
    expect(sidecarPath('simple.pdf')).toBe('simple.pdf.toc.json');
  });
});

describe('loadSidecar', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => { originalFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = originalFetch; });

  it('returns parsed TocItem[] on success', async () => {
    const toc: TocItem[] = [{ title: 'Intro', level: 1, pageNum: 1, children: [] }];
    globalThis.fetch = mock(async () => new Response(JSON.stringify(toc), { status: 200 }));
    const result = await loadSidecar('/docs/report.pdf');
    expect(result).toEqual(toc);
  });

  it('returns null when server returns 404', async () => {
    globalThis.fetch = mock(async () => new Response('Not Found', { status: 404 }));
    const result = await loadSidecar('/docs/report.pdf');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    globalThis.fetch = mock(async () => { throw new Error('network error'); });
    const result = await loadSidecar('/docs/report.pdf');
    expect(result).toBeNull();
  });

  it('encodes the sidecar path in the URL', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock(async (url: string) => {
      capturedUrl = url;
      return new Response('[]', { status: 200 });
    });
    await loadSidecar('/path with spaces/report.pdf');
    expect(capturedUrl).toContain(encodeURIComponent('/path with spaces/report.pdf.toc.json'));
  });
});

describe('saveSidecar', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => { originalFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = originalFetch; });

  it('POSTs to /api/file-write with correct path and content', async () => {
    let capturedBody: any;
    globalThis.fetch = mock(async (_url: string, opts: any) => {
      capturedBody = JSON.parse(opts.body);
      return new Response('OK', { status: 200 });
    });
    const toc: TocItem[] = [{ title: 'Ch1', level: 1, pageNum: 2, children: [] }];
    await saveSidecar('/docs/report.pdf', toc);
    expect(capturedBody.path).toBe('/docs/report.pdf.toc.json');
    expect(JSON.parse(capturedBody.content)).toEqual(toc);
  });
});

describe('scanPdfHeadings', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => { originalFetch = globalThis.fetch; });
  afterEach(() => { globalThis.fetch = originalFetch; });

  // Silence saveSidecar fetch calls
  const mockSilentFetch = mock(async () => new Response('OK', { status: 200 }));

  it('extracts headings taller than body text median', async () => {
    globalThis.fetch = mockSilentFetch;

    // 5 body items (height 10) → median = 10
    // Big Title: 18 >= 10*1.6=16 → level 1
    // Sub Title: 12 > 10*1.1=11, < 16 → level 2
    const mockDoc = {
      numPages: 1,
      getPage: async (_n: number) => ({
        getTextContent: async () => ({
          items: [
            { str: 'body line 1', height: 10, transform: [1,0,0,10,0,700] },
            { str: 'body line 2', height: 10, transform: [1,0,0,10,0,680] },
            { str: 'body line 3', height: 10, transform: [1,0,0,10,0,660] },
            { str: 'body line 4', height: 10, transform: [1,0,0,10,0,640] },
            { str: 'body line 5', height: 10, transform: [1,0,0,10,0,620] },
            { str: 'Big Title', height: 18, transform: [1,0,0,18,0,750] },
            { str: 'Sub Title', height: 12, transform: [1,0,0,12,0,720] },
          ],
        }),
      }),
    };

    const progressCalls: TocItem[][] = [];
    const result = await scanPdfHeadings('/test.pdf', mockDoc as any, toc => progressCalls.push(toc));

    function findInTree(items: TocItem[], title: string): TocItem | undefined {
      for (const t of items) {
        if (t.title === title) return t;
        const found = findInTree(t.children, title);
        if (found) return found;
      }
    }

    expect(result.length).toBeGreaterThan(0);
    const bigTitle = findInTree(result, 'Big Title');
    expect(bigTitle).toBeDefined();
    expect(bigTitle?.level).toBe(1);
    expect(bigTitle?.pageNum).toBe(1);

    const subTitle = findInTree(result, 'Sub Title');
    expect(subTitle).toBeDefined();
    expect(subTitle?.level).toBe(2);

    // onProgress called once per page
    expect(progressCalls.length).toBe(1);
  });

  it('skips text longer than 150 chars', async () => {
    globalThis.fetch = mockSilentFetch;

    const longText = 'a'.repeat(151);
    const mockDoc = {
      numPages: 1,
      getPage: async (_n: number) => ({
        getTextContent: async () => ({
          items: [
            { str: 'Normal', height: 20, transform: [1,0,0,20,0,700] },
            { str: longText, height: 20, transform: [1,0,0,20,0,680] },
            { str: 'body', height: 10, transform: [1,0,0,10,0,660] },
          ],
        }),
      }),
    };

    const result = await scanPdfHeadings('/test.pdf', mockDoc as any, () => {});
    expect(result.every(t => t.title !== longText)).toBe(true);
  });

  it('handles pages that throw without crashing', async () => {
    globalThis.fetch = mockSilentFetch;

    // Page 2 has enough body text so median is well below heading height
    const mockDoc = {
      numPages: 2,
      getPage: async (n: number) => {
        if (n === 1) throw new Error('page error');
        return {
          getTextContent: async () => ({
            items: [
              { str: 'Good Heading', height: 20, transform: [1,0,0,20,0,700] },
              { str: 'body a', height: 10, transform: [1,0,0,10,0,680] },
              { str: 'body b', height: 10, transform: [1,0,0,10,0,660] },
              { str: 'body c', height: 10, transform: [1,0,0,10,0,640] },
            ],
          }),
        };
      },
    };

    const result = await scanPdfHeadings('/test.pdf', mockDoc as any, () => {});
    expect(result.some(t => t.title === 'Good Heading')).toBe(true);
  });

  it('builds nested tree from flat headings', async () => {
    globalThis.fetch = mockSilentFetch;

    // Need enough body text so median is 10, and Chapter (24px) >= 10*1.6=16 → level 1
    const mockDoc = {
      numPages: 1,
      getPage: async (_n: number) => ({
        getTextContent: async () => ({
          items: [
            { str: 'Chapter', height: 24, transform: [1,0,0,24,0,800] },
            { str: 'Section', height: 14, transform: [1,0,0,14,0,760] },
            { str: 'para', height: 10, transform: [1,0,0,10,0,740] },
            { str: 'para2', height: 10, transform: [1,0,0,10,0,720] },
            { str: 'para3', height: 10, transform: [1,0,0,10,0,700] },
          ],
        }),
      }),
    };

    const result = await scanPdfHeadings('/test.pdf', mockDoc as any, () => {});
    const chapter = result.find(t => t.title === 'Chapter');
    expect(chapter).toBeDefined();
    expect(chapter?.level).toBe(1);
    expect(chapter?.children.some(c => c.title === 'Section')).toBe(true);
  });
});
