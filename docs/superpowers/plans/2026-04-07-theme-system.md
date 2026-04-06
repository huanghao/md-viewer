# Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-theme system to MD Viewer — users can switch Markdown rendering themes and code highlight themes at runtime via the settings dialog, with preference persisted in localStorage.

**Architecture:** Each theme is a CSS string stored in `src/client/themes/`. The HTML page gets two `<style id="...">` tags (one for Markdown theme, one for code highlight theme). Switching themes replaces the `textContent` of those style tags — no re-rendering of Markdown needed. Theme preference is stored in `AppConfig` (`markdownTheme` + `codeTheme` fields).

**Tech Stack:** TypeScript, pure CSS, localStorage — zero new dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/client/themes/index.ts` | **Create** | Theme registry: exports all theme CSS strings + metadata |
| `src/client/themes/md-github.ts` | **Create** | Markdown theme: GitHub (extracted from vendor-css.ts) |
| `src/client/themes/md-notion.ts` | **Create** | Markdown theme: Notion style |
| `src/client/themes/md-bear.ts` | **Create** | Markdown theme: Bear/iA Writer (serif) |
| `src/client/themes/hl-github.ts` | **Create** | Code highlight: highlight.js GitHub (extracted from vendor-css.ts) |
| `src/client/themes/hl-github-dark.ts` | **Create** | Code highlight: highlight.js GitHub Dark |
| `src/client/themes/hl-atom-one-dark.ts` | **Create** | Code highlight: highlight.js Atom One Dark |
| `src/client/types.ts` | Modify | Add `markdownTheme` and `codeTheme` to `AppConfig` |
| `src/client/config.ts` | Modify | Add defaults: `markdownTheme: 'github'`, `codeTheme: 'github'` |
| `src/client/html.ts` | Modify | Replace static `<style>` tags with `<style id="theme-md-css">` and `<style id="theme-hl-css">` |
| `src/client/vendor-css.ts` | Modify | Keep exports (used by theme files), but note they're now also in theme registry |
| `src/client/ui/settings.ts` | Modify | Add theme dropdowns to settings dialog |
| `src/client/main.ts` | Modify | Call `applyTheme()` on init and after config change |

---

### Task 1: Create theme files

**Files:**
- Create: `src/client/themes/md-github.ts`
- Create: `src/client/themes/md-notion.ts`
- Create: `src/client/themes/md-bear.ts`
- Create: `src/client/themes/hl-github.ts`
- Create: `src/client/themes/hl-github-dark.ts`
- Create: `src/client/themes/hl-atom-one-dark.ts`
- Create: `src/client/themes/index.ts`

- [ ] **Step 1: Create `src/client/themes/md-github.ts`**

Re-export the existing GitHub markdown CSS from vendor-css:

```ts
import { githubMarkdownCSS } from '../vendor-css';
export const mdGithub = githubMarkdownCSS;
```

- [ ] **Step 2: Create `src/client/themes/md-notion.ts`**

```ts
export const mdNotion = `
.markdown-body {
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: #37352f;
  background-color: #fff;
  word-wrap: break-word;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  font-weight: 700;
  letter-spacing: -0.3px;
  margin-top: 1.4em;
  margin-bottom: 0.5em;
  color: #37352f;
}
.markdown-body h1 { font-size: 1.875em; }
.markdown-body h2 { font-size: 1.5em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body p { margin-top: 0; margin-bottom: 1em; color: #37352f; }
.markdown-body a { color: #0f6cbd; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body strong { font-weight: 600; }
.markdown-body em { font-style: italic; }
.markdown-body code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.875em;
  background: rgba(135,131,120,0.15);
  border-radius: 3px;
  padding: 0.2em 0.4em;
  color: #eb5757;
}
.markdown-body pre {
  background: #f7f6f3;
  border-radius: 4px;
  padding: 1em;
  overflow: auto;
  margin: 1em 0;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.875em;
}
.markdown-body blockquote {
  border-left: 3px solid #37352f;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b6b6b;
}
.markdown-body ul, .markdown-body ol {
  padding-left: 1.5em;
  margin: 0.5em 0 1em;
}
.markdown-body li { margin: 0.25em 0; }
.markdown-body hr {
  border: none;
  border-top: 1px solid rgba(55,53,47,0.16);
  margin: 2em 0;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}
.markdown-body th, .markdown-body td {
  border: 1px solid rgba(55,53,47,0.2);
  padding: 0.5em 0.75em;
  text-align: left;
}
.markdown-body th { background: rgba(55,53,47,0.05); font-weight: 600; }
.markdown-body img { max-width: 100%; border-radius: 4px; }
`;
```

- [ ] **Step 3: Create `src/client/themes/md-bear.ts`**

```ts
export const mdBear = `
.markdown-body {
  font-family: "Georgia", "Times New Roman", "Palatino Linotype", serif;
  font-size: 17px;
  line-height: 1.8;
  color: #2c2c2c;
  background-color: #faf9f7;
  word-wrap: break-word;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-weight: 700;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  color: #1a1a1a;
}
.markdown-body h1 { font-size: 1.8em; }
.markdown-body h2 { font-size: 1.4em; }
.markdown-body h3 { font-size: 1.2em; }
.markdown-body p { margin-top: 0; margin-bottom: 1.1em; }
.markdown-body a { color: #c7254e; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body strong { font-weight: 700; }
.markdown-body em { font-style: italic; color: #444; }
.markdown-body code {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 0.85em;
  background: #f0ede8;
  border-radius: 3px;
  padding: 0.2em 0.4em;
  color: #c7254e;
}
.markdown-body pre {
  background: #f0ede8;
  border-radius: 5px;
  padding: 1em;
  overflow: auto;
  margin: 1.2em 0;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.875em;
}
.markdown-body blockquote {
  border-left: 3px solid #c9c4bc;
  padding-left: 1em;
  margin: 1em 0;
  color: #777;
  font-style: italic;
}
.markdown-body ul, .markdown-body ol {
  padding-left: 1.5em;
  margin: 0.5em 0 1em;
}
.markdown-body li { margin: 0.3em 0; }
.markdown-body hr {
  border: none;
  border-top: 1px solid #d4cfc8;
  margin: 2em 0;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.9em;
}
.markdown-body th, .markdown-body td {
  border: 1px solid #d4cfc8;
  padding: 0.5em 0.75em;
  text-align: left;
}
.markdown-body th { background: #f0ede8; font-weight: 600; }
.markdown-body img { max-width: 100%; }
`;
```

- [ ] **Step 4: Create `src/client/themes/hl-github.ts`**

```ts
import { highlightGithubCSS } from '../vendor-css';
export const hlGithub = highlightGithubCSS;
```

- [ ] **Step 5: Create `src/client/themes/hl-github-dark.ts`**

```ts
export const hlGithubDark = `
pre code.hljs { display: block; overflow-x: auto; padding: 1em; }
code.hljs { padding: 3px 5px; }
.hljs { color: #e6edf3; background: #0d1117; }
.hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword,
.hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_ { color: #ff7b72; }
.hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__,
.hljs-title.function_ { color: #d2a8ff; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta,
.hljs-number, .hljs-operator, .hljs-selector-attr,
.hljs-selector-class, .hljs-selector-id, .hljs-variable { color: #79c0ff; }
.hljs-meta .hljs-string, .hljs-regexp, .hljs-string { color: #a5d6ff; }
.hljs-built_in, .hljs-symbol { color: #ffa657; }
.hljs-code, .hljs-comment, .hljs-formula { color: #8b949e; }
.hljs-name, .hljs-quote, .hljs-selector-pseudo, .hljs-selector-tag { color: #7ee787; }
.hljs-subst { color: #e6edf3; }
.hljs-section { color: #1f6feb; font-weight: bold; }
.hljs-bullet { color: #f2cc60; }
.hljs-emphasis { color: #e6edf3; font-style: italic; }
.hljs-strong { color: #e6edf3; font-weight: bold; }
.hljs-addition { color: #aff5b4; background-color: #033a16; }
.hljs-deletion { color: #ffdcd7; background-color: #67060c; }
`;
```

- [ ] **Step 6: Create `src/client/themes/hl-atom-one-dark.ts`**

```ts
export const hlAtomOneDark = `
pre code.hljs { display: block; overflow-x: auto; padding: 1em; }
code.hljs { padding: 3px 5px; }
.hljs { color: #abb2bf; background: #282c34; }
.hljs-comment, .hljs-quote { color: #5c6370; font-style: italic; }
.hljs-doctag, .hljs-keyword, .hljs-formula { color: #c678dd; }
.hljs-section, .hljs-name, .hljs-selector-tag,
.hljs-deletion, .hljs-subst { color: #e06c75; }
.hljs-literal { color: #56b6c2; }
.hljs-string, .hljs-regexp, .hljs-addition,
.hljs-attribute, .hljs-meta .hljs-string { color: #98c379; }
.hljs-attr, .hljs-variable, .hljs-template-variable,
.hljs-type, .hljs-selector-class, .hljs-selector-attr,
.hljs-selector-pseudo, .hljs-number { color: #d19a66; }
.hljs-symbol, .hljs-bullet, .hljs-link,
.hljs-meta, .hljs-selector-id, .hljs-title { color: #61aeee; }
.hljs-built_in, .hljs-title.class_, .hljs-class .hljs-title { color: #e6c07b; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: bold; }
.hljs-link { text-decoration: underline; }
`;
```

- [ ] **Step 7: Create `src/client/themes/index.ts`**

```ts
import { mdGithub } from './md-github';
import { mdNotion } from './md-notion';
import { mdBear } from './md-bear';
import { hlGithub } from './hl-github';
import { hlGithubDark } from './hl-github-dark';
import { hlAtomOneDark } from './hl-atom-one-dark';

