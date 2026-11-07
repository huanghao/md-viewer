import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { sanitizeHtml } from '../../src/client/utils/html-sanitize';

const KEYS = ['window', 'document', 'Node'] as const;
const saved: Record<string, any> = {};

beforeAll(() => {
  const win = new Window({ url: 'http://localhost/' });
  for (const k of KEYS) {
    saved[k] = (globalThis as any)[k];
    (globalThis as any)[k] = k === 'window' ? win : (win as any)[k];
  }
});

afterAll(() => {
  for (const k of KEYS) (globalThis as any)[k] = saved[k];
});

describe('sanitizeHtml', () => {
  it('去掉脚本与事件属性', () => {
    const out = sanitizeHtml('<p onclick="x()">a</p><script>window.__x=1</script><img src=x onerror="y()">');
    expect(out).not.toContain('script');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onerror');
    expect(out).toContain('<p>a</p>');
  });

  it('危险协议的链接与图片被移除，http 与 pdf 保留', () => {
    const out = sanitizeHtml(
      '<a href="javascript:alert(1)">x</a>' +
      '<a href="java\tscript:alert(2)">y</a>' +
      '<a href="https://example.com">ok</a>' +
      '<a href="pdf:///a/b.pdf#page=2">pdf</a>' +
      '<img src="data:image/svg+xml;base64,PHN2Zz4=" alt="s">' +
      '<img src="https://example.com/a.png" alt="ok">',
    );
    expect(out).not.toContain('javascript');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('href="pdf:///a/b.pdf#page=2"');
    expect(out).not.toContain('svg+xml');
    expect(out).toContain('src="https://example.com/a.png"');
  });

  it('相对链接（含百分号编码的 md 文件名与锚点）保留', () => {
    const out = sanitizeHtml(
      '<a href="rg%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md">g</a>' +
      '<a href="../a/b.md#sec">r</a><a href="#top">t</a>',
    );
    expect(out).toContain('href="rg%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md"');
    expect(out).toContain('href="../a/b.md#sec"');
    expect(out).toContain('href="#top"');
  });

  it('data-* 属性被移除，避免伪造 data-action 等应用动作', () => {
    const out = sanitizeHtml('<span data-action="workspace-confirm-remove" data-workspace-id="w1">x</span>');
    expect(out).not.toContain('data-');
    expect(out).toContain('<span>x</span>');
  });

  it('未知标签保留内容，去掉标签；iframe 整段丢弃', () => {
    expect(sanitizeHtml('<custom-tag>hi <b>there</b></custom-tag>')).toBe('hi <b>there</b>');
    expect(sanitizeHtml('<iframe src="https://evil.example"></iframe>ok')).toBe('ok');
  });

  it('保留 Markdown 常用结构与属性（表格对齐、任务列表复选框、代码类名、id）', () => {
    const html = '<table><thead><tr><th align="right" id="h">n</th></tr></thead></table>' +
      '<ul><li><input type="checkbox" checked disabled> done</li></ul>' +
      '<pre><code class="language-ts">const a = 1;</code></pre>' +
      '<h2 id="sec">标题</h2>';
    const out = sanitizeHtml(html);
    expect(out).toContain('align="right"');
    expect(out).toContain('<input type="checkbox" checked="" disabled="">');
    expect(out).toContain('class="language-ts"');
    expect(out).toContain('id="sec"');
  });

  it('非复选框的 input 被移除，style 中的 url() 与 expression 被移除', () => {
    expect(sanitizeHtml('<input type="text" value="x">')).toBe('');
    expect(sanitizeHtml('<span style="background:url(https://t.example/p.gif)">x</span>')).toBe('<span>x</span>');
    expect(sanitizeHtml('<span style="width:expression(alert(1))">x</span>')).toBe('<span>x</span>');
    expect(sanitizeHtml('<span style="color:red">x</span>')).toBe('<span style="color:red">x</span>');
  });
});
