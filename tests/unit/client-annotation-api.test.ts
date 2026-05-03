import { afterEach, describe, expect, it, mock } from 'bun:test';
import {
  deleteAnnotationRemote,
  fetchAnnotationSummaries,
  fetchAnnotations,
  replyAnnotationRemote,
  updateAnnotationStatusRemote,
  upsertAnnotationRemote,
} from '../../src/client/api/annotations';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('client annotation api', () => {
  it('fetchAnnotations encodes the path and returns annotations array', async () => {
    let capturedUrl = '';
    globalThis.fetch = mock((input: RequestInfo | URL) => {
      capturedUrl = String(input);
      return Promise.resolve(new Response(JSON.stringify({
        annotations: [{ id: 'a1', note: 'note' }],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    const result = await fetchAnnotations('/tmp/a b.md');

    expect(capturedUrl).toBe('/api/annotations?path=%2Ftmp%2Fa%20b.md');
    expect(result).toEqual([{ id: 'a1', note: 'note' }]);
  });

  it('throws when fetching annotations fails', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'boom' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as typeof fetch;

    await expect(fetchAnnotations('/tmp/a.md')).rejects.toThrow('boom');
  });

  it('throws when upserting annotations fails', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'save failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as typeof fetch;

    await expect(upsertAnnotationRemote('/tmp/a.md', {
      id: 'a1',
      start: 0,
      length: 4,
      quote: 'aaaa',
      note: 'note-a1',
      createdAt: 1,
    })).rejects.toThrow('save failed');
  });

  it('posts annotation mutation requests with the expected payloads', async () => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    globalThis.fetch = mock((input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input: String(input), init });
      return Promise.resolve(new Response(JSON.stringify({
        success: true,
        annotation: { id: 'a1', note: 'updated', status: 'resolved' },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }) as typeof fetch;

    const ann = {
      id: 'a1',
      start: 0,
      length: 4,
      quote: 'aaaa',
      note: 'note-a1',
      createdAt: 1,
    };

    await upsertAnnotationRemote('/tmp/a.md', ann as any);
    await replyAnnotationRemote('/tmp/a.md', { serial: 3 }, 'reply', 'codex');
    await deleteAnnotationRemote('/tmp/a.md', { id: 'a1' });
    await updateAnnotationStatusRemote('/tmp/a.md', { id: 'a1' }, 'resolved');

    expect(calls.map((call) => call.input)).toEqual([
      '/api/annotations/item',
      '/api/annotations/reply',
      '/api/annotations/delete',
      '/api/annotations/status',
    ]);
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ path: '/tmp/a.md', annotation: ann });
    expect(JSON.parse(String(calls[1].init?.body))).toEqual({ path: '/tmp/a.md', serial: 3, text: 'reply', author: 'codex' });
    expect(JSON.parse(String(calls[2].init?.body))).toEqual({ path: '/tmp/a.md', id: 'a1' });
    expect(JSON.parse(String(calls[3].init?.body))).toEqual({ path: '/tmp/a.md', id: 'a1', status: 'resolved' });
  });

  it('throws when mutation responses do not report success', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ success: false, error: 'bad mutation' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as typeof fetch;

    await expect(deleteAnnotationRemote('/tmp/a.md', { id: 'missing' })).rejects.toThrow('bad mutation');
  });

  it('fetchAnnotationSummaries returns a map and falls back to empty map on failures', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({
        summaries: {
          '/tmp/a.md': { count: 2, unanchoredCount: 1, updatedAt: 123 },
          '/tmp/b.md': { count: undefined, updatedAt: undefined },
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as typeof fetch;

    const summaries = await fetchAnnotationSummaries();
    expect(summaries.get('/tmp/a.md')).toEqual({ count: 2, unanchoredCount: 1, updatedAt: 123 });
    expect(summaries.get('/tmp/b.md')).toEqual({ count: 0, unanchoredCount: 0, updatedAt: 0 });

    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'nope' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }))
    ) as typeof fetch;

    await expect(fetchAnnotationSummaries()).resolves.toEqual(new Map());
  });
});