export interface ThemeMeta {
  key: string;
  label: string;
  css: string;
}

export const MD_THEMES: ThemeMeta[] = [
  { key: 'github',  label: 'GitHub',         css: mdGithub },
  { key: 'notion',  label: 'Notion',          css: mdNotion },
  { key: 'bear',    label: 'Bear / iA Writer', css: mdBear },
];

export const HL_THEMES: ThemeMeta[] = [
  { key: 'github',        label: 'GitHub Light',  css: hlGithub },
  { key: 'github-dark',   label: 'GitHub Dark',   css: hlGithubDark },
  { key: 'atom-one-dark', label: 'Atom One Dark', css: hlAtomOneDark },
];

export function getMdThemeCss(key: string): string {
  return MD_THEMES.find(t => t.key === key)?.css ?? mdGithub;
}

export function getHlThemeCss(key: string): string {
  return HL_THEMES.find(t => t.key === key)?.css ?? hlGithub;
}
```

- [ ] **Step 8: Build to verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/client/themes/
git commit -m "feat: add theme files for markdown and code highlight"
```

---

### Task 2: Update AppConfig types and defaults

**Files:**
- Modify: `src/client/types.ts`
- Modify: `src/client/config.ts`

- [ ] **Step 1: Add theme fields to `AppConfig` in `src/client/types.ts`**

