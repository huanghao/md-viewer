import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { basename, join, resolve } from 'path';
import {
  handleClearAllAnnotations,
  handleDeleteAnnotation,
  handleDetectPath,
  handleGetAnnotationSummaries,
  handleGetAnnotations,
  handleGetFile,
  handleGetFiles,
  handleInferWorkspace,
  handlePathSuggestions,
  handleReplyAnnotation,
  handleScanWorkspace,
  handleUpdateAnnotationStatus,
  handleUpsertAnnotation,
  handleWriteFile,
} from '../../src/handlers';
import { closeWatcher } from '../../src/file-watcher';
import { replaceAnnotations, resetDbForTesting } from '../../src/annotation-storage';

interface TestContextOptions {
  url?: string;
  body?: unknown;
  signal?: AbortSignal;
}

function makeContext(options: TestContextOptions = {}) {
  const url = options.url || 'http://localhost/';
  return {
    req: {
      url,
      query(name: string) {
        return new URL(url).searchParams.get(name) || undefined;
      },
      json: async () => options.body,
      signal: options.signal || new AbortController().signal,
    },
    json(data: unknown, status = 200) {
      return Response.json(data, { status });
    },
  } as any;
}

async function readJson(response: Response) {
  return response.json() as Promise<any>;
}

let tempRoot = '';
let tempConfigHome = '';
let oldConfigHome: string | undefined;

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), 'mdv-handlers-'));
  tempConfigHome = mkdtempSync(join(tmpdir(), 'mdv-handlers-config-'));
  oldConfigHome = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = tempConfigHome;
  resetDbForTesting();
});

afterEach(async () => {
  await closeWatcher();
  resetDbForTesting();
  if (oldConfigHome === undefined) {
    delete process.env.XDG_CONFIG_HOME;
  } else {
    process.env.XDG_CONFIG_HOME = oldConfigHome;
  }
  rmSync(tempRoot, { recursive: true, force: true });
  rmSync(tempConfigHome, { recursive: true, force: true });
  globalThis.fetch = originalFetch;
});

const originalFetch = globalThis.fetch;

describe('handlers — file APIs', () => {
  it('handleGetFile returns local file metadata and content', async () => {
    const filePath = join(tempRoot, 'readme.md');
    writeFileSync(filePath, '# Hello');

    const response = await handleGetFile(makeContext({
      url: `http://localhost/api/file?path=${encodeURIComponent(filePath)}`,
    }));
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.content).toBe('# Hello');
    expect(data.path).toBe(resolve(filePath));
    expect(data.filename).toBe('readme.md');
    expect(data.isRemote).toBe(false);
    expect(typeof data.lastModified).toBe('number');
  });

  it('handleGetFile infers a remote filename extension from HTML content type', async () => {
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') {
        return new Response('', { status: 200, headers: { 'content-type': 'text/html' } });
      }
      return new Response('<h1>Hello</h1>', { status: 200, headers: { 'content-type': 'text/html' } });
    }) as typeof fetch;

    const response = await handleGetFile(makeContext({
      url: 'http://localhost/api/file?path=https%3A%2F%2Fexample.com%2Fdocs%2Fintro',
    }));
    const data = await readJson(response);

    expect(response.status).toBe(200);
    expect(data.content).toBe('<h1>Hello</h1>');
    expect(data.filename).toBe('intro.html');
    expect(data.isRemote).toBe(true);
  });

  it('handleGetFiles lists supported files and searches across explicit roots', async () => {
    const rootA = join(tempRoot, 'a');
    const rootB = join(tempRoot, 'b');
    mkdirSync(rootA);
    mkdirSync(rootB);
    writeFileSync(join(rootA, 'guide.md'), 'a');
    writeFileSync(join(rootA, 'ignore.txt'), 'x');
    writeFileSync(join(rootB, 'guide-two.html'), 'b');

    const listResponse = handleGetFiles(makeContext({
      url: `http://localhost/api/files?dir=${encodeURIComponent(rootA)}`,
    }));
    const listData = await readJson(listResponse);
    expect(listData.files).toEqual([{ path: join(rootA, 'guide.md'), name: 'guide.md' }]);

    const searchUrl = new URL('http://localhost/api/files');
    searchUrl.searchParams.set('query', 'guide');
    searchUrl.searchParams.append('root', rootA);
    searchUrl.searchParams.append('root', rootB);
    searchUrl.searchParams.set('limit', '10');

    const searchResponse = handleGetFiles(makeContext({ url: searchUrl.toString() }));
    const searchData = await readJson(searchResponse);
    expect(searchData.roots).toEqual([resolve(rootA), resolve(rootB)]);
    expect(searchData.files.map((file: any) => basename(file.path))).toEqual(['guide.md', 'guide-two.html']);
  });

  it('handlePathSuggestions sorts directories before supported files and filters unsupported files', async () => {
    mkdirSync(join(tempRoot, 'docs'));
    writeFileSync(join(tempRoot, 'draft.md'), 'a');
    writeFileSync(join(tempRoot, 'draft.txt'), 'x');

    const response = handlePathSuggestions(makeContext({
      url: `http://localhost/api/path-suggestions?input=${encodeURIComponent(join(tempRoot, 'd'))}`,
    }));
    const data = await readJson(response);

    expect(data.baseDir).toBe(resolve(tempRoot));
    expect(data.suggestions).toEqual([
      { path: `${join(tempRoot, 'docs')}/`, display: 'docs/', type: 'directory' },
      { path: join(tempRoot, 'draft.md'), display: 'draft.md', type: 'file' },
    ]);
  });
});

