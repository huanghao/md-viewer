# 批注系统命名字典

> 用于开发者之间沟通时的统一术语。更新时间：2026-04-19

---

## 一、UI 组件（用户可见）

| 中文名 | 英文代号 | HTML id / CSS class | 说明 |
|--------|---------|---------------------|------|
| **快速添加按钮** | quick-add | `#annotationQuickAdd` / `.annotation-quick-add` | 选中文字后出现的 [+] 圆形按钮 |
| **composer** | composer | `#annotationComposer` / `.annotation-composer` | 点击 [+] 后弹出的**写评论输入框** |
| **popover** | popover | `#annotationPopover` / `.annotation-popover` | 点击高亮/矩形后弹出的**只读评论浮窗** |
| **侧边栏** | sidebar | `#annotationSidebar` / `.annotation-sidebar` | 右侧批注列表面板 |
| **批注列表** | annotation list | `#annotationList` / `.annotation-list` | 侧边栏内的批注条目列表 |
| **批注条目** | annotation item | `.annotation-item` | 列表里的单条批注 |
| **评论线程** | thread | `.annotation-thread` | 一条批注下的所有评论（含回复） |

---

## 二、高亮标记（文本层）

| 中文名 | CSS class | 说明 |
|--------|-----------|------|
| **MD 高亮** | `.annotation-mark` | MD 文件里的黄色背景高亮 span |
| **MD 临时高亮** | `.annotation-mark-temp` | 点击 [+] 后、保存前的黄色下划线 span |
| **PDF span 高亮** | `.pdf-highlight` | PDF TextLayer span 上的黄色背景（旧路径，现已弃用） |
| **PDF 选中标记** | `.pdf-selection-mark` | PDF 拉框时的蓝色临时矩形（canvas overlay） |
| **PDF 临时标记** | `.pdf-selection-mark-temp` | 点击 [+] 后变黄色的临时矩形（canvas overlay） |

---

## 三、PDF 专属组件

| 中文名 | CSS class / 说明 |
|--------|-----------------|
| **overlay canvas** | `.pdf-select-overlay` — 每页 PDF 上方的透明 canvas，捕获鼠标事件、绘制矩形 |
| **矩形高亮** | canvas 上绘制的持久黄色矩形框（保存批注后） |
| **锚点 div** | `.pdf-rect-anchor` — 零尺寸 div，挂 `data-annotation-id`，供 `jumpToAnnotation` 定位用 |
| **PDF 页面包装器** | `.pdf-page-wrapper` — 每页 PDF 的容器 div |
| **PDF 文本层** | `.pdf-text-layer` — PDF.js 生成的透明 span 层（现已 pointer-events:none） |

---

## 四、批注状态

| 状态值 | CSS class | 说明 |
|--------|-----------|------|
| `anchored` | `.status-exact`（置信度≥0.95）/ `.status-reanchored`（<0.95） | 已定位，高亮正常显示 |
| `unanchored` | `.status-orphan` | 失位，文本已改变，无法定位 |
| `resolved` | `.is-resolved` | 用户标记为已解决 |

---

## 五、数据结构关键字段（`Annotation` interface）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | UUID，批注唯一标识 |
| `serial` | number | 序号，显示为 #1、#2 |
| `start` | number | MD：全局文本 offset；PDF：TextItem 数组索引 |
| `length` | number | MD：字符数；PDF：item 数量 |
| `quote` | string | 被批注的原始文本 |
| `quotePrefix` | string | 前文上下文（用于重新定位） |
| `quoteSuffix` | string | 后文上下文（用于重新定位） |
| `status` | `'anchored'` \| `'unanchored'` \| `'resolved'` | 批注状态 |
| `confidence` | number | 定位置信度 0–1 |
| `thread` | `AnnotationThreadItem[]` | 评论线程（首条 type='comment'，后续 type='reply'） |
| `rectCoords` | `{x1,y1,x2,y2}` | PDF 专属：矩形坐标（PDF 坐标系，pt，未乘 scale） |
| `page` | number | PDF 专属：页码（从 1 开始） |
| `fileType` | `'md'` \| `'pdf'` | 文件类型 |

---

## 六、关键函数速查

| 函数 | 文件 | 作用 |
|------|------|------|
| `showQuickAdd(x, y, pending)` | annotation.ts | 显示 [+] 按钮 |
| `hideQuickAdd(clearPending?)` | annotation.ts | 隐藏 [+] 按钮，可选清除 pending |
| `openComposerFromPending()` | annotation.ts | 点 [+] 后打开 composer |
| `savePendingAnnotation(filePath)` | annotation.ts | 保存 composer 里的评论 |
| `showPopover(ann, x, y)` | annotation.ts | 在指定坐标显示 popover |
| `showPopoverBottomRight(ann)` | annotation.ts | 在右下角显示 popover（PDF 用） |
| `setActiveAnnotation(id, filePath)` | annotation.ts | 侧边栏点击批注条目时调用，跳转 + 显示 popover |
| `applyAnnotations()` | annotation.ts | 重新渲染所有高亮（MD） |
| `renderAnnotationList(filePath)` | annotation.ts | 刷新侧边栏列表 |
| `renderHighlights(annotations)` | pdf-annotation.ts | 渲染所有 PDF 矩形高亮 |
| `drawTempRect(page, x1,y1,x2,y2, style)` | pdf-viewer.ts | 绘制临时矩形（'blue' 或 'yellow'） |
| `clearTempRect(page?)` | pdf-viewer.ts | 清除临时矩形 |
| `renderRectHighlight(page, x1,y1,x2,y2, id)` | pdf-viewer.ts | 绘制持久矩形 + 插入锚点 div |

---

## 七、状态变量（`AnnotationState`）

| 变量 | 说明 |
|------|------|
| `state.pendingAnnotation` | 当前正在编辑的批注（选中后、保存前） |
| `state.pinnedAnnotationId` | 当前 popover 显示的批注 id |
| `state.activeAnnotationId` | 侧边栏当前选中的批注 id |
| `state.annotations` | 当前文件的所有批注数组 |
| `state.filter` | 侧边栏筛选器：`'all'` / `'open'` / `'resolved'` / `'orphan'` |
| `state.density` | 列表密度：`'default'`（定位模式）/ `'simple'`（极简列表） |

---

## 八、交互流程速查

### MD 批注流程
```
选中文字 → showQuickAdd（蓝色 selection + [+]）
→ 点 [+] → openComposerFromPending（黄色下划线 + composer）
→ 保存 → savePendingAnnotation → applyAnnotations（持久黄色背景）
→ 点高亮 → showPopover
→ 侧边栏点条目 → setActiveAnnotation → showPopover
```

### PDF 批注流程
```
拉框（overlay canvas） → 蓝色矩形 + showQuickAdd
→ 点 [+] → drawTempRect('yellow')（蓝→黄）+ composer
→ 保存 → clearTempRect + renderRectHighlight（持久黄色矩形 + 锚点 div）
→ 点矩形 → onAnnotationClick → showPopoverBottomRight
→ 侧边栏点条目 → setActiveAnnotation → showPopoverBottomRight（检测 .pdf-rect-anchor）
```
