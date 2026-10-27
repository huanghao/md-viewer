import { describe, expect, it } from 'bun:test';
import {
  getMdThemeCss,
  getHlThemeCss,
  MD_THEMES,
  HL_THEMES,
} from '../../src/client/themes/index';

describe('theme registry', () => {
  it('MD_THEMES contains github, notion, bear', () => {
    const keys = MD_THEMES.map(t => t.key);
    expect(keys).toContain('github');
    expect(keys).toContain('notion');
    expect(keys).toContain('bear');
  });

  it('HL_THEMES contains github, github-dark, atom-one-dark', () => {
    const keys = HL_THEMES.map(t => t.key);
    expect(keys).toContain('github');
    expect(keys).toContain('github-dark');
    expect(keys).toContain('atom-one-dark');
  });

  // 基础样式（github-markdown-css / highlight github）由 main.ts 静态引入，
  // 所以 github 主题本身不带额外样式；其余主题只是叠加的覆盖层
  it('non-baseline themes have non-empty css', () => {
    for (const t of MD_THEMES.filter((t) => t.key !== 'github')) {
      expect(t.css.length).toBeGreaterThan(100);
    }
    for (const t of HL_THEMES) {
      expect(t.css.length).toBeGreaterThan(100);
    }
  });

  it('every theme has a non-empty label', () => {
    for (const t of [...MD_THEMES, ...HL_THEMES]) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});

describe('getMdThemeCss', () => {
  it('github 是基础样式，不需要额外覆盖', () => {
    expect(getMdThemeCss('github')).toBe('');
  });

  it('returns notion CSS for "notion"', () => {
    const css = getMdThemeCss('notion');
    expect(css).toContain('.markdown-body');
    // Notion overrides use Notion-style font
    expect(css).toContain('ui-sans-serif');
  });

  it('returns bear CSS for "bear"', () => {
    const css = getMdThemeCss('bear');
    expect(css).toContain('.markdown-body');
    // Bear uses serif font
    expect(css).toContain('Georgia');
  });

  it('falls back to github for unknown key', () => {
    const css = getMdThemeCss('nonexistent-theme');
    const githubCss = getMdThemeCss('github');
    expect(css).toBe(githubCss);
  });

  it('falls back to github for empty string', () => {
    const css = getMdThemeCss('');
    const githubCss = getMdThemeCss('github');
    expect(css).toBe(githubCss);
  });

  // 覆盖层不能内嵌基础样式：内嵌会让基础样式的深色变量盖掉全站 token 映射
  it('notion / bear 是纯覆盖层，且各自带深色块', () => {
    for (const key of ['notion', 'bear']) {
      const css = getMdThemeCss(key);
      expect(css).toContain('@media (prefers-color-scheme: dark)');
      expect(css).not.toContain('--bgColor-default');
      expect(css).not.toContain('[object');
    }
  });
});

describe('getHlThemeCss', () => {
  it('github 跟随系统：深色块在 prefers-color-scheme: dark 里，且代码底色透明交给外层 pre', () => {
    const css = getHlThemeCss('github');
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)\s*\{[\s\S]*#ff7b72/);
    expect(css).toContain('.hljs { background: transparent; }');
    expect(css).not.toContain('[object');
  });

  it('returns dark background for "github-dark"', () => {
    const css = getHlThemeCss('github-dark');
    expect(css).toContain('#0d1117'); // github dark background
  });

  it('returns dark background for "atom-one-dark"', () => {
    const css = getHlThemeCss('atom-one-dark');
    expect(css).toContain('#282c34'); // atom one dark background
  });

  it('falls back to github for unknown key', () => {
    const css = getHlThemeCss('nonexistent');
    const githubCss = getHlThemeCss('github');
    expect(css).toBe(githubCss);
  });
});
