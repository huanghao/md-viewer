import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { closeWatcher, watchFile, watchWorkspace } from '../../src/file-watcher';
import { addClient, getClients, removeClient } from '../../src/sse';
import { getFileList } from '../../src/utils';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeCaptureClient() {
  const chunks: string[] = [];
  const decoder = new TextDecoder();
  const client = {
    controller: {
      enqueue(chunk: Uint8Array) {
        chunks.push(decoder.decode(chunk));
      },
    },
  };
  return { client, chunks };
}

function parseSseChunk(chunk: string): { event: string; data: any } {
  const event = chunk.match(/^event: (.+)$/m)?.[1] || '';
  const rawData = chunk.match(/^data: (.+)$/m)?.[1] || '{}';
  return { event, data: JSON.parse(rawData) };
}

let tempRoot = '';

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), 'mdv-watcher-'));
  getClients().clear();
});

afterEach(async () => {
  await closeWatcher();
  getClients().clear();
  rmSync(tempRoot, { recursive: true, force: true });
});

describe('file watcher integration', () => {
  it('watchFile broadcasts file-changed when a watched text file changes', async () => {
    const filePath = join(tempRoot, 'readme.md');
    writeFileSync(filePath, 'before');
    const { client, chunks } = makeCaptureClient();
    addClient(client as any);

    watchFile(filePath);
    await wait(500);
    writeFileSync(filePath, 'after');
    await wait(1200);

    removeClient(client as any);
    const changed = chunks.map(parseSseChunk).find((chunk) => chunk.event === 'file-changed');
    expect(changed?.data.path).toBe(filePath);
    expect(typeof changed?.data.lastModified).toBe('number');
  });

  it('watchWorkspace invalidates cached workspace file lists when a supported file is added', async () => {
    const existingPath = join(tempRoot, 'existing.md');
    const newPath = join(tempRoot, 'new.md');
    writeFileSync(existingPath, 'old');

    expect(getFileList(tempRoot)).toEqual([existingPath]);

    watchWorkspace(tempRoot);
    await wait(500);
    writeFileSync(newPath, 'new');
    await wait(1200);

    expect(getFileList(tempRoot)).toEqual([existingPath, newPath]);
  });

  it('watchWorkspace broadcasts file-deleted for unlinked supported files under the workspace', async () => {
    const filePath = join(tempRoot, 'deleted.md');
    writeFileSync(filePath, 'content');
    const { client, chunks } = makeCaptureClient();
    addClient(client as any);

    watchWorkspace(tempRoot);
    await wait(500);
    unlinkSync(filePath);
    await wait(1600);

    removeClient(client as any);
    expect(chunks).toContain(`event: file-deleted\ndata: ${JSON.stringify({ path: filePath })}\n\n`);
  });

  it('ignores unsupported file changes in workspace watchers', async () => {
    const filePath = join(tempRoot, 'image.png');
    writeFileSync(filePath, 'before');
    const { client, chunks } = makeCaptureClient();
    addClient(client as any);

    watchWorkspace(tempRoot);
    await wait(500);
    writeFileSync(filePath, 'after');
    unlinkSync(filePath);
    await wait(1200);

    removeClient(client as any);
    expect(chunks).toEqual([]);
  });
});
