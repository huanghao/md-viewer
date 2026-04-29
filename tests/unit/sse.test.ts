import { beforeEach, describe, expect, it } from 'bun:test';
import {
  addClient,
  broadcastEvent,
  broadcastFileChanged,
  broadcastFileDeleted,
  broadcastFileOpened,
  getClients,
  removeClient,
} from '../../src/sse';
import type { SSEClient } from '../../src/types';

const decoder = new TextDecoder();

function makeClient() {
  const chunks: string[] = [];
  const client = {
    controller: {
      enqueue(bytes: Uint8Array) {
        chunks.push(decoder.decode(bytes));
      },
    },
  } as unknown as SSEClient;
  return { client, chunks };
}

describe('sse broadcasts', () => {
  beforeEach(() => {
    getClients().clear();
  });

  it('adds and removes clients from the broadcast set', () => {
    const { client } = makeClient();
    addClient(client);
    expect(getClients().has(client)).toBe(true);

    removeClient(client);
    expect(getClients().has(client)).toBe(false);
  });

  it('broadcasts file lifecycle events using SSE framing', () => {
    const { client, chunks } = makeClient();
    addClient(client);

    broadcastFileOpened({ path: '/tmp/a.md', filename: 'a.md', content: '# A', lastModified: 12, isRemote: false }, true);
    broadcastFileChanged('/tmp/a.md', 34);
    broadcastFileDeleted('/tmp/a.md');

    expect(chunks[0]).toContain('event: file-opened\n');
    expect(chunks[0]).toContain('"focus":true');
    expect(chunks[1]).toBe('event: file-changed\ndata: {"path":"/tmp/a.md","lastModified":34}\n\n');
    expect(chunks[2]).toBe('event: file-deleted\ndata: {"path":"/tmp/a.md"}\n\n');
  });

  it('drops disconnected clients that throw while broadcasting', () => {
    const badClient = {
      controller: {
        enqueue() {
          throw new Error('closed');
        },
      },
    } as unknown as SSEClient;
    const { client: goodClient, chunks } = makeClient();
    addClient(badClient);
    addClient(goodClient);

    broadcastEvent({ type: 'workspace-changed', path: '/tmp' });

    expect(getClients().has(badClient)).toBe(false);
    expect(getClients().has(goodClient)).toBe(true);
    expect(chunks[0]).toBe('event: workspace-changed\ndata: {"type":"workspace-changed","path":"/tmp"}\n\n');
  });
});
