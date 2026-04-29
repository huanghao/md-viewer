import { afterEach, describe, expect, it } from 'bun:test';
import { checkRemoteContentType, fetchRemoteMarkdown, isSupportedContentType } from '../../src/utils';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('remote content type handling', () => {
  it('accepts markdown/plain/html and rejects explicit binary types', () => {
    expect(isSupportedContentType('text/markdown; charset=utf-8').supported).toBe(true);
    expect(isSupportedContentType('text/plain').supported).toBe(true);
    expect(isSupportedContentType('application/pdf').supported).toBe(false);
    expect(isSupportedContentType('image/png').reason).toContain('不支持的文件类型');
  });

  it('checkRemoteContentType returns HEAD status and unsupported-type failures', async () => {
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe('HEAD');
      return new Response('', { status: 200, headers: { 'content-type': 'application/pdf' } });
    }) as typeof fetch;

    const result = await checkRemoteContentType('https://example.com/a.pdf');

    expect(result.ok).toBe(false);
    expect(result.contentType).toBe('application/pdf');
  });

  it('fetchRemoteMarkdown performs HEAD preflight before GET and returns text', async () => {
    const methods: string[] = [];
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      methods.push(init?.method || 'GET');
      if (init?.method === 'HEAD') {
        return new Response('', { status: 200, headers: { 'content-type': 'text/markdown' } });
      }
      return new Response('# Hello', { status: 200, headers: { 'content-type': 'text/markdown; charset=utf-8' } });
    }) as typeof fetch;

    const result = await fetchRemoteMarkdown('https://example.com/a.md');

    expect(methods).toEqual(['HEAD', 'GET']);
    expect(result.content).toBe('# Hello');
    expect(result.contentType).toBe('text/markdown; charset=utf-8');
  });
});
