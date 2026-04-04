# JSON / JSONL 文件查看器设计

**日期：** 2026-04-04  
**状态：** 已批准

## 需求摘要

- 支持打开本地 `.json` 和 `.jsonl` 文件，与现有 `.md` / `.html` 文件并列
- 可折叠/展开的树形视图，默认展开第 1 层，深层收起
- 支持搜索 key 和 value，高亮匹配项，自动展开匹配节点的所有父节点
- 小文件场景（< 1MB），无需虚拟滚动
- 文本保持可选中，为后续批注功能预留接入点（不在本期实现批注）

## 架构

改动集中在以下文件，不引入新依赖：

| 文件 | 改动 |
|------|------|
| `src/utils.ts` | `isSupportedTextFile()` 加入 `.json` / `.jsonl` |
| `src/client/utils/file-type.ts` | 加入 `isJsonFile()` / `isJsonlFile()` |
| `src/client/ui/json-viewer.ts` | 新文件，JSON tree renderer |
| `src/client/main.ts` | `renderContent()` 加 JSON 分支；`syncAnnotationsForCurrentFile` 不排除 JSON |
| `src/client/css.ts` | 追加 JSON viewer 样式 |

## JSON Tree Renderer

### 解析

- `.json`：`JSON.parse(rawText)`，出错显示错误提示（行号 + 错误信息）
- `.jsonl`：按行 split，跳过空行，每行独立 parse，渲染为带行号的多个顶层条目；某行 parse 失败时显示该行错误，不影响其他行

### 渲染结构

```
▼ { } 3 keys          ← object 节点，可点击折叠
  "name": "Alice"     ← string 值，绿色
  "age": 30           ← number 值，蓝色
  ▶ "tags": [ ] 2     ← array 节点，收起状态
```

- 用 `<ul>/<li>` 递归生成 DOM
- object/array 节点：显示 `▶/▼` 箭头 + 类型标记（`{}`/`[]`）+ 子项数量
- 叶子节点：`key: value`，值按类型着色
  - string → `--json-string`（绿色调）
  - number → `--json-number`（蓝色调）
  - boolean → `--json-boolean`（橙色调）
  - null → `--json-null`（灰色）
- key 显示为中性色
- 缩进用 CSS `padding-left`，每层 16px

### 展开/收起

- 默认展开第 1 层（depth === 0 的子节点展开，depth >= 1 收起）
- 点击节点行（箭头或 key 区域）切换展开状态
- 收起时显示内联预览：`{ "name": "Alice", ... }` 截断到 60 字符

### 搜索

- 复用顶部现有 `#searchInput`
- 搜索时：
  1. 遍历所有叶子节点的 key 和 value 文本，不区分大小写匹配
  2. 高亮匹配的文本片段（用 `<mark>` 包裹）
  3. 自动展开所有包含匹配项的祖先节点
  4. 无匹配时在内容区显示 "无匹配结果"
- 清空搜索词时恢复默认展开状态

### 错误处理

- JSON parse 失败：显示红色错误提示框，包含错误信息，原始文本以 `<pre>` 展示
- JSONL 部分行失败：失败行显示内联错误，其余行正常渲染

## 批注预留

- 所有文本节点保持 `user-select: text`（不设置 `user-select: none`）
- `syncAnnotationsForCurrentFile` 不排除 JSON 文件
- 后期开启批注只需在该函数中去掉对 JSON 的豁免判断

## 不做的事

- 编辑功能
- 复制单个节点值
- 大文件虚拟滚动
- 本期不接批注
