import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  saveSnapshot,
  getSnapshot,
  deleteSnapshot,
  snapshotExists,
} from '../../src/snapshot-storage';

let tempDataHome = '';
let oldDataHome: string | undefined;

beforeAll(() => {
  oldDataHome = process.env.MDV_DATA_DIR;
  tempDataHome = mkdtempSync(join(tmpdir(), 'mdv-snap-test-'));
  process.env.MDV_DATA_DIR = tempDataHome;
});

afterAll(() => {
  if (oldDataHome === undefined) {
    delete process.env.MDV_DATA_DIR;
  } else {
    process.env.MDV_DATA_DIR = oldDataHome;
  }
  rmSync(tempDataHome, { recursive: true, force: true });
});

// 每个 case 使用独立路径，避免相互干扰
let counter = 0;
function testPath(): string {
  return `/tmp/test-snap-${++counter}.md`;
}

describe('saveSnapshot', () => {
  it('首次保存返回 true，快照内容正确', () => {
    const path = testPath();
    const created = saveSnapshot(path, 'hello world');
    expect(created).toBe(true);
    const snap = getSnapshot(path);
    expect(snap).not.toBeNull();
    expect(snap!.content).toBe('hello world');
    expect(snap!.docPath).toBe(path);
    expect(typeof snap!.savedAt).toBe('number');
  });

  it('第二次保存同一文件返回 false（幂等，不覆盖）', () => {
    const path = testPath();
    saveSnapshot(path, 'v1');
    const second = saveSnapshot(path, 'v2');
    expect(second).toBe(false);
    // 内容仍是 v1
    expect(getSnapshot(path)!.content).toBe('v1');
  });

  it('不同文件互不影响', () => {
    const p1 = testPath();
    const p2 = testPath();
    saveSnapshot(p1, 'file-one');
    saveSnapshot(p2, 'file-two');
    expect(getSnapshot(p1)!.content).toBe('file-one');
    expect(getSnapshot(p2)!.content).toBe('file-two');
  });
});

describe('getSnapshot', () => {
  it('不存在时返回 null', () => {
    expect(getSnapshot('/nonexistent/file.md')).toBeNull();
  });

  it('内容可正确回读', () => {
    const path = testPath();
    const content = '# Title\n\nSome content with unicode 中文';
    saveSnapshot(path, content);
    expect(getSnapshot(path)!.content).toBe(content);
  });
});

describe('snapshotExists', () => {
  it('未保存时返回 false', () => {
    expect(snapshotExists('/no/such/file.md')).toBe(false);
  });

  it('保存后返回 true', () => {
    const path = testPath();
    saveSnapshot(path, 'x');
    expect(snapshotExists(path)).toBe(true);
  });

  it('删除后返回 false', () => {
    const path = testPath();
    saveSnapshot(path, 'x');
    deleteSnapshot(path);
    expect(snapshotExists(path)).toBe(false);
  });
});

describe('deleteSnapshot', () => {
  it('删除已存在的快照', () => {
    const path = testPath();
    saveSnapshot(path, 'to-delete');
    expect(snapshotExists(path)).toBe(true);
    deleteSnapshot(path);
    expect(snapshotExists(path)).toBe(false);
    expect(getSnapshot(path)).toBeNull();
  });

  it('删除不存在的快照不抛出异常', () => {
    expect(() => deleteSnapshot('/never/existed.md')).not.toThrow();
  });

  it('删除后可重新保存新内容', () => {
    const path = testPath();
    saveSnapshot(path, 'v1');
    deleteSnapshot(path);
    const created = saveSnapshot(path, 'v2');
    expect(created).toBe(true);
    expect(getSnapshot(path)!.content).toBe('v2');
  });
});
