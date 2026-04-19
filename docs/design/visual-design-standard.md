# Visual Design Audit — md-viewer

**日期**: 2026-04-19  
**目的**: 梳理项目现有视觉元素、发现不一致，为后续统一设计 token 提供基础。

---

## 1. 布局骨架

```
┌─────────────────────────────────────────────────────────┐
│  顶部工具栏 (.toolbar)  48px                             │
├──────────┬──────────────────────────┬───────────────────┤
│          │  面包屑                   │                   │
│  左侧边栏 │  内容区 (.content)       │  右侧批注栏       │
│  260px   │  max-width: 900px 白卡片 │  320px            │
│          │                          │  ├ Tab 标题行  │
│          │                          │  │  36px      │
│  搜索框   │                          │  ├ 工具栏行   │
│  模式 tab │                          │  └ 列表内容   │
│  文件列表 │                          │               │
│  工作区树 │                          │               │
└──────────┴──────────────────────────┴───────────────────┘
```

三栏布局，左侧固定宽度，中间自适应，右侧固定宽度（可隐藏）。

---

## 2. 工具栏

项目里有 **2 处工具栏**：

| 位置 | CSS 类 | 高度 | 内容 |
|------|--------|------|------|
| 顶部主工具栏 | `.toolbar` | **48px** | 刷新、diff、字号、连接状态、设置 |
| 右侧批注栏 Tab 行 | `.annotation-tabs` | **约 28px**（由 `.annotation-tab` padding 7px 撑开） | tab 切换 + 操作按钮并排在同一行 |

右侧批注栏的结构：tab 按钮（`.annotation-tab`，padding 7px 4px）和操作图标按钮（`.annotation-icon-btn`，30×30px）**在同一行 flex 容器**里，图标按钮高于 tab 文字区域，由 `align-items: center` 居中对齐，整行高度由 30px 的图标按钮撑开。这是已知的设计，tab 标题和操作按钮共享同一行高。

---

## 3. 按钮

5 种形态，样式数值如下：

| 类型 | CSS 类 | padding | font-size | border-radius | 用途 |
|------|--------|---------|-----------|--------------|------|
| 主按钮 | `.add-file-confirm-button.primary` | 0 10px | 12px | 6px | 确认操作，蓝底白字 |
| 次按钮 | `.add-file-button` | 0 10px | 13px | 6px | 添加文件，白底灰边 |
| 工具栏文字按钮 | `.toolbar-text-button` | 4px 8px | 13px | 4px | 工具栏内操作 |
| 字号按钮 | `.font-scale-button` | 4px 8px | 12px | 4px | 字号调整 |
| 图标按钮 | `.icon-button` | 4px | 14px | 4px | 纯图标，无文字 |
| 关闭按钮 | `.close` | 2px 6px | — | 4px | hover 变红 #ff4444 |
| 小确认按钮 | `.add-file-confirm-button` | 0 10px | 12px | 6px | 26px 高，比次按钮矮 |

**问题**：
- 工具栏文字按钮 13px vs 字号按钮 12px，相差 1px，视觉上无意义
- 主按钮高度 26px，次按钮高度 34px，同一交互场景下高度不一致
- 圆角 4px / 6px 混用，无明确规则

---

## 4. 搜索框

| 属性 | 值 |
|------|-----|
| 容器高度 | 34px |
| 内边距 | 8px 30px（左右各 30px 留给图标） |
| 圆角 | 6px |
| 字号 | 13px |
| 边框 | 1px solid #d0d7de |
| focus 边框 | #0969da + box-shadow 0 0 0 3px rgba(9,105,218,0.1) |

整体一致，无明显问题。

---

## 5. 列表项

两种：文件列表（`.file-item`）和工作区树（`.tree-item`）。

| 属性 | `.file-item` | `.tree-item` |
|------|-------------|-------------|
| padding | 4px 8px | 4px 8px |
| min-height | 无（约 24px） | 28px |
| font-size | 13px | 13px |
| 圆角 | 4px | 4px |
| hover 背景 | #f6f8fa | #f6f8fa |
| 当前项背景 | #dbeafe | #dbeafe |
| 当前项文字 | #0969da | #0969da |

