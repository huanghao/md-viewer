import { describe, expect, it, beforeEach } from 'bun:test';
import { Window } from 'happy-dom';
import { buildParagraphMap } from '../../src/client/translation/paragraph-mapper';

let doc: Document;
beforeEach(() => {
  const win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
});

function makeContent(html: string): HTMLElement {
  const div = doc.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('buildParagraphMap', () => {
  it('maps first paragraph in first section', () => {
    const el = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language.</p>
      </div>
    `);
    const map = buildParagraphMap(el);
    expect(map.has('1-p0')).toBe(true);
    expect(map.get('1-p0')?.tagName).toBe('P');
  });

  it('maps multiple paragraphs per section', () => {
    const el = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>First paragraph with enough text to be included here.</p>
        <p>Second paragraph with enough text to be included here.</p>
      </div>
    `);
    const map = buildParagraphMap(el);
    expect(map.has('1-p0')).toBe(true);
    expect(map.has('1-p1')).toBe(true);
  });

  it('resets paragraph counter per section', () => {
    const el = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>First paragraph with enough text to be included here.</p>
        <h1>2. Methods</h1>
        <p>Second section first paragraph with enough text here.</p>
      </div>
    `);
    const map = buildParagraphMap(el);
    expect(map.has('1-p0')).toBe(true);
    expect(map.has('2-p0')).toBe(true);
    expect(map.has('2-p1')).toBe(false);
  });

  it('skips paragraphs shorter than 20 chars', () => {
    const el = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Short.</p>
        <p>This paragraph is long enough to be included in the map.</p>
      </div>
    `);
    const map = buildParagraphMap(el);
    expect(map.has('1-p0')).toBe(true);
    expect(map.size).toBe(1);
    expect(map.get('1-p0')?.textContent).toContain('long enough');
  });

  it('skips blockquote elements', () => {
    const el = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <blockquote><p>Figure placeholder</p></blockquote>
        <p>This paragraph is long enough to be included in the map.</p>
      </div>
    `);
    const map = buildParagraphMap(el);
    expect(map.size).toBe(1);
    expect(map.get('1-p0')?.textContent).toContain('long enough');
  });

  it('skips pre/code blocks', () => {
    const el = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <pre><code>some code block here</code></pre>
        <p>This paragraph is long enough to be included in the map.</p>
      </div>
    `);
    const map = buildParagraphMap(el);
    expect(map.size).toBe(1);
  });

  it('handles section path without numeric prefix', () => {
    const el = makeContent(`
      <div class="markdown-body">
        <h1>Introduction</h1>
        <p>This paragraph is long enough to be included in the map.</p>
      </div>
    `);
    const map = buildParagraphMap(el);
    // section without numeric prefix gets sequential index "1"
    expect(map.has('1-p0')).toBe(true);
  });

  it('handles content before any heading (section 0)', () => {
    const el = makeContent(`
      <div class="markdown-body">
        <p>This paragraph is long enough to be included in the map.</p>
        <h1>1. Introduction</h1>
        <p>Introduction paragraph long enough to be included here.</p>
      </div>
    `);
    const map = buildParagraphMap(el);
    expect(map.has('0-p0')).toBe(true);
    expect(map.has('1-p0')).toBe(true);
  });
});
