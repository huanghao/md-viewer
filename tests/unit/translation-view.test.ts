import { describe, expect, it, beforeEach } from 'bun:test';
import { Window } from 'happy-dom';
import { buildParagraphMap } from '../../src/client/translation/paragraph-mapper';
import { enterTranslationMode, exitTranslationMode, isTranslationActive } from '../../src/client/translation/translation-view';

let doc: Document;
beforeEach(() => {
  const win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
});

function makeContent(html: string): HTMLElement {
  const div = doc.createElement('div');
  div.id = 'content';
  div.innerHTML = html;
  doc.body.appendChild(div);
  return div;
}

describe('enterTranslationMode', () => {
  it('inserts translation block after matched paragraph', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    const data: Record<string, string> = { '1-p0': '基础模型是语言模型。' };

    enterTranslationMode(data, paragraphMap);

    const blocks = content.querySelectorAll('.translation-block');
    expect(blocks.length).toBe(1);
    expect(blocks[0].textContent).toBe('基础模型是语言模型。');
  });

  it('marks original paragraph with data-translation-source', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    enterTranslationMode({ '1-p0': '译文' }, paragraphMap);

    const sourcePara = content.querySelector('[data-translation-source]');
    expect(sourcePara).not.toBeNull();
  });

  it('marks translation block with data-translation-target', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    enterTranslationMode({ '1-p0': '译文' }, paragraphMap);

    const targetBlock = content.querySelector('[data-translation-target]');
    expect(targetBlock).not.toBeNull();
  });

  it('adds translation-active class to content element', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    enterTranslationMode({ '1-p0': '译文' }, paragraphMap);

    expect(content.classList.contains('translation-active')).toBe(true);
  });

  it('skips keys not in paragraphMap', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    enterTranslationMode({ '99-p0': '不存在的段落' }, paragraphMap);

    const blocks = content.querySelectorAll('.translation-block');
    expect(blocks.length).toBe(0);
  });

  it('isTranslationActive returns true after entering', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    enterTranslationMode({ '1-p0': '译文' }, paragraphMap);
    expect(isTranslationActive()).toBe(true);
  });
});

describe('exitTranslationMode', () => {
  it('removes all translation blocks', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
        <p>Second paragraph is also long enough to be included here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    enterTranslationMode({ '1-p0': '译文一', '1-p1': '译文二' }, paragraphMap);
    exitTranslationMode();

    expect(content.querySelectorAll('.translation-block').length).toBe(0);
  });

  it('removes data-translation-source attributes', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    enterTranslationMode({ '1-p0': '译文' }, paragraphMap);
    exitTranslationMode();

    expect(content.querySelector('[data-translation-source]')).toBeNull();
  });

  it('removes translation-active class', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    enterTranslationMode({ '1-p0': '译文' }, paragraphMap);
    exitTranslationMode();

    expect(content.classList.contains('translation-active')).toBe(false);
  });

  it('isTranslationActive returns false after exiting', () => {
    const content = makeContent(`
      <div class="markdown-body">
        <h1>1. Introduction</h1>
        <p>Foundation models are general models of language here.</p>
      </div>
    `);
    const paragraphMap = buildParagraphMap(content);
    enterTranslationMode({ '1-p0': '译文' }, paragraphMap);
    exitTranslationMode();
    expect(isTranslationActive()).toBe(false);
  });
});
