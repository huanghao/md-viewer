import { describe, expect, it } from 'bun:test';
import { protectMath } from '../../src/client/utils/math-protect';

describe('protectMath', () => {
  it('restores $$ block unchanged', () => {
    const src = 'before $$a_b + c_d$$ after';
    const g = protectMath(src);
    expect(g.protected).not.toContain('_');
    expect(g.restore(g.protected)).toBe(src);
  });

  it('restores inline $ block unchanged', () => {
    const src = 'text $p_\\theta(y_t)$ end';
    const g = protectMath(src);
    expect(g.protected).not.toContain('_');
    expect(g.restore(g.protected)).toBe(src);
  });

  it('restores \\[...\\] block unchanged', () => {
    const src = '\\[\\mathcal{L}_{\\text{NLL}}\\]';
    const g = protectMath(src);
    expect(g.restore(g.protected)).toBe(src);
  });

  it('restores \\(...\\) block unchanged', () => {
    const src = 'see \\(x^2\\) here';
    const g = protectMath(src);
    expect(g.restore(g.protected)).toBe(src);
  });

  it('does not disturb non-math content', () => {
    const src = 'just plain text with no math';
    const g = protectMath(src);
    expect(g.protected).toBe(src);
    expect(g.restore(src)).toBe(src);
  });

  it('handles multiple math blocks in one string', () => {
    const src = '$a_1$ and $$b_2$$';
    const g = protectMath(src);
    expect(g.protected).not.toContain('_');
    expect(g.restore(g.protected)).toBe(src);
  });

  it('restore is idempotent when html has no placeholders', () => {
    const src = '$x_1$';
    const g = protectMath(src);
    const html = '<p>some rendered html</p>';
    expect(g.restore(html)).toBe(html);
  });

  it('does not match $$ as two separate $ blocks', () => {
    const src = '$$x^2$$';
    const g = protectMath(src);
    // should be exactly one placeholder, not two
    const placeholders = (g.protected.match(/\x02MATH\d+\x03/g) ?? []).length;
    expect(placeholders).toBe(1);
  });
});
