import { describe, expect, it, beforeEach } from 'bun:test';
import { Window } from 'happy-dom';
import { getTextNodes, globalOffsetForPosition, globalOffsetForPositionEnd, positionForGlobalOffset, clamp, placeFloating, getReaderText } from '../../src/client/annotation/position';

let doc: Document;
beforeEach(() => {
  const win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
  (globalThis as any).window = { innerWidth: 1024, innerHeight: 768 };
  (globalThis as any).NodeFilter = { SHOW_TEXT: 4 };
});

function makeDiv(html: string): HTMLElement {
  const div = doc.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('clamp', () => {
  it('returns value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps to min', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });
  it('clamps to max', () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('getTextNodes', () => {
  it('returns text nodes from element', () => {
    const div = makeDiv('hello <b>world</b>');
    const nodes = getTextNodes(div);
    expect(nodes.length).toBe(2);
    expect(nodes[0].nodeValue).toBe('hello ');
    expect(nodes[1].nodeValue).toBe('world');
  });

  it('skips empty text nodes', () => {
    const div = makeDiv('<b></b>text');
    const nodes = getTextNodes(div);
    expect(nodes.every(n => (n.nodeValue?.length ?? 0) > 0)).toBe(true);
  });

  it('returns empty array for element with no text', () => {
    const div = makeDiv('<br><hr>');
    expect(getTextNodes(div).length).toBe(0);
  });
});

describe('getReaderText', () => {
  it('concatenates all text content', () => {
    const div = makeDiv('hello <b>world</b>') as HTMLElement;
    expect(getReaderText(div)).toBe('hello world');
  });

  it('returns empty string for no text', () => {
    const div = makeDiv('<br>') as HTMLElement;
    expect(getReaderText(div)).toBe('');
  });
});

describe('globalOffsetForPosition', () => {
  it('returns correct offset for first text node', () => {
    const div = makeDiv('hello world') as HTMLElement;
    const textNode = getTextNodes(div)[0];
    expect(globalOffsetForPosition(div, textNode, 5)).toBe(5);
  });

  it('returns offset spanning multiple nodes', () => {
    const div = makeDiv('abc<b>def</b>') as HTMLElement;
    const nodes = getTextNodes(div);
    // second node starts at offset 3
    expect(globalOffsetForPosition(div, nodes[1], 2)).toBe(5);
  });

  it('returns -1 for unknown node', () => {
    const div = makeDiv('hello') as HTMLElement;
    const other = doc.createTextNode('other');
    expect(globalOffsetForPosition(div, other, 0)).toBe(-1);
  });
});

describe('positionForGlobalOffset', () => {
  it('resolves offset to correct node and local offset', () => {
    const div = makeDiv('hello world') as HTMLElement;
    const result = positionForGlobalOffset(div, 6);
    expect(result).not.toBeNull();
    expect(result!.node.nodeValue).toBe('hello world');
    expect(result!.offset).toBe(6);
  });

  it('returns last node position when offset exceeds text length', () => {
    const div = makeDiv('abc') as HTMLElement;
    const result = positionForGlobalOffset(div, 100);
    expect(result).not.toBeNull();
    expect(result!.offset).toBe(3);
  });

  it('returns null for empty element', () => {
    const div = makeDiv('') as HTMLElement;
    const result = positionForGlobalOffset(div, 0);
    expect(result).toBeNull();
  });

  it('resolves offset spanning multiple nodes', () => {
    const div = makeDiv('abc<b>def</b>') as HTMLElement;
    const result = positionForGlobalOffset(div, 4); // offset 4 is in 'def', local offset 1
    expect(result).not.toBeNull();
    expect(result!.node.nodeValue).toBe('def');
    expect(result!.offset).toBe(1);
  });
});

describe('getTextNodes with katex', () => {
  it('skips text nodes inside .katex element', () => {
    const div = makeDiv('before<span class="katex"><span>formula</span></span>after') as HTMLElement;
    const nodes = getTextNodes(div);
    expect(nodes.length).toBe(2);
    expect(nodes[0].nodeValue).toBe('before');
    expect(nodes[1].nodeValue).toBe('after');
  });

  it('offset of text after katex ignores katex text length', () => {
    // "before" = 6 chars, katex is skipped, "after" starts at offset 6
    const div = makeDiv('before<span class="katex"><span>formula</span></span>after') as HTMLElement;
    const nodes = getTextNodes(div);
    expect(globalOffsetForPosition(div, nodes[1], 0)).toBe(6);
    expect(globalOffsetForPosition(div, nodes[1], 5)).toBe(11);
  });
});

describe('globalOffsetForPosition with element boundary node', () => {
  // Simulates browser Range where startContainer is a <p> element, not a text node.
  // e.g. <p>before<span class="katex">...</span>after</p>
  // Range.setStart(p, 0) means "before all children" → offset 0
  it('returns 0 when boundary is before all text', () => {
    const div = makeDiv('<p>hello world</p>') as HTMLElement;
    const p = div.querySelector('p')!;
    // childIndex=0: before "hello world" text node
    expect(globalOffsetForPosition(div, p, 0)).toBe(0);
  });

  it('returns full length when boundary is after all children', () => {
    const div = makeDiv('<p>hello</p>') as HTMLElement;
    const p = div.querySelector('p')!;
    expect(globalOffsetForPosition(div, p, p.childNodes.length)).toBe(5);
  });

  it('snaps start to text node start after katex span', () => {
    // <p>before<span class="katex">X</span>after</p>
    // childIndex=2 means after the katex span, before "after" text node
    const div = makeDiv('<p>before<span class="katex"><span>X</span></span>after</p>') as HTMLElement;
    const p = div.querySelector('p')!;
    // p.childNodes: [#text"before", span.katex, #text"after"]
    // childIndex=2 = after katex span → should snap to start of "after" = offset 6
    expect(globalOffsetForPosition(div, p, 2)).toBe(6);
  });
});

describe('globalOffsetForPositionEnd with element boundary node', () => {
  it('returns full length when boundary is after all children', () => {
    const div = makeDiv('<p>hello</p>') as HTMLElement;
    const p = div.querySelector('p')!;
    expect(globalOffsetForPositionEnd(div, p, p.childNodes.length)).toBe(5);
  });

  it('snaps end to text node end before katex span', () => {
    // <p>before<span class="katex">X</span>after</p>
    // childIndex=1 means after "before" text node, before katex span → snap to end of "before" = 6
    const div = makeDiv('<p>before<span class="katex"><span>X</span></span>after</p>') as HTMLElement;
    const p = div.querySelector('p')!;
    // p.childNodes: [#text"before", span.katex, #text"after"]
    // childIndex=1 = after "before", before katex → end of "before" = offset 6
    expect(globalOffsetForPositionEnd(div, p, 1)).toBe(6);
  });

  it('produces valid start < end spanning inline formula', () => {
    // Simulate selection: start="before"[2], end=<p>[2] (after katex, before "after")
    const div = makeDiv('<p>before<span class="katex"><span>X</span></span>after</p>') as HTMLElement;
    const p = div.querySelector('p')!;
    const nodes = getTextNodes(div);
    const beforeNode = nodes[0]; // "before"
    const start = globalOffsetForPosition(div, beforeNode, 2); // offset 2 in "before" → global 2
    const end = globalOffsetForPositionEnd(div, p, 2);          // after katex → global 6
    expect(start).toBe(2);
    expect(end).toBe(6);
    expect(end).toBeGreaterThan(start);
  });
});

describe('globalOffsetForPosition/End with selection endpoint inside katex', () => {
  // Browser sometimes sets Range endpoints inside KaTeX internal nodes
  it('start inside katex snaps forward to text after katex', () => {
    const div = makeDiv('<p>before<span class="katex"><span>formula</span></span>after</p>') as HTMLElement;
    const katexInner = (div.querySelector('span.katex span') as any)?.childNodes[0] as Text;
    // "before" = 6 chars; katex snaps to start of "after" = offset 6
    expect(globalOffsetForPosition(div, katexInner, 0)).toBe(6);
  });

  it('end inside katex snaps backward to text before katex', () => {
    const div = makeDiv('<p>before<span class="katex"><span>formula</span></span>after</p>') as HTMLElement;
    const katexInner = (div.querySelector('span.katex span') as any)?.childNodes[0] as Text;
    // snap to end of "before" = offset 6
    expect(globalOffsetForPositionEnd(div, katexInner, 3)).toBe(6);
  });

  it('start/end from katex interior produce valid positionValid range', () => {
    const div = makeDiv('<p>before<span class="katex"><span>formula</span></span>after</p>') as HTMLElement;
    const katexInner = (div.querySelector('span.katex span') as any)?.childNodes[0] as Text;
    const start = globalOffsetForPosition(div, katexInner, 0);
    const end = globalOffsetForPositionEnd(div, katexInner, 3);
    // Both snap to offset 6 (boundary of katex), end >= start is acceptable
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThanOrEqual(0);
  });
});

describe('placeFloating', () => {
  it('sets left and top style within viewport bounds', () => {
    const el = doc.createElement('div') as HTMLElement;
    placeFloating(el, 100, 100);
    expect(el.style.left).toBe('100px');
    expect(el.style.top).toBe('100px');
  });

  it('clamps left to avoid overflow on right edge', () => {
    const el = doc.createElement('div') as HTMLElement;
    placeFloating(el, 900, 100); // viewport 1024, width 360 → max left = 1024-360-8 = 656
    expect(el.style.left).toBe('656px');
  });

  it('clamps top to avoid overflow on bottom edge', () => {
    const el = doc.createElement('div') as HTMLElement;
    placeFloating(el, 100, 700); // viewport 768, height 220 → max top = 768-220-8 = 540
    expect(el.style.top).toBe('540px');
  });
});