Find `AppConfig` interface and add:

```ts
export interface AppConfig {
  sidebarTab: 'focus' | 'full' | 'list';
  focusWindowKey: '8h' | '2d' | '1w' | '1m';
  markdownTheme: string;  // 'github' | 'notion' | 'bear'
  codeTheme: string;      // 'github' | 'github-dark' | 'atom-one-dark'
  workspaces: Workspace[];
}
```

- [ ] **Step 2: Add defaults in `src/client/config.ts`**

```ts
export const defaultConfig: AppConfig = {
  sidebarTab: 'focus',
  focusWindowKey: '8h',
  markdownTheme: 'github',
  codeTheme: 'github',
  workspaces: [],
};
```

- [ ] **Step 3: Build to verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/client/types.ts src/client/config.ts
git commit -m "feat: add markdownTheme and codeTheme to AppConfig"
```

---

### Task 3: Update html.ts — dynamic style tags

**Files:**
- Modify: `src/client/html.ts`

- [ ] **Step 1: Replace static style tags with dynamic ones**

In `generateClientHTML()`, find:

```html
  <style>${githubMarkdownCSS}</style>
  <style>${highlightGithubCSS}</style>
```

Replace with:

```html
  <style id="theme-md-css">${githubMarkdownCSS}</style>
  <style id="theme-hl-css">${highlightGithubCSS}</style>
```

That's the only change — adding `id` attributes so client-side JS can find and replace them.

- [ ] **Step 2: Build to verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/client/html.ts
git commit -m "feat: add id to theme style tags for dynamic switching"
```

---

### Task 4: Add applyTheme() and wire to init

**Files:**
- Modify: `src/client/main.ts`

- [ ] **Step 1: Add import**

At the top of `src/client/main.ts`, add:

```ts
import { getMdThemeCss, getHlThemeCss } from './themes/index';
```

- [ ] **Step 2: Add `applyTheme` function**

After the imports section, add:

```ts
function applyTheme(): void {
  const mdCss = getMdThemeCss(state.config.markdownTheme || 'github');
  const hlCss = getHlThemeCss(state.config.codeTheme || 'github');

  const mdStyle = document.getElementById('theme-md-css');
  const hlStyle = document.getElementById('theme-hl-css');

  if (mdStyle) mdStyle.textContent = mdCss;
  if (hlStyle) hlStyle.textContent = hlCss;
}
```

