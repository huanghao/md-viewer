import { describe, expect, it } from 'bun:test';
import { coordPath, buildPdfContext } from '../../src/client/pdf-viewer';
import type { PdfPageTextItem } from '../../src/client/pdf-viewer';

// ── helpers ───────────────────────────────────────────────────────────────

/** Build a minimal PdfPageTextItem at given PDF coords (x, baseline_y from bottom). */
function item(str: string, x: number, baselineY: number, width: number, height = 12): PdfPageTextItem {
  return {
    str,
    // transform[4]=x, transform[5]=baselineY (PDF coords, Y from bottom)
    transform: [1, 0, 0, -height, x, baselineY],
    width,
    height,
  };
}

/** pageH used throughout: 800pt */
const PAGE_H = 800;

// ── coordPath ─────────────────────────────────────────────────────────────

describe('coordPath', () => {
  it('returns null when no items are hit', () => {
    const items = [item('hello', 100, 700, 50)];
    // drag far away from the item
    const result = coordPath(items, PAGE_H, 0, 0, 10, 10);
    expect(result.text).toBeNull();
    expect(result.hits).toHaveLength(0);
  });

  it('hits a single item whose center is inside the selection rect', () => {
    // item center: x=125, screenY = PAGE_H - 700 = 100, center_y = 100 - 12*0.35 ≈ 95.8
    const items = [item('hello world', 100, 700, 50, 12)];
    // selection covers x=[100,150], y=[88,108] — center (125, ~96) is inside
    const result = coordPath(items, PAGE_H, 100, 88, 150, 108);
    expect(result.text).toBe('hello world');
    expect(result.hits).toEqual([0]);
  });

  it('does not hit an item whose center is outside the selection rect', () => {
    const items = [item('hello', 100, 700, 50, 12)];
    // selection is to the right of the item
    const result = coordPath(items, PAGE_H, 200, 88, 300, 108);
    expect(result.text).toBeNull();
  });

  it('skips whitespace-only items', () => {
    const items = [
      item('  ', 100, 700, 20, 12),
      item('real text', 120, 700, 80, 12),
    ];
    const result = coordPath(items, PAGE_H, 100, 88, 220, 108);
    expect(result.text).toBe('real text');
    expect(result.hits).toEqual([1]);
  });

  it('collects multiple items on the same line', () => {
    const items = [
      item('the', 50, 700, 30, 12),
      item('quick', 90, 700, 40, 12),
      item('fox', 140, 700, 30, 12),
    ];
    // wide selection covering all three centers
    const result = coordPath(items, PAGE_H, 40, 88, 180, 108);
    expect(result.text).toContain('the');
    expect(result.text).toContain('quick');
    expect(result.text).toContain('fox');
    expect(result.hits).toHaveLength(3);
  });

  it('normalises reversed drag direction (right-to-left, same line)', () => {
    const items = [item('hello', 100, 700, 50, 12)];
    // item: iy=88, iy2≈103.6, cy≈95.8
    // drag right-to-left on same line (deltaY=2 < 5 → same-line path)
    // reversed=true (downX=160 > upX=90): startX=90, endX=160
    // selLeft=90, selRight=160, selTop=94, selBottom=96 → cy=95.8 ✓
    const result = coordPath(items, PAGE_H, 160, 94, 90, 96);
    expect(result.hits).toContain(0);
  });

  it('handles multi-line selection (deltaY > 5)', () => {
    const items = [
      item('line one', 50, 700, 80, 12),   // screenY ≈ 100
      item('line two', 50, 680, 80, 12),   // screenY ≈ 120
    ];
    // selection spans both lines
    const result = coordPath(items, PAGE_H, 50, 88, 140, 132);
    expect(result.hits).toHaveLength(2);
  });

  it('estimates character offset for first and last items', () => {
    // item: x=100, width=100, str='0123456789' (10 chars)
    const items = [item('0123456789', 100, 700, 100, 12)];
    // start at x=150 → startChar ≈ 5; end at x=180 → endChar ≈ 8
    const result = coordPath(items, PAGE_H, 150, 88, 180, 108);
    // slice(5,8) = '567', trimmed
    expect(result.text).toBe('567');
  });
});

// ── buildPdfContext ───────────────────────────────────────────────────────

function textItems(strs: string[]): PdfPageTextItem[] {
  return strs.map((s, i) => item(s, i * 100, 700, 90, 12));
}

describe('buildPdfContext — direction: after', () => {
  it('returns empty string when anchorIdx is last item', () => {
    const items = textItems(['a', 'b', 'c']);
    expect(buildPdfContext(items, 2, 'after')).toBe('');
  });

  it('collects items after anchor up to sentence boundary', () => {
    const items = textItems(['anchor', 'hello', 'world.', 'next sentence']);
    // anchor=0, collects 'hello', 'world.' then stops at sentence end
    const result = buildPdfContext(items, 0, 'after');
    expect(result).toBe('hello world.');
    expect(result).not.toContain('next sentence');
  });

  it('stops at CHAR_LIMIT even without sentence boundary', () => {
    // 12 items each 12 chars = 144 chars total, over 120 limit
    const strs = Array.from({ length: 12 }, (_, i) => `word${String(i).padStart(8, '0')}`);
    const items = textItems(strs);
    const result = buildPdfContext(items, 0, 'after');
    expect(result.length).toBeLessThanOrEqual(120);
  });

  it('skips empty/whitespace items', () => {
    const items = textItems(['anchor', '', 'content.', 'more']);
    const result = buildPdfContext(items, 0, 'after');
    expect(result).toBe('content.');
  });

  it('handles Chinese sentence boundary', () => {
    const items = textItems(['anchor', '这是一句话。', '下一句']);
    const result = buildPdfContext(items, 0, 'after');
    expect(result).toBe('这是一句话。');
    expect(result).not.toContain('下一句');
  });
});

describe('buildPdfContext — direction: before', () => {
  it('returns empty string when anchorIdx is 0', () => {
    const items = textItems(['a', 'b', 'c']);
    expect(buildPdfContext(items, 0, 'before')).toBe('');
  });

  it('collects items before anchor and stops after sentence boundary item', () => {
    const items = textItems(['outside.', 'prev sentence.', 'hello', 'world', 'anchor']);
    // anchor=4, collects 'world','hello','prev sentence.' then stops (sentence end)
    // 'outside.' is not collected
    const result = buildPdfContext(items, 4, 'before');
    expect(result).toContain('hello');
    expect(result).toContain('world');
    expect(result).toContain('prev sentence.');
    expect(result).not.toContain('outside.');
  });

  it('stops at CHAR_LIMIT from the left', () => {
    const strs = Array.from({ length: 12 }, (_, i) => `word${String(i).padStart(8, '0')}`);
    const items = textItems([...strs, 'anchor']);
    const result = buildPdfContext(items, strs.length, 'before');
    expect(result.length).toBeLessThanOrEqual(120);
  });

  it('skips empty/whitespace items', () => {
    const items = textItems(['content.', '', 'anchor']);
    const result = buildPdfContext(items, 2, 'before');
    expect(result).toBe('content.');
  });
});
