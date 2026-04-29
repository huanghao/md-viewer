import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  detectPathType,
  getNearbyFiles,
  getPathSuggestions,
  loadFile,
  openFile,
  searchFiles,
} from '../../src/client/api/files';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('client file api', () => {
  it('loadFile returns file data and encodes the requested path', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock((input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return Promise.resolve(new Response(JSON.stringify({
        content: '# A',
        path: '/tmp/a b.md',
        filename: 'a b.md',
        lastModified: 123,
        isRemote: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    const result = await loadFile('/tmp/a b.md');

    expect(capturedUrl).toBe('/api/file?path=%2Ftmp%2Fa%20b.md');
    expect(result?.filename).toBe('a b.md');
  });

  it('loadFile returns null on API errors when silent', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'missing' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as typeof fetch;

    await expect(loadFile('/tmp/missing.md', true)).resolves.toBeNull();
  });

  it('passes all workspace roots to /api/files search', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock((input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return Promise.resolve(new Response(JSON.stringify({ files: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    await searchFiles('target', {
      roots: ['/repo-a', '/repo-b'],
      limit: 200,
    });

    const url = new URL(capturedUrl, 'http://localhost');
    expect(url.pathname).toBe('/api/files');
    expect(url.searchParams.get('query')).toBe('target');
    expect(url.searchParams.get('limit')).toBe('200');
    expect(url.searchParams.getAll('root')).toEqual(['/repo-a', '/repo-b']);
  });

  it('wraps nearby, path suggestion, and detect-path endpoints', async () => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    globalThis.fetch = mock((input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input: String(input), init });
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    await getNearbyFiles('/tmp/a.md');
    await getPathSuggestions('/tmp/d', { kind: 'directory', markdownOnly: false });
    await detectPathType('/tmp/a.md');

    expect(calls[0].input).toBe('/api/nearby?path=%2Ftmp%2Fa.md');

    const suggestionsUrl = new URL(calls[1].input, 'http://localhost');
    expect(suggestionsUrl.pathname).toBe('/api/path-suggestions');
    expect(suggestionsUrl.searchParams.get('input')).toBe('/tmp/d');
    expect(suggestionsUrl.searchParams.get('kind')).toBe('directory');
    expect(suggestionsUrl.searchParams.get('markdownOnly')).toBe('false');

    expect(calls[2].input).toBe('/api/detect-path');
    expect(calls[2].init?.method).toBe('POST');
    expect(JSON.parse(String(calls[2].init?.body))).toEqual({ path: '/tmp/a.md' });
  });

  it('openFile posts to the server open-file endpoint with focus state', async () => {
    let capturedInput = '';
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = mock((input: RequestInfo | URL, init?: RequestInit) => {
      capturedInput = String(input);
      capturedInit = init;
      return Promise.resolve(new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    await openFile('/tmp/a.md', false);

    expect(capturedInput).toBe('/api/open-file');
    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(capturedInit?.body))).toEqual({ path: '/tmp/a.md', focus: false });
  });
});
