import { describe, expect, it } from 'bun:test';
import { fuzzyMatch, fuzzyScore } from '../../src/client/utils/fuzzy-search';
import { fuzzySegments } from "../../src/client/utils/fuzzy-search";

describe('fuzzyMatch', () => {
  it('returns null when query does not match', () => {
    expect(fuzzyMatch('foo-bar.ts', 'qux')).toBeNull();
  });

  it('matches single token substring', () => {
    const result = fuzzyMatch('workspace-state.ts', 'workspace');
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
    expect(result!.highlight).toContain('<mark');
    expect(result!.highlight).toContain('workspace');
  });

  it('matches multi-token query — the core requirement', () => {
    const result = fuzzyMatch('workspace-tree-expansion-persistence.ts', 'workspace persistence');
    expect(result).not.toBeNull();
    expect(result!.highlight).toContain('<mark');
  });

  it('returns null when one token of multi-token query does not match', () => {
    expect(fuzzyMatch('workspace-state.ts', 'workspace qux')).toBeNull();
  });

  it('empty query returns non-null with plain escaped text', () => {
    const result = fuzzyMatch('foo.ts', '');
    expect(result).not.toBeNull();
    expect(result!.highlight).toBe('foo.ts');
    expect(result!.score).toBe(0);
  });

  it('escapes HTML in text', () => {
    const result = fuzzyMatch('<script>alert(1)</script>', '');
    expect(result!.highlight).not.toContain('<script>');
    expect(result!.highlight).toContain('&lt;script&gt;');
  });
});

describe('fuzzyScore', () => {
  it('returns 0 for no match', () => {
    expect(fuzzyScore('foo.ts', 'qux')).toBe(0);
  });

  it('returns positive score for match', () => {
    expect(fuzzyScore('workspace-state.ts', 'workspace')).toBeGreaterThan(0);
  });

  it('returns 0 when one token of multi-token query does not match', () => {
    expect(fuzzyScore('workspace-state.ts', 'workspace qux')).toBe(0);
  });
});


describe("fuzzySegments", () => {
  it("把匹配区间切成带标记的片段", () => {
    expect(fuzzySegments("rg使用指南.md", "指南")).toEqual([
      { text: "rg使用", match: false },
      { text: "指南", match: true },
      { text: ".md", match: false },
    ]);
  });
  it("空查询或无匹配时返回整段", () => {
    expect(fuzzySegments("abc", "")).toEqual([{ text: "abc", match: false }]);
    expect(fuzzySegments("abc", "zz")).toEqual([{ text: "abc", match: false }]);
  });
  it("不做 HTML 转义（由 React 负责），原样保留特殊字符", () => {
    expect(fuzzySegments("a<b>", "b")).toEqual([
      { text: "a<", match: false },
      { text: "b", match: true },
      { text: ">", match: false },
    ]);
  });
});
