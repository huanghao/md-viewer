import { describe, expect, it, beforeEach } from 'bun:test';
import { Window } from 'happy-dom';
import { collectTextNodes } from '../../src/client/utils/text-node-index';

let doc: Document;
beforeEach(() => {
  const win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
  (globalThis as any).NodeFilter = { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2, FILTER_SKIP: 3 };
});

function makeDiv(html: string): HTMLElement {
  const div = doc.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('collectTextNodes with skipSelector', () => {
  it('collects all text nodes without skipSelector', () => {
    const div = makeDiv('<p>hello</p><p>world</p>');
    const nodes = collectTextNodes(div);
    expect(nodes.map(n => n.nodeValue)).toEqual(['hello', 'world']);
  });

  it('skips nodes matching skipSelector', () => {
    const div = makeDiv(
      '<p>hello</p>' +
      '<div data-translation-target>译文</div>' +
      '<p>world</p>'
    );
    const nodes = collectTextNodes(div, '[data-translation-target]');
    expect(nodes.map(n => n.nodeValue)).toEqual(['hello', 'world']);
  });

  it('skips nested text inside matching selector', () => {
    const div = makeDiv(
      '<p>original text here</p>' +
      '<div data-translation-target><span>译文内容</span></div>'
    );
    const nodes = collectTextNodes(div, '[data-translation-target]');
    expect(nodes.map(n => n.nodeValue)).toEqual(['original text here']);
  });

  it('offset is same in translation mode as without', () => {
    const divOriginal = makeDiv('<p>hello</p><p>world</p>');
    const nodesOriginal = collectTextNodes(divOriginal);
    const textOriginal = nodesOriginal.map(n => n.nodeValue ?? '').join('');
    expect(textOriginal.indexOf('world')).toBe(5);

    const divWithTranslation = makeDiv(
      '<p>hello</p>' +
      '<div data-translation-target>译文</div>' +
      '<p>world</p>'
    );
    const nodesFiltered = collectTextNodes(divWithTranslation, '[data-translation-target]');
    const textFiltered = nodesFiltered.map(n => n.nodeValue ?? '').join('');
    expect(textFiltered.indexOf('world')).toBe(5);
  });
});
