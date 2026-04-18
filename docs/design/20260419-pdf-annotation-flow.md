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
      ├─── 用户点 [+]
      │         │
      │         ▼
      │   [步骤3] 蓝色→黄色下划线 + 弹出评论输入框
      │         │
      │         ├─── 用户写评论，点保存
      │         │         │
      │         │         ▼
      │         │   [步骤4] 保存注释
      │         │         │
      │         │         ▼
      │         │   [步骤5] 黄色精确高亮（持久）
      │         │
      │         └─── 用户点 [x] 取消
      │                   │
      │                   ▼
      │             [步骤7b] 清除下划线，取消 pending
      │
      └─── 用户不点 [+]，点其他地方
                │
                ▼
          [步骤7a] [+] 消失，黄色下划线保留（pending 保留）
                │
                └─── 用户再次选中同区域 → 回到步骤2（新 pending 覆盖旧 pending）
```

---

## 各步骤详解

### 步骤 1：拖拽选中

**触发**：用户在 PDF TextLayer 上按住鼠标拖拽。

**发生了什么**：浏览器原生处理文本选中，在透明 span 上渲染蓝色 `::selection` 效果。

**视觉状态**：选中区域显示蓝色高亮（浏览器默认样式）。

**关键数据**：无，浏览器内部状态。

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
- 蓝色 `<mark>` 精确覆盖选中字符（项目自己画，替代原生 ::selection）
- `[+]` 按钮出现在鼠标附近

**关键数据**：
- `selectedText`：精确选中文字（如 `"Language Models"`）
- `startItemIdx`：item 索引（如 `42`）
- `state.pendingAnnotation.quote = selectedText`

**双击特殊路径**：双击时走 `dblclick` 事件，通过 `expandDblClick` 自动扩展到词/句边界，其余逻辑相同。

---

### 步骤 3：点 `[+]` — 进入编辑态

**触发**：用户点击 `[+]` 按钮。

**发生了什么**：
1. 调用 `openComposerFromPending`
2. `<mark class="pdf-selection-mark">` → `<mark class="pdf-selection-mark-temp">`（蓝色变黄色下划线）
3. 弹出评论输入框（`#annotationComposer`），获得焦点

**视觉状态**：
- 选中区域变为黄色下划线（表示"有待确认的 pending 注释"）
- 评论输入框出现

**关键数据**：`state.pendingAnnotation` 保持不变。

---

### 步骤 4：写评论，点保存

**触发**：用户在输入框写完评论，点保存按钮（或按 Enter）。

**发生了什么**：
1. `savePendingAnnotation`：从 `state.pendingAnnotation` 取 `quote`、`start`、`length`，加上 `note`，构造完整注释对象
2. 保存到本地 state
3. `persistAnnotation` 发送到服务器（乐观更新）
4. 触发 `annotation:created` 事件
5. `hideComposer`：清除 `<mark class="pdf-selection-mark-temp">`，清空 `state.pendingAnnotation`
6. `renderHighlights` 被触发（通过 `annotation:created` 事件）

**视觉状态**：
- 评论输入框消失
- 黄色下划线消失（`pdf-selection-mark-temp` 被清除）
- 新的黄色高亮出现（步骤 5）

**关键数据**：
- 注释对象：`{ quote: "Language Models", start: 42, length: 1, note: "...", page: 1, fileType: "pdf" }`

---

### 步骤 5：高亮渲染（持久）

**触发**：`renderHighlights` 被调用（步骤 4 保存后触发）。

**发生了什么**：
1. `clearHighlights`：清除所有现有高亮（解包 `<mark class="pdf-highlight">`，移除 span 上的 class）
2. 遍历所有 PDF 注释，对每条调用 `highlightByItemRange(page, start, endIdx, id, quote)`
3. `highlightByItemRange` 内部逻辑：
   - 找到 item 对应的 span
   - 如果 `quote === span.textContent`（整行匹配）：给 span 加 `pdf-highlight` class
   - 如果 `quote` 是 span 的子串：用 `document.createRange()` + `surroundContents` 包一个 `<mark class="pdf-highlight">`，精确高亮子串
   - 如果 `surroundContents` 失败（try/catch）：fallback 到给整个 span 加 class

