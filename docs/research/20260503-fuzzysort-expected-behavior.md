# fuzzysort 搜索预期行为

**日期**：2026-05-03  
**背景**：当前已引入 fuzzysort，但实际行为与预期不符。本文档用具体例子描述**期望的搜索行为**，作为 review 和修复的基准。

---

## 核心原则

fuzzysort 是**字符级子序列匹配**（subsequence matching），不是普通的 substring 匹配。

关键区别：

- **substring**：`"un"` 必须在文件名里以连续字符形式出现
- **fuzzysort**：`"un"` 的字符 `u`、`n` 只需按顺序出现，不要求连续

多 token 查询（空格分隔）：每个 token 分别做 fuzzysort 匹配，**全部命中才算匹配**（AND 语义）。

---

## 示例文件

以下用真实项目文件举例：

```
unnatural-instructions-2212.09689.md
workspace-tree-expansion-persistence.ts
pdf-annotation.ts
rag-vector-cache.ts
workspace-state-diff.ts
```

---

## 单 token 查询

| 查询 | 能匹配的文件 | 原因 |
|------|------------|------|
| `unnat` | `unnatural-instructions-2212.09689.md` | 文件名包含连续子串 `unnat` |
| `un` | `unnatural-instructions-2212.09689.md` | 字符 u-n 存在于文件名 |
| `ins` | `unnatural-instructions-2212.09689.md` | 连续子串 `ins` |
| `pdf` | `pdf-annotation.ts` | 前缀匹配 |
| `annot` | `pdf-annotation.ts` | 连续子串 `annot` |
| `wsp` | `workspace-state-diff.ts`, `workspace-tree-expansion-persistence.ts` | w-s-p 是子序列 |

---

## 多 token 查询（这是新增的核心能力）

| 查询 | 能匹配的文件 | 原因 |
|------|------------|------|
| `un ins` | `unnatural-instructions-2212.09689.md` | `un` 和 `ins` 各自都能 fuzzysort 匹配文件名 |
| `pdf ann` | `pdf-annotation.ts` | `pdf` 和 `ann` 各自匹配 |
| `workspace persistence` | `workspace-tree-expansion-persistence.ts` | 两个 token 都命中 |
| `workspace diff` | `workspace-state-diff.ts` | 两个 token 都命中 |
| `rag cache` | `rag-vector-cache.ts` | 两个 token 都命中 |

---

## 多 token 查询：不匹配的情况

| 查询 | 不匹配的文件 | 原因 |
|------|------------|------|
| `un ins` | `workspace-state-diff.ts` | `un` 虽能在里面找子序列，但 `ins` 找不到 |
| `pdf diff` | `pdf-annotation.ts` | `diff` 在 `pdf-annotation.ts` 里找不到 |
| `workspace xyz` | 任何文件 | `xyz` 不存在于任何文件名 |

---

## 关于「顺序无关」

多 token 查询里，**token 之间的顺序不影响结果**：

| 查询 | 等价于 | 都能匹配 |
|------|-------|---------|
| `un ins` | `ins un` | `unnatural-instructions-2212.09689.md` |
| `pdf ann` | `ann pdf` | `pdf-annotation.ts` |

但每个 token **自身的字符必须按顺序出现**（这是 fuzzysort 的子序列语义）。

---

## 高亮行为

匹配到的字符应该被高亮（`<mark>` 包裹）：

- 查询 `unnat` → `<mark>unnat</mark>ural-instructions-2212.09689.md`
- 查询 `un ins` → `<mark>un</mark>natural-<mark>ins</mark>tructions-2212.09689.md`
- 查询 `workspace persistence` → `<mark>workspace</mark>-tree-expansion-<mark>persistence</mark>.ts`

目前高亮已经有实现，但**多 token 的高亮可能不完整**（只高亮了后一个 token）。这是次要问题，不影响搜索能否找到文件。

---

## 当前已知问题

1. **quick-open（ctrl+f）多 token 搜索返回空**：搜 `un ins` 找不到任何文件。
   - 这是主要 bug，需要修复。

2. **高亮不完整**：多 token 时只有部分 token 被高亮。
   - 次要问题，可以后续优化。

---

## 不在范围内（当前不期望支持）

- **缩写式匹配**：`fbb` 不保证能找到 `foo-bar-baz`（取决于子序列算法对稀疏匹配的处理）
- **模糊容错**：`unnatural`（多了一个字母）不保证能找到 `unnatural`
- **引号精确匹配**：`"un ins"` 不做特殊处理，等同于 `un ins`