**问题**：`tree-item` 有 min-height 28px，`file-item` 没有，导致两种列表项高度感不同。

---

## 5.1 TOC 面板条目（`.toc-item`）

TOC 条目与 `.file-item` / `.tree-item` 对齐，使用相同视觉语言：

| 属性 | 值 |
|------|-----|
| padding | 4px 8px |
| font-size | 13px（`var(--text-sm)`） |
| border-radius | 4px（`var(--radius-sm)`） |
| hover 背景 | #f6f8fa（`var(--color-bg-subtle)`） |
| 当前项背景 | #dbeafe |
| 当前项文字 | #0969da（`var(--color-accent)`） |
| margin-bottom | 2px |

**无** border-left 竖线（与 `.file-item.current` 一致）。

层级缩进：
- h1：`padding-left: 8px`，`font-weight: 500`
- h2：`padding-left: 20px`，`font-weight: 400`
- h3：`padding-left: 32px`，`font-size: 11px`，`color: #57606a`

当前高亮行左侧显示淡灰色级别标记（`#1` / `#2` / `#3`），`color: #8b949e`，`font-size: 10px`，未选中时隐藏。

---

## 6. Badge

3 种形态：

| 类型 | CSS 类 | 形状 | 尺寸 | 颜色 | 用途 |
|------|--------|------|------|------|------|
| 状态点 | `.new-dot` | 圆形 | 6×6px | #007AFF | 新打开文件标记 |
| 计数 badge | `.annotation-count-badge` | 圆角矩形 | padding 1px 6px | 红底 #e05252 白字 | 批注数量 |
| 状态 tag | `.annotation-status-tag` | 胶囊 border-radius 999px | padding 1px 6px, font-size 10px | 边框型，颜色区分状态 | 批注状态（open/resolved） |
| 编号 badge | `.annotation-number` | 圆角矩形 | 20px 高, padding 0 6px | 蓝底 #0969da 白字 | 批注序号 |

**问题**：计数 badge 和编号 badge 颜色不同（红 vs 蓝），但都是"数字"语义，容易混淆。

---

## 7. 图标

混用两种方案：

| 方案 | 示例 | 位置 |
|------|------|------|
| Unicode 符号 | ⚙ ± ↻ ▦ × | 顶部工具栏按钮 |
| SVG 线性图标 | 消息气泡、折叠箭头、pin | 批注栏、工作区树 |

SVG 规范：16×16px，线宽 1.5px，线性风格。

**问题**：Unicode 符号的视觉重量、对齐、大小感与 SVG 不一致。⚙（齿轮）和 ↻（刷新）在不同系统字体下渲染差异大。

---

## 8. 颜色系统

### 主色
| 用途 | 值 |
|------|-----|
| 主蓝（交互、选中、链接） | #0969da |
| 主文字 | #24292e |
| 次要文字 | #57606a |
| 边框（主） | #e1e4e8 |
| 边框（次） | #d0d7de |
| 浅背景 | #f6f8fa |

### 功能色
| 语义 | 值 |
|------|-----|
| 成功绿 | #1a7f37 / #2da44e |
| 错误红 | #cf222e / #d1242f |
| 警告橙 | #bf8700 / #ff9500 |
| info 蓝 | #0969da |

**问题**：
- 次要文字用了 #57606a、#6b7280、#8b949e、#9ca3af 四个不同灰，没有统一语义
- 成功绿和错误红各有两个近似值，说明是多次独立添加的

**实际分布（css.ts）**：

| 颜色 | 出现次数 | 实际用途 |
|------|---------|---------|
| `#57606a` | 37 | 绝大多数 UI 标签、按钮文字、次要文字 |
| `#6b7280` | 19 | 辅助区域（设置、监控面板）的次要文字，与 #57606a 混用 |
| `#8b949e` | 5 | 更弱的提示文字：翻译空状态、翻译原文、resolved 批注边框 |
| `#9ca3af` | 7 | 最弱的占位/辅助文字：文件元信息、字号按钮、监控时间戳 |

