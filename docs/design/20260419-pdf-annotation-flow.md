# PDF 批注交互流程

## 概述

用户在 PDF 上选中文字、创建批注、查看批注的完整交互流程。每个步骤列出：触发条件、发生了什么、预期的视觉状态、关键数据。

---

## 流程图

```
用户拖拽选中文字
      │
      ▼
[步骤1] 蓝色选中（浏览器原生 ::selection）
      │
      ▼ mouseup
[步骤2] 项目接管：蓝色 <mark>（精确字符）+ 弹出 [+] 按钮
      │
      ├─── 用户不点 [+]，点其他地方
      │         │
      │         ▼
      │    蓝色消失，pending 清除，流程结束
      │
      └─── 用户点 [+]
                │
                ▼
          [步骤3] 蓝色→黄色下划线 + 弹出评论输入框
                │
                ├─── 用户点 [x] 取消
                │         │
                │         ▼
                │    黄色下划线消失，pending 清除，流程结束
                │
                ├─── 用户点评论框外部（失焦）
                │         │
                │         ▼
                │    评论框折叠隐藏（草稿保留，下划线保留）
                │         │
                │         └─── 用户点击黄色下划线 → 评论框重新展开
                │
                └─── 用户写评论，点保存（或 Cmd+Enter）
                          │
                          ▼
                    [步骤4] 保存注释
                          │
                          ▼
                    [步骤5] 黄色精确高亮（持久）
                          │
                    [步骤6] 点击侧边栏评论 → 定位高亮
```

---

## 各步骤详解

### 步骤 1：拖拽选中

**触发**：用户在 PDF TextLayer 上按住鼠标拖拽。

**发生了什么**：浏览器原生处理文本选中，在透明 span 上渲染蓝色 `::selection` 效果。

**视觉状态**：选中区域显示蓝色高亮（浏览器默认样式）。

---

### 步骤 2：mouseup — 项目接管

**触发**：用户松开鼠标（mouseup），且 `sel.isCollapsed === false`。

**发生了什么**：
1. 读取 `sel.toString()` 得到精确选中文字（`selectedText`）
2. 遍历该页所有 TextItem，找到选区中心最近的 item，记录 `startItemIdx`
3. 调用 `markSelectionSpans`：在 span 内部用 `<mark class="pdf-selection-mark">` 精确包裹选中字符
4. 清除原生 Selection（`sel.removeAllRanges()`）
5. 调用 `onTextSelected` → `showQuickAdd`，在鼠标位置附近显示 `[+]` 按钮

**视觉状态**：
- 蓝色 `<mark>` 精确覆盖选中字符（项目自己画，替代原生 `::selection`）
- `[+]` 按钮出现在鼠标附近

> **设计疑问**：步骤 3~4 清除原生 Selection 后蓝色消失，所以项目用 `markSelectionSpans` 重新画一次蓝色。但两次蓝色之间有视觉跳变，体验奇怪。是否可以不清除原生 Selection，直接保留浏览器蓝色？待评估。

**关键数据**：
- `selectedText = sel.toString()`：从鼠标按下字符位置截取到抬起字符位置，**不对齐词边界**
  - 例：用户想选 "individual tasks"，mousedown 落在 "i" 中间，实际得到 "ividual tasks"
  - `toString()` 本身是准的，问题在于鼠标操作精度不到词边界
  - **需要词边界扩展**：拿到 `startOffset` 后往左找最近空格，`endOffset` 往右找最近空格
- `startItemIdx`：item 索引（如 `42`）
- `state.pendingAnnotation = { quote: "ividual tasks", start: 42, length: 1, ... }` ← quote 不完整

**标题/节标题区域的额外问题**：标题 span 和正文 span 在 DOM 里连续排列，浏览器把它们当成一个文本流，拖拽时会跨越多个 span 扩展选区，无法精确选一个词。这是 TextLayer 布局问题，独立于 `selectedText` 的问题。

**双击特殊路径**：双击时走 `dblclick` 事件，通过 `expandDblClick` 自动扩展到词/句边界，其余逻辑相同。**已知 bug：双击目前不生效，会退化成普通单词选中后弹出评论框。**

**不点 `[+]`，点其他地方**：
- `mousedown` 检测到点击在 `quickAdd` 外部
- `hideQuickAdd(true)`：`[+]` 消失，蓝色 `<mark>` 消失，`state.pendingAnnotation` 清空
- 流程结束，无任何残留

---

### 步骤 3：点 `[+]` — 进入编辑态

**触发**：用户点击 `[+]` 按钮。

**发生了什么**：
1. 调用 `openComposerFromPending`
2. `<mark class="pdf-selection-mark">` → `<mark class="pdf-selection-mark-temp">`（蓝色变黄色下划线）
3. 弹出评论输入框（`#annotationComposer`），获得焦点

**视觉状态**：
- 选中区域变为黄色下划线
- 评论输入框出现

**关键数据**：`state.pendingAnnotation` 保持不变。

