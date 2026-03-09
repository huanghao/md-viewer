import { afterEach, describe, expect, it, mock } from 'bun:test';
import { searchFiles } from '../../src/client/api/files';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('client file api', () => {
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
});
