# MD Viewer 配色调研报告（2026-03-06）

## 决策结论

- 已确认采用：`A 现状基线`（见 `docs/research/20260306-color-system-variants.html`）。
- 当前阶段不引入 B/C 的视觉改造，仅保留调研与备选方案作为后续参考。

## 1. 目标与范围

本报告用于解决三个问题：

1. 盘点当前项目真实在用颜色（重点是评论与同步相关 UI）。
2. 设计一套更统一、可扩展、可维护的配色方案（含使用规范）。
3. 总结主流软件在配色上的通用原则与可落地经验。

配套可视化原型（建议一起看）：

- `docs/research/20260306-color-system-prototype.html`
- `docs/research/20260306-color-system-variants.html`（A/B/C 对比，建议优先看）

---

## 2. 当前颜色盘点（现状）

### 2.1 统计结论（`src/client/css.ts`）

按出现频次，当前高频颜色如下：

| 颜色 | 次数 | 主要语义 |
|---|---:|---|
| `#0969da` | 53 | 主交互色（按钮、链接、focus、边框） |
| `#fff` | 33 | 主背景 |
| `#57606a` | 31 | 次级文字 |
| `#24292e` | 29 | 主文字 |
| `#f6f8fa` | 27 | 次级背景 / hover |
| `#d0d7de` | 20 | 常规边框 |
| `#6b7280` | 17 | 提示文字 |
| `#e1e4e8` | 14 | 分割线 |
| `#cf222e` | 12 | 危险/错误文本 |
| `#d1d5da` | 10 | 输入框边框 |

结论：

- 已形成“GitHub 风格”浅色基线（蓝色主色 + 灰阶底盘）。
- 但存在灰阶重复（`#57606a` / `#586069` / `#6a737d` / `#6b7280`）和语义重叠。
- 局部模块（评论）使用了一套偏暖色（黄/棕）系统，和全局蓝灰系统有轻微割裂。

### 2.2 关键模块现状

1. 评论卡片（侧栏）  
见 [src/client/css.ts](/Users/huanghao/workspace/md-viewer/src/client/css.ts:2540)

- 卡片主态：白底 + 灰边
- 当前态：浅蓝底（`#f6f9ff`）
- 状态条：黄棕系（`#b99a55` / `#9a7b4f`）

2. 评论划线（正文）  
见 [src/client/css.ts](/Users/huanghao/workspace/md-viewer/src/client/css.ts:2795)

- 默认：`#fffbe6` + `#fadb14`
- hover：`#fff1b8`
- active：`#ffe58f` + `#d4b106`

3. Toast 反馈色  
见 [src/client/css.ts](/Users/huanghao/workspace/md-viewer/src/client/css.ts:1847)

- success：绿系（`#1a7f37` / `#dafbe1`）
- error：红系（`#d1242f` / `#ffebe9`）
- warning：黄系（`#bf8700` / `#fff8c5`）
- info：蓝系（`#0969da` / `#ddf4ff`）

---

## 3. 问题诊断

### 3.1 现有优势

- 全局可读性稳定，浅色背景层级清晰。
- 交互蓝色统一，用户认知成本低。
- 反馈色（成功/失败/告警/信息）语义明确。

### 3.2 现有问题

1. 缺少“语义 token 层”  
同类语义在不同模块各写一套颜色值，后续改色容易失控。

2. 评论系统配色“自成一派”  
正文划线和侧栏卡片用暖色，和全局蓝灰体系融合度不够。

3. 强调层级不稳定  
有些地方 hover 和 active 差异不够可预期；有些地方反而过强。

---

## 4. 建议配色方案（建议稿）

### 4.1 设计方向

- 保留现有整体气质（蓝灰、轻量、工程化）。
- 评论模块从“纯暖黄主导”改为“中性底 + 单点暖色强调”：
  - 默认低饱和（不打扰阅读）
  - 当前项高对比（快速定位）
- 全局采用语义色，不再按组件硬编码。

### 4.2 建议 token（Light）

