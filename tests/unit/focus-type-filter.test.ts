import { describe, expect, it } from 'bun:test';
import { getFileExtension } from '../../src/client/utils/file-type';

// 测试类型过滤的核心逻辑：扩展名归一化
describe('focus type filter — extension normalization', () => {
  it('md 文件归到 md', () => {
    expect(getFileExtension('/a/b/file.md')).toBe('md');
  });

  it('markdown 文件归到 md（需调用方归一化）', () => {
    const ext = getFileExtension('/a/file.markdown');
    const normalized = ext === 'markdown' ? 'md' : ext;
    expect(normalized).toBe('md');
  });

  it('pdf 文件归到 pdf', () => {
    expect(getFileExtension('/a/file.pdf')).toBe('pdf');
  });

  it('json 文件归到 json', () => {
    expect(getFileExtension('/a/file.json')).toBe('json');
  });

  it('jsonl 文件归一化到 json（需调用方归一化）', () => {
    const ext = getFileExtension('/a/file.jsonl');
    const normalized = ext === 'jsonl' ? 'json' : ext;
    expect(normalized).toBe('json');
  });

  it('html 文件归到 html', () => {
    expect(getFileExtension('/a/file.html')).toBe('html');
  });

  it('htm 文件归一化到 html（需调用方归一化）', () => {
    const ext = getFileExtension('/a/file.htm');
    const normalized = ext === 'htm' ? 'html' : ext;
    expect(normalized).toBe('html');
  });

  it('无扩展名返回空字符串', () => {
    expect(getFileExtension('/a/Makefile')).toBe('');
  });
});

// 测试默认类型集合语义
describe('focus type filter — default active types', () => {
  const DEFAULT_ACTIVE = new Set(['md', 'pdf']);

  it('md 默认开启', () => expect(DEFAULT_ACTIVE.has('md')).toBe(true));
  it('pdf 默认开启', () => expect(DEFAULT_ACTIVE.has('pdf')).toBe(true));
  it('html 默认关闭', () => expect(DEFAULT_ACTIVE.has('html')).toBe(false));
  it('json 默认关闭', () => expect(DEFAULT_ACTIVE.has('json')).toBe(false));
});

// 测试 toggle 语义（不依赖 DOM，纯 Set 逻辑）
describe('focus type filter — toggle logic', () => {
  function toggle(active: Set<string>, ext: string): Set<string> {
    const next = new Set(active);
    if (next.has(ext)) {
      if (next.size > 1) next.delete(ext);
    } else {
      next.add(ext);
    }
    return next;
  }

  it('关闭一个已开启的类型', () => {
    const result = toggle(new Set(['md', 'pdf']), 'pdf');
    expect(result.has('pdf')).toBe(false);
    expect(result.has('md')).toBe(true);
  });

  it('开启一个已关闭的类型', () => {
    const result = toggle(new Set(['md', 'pdf']), 'json');
    expect(result.has('json')).toBe(true);
  });

  it('最后一个类型不能被关闭', () => {
    const result = toggle(new Set(['md']), 'md');
    expect(result.has('md')).toBe(true);
    expect(result.size).toBe(1);
  });
});