- [ ] **Step 3: Call `applyTheme()` on init**

In the initialization IIFE (search for `restoreState` or the `(async () => {` block at the bottom), call `applyTheme()` after `restoreState`:

```ts
await restoreState(loadFile);
applyTheme();  // apply saved theme preference
```

- [ ] **Step 4: Expose on window**

In the window assignments section, add:

```ts
(window as any).applyTheme = applyTheme;
```

- [ ] **Step 5: Build to verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/client/main.ts
git commit -m "feat: add applyTheme() function wired to init"
```

---

### Task 5: Add theme dropdowns to settings dialog

**Files:**
- Modify: `src/client/ui/settings.ts`

- [ ] **Step 1: Add import**

At the top of `src/client/ui/settings.ts`, add:

```ts
import { MD_THEMES, HL_THEMES } from '../themes/index';
```

- [ ] **Step 2: Add theme section to `renderSettingsDialog`**

In `renderSettingsDialog`, add a new section at the top of `body.innerHTML`:

```html
<div class="settings-section">
  <div class="settings-section-title">主题</div>
  <div class="settings-kv-grid">
    <div>正文样式</div>
    <div>
      <select id="markdownThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
        ${MD_THEMES.map(t =>
          `<option value="${t.key}"${state.config.markdownTheme === t.key ? ' selected' : ''}>${t.label}</option>`
        ).join('')}
      </select>
    </div>
    <div>代码高亮</div>
    <div>
      <select id="codeThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
        ${HL_THEMES.map(t =>
          `<option value="${t.key}"${state.config.codeTheme === t.key ? ' selected' : ''}>${t.label}</option>`
        ).join('')}
      </select>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Wire selects to live preview in `renderSettingsDialog`**

After setting `body.innerHTML`, add event listeners for immediate preview:

```ts
const mdSelect = document.getElementById('markdownThemeSelect') as HTMLSelectElement | null;
const hlSelect = document.getElementById('codeThemeSelect') as HTMLSelectElement | null;

mdSelect?.addEventListener('change', () => {
  state.config.markdownTheme = mdSelect.value;
  (window as any).applyTheme?.();
});

hlSelect?.addEventListener('change', () => {
  state.config.codeTheme = hlSelect.value;
  (window as any).applyTheme?.();
});
```

This gives instant live preview — user can see theme change while the dialog is still open.

- [ ] **Step 4: Save in `saveSettings`**

In `saveSettings`, add:

```ts
const mdSelect = document.getElementById('markdownThemeSelect') as HTMLSelectElement | null;
const hlSelect = document.getElementById('codeThemeSelect') as HTMLSelectElement | null;
if (mdSelect) state.config.markdownTheme = mdSelect.value;
if (hlSelect) state.config.codeTheme = hlSelect.value;
```

- [ ] **Step 5: Build to verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/client/ui/settings.ts
git commit -m "feat: add theme dropdowns to settings dialog with live preview"
```

---

### Task 6: Full build and smoke test

- [ ] **Step 1: Full build**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build
```

Expected: succeeds.

- [ ] **Step 2: Manual smoke test**

```bash
bun run dev
```

1. Open a `.md` file
2. Open Settings → verify "主题" section appears with two dropdowns
3. Change "正文样式" to Notion → verify the Markdown content updates immediately (no dialog close needed)
4. Change "代码高亮" to GitHub Dark → verify code blocks update immediately
5. Click 保存 → close dialog → reload page → verify theme persists
6. Switch to Bear theme → verify serif font appears

- [ ] **Step 3: Commit final build**

```bash
git add src/client/embedded-client.ts
git commit -m "build: rebuild embedded client with theme system"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| Multiple Markdown themes (GitHub, Notion, Bear) | Task 1 |
| Multiple code highlight themes | Task 1 |
| Theme registry with metadata | Task 1 (`index.ts`) |
| `markdownTheme` + `codeTheme` in AppConfig | Task 2 |
| Dynamic `<style id>` tags in HTML | Task 3 |
| `applyTheme()` replaces style tag content | Task 4 |
| Theme applied on app init | Task 4 |
| Settings dialog dropdowns | Task 5 |
| Live preview while dialog open | Task 5 |
| Preference persisted across reload | Task 2 + 5 |

**Placeholder scan:** None.

**Type consistency:** `getMdThemeCss`/`getHlThemeCss` defined in Task 1, used in Task 4. `MD_THEMES`/`HL_THEMES` defined in Task 1, used in Task 5. `markdownTheme`/`codeTheme` defined in Task 2, used in Tasks 4 and 5.