**修改方案**：合并为 2 档语义色：
- `secondary`（次要文字）：`#57606a` — 合并 #6b7280 → #57606a（37+19=56 处，纯机械替换）
- `muted`（弱提示文字）：`#8b949e` — 合并 #9ca3af → #8b949e（5+7=12 处）

resolved 批注边框（`border-left-color: #8b949e`）保持不变，本来就是 muted 语义。

---

## 9. 字体系统

### 字号档位（实际使用）
| 档位 | 用途 |
|------|------|
| 10px | 文件类型 badge 文字 |
| 11px | 小标签、badge、连接状态 |
| 12px | tab 管理器、小按钮、字号按钮 |
| 13px | 标准 UI（搜索框、列表项、工具栏按钮、tab 标题） |
| 14px | 图标按钮、Toast 正文 |
| 16px | Markdown 正文基准 |
| 20px | 空状态标题 |

**问题**：10 / 11 / 12 / 13 / 14 五个档位相差 1px，视觉上难以区分层级，且没有语义命名。

### 字重
400（正文）/ 500（次要标题）/ 600（强调）/ 700（badge）

---

## 10. 间距和圆角

### 间距（padding/gap 实际出现值）
4 / 6 / 8 / 10 / 12 / 16 / 20 / 24 / 32px

**问题**：6px 和 10px 是非 4 的倍数，是"填空"值，说明没有严格遵循间距系统。

### 圆角（实际出现值）
3 / 4 / 6 / 8 / 10 / 999px

**问题**：3px 和 10px 是边缘值，4 / 6 / 8 三档的使用规则不清晰。

---

## 11. z-index 层级

| 层 | 值 | 元素 |
|----|----|------|
| 低 | 80 | 批注侧边栏 |
| 中 | 2100 | tab 管理器面板 |
| 中高 | 2500–2601 | 批注浮层 |
| 高 | 9000 | 对话框遮罩 |
| 最高 | 9998–10000 | Toast、find bar |

**问题**：没有分层语义，数值跨度大（80 到 10000），后续难以插入新层。

---

## 12. 不一致汇总

| 问题 | 位置 | 严重程度 |
|------|------|---------|
| 次要文字色有 4 个近似值 | 全局 | ⚠ 明显 |
| 字号 10–14px 五档差 1px | 全局 | ⚠ 明显 |
| 计数 badge（红）和编号 badge（蓝）语义混淆 | 批注栏 | ⚠ 明显 |
| Unicode 图标和 SVG 图标混用 | 工具栏 vs 批注栏 | ℹ 轻微 |
| 圆角 4 / 6 / 8px 无使用规则 | 全局 | ℹ 轻微 |
| 间距出现 6px / 10px 非 4 倍数值 | 全局 | ℹ 轻微 |
| z-index 无分层语义 | 全局 | ℹ 轻微（目前无冲突） |
| 文件列表和工作区树高度感不同 | 侧边栏 | ℹ 轻微 |

---

## 13. 建议的 token 体系（草案）

不需要重写，只需把现有值归纳成命名 token，统一引用。

### 间距（基于 4px）
```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
```
清理掉 6px / 10px，用 8px / 12px 替代。

### 字号（3 档 UI + Markdown 独立）
```
--text-xs:  11px   /* badge、标签 */
--text-sm:  13px   /* 标准 UI */
--text-base: 14px  /* 较大 UI，Toast */
```
合并 10px → 11px，合并 12px → 11px 或 13px，合并 14px → 保留。

### 圆角（3 档）
```
--radius-sm: 4px   /* 按钮、列表项 */
--radius-md: 6px   /* 输入框、面板 */
--radius-lg: 8px   /* 卡片、对话框 */
--radius-full: 999px  /* 胶囊 badge */
```
清理掉 3px / 10px。

### 颜色语义
```
--color-text-primary:   #24292e
--color-text-secondary: #57606a   /* 统一，清理其余 3 个灰 */
--color-text-muted:     #8b949e
--color-border:         #e1e4e8
--color-border-subtle:  #d0d7de
--color-bg-subtle:      #f6f8fa
--color-accent:         #0969da
```

### 工具栏高度（2 档）
```
--toolbar-height-lg: 48px   /* 主工具栏 */
--toolbar-height-sm: 32px   /* tab 内工具栏 */
```
右侧 tab 下的工具栏改用 `--toolbar-height-sm`，按钮 padding 相应缩小。