describe('handlers — path and workspace APIs', () => {
  it('handleDetectPath classifies URL, missing path, directories, and supported local files', async () => {
    const pdfPath = join(tempRoot, 'paper.pdf');
    writeFileSync(pdfPath, 'pdf');

    const urlResponse = await handleDetectPath(makeContext({ body: { path: 'https://example.com/a.pdf' } }));
    expect(await readJson(urlResponse)).toMatchObject({ kind: 'pdf_file', isUrl: true, ext: '.pdf' });

    const missingResponse = await handleDetectPath(makeContext({ body: { path: join(tempRoot, 'none.md') } }));
    expect(await readJson(missingResponse)).toMatchObject({ kind: 'not_found', path: join(tempRoot, 'none.md') });

    const dirResponse = await handleDetectPath(makeContext({ body: { path: tempRoot } }));
    expect(await readJson(dirResponse)).toMatchObject({ kind: 'directory', path: resolve(tempRoot) });

    const fileResponse = await handleDetectPath(makeContext({ body: { path: pdfPath } }));
    expect(await readJson(fileResponse)).toMatchObject({ kind: 'pdf_file', path: resolve(pdfPath), ext: '.pdf' });
  });

  it('handleInferWorkspace walks up to the nearest .git directory', async () => {
    const project = join(tempRoot, 'project');
    const docs = join(project, 'docs');
    mkdirSync(join(project, '.git'), { recursive: true });
    mkdirSync(docs, { recursive: true });
    const filePath = join(docs, 'readme.md');
    writeFileSync(filePath, '# Readme');

    const response = await handleInferWorkspace(makeContext({ body: { filePath } }));
    const data = await readJson(response);

    expect(data).toEqual({
      workspacePath: project,
      workspaceName: 'project',
    });
  });

  it('handleScanWorkspace returns only displayable files and non-empty directories', async () => {
    const docs = join(tempRoot, 'docs');
    const empty = join(tempRoot, 'empty');
    const ignored = join(tempRoot, 'node_modules');
    mkdirSync(docs, { recursive: true });
    mkdirSync(empty);
    mkdirSync(ignored);
    writeFileSync(join(tempRoot, '.mdvignore'), 'tmp/\n# comment\n');
    writeFileSync(join(tempRoot, 'index.md'), '# Index');
    writeFileSync(join(tempRoot, 'notes.txt'), 'skip');
    writeFileSync(join(docs, 'page.html'), '<p>Page</p>');
    writeFileSync(join(ignored, 'package.md'), 'skip');

    const response = await handleScanWorkspace(makeContext({ body: { path: tempRoot } }));
    const data = await readJson(response);

    expect(data.type).toBe('directory');
    expect(data.path).toBe(resolve(tempRoot));
    expect(data.ignorePatterns).toEqual(['tmp/']);
    expect(data.fileCount).toBe(2);
    expect(data.children.map((child: any) => child.name)).toEqual(['docs', 'index.md']);
    expect(data.children[0].children.map((child: any) => child.name)).toEqual(['page.html']);
  });
});

