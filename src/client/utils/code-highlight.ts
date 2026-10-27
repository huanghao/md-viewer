/**
 * 代码块语法高亮。highlight.js 由 index.html 从 CDN 加载（和 marked / katex 一样是库集成点），
 * 配色来自 vendor-highlight-github.css / 主题里的 hljs-* 规则。
 *
 * 只处理带语言标记的块：没写语言的块自动识别经常猜错，保持纯文本；
 * mermaid / flowchart 另有渲染流程，不碰。高亮只往文本外面包 span，不改文字内容，不影响批注定位。
 */

const SKIP = /\blang(?:uage)?-(?:mermaid|flowchart)\b/;

export function highlightCodeBlocks(container: ParentNode): void {
  const hljs = (window as any).hljs;
  if (!hljs) return;
  container.querySelectorAll<HTMLElement>('pre > code[class*="language-"], pre > code[class*="lang-"]').forEach((code) => {
    if (code.classList.contains('hljs') || SKIP.test(code.className)) return;
    const lang = /\blang(?:uage)?-([\w+#-]+)/.exec(code.className)?.[1];
    if (!lang || !hljs.getLanguage(lang)) return;
    try {
      code.innerHTML = hljs.highlight(code.textContent || '', { language: lang, ignoreIllegals: true }).value;
      code.classList.add('hljs');
    } catch { /* 高亮失败时保留原样 */ }
  });
}
