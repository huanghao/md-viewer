import { describe, it, expect } from 'bun:test';
import { getFileListStatus, needsRefresh, type FileListStatus } from '../../src/client/utils/file-status';
import type { FileInfo } from '../../src/client/types';

function createFile(overrides: Partial<FileInfo> = {}): FileInfo {
  const now = Date.now();
  return {
    path: '/test/file.md',
    name: 'file.md',
    content: '# Test',
    lastModified: now,
    displayedModified: now,
    isRemote: false,
    isMissing: false,
    ...overrides,
  };
}

describe('getFileListStatus', () => {
  describe('优先级：删除 (D) > 修改 (M) > 蓝点 (dot) > 正常', () => {
    it('文件不存在时返回删除状态', () => {
      const file = createFile({ isMissing: true });
      const status = getFileListStatus(file, false);
      expect(status.badge).toBe('D');
      expect(status.type).toBe('deleted');
    });

    it('文件已修改时返回修改状态', () => {
      const now = Date.now();
      const file = createFile({
        lastModified: now + 1000,
        displayedModified: now,
      });
      const status = getFileListStatus(file, false);
      expect(status.badge).toBe('M');
      expect(status.type).toBe('modified');
    });

    it('文件未修改但有列表差异时返回蓝点', () => {
      const file = createFile();
      const status = getFileListStatus(file, true);
      expect(status.badge).toBe('dot');
      expect(status.type).toBe('new');
    });

    it('文件正常时返回空状态', () => {
      const file = createFile();
      const status = getFileListStatus(file, false);
      expect(status.badge).toBeNull();
      expect(status.type).toBe('normal');
    });
  });

  describe('优先级覆盖', () => {
    it('删除优先级高于修改', () => {
      const now = Date.now();
      const file = createFile({
        isMissing: true,
        lastModified: now + 1000,
        displayedModified: now,
      });
      const status = getFileListStatus(file, false);
      expect(status.badge).toBe('D');
    });

    it('删除优先级高于蓝点', () => {
      const file = createFile({ isMissing: true });
      const status = getFileListStatus(file, true);
      expect(status.badge).toBe('D');
    });

    it('修改优先级高于蓝点', () => {
      const now = Date.now();
      const file = createFile({
        lastModified: now + 1000,
        displayedModified: now,
      });
      const status = getFileListStatus(file, true);
      expect(status.badge).toBe('M');
    });
  });
});

describe('needsRefresh', () => {
  it('文件未修改时不需要刷新', () => {
    const file = createFile();
    expect(needsRefresh(file)).toBe(false);
  });

  it('文件已修改时需要刷新', () => {
    const now = Date.now();
    const file = createFile({
      lastModified: now + 1000,
      displayedModified: now,
    });
    expect(needsRefresh(file)).toBe(true);
  });

  it('文件不存在时不需要刷新', () => {
    const now = Date.now();
    const file = createFile({
      isMissing: true,
      lastModified: now + 1000,
      displayedModified: now,
    });
    expect(needsRefresh(file)).toBe(false);
  });
});
