import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { closeWatcher, getWatchedFileCountForTesting, pollForFileReturn, unwatchFile, watchFile, watchWorkspace } from '../../src/file-watcher';
import { addClient, getClients, removeClient } from '../../src/sse';
import { getFileList, getFileListCacheSizeForTesting } from '../../src/utils';
import { markExploded, resetExplodedForTesting } from '../../src/scan-guard';

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
  resetExplodedForTesting();
});

afterEach(async () => {
  await closeWatcher();
  getClients().clear();
  resetExplodedForTesting();
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

  it('unwatchFile releases an opened file watcher', async () => {
    const filePath = join(tempRoot, 'closed.md');
    writeFileSync(filePath, 'before');
    const { client, chunks } = makeCaptureClient();
    addClient(client as any);

    watchFile(filePath);
    await wait(500);
    expect(getWatchedFileCountForTesting()).toBe(1);
    expect(unwatchFile(filePath)).toBe(true);
    expect(getWatchedFileCountForTesting()).toBe(0);

    // macOS FSEvents 可能把 watch 之前那次 writeFileSync('before') 作为在途事件投递过来；
    // 本用例只关心 unwatch 之后不再推送，所以先清掉此前收到的内容
    await wait(200);
    chunks.length = 0;
    writeFileSync(filePath, 'after');
    await wait(1200);

    removeClient(client as any);
    expect(chunks.map(parseSseChunk).find((chunk) => chunk.event === 'file-changed')).toBeUndefined();
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

  it('file list cache is bounded across many path suggestion roots', () => {
    for (let i = 0; i < 230; i++) {
      const dir = join(tempRoot, `root-${i}`);
      mkdirSync(dir);
      writeFileSync(join(dir, 'a.md'), 'x');
      getFileList(dir);
    }

    expect(getFileListCacheSizeForTesting()).toBeLessThanOrEqual(200);
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

  // 直接调用 pollForFileReturn，不经过 watchFile()/真实 chokidar unlink 事件——避免生产路径
  // 用默认 8s 宽限期的那次调用和本测试注入的短宽限期调用并发竞争，产生两次广播的假失败。
  it('pollForFileReturn: broadcasts file-changed (not file-deleted) when the file reappears before the deadline', async () => {
    // 模拟 agent 用 unlink+recreate 整体重写文件，重建耗时较长（但仍在宽限期内）
    const filePath = join(tempRoot, 'slow-rewrite.md');
    writeFileSync(filePath, 'v1');
    const { client, chunks } = makeCaptureClient();
    addClient(client as any);

    unlinkSync(filePath);
    setTimeout(() => writeFileSync(filePath, 'v2 rewritten'), 300);

    // deadline 2000ms 远大于 300ms 重建耗时 → 应判定为原子保存，不应误报删除
    await pollForFileReturn(filePath, 2000, 20);

    removeClient(client as any);
    const events = chunks.map(parseSseChunk).map((c) => c.event);
    expect(events).toContain('file-changed');
    expect(events).not.toContain('file-deleted');
  });

  it('pollForFileReturn: broadcasts file-deleted when the file never reappears within the deadline', async () => {
    const filePath = join(tempRoot, 'really-deleted.md');
    writeFileSync(filePath, 'v1');
    const { client, chunks } = makeCaptureClient();
    addClient(client as any);

    unlinkSync(filePath);
    await pollForFileReturn(filePath, 150, 20);

    removeClient(client as any);
    const events = chunks.map(parseSseChunk).map((c) => c.event);
    expect(events).toContain('file-deleted');
    expect(events).not.toContain('file-changed');
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

  it('does not poll/broadcast changes for files under node_modules or .git (avoids watching huge dep trees)', async () => {
    const nmFile = join(tempRoot, 'node_modules', 'pkg', 'README.md');
    const gitFile = join(tempRoot, '.git', 'HEAD');
    mkdirSync(join(tempRoot, 'node_modules', 'pkg'), { recursive: true });
    mkdirSync(join(tempRoot, '.git'), { recursive: true });
    writeFileSync(nmFile, 'before');
    writeFileSync(gitFile, 'before');
    const { client, chunks } = makeCaptureClient();
    addClient(client as any);

    watchWorkspace(tempRoot);
    await wait(500);
    writeFileSync(nmFile, 'after');
    writeFileSync(gitFile, 'after');
    await wait(1200);

    removeClient(client as any);
    expect(chunks).toEqual([]);
  });

  it('circuit breaker: a dynamically-discovered exploded dir (unknown name) stops being polled once marked, even if already watched', async () => {
    const previousPolling = process.env.MDV_USE_POLLING;
    process.env.MDV_USE_POLLING = '1';
    try {
      const explodedDir = join(tempRoot, 'some-unrecognized-dump');
      const fileInside = join(explodedDir, 'a.md');
      mkdirSync(explodedDir, { recursive: true });
      writeFileSync(fileInside, 'before');
      const { client, chunks } = makeCaptureClient();
      addClient(client as any);

      watchWorkspace(tempRoot);
      await wait(500);

      // A scan (elsewhere in the codebase) discovers this directory is huge and
      // marks it exploded — file-watcher must react immediately, not just on
      // the next restart.
      markExploded(explodedDir, 5000);
      await wait(200);

      writeFileSync(fileInside, 'after');
      await wait(1200);

      removeClient(client as any);
      expect(chunks).toEqual([]);
    } finally {
      if (previousPolling === undefined) {
        delete process.env.MDV_USE_POLLING;
      } else {
        process.env.MDV_USE_POLLING = previousPolling;
      }
    }
  });
});
