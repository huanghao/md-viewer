import { afterEach, describe, expect, it, mock } from 'bun:test';
import { fetchAnnotations, upsertAnnotationRemote } from '../../src/client/api/annotations';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('client annotation api', () => {
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
});
