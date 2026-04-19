# PDF Canvas 拉框选中 + 矩形高亮设计

## 背景

PDF TextLayer DOM 文本选中在标题、图表、公式、竖排文字等区域体验极差（浏览器拖拽扩展失控）。通过交互测试工具验证了「坐标映射方案」（23 条样本 22/23 准确），下一步将选中交互改为 Canvas 拉框，完全绕过 TextLayer DOM 布局问题。

## 目标

1. 用 Canvas 拉框替换 TextLayer DOM 文本选中
2. 批注后续流程（[+] → composer → 保存 → 高亮 → 侧边栏 → popover）与 MD 保持一致的交互节奏
3. 持久高亮改为矩形框（方案 B），覆盖任意区域

## 不在范围内

- 双击选词（暂时移除，原有 dblclick 依赖 DOM selection）
- 多页跨页选中
- 缩放/旋转后矩形坐标自动适配

---

## 设计决策

| 问题 | 决策 | 理由 |
|------|------|------|
| 持久高亮形态 | 矩形框（canvas overlay 重绘） | 拉框和高亮视觉一致，竖排/图表/公式都能精确覆盖 |
| 临时高亮（选中未保存） | 松手→蓝色矩形保留；点[+]→变黄色矩形 | 蓝=待确认，黄=已进入编辑，和 MD 节奏一致 |
| 点击矩形高亮 | 弹 popover（和 MD 一致） | 避免习惯跳跃 |
| 侧边栏定位 | 零尺寸锚点 div（data-annotation-id），复用 jumpToAnnotation | 改动最小 |
| 数据锚定 | startItemIdx / endItemIdx（item index），附加 rectCoords | start/length/quote 语义不变，矩形坐标作为附加字段 |

---

## 状态机

```
拉框中（mousemove）
  → overlay canvas 绘制蓝色半透明矩形（实时）

松手（mouseup，拖拽 >= 5px）
  → 蓝色矩形保留
  → onTextSelected 回调 → handleTextSelected → showQuickAdd（[+] 出现）

点其他地方（[+] 存在时）
  → clearTempRect() + hideQuickAdd()
  → 流程结束，无残留

点 [+]（openComposerFromPending）
  → drawTempRect(..., 'yellow')（蓝色 → 黄色临时矩形）
  → composer 浮窗出现

composer 取消 / 点外部
  → clearTempRect()
  → hideQuickAdd()
  → 流程结束

composer 保存（savePendingAnnotation）
  → clearTempRect()
  → renderHighlights() → renderRectHighlight()（持久黄色矩形 + 锚点 div）
  → composer 消失

点击持久矩形区域（overlay canvas click）
  → 命中检测：点击坐标落在某矩形内
  → onAnnotationClick(annotationId, clientX, clientY)
  → showPopover()

侧边栏点击批注条目
  → jumpToAnnotation(id)
  → 找锚点 div [data-annotation-id]
  → scrollIntoView
  → showPopover()
```

---

## 数据结构变更

### Annotation 扩展字段

```typescript
// src/client/annotation.ts — Annotation interface 新增可选字段
rectCoords?: { x1: number; y1: number; x2: number; y2: number }
// PDF 坐标系（pt，未乘 scale），用于矩形高亮重绘
```

`start`、`length`、`quote` 语义不变：
- `start` = startItemIdx（TextItem 数组索引）
- `length` = endItemIdx - startItemIdx + 1（item 数量）
- `quote` = 命中 items 的文字拼接

### 服务器存储

`src/annotation-storage.ts` 的 `annotations` 表新增列：
```sql
rect_coords_json TEXT  -- nullable，JSON 序列化的 {x1,y1,x2,y2}
```

---

## 接口变更

### PdfViewerInstance 新增方法

```typescript
// 在指定页 overlay canvas 上绘制临时矩形
drawTempRect(pageNum: number, x1: number, y1: number, x2: number, y2: number, style: 'blue' | 'yellow'): void

// 清除指定页（或所有页）的临时矩形
clearTempRect(pageNum?: number): void

// 点击批注矩形的回调（由调用方设置）
onAnnotationClick?: (annotationId: string, clientX: number, clientY: number) => void
```

`onTextSelected` 签名不变。

### PdfAnnotationBridgeOptions 扩展

`pdf-annotation.ts` 的 `createPdfAnnotationBridge` 需要能调用 `viewer.drawTempRect` 和 `viewer.clearTempRect`，这些已通过 `PdfViewerInstance` 暴露，无需额外接口变更。

---

## 文件改动范围

| 文件 | 改动类型 | 内容 |
|------|---------|------|
| `src/client/pdf-viewer.ts` | 修改 | ① TextLayer pointer-events:none；② overlay canvas 创建；③ 事件绑定改为 overlay；④ coordPath 逻辑；⑤ renderRectHighlight；⑥ clearHighlights 清矩形；⑦ overlay click 命中检测；⑧ drawTempRect/clearTempRect 暴露 |
| `src/client/pdf-annotation.ts` | 修改 | ① handleTextSelected 存 rectCoords；② openComposerFromPending 调 drawTempRect yellow；③ 取消/保存时调 clearTempRect |
| `src/client/annotation.ts` | 修改 | Annotation interface 加 rectCoords 字段 |
| `src/annotation-storage.ts` | 修改 | DB schema 加 rect_coords_json 列；读写逻辑 |

---

## 坐标映射逻辑（coordPath）

从 `scripts/pdf-select-lab/index.html` 移植，核心逻辑：

```typescript
function coordPath(items, pageH, downX, downY, upX, upY):
  { text: string | null, hits: number[], detail: HitDetail[] }
```

参数：`pageH = viewport.height / scale`（PDF 坐标系高度，单位 pt）

1. 判断跨行（deltaY > 5pt）
2. 规范化起终点（Y 小的为起点，同行时 X 小的为起点）
3. 构建选区矩形 `[selLeft, selRight, selTop, selBottom]`
4. 遍历 items，找包围盒与选区矩形有交叉的 item
5. 按 Y 排序（从上到下），同行按 X 排序
6. 首尾 item 用 X 坐标估算字符偏移（均匀分布）
7. 拼接所有命中 item 的 str 子串

---

## 高亮渲染

`renderHighlights` 对每条 PDF annotation 同时调用：
1. `highlightByItemRange(page, start, start+length-1, id, quote)` — span 高亮（文字可点击）
2. `renderRectHighlight(page, x1, y1, x2, y2, id)` — 矩形高亮 + 锚点 div

两者并行：span 高亮确保文字区域有 click 事件，矩形高亮确保视觉覆盖完整。

`renderRectHighlight` 实现：
- 在该页 overlay canvas 上绘制持久黄色矩形（`rgba(255,200,0,0.35)` 填充，`rgba(255,160,0,0.8)` 描边）
- 在 wrapper 内插入零尺寸锚点 div：
  ```html
  <div class="pdf-rect-anchor"
       data-annotation-id="${id}"
       style="position:absolute;top:${y1*scale}px;left:${x1*scale}px;width:0;height:0;pointer-events:none">
  </div>
  ```

`clearHighlights` 时：
- 清除所有 overlay canvas（`clearRect`）
- 移除所有 `.pdf-rect-anchor` div

---

## 已知局限

1. **字符偏移精度**：均匀分布估算，差 1 字符概率约 20%（实测可接受）
2. **竖排文字**：矩形覆盖正确，但 quote 文字拼接可能包含不可见字符
3. **缩放**：当前 scale 固定 1.5，缩放功能未来实现时需要重算 rectCoords 显示坐标
4. **双击选词**：暂时移除，后续可基于 coordPath 重新实现