describe('handlers — annotation APIs', () => {
  it('supports annotation upsert, list, reply, status update, summaries, delete, and clear', async () => {
    const docPath = join(tempRoot, 'readme.md');
    const annotation = {
      id: 'ann-1',
      start: 0,
      length: 5,
      quote: 'Hello',
      note: 'First note',
      createdAt: 1000,
      status: 'anchored',
    };

    const upsertResponse = await handleUpsertAnnotation(makeContext({ body: { path: docPath, annotation } }));
    const upsertData = await readJson(upsertResponse);
    expect(upsertResponse.status).toBe(200);
    expect(upsertData.success).toBe(true);
    expect(upsertData.annotation.serial).toBe(1);

    const listResponse = await handleGetAnnotations(makeContext({
      url: `http://localhost/api/annotations?path=${encodeURIComponent(docPath)}`,
    }));
    const listData = await readJson(listResponse);
    expect(listData.annotations).toHaveLength(1);
    expect(listData.annotations[0].note).toBe('First note');

    const replyResponse = await handleReplyAnnotation(makeContext({
      body: { path: docPath, serial: 1, text: 'Reply note', author: 'codex' },
    }));
    const replyData = await readJson(replyResponse);
    expect(replyData.annotation.thread.map((item: any) => item.type)).toEqual(['comment', 'reply']);
    expect(replyData.annotation.thread[1].author).toBe('codex');

    const statusResponse = await handleUpdateAnnotationStatus(makeContext({
      body: { path: docPath, serial: 1, status: 'unanchored' },
    }));
    const statusData = await readJson(statusResponse);
    expect(statusData.annotation.status).toBe('unanchored');

    const summaryResponse = await handleGetAnnotationSummaries(makeContext());
    const summaryData = await readJson(summaryResponse);
    expect(summaryData.summaries[resolve(docPath)]).toBeUndefined();

    const deleteResponse = await handleDeleteAnnotation(makeContext({ body: { path: docPath, serial: 1 } }));
    expect(await readJson(deleteResponse)).toEqual({ success: true, deleted: true });

    const clearResponse = await handleClearAllAnnotations(makeContext());
    expect(await readJson(clearResponse)).toEqual({ success: true, deleted: 0, documents: 0 });
  });

  it('returns only anchored annotation summaries using the shared status count semantics', async () => {
    replaceAnnotations('/tmp/open.md', [
      { id: 'a1', start: 0, length: 1, quote: 'a', note: 'open', createdAt: 1000, status: 'anchored' },
      { id: 'a2', start: 1, length: 1, quote: 'b', note: 'floating', createdAt: 2000, status: 'unanchored' },
      { id: 'a3', start: 2, length: 1, quote: 'c', note: 'done', createdAt: 3000, status: 'resolved' },
    ]);
    replaceAnnotations('/tmp/resolved.md', [
      { id: 'r1', start: 0, length: 1, quote: 'r', note: 'done', createdAt: 4000, status: 'resolved' },
    ]);

    const response = await handleGetAnnotationSummaries(makeContext());
    const data = await readJson(response);

    expect(data.summaries['/tmp/open.md'].count).toBe(1);
    expect(data.summaries['/tmp/resolved.md']).toBeUndefined();
  });
});

describe('handlers — file write API', () => {
  it('handleWriteFile only writes .toc.json sidecars', async () => {
    const sidecarPath = join(tempRoot, 'readme.md.toc.json');
    const forbiddenPath = join(tempRoot, 'readme.md');

    const forbiddenResponse = await handleWriteFile(makeContext({
      body: { path: forbiddenPath, content: '# overwrite' },
    }));
    expect(forbiddenResponse.status).toBe(403);
    expect(existsSync(forbiddenPath)).toBe(false);

    const response = await handleWriteFile(makeContext({
      body: { path: sidecarPath, content: '{"headings":[]}' },
    }));
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ success: true });
    expect(readFileSync(sidecarPath, 'utf-8')).toBe('{"headings":[]}');
  });
});
