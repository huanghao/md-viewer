import { hlGithubDark } from './hl-github-dark';

// 「GitHub」代码主题跟随系统外观：浅色用官方 GitHub Light，系统为深色时换 GitHub Dark。
// 明确选了 GitHub Dark / Atom One Dark 的人仍然始终是深色。
// 浅色基础样式（vendor-highlight-github.css）由 main.ts 静态引入，这里只补深色。
export const hlGithub = `
/* 代码块底色交给外层 pre（随正文主题），高亮只负责文字颜色 */
.hljs { background: transparent; }
@media (prefers-color-scheme: dark) {
${hlGithubDark}
.hljs { background: transparent; }
}
`;