---

## 14. Theme 系统与视觉元素的关系

### 架构

Theme 系统分两层，各自独立，互不干扰：

```
┌─────────────────────────────────────────────────────┐
│  UI Shell（css.ts）                                  │
│  工具栏、侧边栏、按钮、badge、列表项……               │
│  硬编码颜色，不受 theme 切换影响                     │
├─────────────────────────────────────────────────────┤
│  Markdown Theme（<style id="theme-md-css">）         │
│  .markdown-body 内所有排版样式                       │
│  GitHub / Notion / Bear 三选一，可运行时切换          │
├─────────────────────────────────────────────────────┤
│  Highlight Theme（<style id="theme-hl-css">）        │
│  代码块语法高亮颜色                                  │
│  GitHub Light / GitHub Dark / Atom One Dark 三选一   │
└─────────────────────────────────────────────────────┘
```

### 实现方式

HTML 初始时注入两个 `<style>` 标签（`html.ts` 第 68-69 行），默认值为 GitHub 主题：

```html
<style id="theme-md-css">/* github markdown css */</style>
<style id="theme-hl-css">/* highlight github css */</style>
```

用户在设置里切换主题时，`applyTheme()` 直接替换这两个标签的 `textContent`，无需重新渲染内容。

### 各主题覆盖范围

| 主题 | 类型 | 覆盖的 CSS 类 | 覆盖内容 |
|------|------|-------------|---------|
| GitHub（默认） | Markdown | `.markdown-body` | 完整 github-markdown-css，字号 16px，行高 1.5 |
| Notion | Markdown | `.markdown-body` | 在 GitHub 基础上叠加：字体 ui-sans-serif，行高 1.75，颜色 #37352f，去掉标题下划线 |
| Bear / iA Writer | Markdown | `.markdown-body` | 叠加：衬线字体 Georgia，行高 1.8，更大字号，更宽行间距 |
| GitHub Light | Highlight | `.hljs` | 浅色代码高亮 |
| GitHub Dark | Highlight | `.hljs` | 深色代码高亮 |
| Atom One Dark | Highlight | `.hljs` | 深色代码高亮（暖色调） |

### 哪些视觉元素受 theme 影响

**受影响（在 `.markdown-body` 内）**：
- 正文字体、字号、行高、颜色
- 标题样式（字重、边框、间距）
- 链接颜色
- 行内代码背景和颜色
- 代码块背景（Markdown theme 控制容器，Highlight theme 控制 token 颜色）
- 引用块、表格、分割线

**不受影响（UI Shell，css.ts 硬编码）**：
- 工具栏、侧边栏、批注栏
- 所有按钮、搜索框、列表项
- Badge、Toast、对话框
- 面包屑、tab 标题

### 问题

**UI Shell 颜色与 Markdown theme 颜色没有关联**。例如：
- GitHub theme 正文色 `#24292e`，UI Shell 主文字也是 `#24292e`——偶然一致
- Notion theme 正文色 `#37352f`，但 UI Shell 仍是 `#24292e`——切换主题后正文和 UI 颜色不一致
- Bear theme 背景白色，但如果未来加深色 Markdown theme，UI Shell 没有对应的暗色模式

**结论**：Theme 系统目前只管内容区排版，UI Shell 是独立的一套，两者没有 token 共享。这在当前三个主题下问题不大（都是浅色），若要支持暗色模式则需要重新设计。

---

## 下一步

1. **优先修**：统一次要文字色（改动面广但机械，风险低）
2. **后续**：建立 CSS token 变量，逐步替换硬编码值
3. **长期**：如需暗色模式，需要 UI Shell 也参与 theme 系统

---

## 15. TOC 面板

TOC 面板（左侧边栏下半部分）的样式规范见 5.1 节。

TOC 开关行为：
- 默认打开（per-file 状态存 localStorage `md-viewer:toc-open-by-file`）
- 收起后底部显示"目录 ▲"展开按钮
- 面板内右上角有向下箭头收起按钮
- 两个按钮的箭头方向一致（均在最右侧）