**视觉状态**：
- 选中文字显示黄色背景高亮（精确子串）
- 侧边栏出现对应评论条目

**预期**：高亮范围应与 `quote` 完全一致，不超出右侧。

**已知问题**：
- 若走 fallback（整行 span 加 class），高亮会覆盖整行，视觉上超出右侧
- `surroundContents` 失败的原因可能是 span 内部有嵌套节点，或文本节点结构被之前的 clearHighlights 破坏

---

### 步骤 6：点击侧边栏评论

**触发**：用户点击侧边栏中的评论条目。

**发生了什么**：
1. 滚动到对应页面
2. 对应高亮 span/mark 加 `annotation-mark.is-active` class（加深背景）

**视觉状态**：高亮颜色加深，侧边栏条目高亮。✓

---

### 步骤 7a：`[+]` 后点其他地方

**触发**：`[+]` 按钮可见时，用户点击非 `[+]`、非评论框的区域。

**发生了什么**：
1. `mousedown` 事件检测到点击在 `quickAdd` 外部
2. `hideQuickAdd(true)`：隐藏 `[+]` 按钮，清除 `state.pendingAnnotation`，清除 `<mark class="pdf-selection-mark">`

**视觉状态**：
- `[+]` 消失
- 蓝色 `<mark>` 消失
- 无任何残留标记

**注意**：此时 pending 已被清除，不存在"黄色下划线保留"的情况——那只发生在步骤 3（已点过 `[+]` 进入评论框）之后。

---

### 步骤 7b：评论框中点 `[x]` 取消

**触发**：用户点击评论输入框的关闭按钮（`#composerCancelBtn`）。

**发生了什么**：
1. `hideComposer`：
   - `clearTempSelectionMark`：清除 `<mark class="pdf-selection-mark-temp">` 和 `<mark class="pdf-selection-mark">`
   - `state.pendingAnnotation = null`
   - 关闭评论输入框

**视觉状态**：
- 黄色下划线消失
- 评论输入框消失
- 无任何残留标记

---

### 步骤 7c：评论框可见时重新选中文字

**触发**：评论框已打开（步骤 3 之后），用户在 PDF 上重新拖拽选中文字。

**发生了什么**：
1. mouseup → `showQuickAdd` 被调用
2. `showQuickAdd` 检测到评论框未隐藏，先调用 `hideComposer`（清除旧 pending、旧下划线）
3. 用新选中的文字创建新 pending，显示新的 `[+]` 按钮

**视觉状态**：旧的黄色下划线消失，新的蓝色 mark 出现，`[+]` 出现。

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

这些是目前代码逻辑上存在不确定性的地方，需要通过测试确认：

| # | 步骤 | 待验证 | 预期 |
|---|------|--------|------|
| 1 | 步骤 2 | `sel.toString()` 的值是否等于蓝色高亮的文字 | 一致 |
| 2 | 步骤 2 | `markSelectionSpans` 是否成功（DOM 里有 `<mark class="pdf-selection-mark">`） | 成功 |
| 3 | 步骤 4 | 保存的 `annotation.quote` 是精确子串还是整行 | 精确子串 |
| 4 | 步骤 5 | `surroundContents` 是否成功（未走 fallback） | 成功 |
| 5 | 步骤 5 | 高亮范围是否和 `quote` 完全一致 | 一致，不超出右侧 |
| 6 | 步骤 5→5 | 多次 clearHighlights + renderHighlights 后高亮是否仍然正确 | 仍然正确 |
| 7 | 步骤 7a | 点其他地方后是否完全清除（无残留 mark） | 完全清除 |
