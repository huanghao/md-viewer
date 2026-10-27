import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { highlightCodeBlocks } from '../../src/client/utils/code-highlight';

let win: Window;
const prevWindow = (globalThis as any).window;

beforeEach(() => {
  win = new Window();
  (globalThis as any).window = win;
  (win as any).hljs = {
    getLanguage: (l: string) => (l === 'python' ? {} : undefined),
    highlight: (code: string, o: { language: string }) => ({ value: `<span class="hljs-keyword">${code}</span>` }),
  };
});
afterEach(() => { (globalThis as any).window = prevWindow; });

function render(html: string): HTMLElement {
  const el = win.document.createElement('div');
  el.innerHTML = html;
  return el as unknown as HTMLElement;
}

describe('highlightCodeBlocks', () => {
  it('带已知语言的块被高亮，文字内容不变', () => {
    const el = render('<pre><code class="language-python">def f(): pass</code></pre>');
    highlightCodeBlocks(el);
    const code = el.querySelector('code')!;
    expect(code.classList.contains('hljs')).toBe(true);
    expect(code.querySelector('.hljs-keyword')).not.toBeNull();
    expect(code.textContent).toBe('def f(): pass');
  });

  it('无语言 / 未知语言 / mermaid 不处理', () => {
    const el = render('<pre><code>plain</code></pre><pre><code class="language-nope">x</code></pre><pre><code class="language-mermaid">graph</code></pre>');
    highlightCodeBlocks(el);
    expect(el.querySelector('.hljs')).toBeNull();
  });

  it('重复调用不二次高亮；没有 hljs 时静默跳过', () => {
    const el = render('<pre><code class="language-python">a</code></pre>');
    highlightCodeBlocks(el);
    const once = el.innerHTML;
    highlightCodeBlocks(el);
    expect(el.innerHTML).toBe(once);
    delete (win as any).hljs;
    expect(() => highlightCodeBlocks(render('<pre><code class="language-python">a</code></pre>'))).not.toThrow();
  });
});
