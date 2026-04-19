import { describe, expect, it, beforeEach } from 'bun:test';
import { state, addOrUpdateFile, getSessionFile, saveScrollPosition, removeFile } from '../../src/client/state';
import type { FileData } from '../../src/client/types';

function makeFileData(path: string): FileData {
  return { path, filename: path.split('/').pop()!, content: '# test', lastModified: 1000 };
}

beforeEach(() => {
  state.sessionFiles.clear();
  state.currentFile = null;
});

// ==================== savedScrollTop 字段 ====================

describe('FileInfo.savedScrollTop', () => {
  it('新加载的文件 savedScrollTop 为 undefined', () => {
    addOrUpdateFile(makeFileData('/a.md'));
    expect(getSessionFile('/a.md')?.savedScrollTop).toBeUndefined();
  });

  it('saveScrollPosition 保存滚动位置到 FileInfo', () => {
    addOrUpdateFile(makeFileData('/a.md'));
    saveScrollPosition('/a.md', 320);
    expect(getSessionFile('/a.md')?.savedScrollTop).toBe(320);
  });

  it('saveScrollPosition 对不存在的文件无副作用', () => {
    expect(() => saveScrollPosition('/nonexistent.md', 100)).not.toThrow();
  });

  it('addOrUpdateFile 更新文件内容时保留已有的 savedScrollTop', () => {
    addOrUpdateFile(makeFileData('/a.md'));
    saveScrollPosition('/a.md', 500);
    // 文件内容更新（如磁盘变更）
    addOrUpdateFile({ ...makeFileData('/a.md'), content: '# updated', lastModified: 2000 });
    expect(getSessionFile('/a.md')?.savedScrollTop).toBe(500);
  });

  it('saveScrollPosition 覆盖旧值', () => {
    addOrUpdateFile(makeFileData('/a.md'));
    saveScrollPosition('/a.md', 100);
    saveScrollPosition('/a.md', 800);
    expect(getSessionFile('/a.md')?.savedScrollTop).toBe(800);
  });

  it('saveScrollPosition 保存 0（滚回顶部也是有效位置）', () => {
    addOrUpdateFile(makeFileData('/a.md'));
    saveScrollPosition('/a.md', 500);
    saveScrollPosition('/a.md', 0);
    expect(getSessionFile('/a.md')?.savedScrollTop).toBe(0);
  });

  it('removeFile 后 savedScrollTop 随之清除（关闭文件即丢弃位置记忆）', () => {
    addOrUpdateFile(makeFileData('/a.md'), true);
    addOrUpdateFile(makeFileData('/b.md'));
    saveScrollPosition('/a.md', 400);
    removeFile('/a.md');
    expect(getSessionFile('/a.md')).toBeUndefined();
  });
});
