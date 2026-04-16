# Diff 导航设计文档

**日期：** 2026-04-16  
**状态：** 已批准

---

## 背景

当前 diff 页面（`renderDiffView` in `src/client/main.ts`）展示两列 side-by-side 对比表格，但没有任何导航能力。用户无法快速跳转到下一处差异，也不知道总共有几处。

---

## 功能描述

### 1. 差异块（diff block）定义

连续的 delete/insert 行（含配对的 mixed 行）合并为一个 block。equal 行打断 block。  
左右两侧作为一个整体算一处，不分别计数。

### 2. 导航条（独立 bar，位于 header 下方）

在 `.diff-header` 和 `.diff-view-scroll` 之间插入一条导航栏：

```
共 7 处差异          [↑ 上一处]  [↓ 下一处]
```

- 左侧文字：`共 N 处差异`，无差异时隐藏整条导航栏
- 右侧两个按钮：`↑ 上一处` / `↓ 下一处`
- 到达首/尾时对应按钮 disabled

### 3. 当前位置指示

在 diff 表格每个 block 的**行号列**（`diff-line-no`）旁，叠加一个小标签显示 `2/7`，仅当前激活 block 显示，其余 block 不显示。  
具体实现：每个 block 的第一行左侧行号单元格内追加一个 `<span class="diff-block-index">2/7</span>`，激活时显示，非激活时 `display:none`。

### 4. 滚动行为

点击「下一处」/「上一处」或键盘触发时：
- 将目标 block 第一行 `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- 更新行号区的小标签（隐藏旧的，显示新的）
- 更新导航条左侧文字为 `3 / 7 处差异`（激活态）或保持 `共 7 处差异`（初始态）

### 5. 键盘快捷键

仅在 diff 视图激活时生效（`diffViewActive === true`）：
- `n` — 下一处
- `p` — 上一处

不拦截输入框内的按键（检查 `event.target` 是否为 `input`/`textarea`）。

---

## 数据结构

在 `renderDiffView` 中计算 block 列表：

```ts
interface DiffBlock {
  startRowIndex: number;  // 在 rows 数组中的起始下标
  endRowIndex: number;    // 含尾，闭区间
}
```

渲染时为每个 block 的第一行 `<tr>` 加 `data-block-index="0"` 属性，供滚动定位用。

---

## UI 样式

```css
.diff-nav-bar {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  background: #fff;
  border-bottom: 1px solid #d0d7de;
  font-size: 12px;
  color: #57606a;
  gap: 8px;
}
.diff-nav-bar .diff-nav-count { flex: 1; }
.diff-nav-btn {
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  background: #fff;
  cursor: pointer;
  font-size: 11px;
}
.diff-nav-btn:hover { background: #f6f8fa; }
.diff-nav-btn:disabled { opacity: 0.4; cursor: default; }
.diff-nav-btn.primary {
  background: #0969da;
  color: #fff;
  border-color: #0969da;
}
.diff-nav-btn.primary:hover { background: #0860ca; }
.diff-block-index {
  display: none;
  font-size: 10px;
  color: #0969da;
  font-weight: 600;
  margin-left: 2px;
}
```

---

## 受影响的文件

| 文件 | 变更 |
|------|------|
| `src/client/main.ts` | `renderDiffView` 增加 block 计算、导航条 HTML、`navigateDiffBlock` 函数、键盘监听 |
| `src/client/css.ts` | 增加 `.diff-nav-bar`、`.diff-nav-btn`、`.diff-block-index` 样式 |

---

## 不在范围内

- 「接受更新」按钮（已从 diff 页面移除）
- 字符级 inline diff 高亮
- 多文件 diff