```css
:root {
  /* Text */
  --text-primary: #1f2328;
  --text-secondary: #57606a;
  --text-muted: #6e7781;

  /* Surface */
  --bg-canvas: #ffffff;
  --bg-subtle: #f6f8fa;
  --bg-elevated: #ffffff;

  /* Border */
  --border-default: #d0d7de;
  --border-muted: #e1e4e8;

  /* Brand / Interaction */
  --brand-600: #0969da;
  --brand-700: #0550ae;
  --focus-ring: rgba(9, 105, 218, 0.24);

  /* Feedback */
  --success-600: #1a7f37;
  --success-bg: #dafbe1;
  --danger-600: #d1242f;
  --danger-bg: #ffebe9;
  --warning-700: #9a6700;
  --warning-bg: #fff8c5;
  --info-bg: #ddf4ff;

  /* Annotation (关键) */
  --annot-mark-bg: #f8fafc;            /* 默认低饱和 */
  --annot-mark-line: #b6c2cf;
  --annot-mark-hover-bg: #eef5ff;
  --annot-mark-hover-line: #96afd1;
  --annot-mark-active-bg: #ffe8a3;     /* 当前项高对比 */
  --annot-mark-active-line: #c69026;
  --annot-item-active-bg: #f3f8ff;
  --annot-item-active-border: #9ec2f8;
}
```

### 4.3 使用规范（怎么用）

1. 基础层（80% 场景）
- 文字：只用 `primary/secondary/muted`
- 背景：只用 `canvas/subtle/elevated`
- 边框：只用 `default/muted`

2. 交互层（按钮/链接/focus）
- 主按钮、主链接统一 `brand-600`
- hover/active 仅用 `brand-700` 或透明度变体
- 输入框 focus ring 统一 `--focus-ring`

3. 反馈层（toast/状态块）
- 严格按 success/danger/warning/info，禁止跨语义借色

4. 评论层（重点）
- 正文划线默认低饱和：`--annot-mark-bg` + `--annot-mark-line`
- 当前评论高对比：`--annot-mark-active-bg` + `--annot-mark-active-line`
- 侧栏当前卡片：`--annot-item-active-bg` + `--annot-item-active-border`
- 避免同时使用“高饱和背景 + 高饱和边框 + 高对比文字”三重强调

---

## 5. 主流软件配色原则与经验

以下是 GitHub / Notion / Linear / Slack / Figma 等主流产品的共通方法论（抽象层）：

### 5.1 原则

1. 先语义，后组件  
先定义 token（text/surface/border/brand/feedback），组件只消费 token。

2. 降低“默认态”存在感  
默认态尽量低饱和，把注意力留给内容；只有 hover/active 才增强。

3. 强调态要“稀缺”  
同一屏幕同时出现多个高对比元素会互相抵消，建议每个局部区域只保留 1 个主强调。

4. 层级靠“明度差”，不是靠彩度堆叠  
大多数信息层级用灰阶明度解决，彩色主要承担语义而非布局。

5. 可访问性先行  
正文/关键控件优先保障对比度（参考 WCAG AA）；focus 态必须可见。

### 5.2 实操经验

1. 控制色阶数量  
单一色系通常 3~5 个阶梯已够（如 500/600/700 + 透明度变体）。

2. 同语义跨组件统一  
“错误”在 toast、输入校验、状态标签上应是同一套 token，不要每处自定义红色。

3. 先做状态矩阵再写 CSS  
每个组件至少定义 `default / hover / active / disabled / focus` 五态，避免临时补色。

4. 颜色变更要配可回归截图  
配色改动推荐带视觉回归（关键页面对比图），防止局部调色破坏全局一致性。

---

## 6. 落地建议（分阶段）

1. 第 1 阶段：建 token，不改视觉  
- 在 `css.ts` 顶部引入语义变量，先做等值映射。

2. 第 2 阶段：收敛高频重复色  
- 把 `#57606a/#586069/#6a737d/#6b7280` 收敛为 2 档 secondary/muted。

3. 第 3 阶段：评论模块整体换肤  
- 一次性替换评论卡片 + 正文划线 + popover（避免混搭过渡态）。

4. 第 4 阶段：补视觉回归用例  
- 至少覆盖：普通文档、评论密集文档、同步弹窗、toast 四类页面。

---

## 7. 结论

- 当前系统可用，但“颜色语义层”缺失导致扩展成本高。
- 建议以“语义 token 化 + 评论模块统一配色”作为下一步重点。
- 对你这次关注点（评论划线与侧栏一致、默认低饱和/当前高对比）可通过第 3 阶段一次落地，风险最小、收益最大。
