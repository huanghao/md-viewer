import { githubMarkdownCSS } from '../vendor-css';

// Notion 主题：在 GitHub baseline 上叠加 typography/color overrides
// 保留所有 GFM 特性样式（task list、alert、footnote 等），只覆盖视觉 token
export const mdNotion = githubMarkdownCSS + `

/* ===== Notion theme overrides ===== */
.markdown-body {
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: #37352f;
  background-color: #fff;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  font-weight: 700;
  letter-spacing: -0.3px;
  color: #37352f;
  border-bottom: none;
}
.markdown-body h1 { font-size: 1.875em; margin-top: 1.4em; }
.markdown-body h2 { font-size: 1.5em; margin-top: 1.4em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body p { color: #37352f; margin-bottom: 1em; }
.markdown-body a { color: #0f6cbd; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  background: rgba(135,131,120,0.15);
  border-radius: 3px;
  padding: 0.2em 0.4em;
  color: #eb5757;
  border: none;
}
.markdown-body pre {
  background: #f7f6f3;
  border-radius: 4px;
  border: none;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  border: none;
}
.markdown-body blockquote {
  border-left: 3px solid #37352f;
  color: #6b6b6b;
}
.markdown-body hr {
  border-top-color: rgba(55,53,47,0.16);
}
.markdown-body table th {
  background: rgba(55,53,47,0.05);
}
.markdown-body table th, .markdown-body table td {
  border-color: rgba(55,53,47,0.2);
}
`;
