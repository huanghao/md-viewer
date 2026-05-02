import { describe, expect, it } from 'bun:test';
import { defaultConfig } from '../../src/client/config';
import { getFileExtension } from '../../src/client/utils/file-type';
import {
  DEFAULT_FOCUS_ACTIVE_TYPES,
  normalizeFocusFileType,
  sameFocusActiveTypes,
  sanitizeFocusActiveTypes,
  toggleFocusActiveType,
} from '../../src/client/utils/focus-type-filter';

// 测试类型过滤的核心逻辑：扩展名归一化
describe('focus type filter — extension normalization', () => {
  it('md 文件归到 md', () => {
    expect(getFileExtension('/a/b/file.md')).toBe('md');
  });

  it('markdown 文件归到 md（需调用方归一化）', () => {
    const ext = getFileExtension('/a/file.markdown');
    expect(normalizeFocusFileType(ext)).toBe('md');
  });

  it('pdf 文件归到 pdf', () => {
    expect(getFileExtension('/a/file.pdf')).toBe('pdf');
  });

  it('json 文件归到 json', () => {
    expect(getFileExtension('/a/file.json')).toBe('json');
  });

  it('jsonl 文件归一化到 json（需调用方归一化）', () => {
    const ext = getFileExtension('/a/file.jsonl');
    expect(normalizeFocusFileType(ext)).toBe('json');
  });

  it('html 文件归到 html', () => {
    expect(getFileExtension('/a/file.html')).toBe('html');
  });

  it('htm 文件归一化到 html（需调用方归一化）', () => {
    const ext = getFileExtension('/a/file.htm');
    expect(normalizeFocusFileType(ext)).toBe('html');
  });

  it('无扩展名返回空字符串', () => {
    expect(getFileExtension('/a/Makefile')).toBe('');
  });
});

// 测试默认类型集合语义
describe('focus type filter — default active types', () => {
  const DEFAULT_ACTIVE = new Set(DEFAULT_FOCUS_ACTIVE_TYPES);

  it('config 默认保存 md/pdf', () => {
    expect(defaultConfig.focusActiveTypes).toEqual(['md', 'pdf']);
  });

  it('md 默认开启', () => expect(DEFAULT_ACTIVE.has('md')).toBe(true));
  it('pdf 默认开启', () => expect(DEFAULT_ACTIVE.has('pdf')).toBe(true));
  it('html 默认关闭', () => expect(DEFAULT_ACTIVE.has('html')).toBe(false));
  it('json 默认关闭', () => expect(DEFAULT_ACTIVE.has('json')).toBe(false));
});

// 测试 toggle 语义（不依赖 DOM，纯 Set 逻辑）
describe('focus type filter — toggle logic', () => {
  it('关闭一个已开启的类型', () => {
    const result = new Set(toggleFocusActiveType(new Set(['md', 'pdf']), 'pdf'));
    expect(result.has('pdf')).toBe(false);
    expect(result.has('md')).toBe(true);
  });

  it('开启一个已关闭的类型', () => {
    const result = new Set(toggleFocusActiveType(new Set(['md', 'pdf']), 'json'));
    expect(result.has('json')).toBe(true);
  });

  it('最后一个类型不能被关闭', () => {
    const result = new Set(toggleFocusActiveType(new Set(['md']), 'md'));
    expect(result.has('md')).toBe(true);
    expect(result.size).toBe(1);
  });
});

describe('focus type filter — persistence shape', () => {
  it('old configs without active types fall back to md/pdf', () => {
    expect(sanitizeFocusActiveTypes(undefined)).toEqual(['md', 'pdf']);
  });

  it('empty saved active types are rejected so the view never hides everything', () => {
    expect(sanitizeFocusActiveTypes([])).toEqual(['md', 'pdf']);
  });

  it('deduplicates saved active types', () => {
    expect(sanitizeFocusActiveTypes(['md', 'pdf', 'pdf'])).toEqual(['md', 'pdf']);
  });

  it('compares active type arrays by value', () => {
    expect(sameFocusActiveTypes(['md', 'pdf'], ['md', 'pdf'])).toBe(true);
    expect(sameFocusActiveTypes(['pdf', 'md'], ['md', 'pdf'])).toBe(false);
  });
});