---

#### 分支 A：点 `[x]` 取消

**触发**：用户点击评论输入框的关闭按钮（`#composerCancelBtn`）。

**发生了什么**：`hideComposer` → 清除 `<mark class="pdf-selection-mark-temp">`，清空 `state.pendingAnnotation`，关闭输入框。

**视觉状态**：黄色下划线消失，输入框消失，无残留。

---

#### 分支 B：点评论框外部（失焦）

**触发**：用户点击评论框以外的区域（`mousedown` 检测到）。

**发生了什么**：`collapseComposer` → 仅隐藏输入框浮窗，**不清除** pending、不清除 `<mark class="pdf-selection-mark-temp">`。

**视觉状态**：
- 评论框消失
- 黄色下划线**保留**（表示有未提交的 pending 注释）
- 输入框里已写的内容也保留（草稿）

**再次点击黄色下划线**：
- `mousedown` 检测到点击在 `.annotation-mark-temp` 上
- `expandComposer`：重新定位并显示输入框，恢复草稿内容

---

### 步骤 4：写评论，点保存

**触发**：用户在输入框写完评论，点保存按钮或按 `Cmd+Enter`。

**发生了什么**：
1. `savePendingAnnotation`：从 `state.pendingAnnotation` 取 `quote`、`start`、`length`，加上 `note`，构造完整注释对象
2. 保存到本地 state，`persistAnnotation` 发送到服务器（乐观更新）
3. 触发 `annotation:created` 事件
4. PDF 特殊处理：`clearTempSelectionMark(true)`（保留 `pdf-selection-mark-temp`，等 `renderHighlights` 用持久高亮替换它），关闭输入框
5. `renderHighlights` 被触发

**视觉状态**：
- 评论输入框消失
- 黄色下划线短暂保留，随后被步骤 5 的持久高亮替换

**关键数据**：
- 注释对象：`{ quote: "Language Models", start: 42, length: 1, note: "...", page: 1, fileType: "pdf" }`

---

### 步骤 5：高亮渲染（持久）

**触发**：`renderHighlights` 被调用。

**发生了什么**：
1. `clearHighlights`：清除所有现有高亮（解包 `<mark class="pdf-highlight">`，移除 span 上的 class）
2. 对每条 PDF 注释调用 `highlightByItemRange(page, start, endIdx, id, quote)`
3. `highlightByItemRange` 内部：
   - 找到 item 对应的 span
   - 若 `quote === span.textContent`（整行）：给 span 加 `pdf-highlight` class
   - 若 `quote` 是 span 的子串：`document.createRange()` + `surroundContents` 包 `<mark class="pdf-highlight">`，精确高亮子串
   - 若 `surroundContents` 失败（try/catch）：fallback 到整行 span 加 class

**视觉状态**：
- 选中文字显示黄色背景高亮（精确子串）
- 侧边栏出现对应评论条目

**预期**：高亮范围应与 `quote` 完全一致，不超出右侧。

**已知问题**：若走 fallback，高亮覆盖整行，视觉上超出右侧。

---

### 步骤 6：点击侧边栏评论

**触发**：用户点击侧边栏中的评论条目。

**发生了什么**：滚动到对应页面，对应高亮加 `annotation-mark.is-active` class（加深背景）。

**视觉状态**：高亮颜色加深。✓

---

## 数据流总结

```
拖拽 → sel.toString() = "Language Models"
     → startItemIdx = 42
     → state.pendingAnnotation = {
           quote: "Language Models",
           start: 42, length: 1,
           page: 1, fileType: "pdf"
         }

保存 → annotation = {
           quote: "Language Models",   ← 精确子串
           start: 42, length: 1,
           ...
         }

高亮 → highlightByItemRange(1, 42, 42, id, "Language Models")
     → 在 span["...整行文字..."] 内找到 "Language Models"
     → surroundContents(<mark>) 包裹精确子串
```

---

## 待验证的关键点

| # | 步骤 | 状态 | 结论 |
|---|------|------|------|
| 1 | 步骤 2 | ✅ 已验证 | `sel.toString()` 和蓝色高亮一致，是准的 |
| 2 | 步骤 2 | ❌ 已发现 bug | `selectedText` 不对齐词边界，需要词边界扩展（往左/右找空格） |
| 3 | 步骤 2 | ❌ 已发现 bug | 标题区域无法精确选词，span 连续排列导致跨行扩展 |
| 4 | 步骤 4 | ⏳ 待验证 | 保存的 `annotation.quote` 是截断的子串（来自 bug #2） |
| 5 | 步骤 5 | ⏳ 待验证 | `surroundContents` 是否成功（未走 fallback 整行高亮） |
| 6 | 步骤 5 | ⏳ 待验证 | 高亮范围是否和 `quote` 一致，不超出右侧 |
| 7 | 步骤 5→5 | ⏳ 待验证 | 多次 clearHighlights + renderHighlights 后高亮是否仍然正确 |
