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

  it('every theme has non-empty css', () => {
    for (const t of MD_THEMES) {
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
  it('returns github CSS for "github"', () => {
    const css = getMdThemeCss('github');
    expect(css).toContain('.markdown-body');
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

  // Notion and Bear layer on top of github baseline — both must contain github base
  it('notion theme includes github baseline CSS', () => {
    const notion = getMdThemeCss('notion');
    const github = getMdThemeCss('github');
    // Notion = github + overrides, so it must be longer
    expect(notion.length).toBeGreaterThan(github.length);
    // And must contain the github base
    expect(notion).toContain(github.slice(0, 200));
  });

  it('bear theme includes github baseline CSS', () => {
    const bear = getMdThemeCss('bear');
    const github = getMdThemeCss('github');
    expect(bear.length).toBeGreaterThan(github.length);
    expect(bear).toContain(github.slice(0, 200));
  });
});

describe('getHlThemeCss', () => {
  it('returns github light CSS for "github"', () => {
    const css = getHlThemeCss('github');
    expect(css).toContain('.hljs');
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
