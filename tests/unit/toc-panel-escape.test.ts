import { describe, expect, it } from 'bun:test';
import { renderItems } from '../../src/client/ui/toc-panel';

describe('renderItems 转义', () => {
  it('标题中的 HTML 被转义，不会生成真实元素', () => {
    const html = renderItems([{
      title: '<img src=x onerror="window.__tocXss=1">注入',
      level: 2,
      anchor: 'a"b',
      children: [],
    } as any]);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('a&quot;b');
  });
});
