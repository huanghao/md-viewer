# fzf-lite 文件名搜索方案调研

**日期**：2026-05-03
**背景**：当前文件名搜索使用 `name.toLowerCase().includes(query)`，无法处理 `"foo baz"` 匹配 `foo-bar-baz` 这类多段查询。本文档介绍我称之为「fzf-lite」的中间档方案，便于决策。

---

## 0. 名词澄清

**「fzf-lite」不是业界标准术语**，是本文档对一种简化模糊匹配策略的称呼。它指：

> 把 query 按空白切成多个 token，每个 token 都必须以**子串**形式命中候选项；不做字符级子序列匹配。

之所以叫 lite，是相对于真正的 [fzf](https://github.com/junegunn/fzf)（Junegunn Choi 写的命令行模糊查找器）而言——fzf 做的是字符级子序列匹配 + 复杂打分。本方案只取了「多 token + 智能打分」这两层，不做字符级子序列。

---

## 1. 基线：当前 substring 方案的问题

### 当前实现

```ts
// src/utils.ts:105
function scoreFileMatch(query, filePath, root) {
  if (basename === query)        return 400;  // 完全相等
  if (basename.startsWith(query)) return 320;  // 前缀
  if (basename.includes(query))   return 240;  // 包含
  if (relPath.includes(query))    return 160;  // 路径包含
  return 0;
}
```

### 失败案例（用本仓库真实文件举例）

| Query                  | 文件                                       | 当前行为 | 期望 |
| ---------------------- | ------------------------------------------ | -------- | ---- |
| `workspace`            | `workspace-tree-expansion-persistence.ts`  | ✅ 命中  | ✅   |
| `persistence`          | `workspace-tree-expansion-persistence.ts`  | ✅ 命中  | ✅   |
| `workspace persistence`| `workspace-tree-expansion-persistence.ts`  | ❌ miss  | ✅   |
| `persistence tree`     | `workspace-tree-expansion-persistence.ts`  | ❌ miss  | ✅（顺序不该重要） |
| `pdf annotation`       | `pdf-annotation.ts`                        | ❌ miss  | ✅   |
| `rag cache`            | `rag-vector-cache.ts`                      | ❌ miss  | ✅   |
| `state diff`           | `workspace-state-diff.ts`                  | ❌ miss  | ✅   |

**根因**：`includes("workspace persistence")` 在 `"workspace-tree-expansion-persistence.ts"` 里找不到字面量子串（中间隔了 `-tree-expansion-`）。

---

## 2. 方案对比（四档）

| 方案                         | query → 行为                                              | `foo baz` → `foo-bar-baz` | `fbb` → `foo-bar-baz` | 实现复杂度 | 误命中风险 |
| ---------------------------- | --------------------------------------------------------- | ------------------------- | --------------------- | ---------- | ---------- |
| **A. substring**（现状）     | 整个 query 当一个子串找                                    | ❌                         | ❌                     | 极简       | 极低       |
| **B. fzf-lite**（本文方案） | 按空白切 token，每个 token 各自做 substring 匹配（AND）   | ✅                         | ❌                     | 简单       | 低         |
| **C. 子序列 fuzzy**          | query 每个字符按序在候选里出现即可                        | ✅                         | ✅                     | 中等       | 中（短 query 易过匹配） |
| **D. 完整 fzf**              | C + word-boundary 加分 + 连续匹配奖励 + 大小写敏感推断   | ✅                         | ✅                     | 高         | 中（靠打分压制） |

VSCode 的 Quick Open（Cmd+P）实际用的是 **D**。VSCode 在文件树侧栏的「过滤」框用的是更接近 **B/C** 的轻量版本。

---

## 2.5 现成三方库选型

四个主流可选项（都是 MIT/Apache，npm 可用）：

| 库                | 算法档位 | 体积（min+gz） | 类型 | 多 token | 多段高亮 | 备注                                                       |
| ----------------- | -------- | -------------- | ---- | -------- | -------- | ---------------------------------------------------------- |
| **fuse.js**       | 自定义（基于 Bitap） | ~13 KB         | ✅   | ❌（整串匹配） | ✅ `matches[]` 字段 | 名气最大；但默认是「容错搜索」，不是 fzf 那种 token AND，行为不像 VSCode |
| **fuzzysort**     | 子序列 + 词边界加分（≈方案 D 的轻量版） | ~5 KB | ✅ | ✅ 通过 `prepared` + 多 query | ✅ `highlight()` API | 跟 VSCode Quick Open 行为最接近、体积最小、零依赖；推荐 |
| **fzf-for-js**    | 完整 fzf v2 算法（≈方案 D） | ~15 KB         | ✅   | ✅ 原生 fzf 语法 | ✅ `positions` | 最贴近 fzf 行为；有完整的 extended-search 语法（`'exact` `^prefix` `$suffix` `!neg`） |
| **fzy.js**        | 子序列 DP 打分（≈方案 D） | ~3 KB | ❌（无类型） | ❌ | ❌（要自己拼） | 算法干净但 API 老旧，需要自己加多 token 包装               |

我的推荐顺序：

1. **fuzzysort** — 最佳性价比。跟方案 D 行为基本一致，~5KB，开箱即用支持多段高亮，TS 类型完整。直接跳过 fzf-lite，一步到位。
2. **fzf-for-js** — 如果将来要给 RAG search panel 之类引入「冒号语法」「精确匹配」「排除模式」（比如 `'pdf !test`），就用它。现阶段**不建议引入**：体积 ~15 KB（是 fuzzysort 的 3 倍）、API 与项目接口差距大需要适配层、extended-search 语法当前完全用不到——三点加在一起，接入成本不值当前收益。
3. **手写 fzf-lite** — 只在「不想新增 dep」「构建产物体积非常敏感」「需要服务端跑同样逻辑且要确保 zero-dep」三个条件全满足时才考虑。

> **服务端复用问题**：`fuzzysort` 是浏览器/Node 双端可用的纯 JS（无 DOM 依赖），在 Bun 里也能 import。所以选它不会破坏「客户端服务端共用一份算法」的诉求——本仓库的服务端搜索与客户端过滤都可以走同一个库。

### 决策建议

如果选三方库 → **直接上 fuzzysort**，跳过本文档后面 3-7 节的手写细节，落地点（第 5 节）的 4 处替换照旧适用，只是 `fuzzyMatch` 换成 `fuzzysort.single` / `fuzzysort.go`。

如果坚持手写 → 本文剩余章节的 fzf-lite 方案是最低成本可用版。

后文 3-7 节默认按手写描述，以便对比；选库时把 `fuzzyMatch(text, tokens)` 心理替换为 `fuzzysort.single(query, text)` 即可。

---

## 2.6 fuzzysort 实际行为与项目实现的关系

> **重要**：这节说明最终落地方案与原库行为的差异。

### fuzzysort 原生能力

fuzzysort 是一个**字符级子序列匹配**库：

- 输入一个 query 和一个候选字符串
- 找出 query 的字符按序出现在候选里的最优位置（可以不连续）
- 对连续匹配、词边界匹配加分，对稀疏分散的匹配减分
- 返回 score 和每个匹配字符的 indexes，供调用方高亮

```
fuzzysort.single('uninst', 'unnatural-instructions.md')
  → score: 0.68, indexes: [0,1, 10,11,12,13]
  → highlight: <mark>un</mark>natural-<mark>inst</mark>ructions.md
```

关键特性：
- **原生不支持多 token**：`fuzzysort.single('un ins', text)` 会把 `'un ins'`（含空格）当成一个整体来做子序列匹配，不会按空格拆分
- **子序列匹配很宽松**：任何包含 u、n、i、n、s 这几个字母的文件名都会得到非零分，包括 `schedule_data_version.json`

### 本项目的 `fuzzy-search.ts` 实际做了什么

```
src/client/utils/fuzzy-search.ts
```

这个文件是一个**适配层**，并非直接暴露 fuzzysort API。它实现的逻辑是：

**单 token 查询**（无空格）：
- 用 `fuzzysort.single(token, text)` 判断**是否匹配**和获取**打分**
- 高亮位置用 `indexOf` 找连续子串位置（不用 fuzzysort 的 indexes）
- 如果 token 在文件名里找不到连续子串，才 fallback 到 fuzzysort 的 indexes

**多 token 查询**（有空格）：
- **完全不用 fuzzysort 做匹配判断**
- 改为：每个 token 必须以连续子串（`indexOf`）形式出现在文件名里（AND 逻辑）
- fuzzysort 只用来给每个 token 打分，再取平均

```
fuzzyMatch('unnatural-instructions.md', 'un ins')
  → 检查 'un' 在文件名里有连续子串？ √（位置 0）
  → 检查 'ins' 在文件名里有连续子串？ √（位置 10）
  → 高亮 [0,2) 和 [10,13)
  → score = 各 token fuzzysort 分的平均值

fuzzyMatch('schedule_data_version.json', 'un ins')
  → 检查 'un' 在文件名里有连续子串？ ✗（没有 "un" 子串）
  → 返回 null（不匹配）
```

### 为什么不直接用 fuzzysort 原生做多 token？

fuzzysort 的子序列匹配太宽松——`'un ins'` 里的字符 u/n/i/n/s 按序出现在几乎任何英文文件名里，导致搜索结果混乱。文件名搜索的用户心智是"每个词都要连续出现"，而不是"字符按序散落"。

### 总结：实际用了 fuzzysort 的哪些部分

| 功能 | 是否用 fuzzysort |
|------|----------------|
| 单 token 是否命中 | ✅ 用 `fuzzysort.single` |
| 单 token 打分 | ✅ 用 `fuzzysort.single` 的 score |
| 单 token 高亮位置 | ❌ 改用 `indexOf`（连续子串） |
| 多 token 是否命中 | ❌ 改用 `indexOf` 逐 token 检查 |
| 多 token 打分 | ✅ 对每个 token 调 `fuzzysort.single` 取平均 |
| 多 token 高亮位置 | ❌ 改用 `indexOf` |

简单说：**fuzzysort 主要用于打分和单 token 的宽松命中判断；匹配语义（尤其是多 token）和高亮位置是自己实现的**。

---

## 3. fzf-lite 详细规格

### 3.1 匹配规则

```
query  := token (whitespace+ token)*
token  := 任意非空白字符序列
```

候选 `text` 命中 query 的条件：**所有** token 都作为子串（大小写不敏感）出现在 `text` 里。token 之间的**先后顺序不要求**。

```
"foo baz"   matches "foo-bar-baz"   ✅
"baz foo"   matches "foo-bar-baz"   ✅（顺序无关）
"foo qux"   matches "foo-bar-baz"   ❌（qux 不在）
""          matches anything         ✅（空 query 不过滤）
```

### 3.2 打分

每个候选先算单 token 的得分，最后按某种方式合成：

```
tokenScore(token, text):
  if text == token              → 400
  if text.startsWith(token)     → 320
  if isWordBoundaryHit(text, token) → 280   # 在 - / _ / 空格 后的位置
  if text.includes(token)       → 240
  return 0

score(query, text):
  tokens = tokenize(query)
  if any tokenScore == 0 → return 0
  return sum(tokenScore) + bonus
    where bonus =
      + 80  if 所有 token 都命中 basename（不只是路径中部）
      + 40  if 第一个 token 命中 basename 开头
      − len(text) * 0.1   # 短候选优先（轻微）
```

### 3.3 高亮（必须实现）

返回每个 token 的命中区间 `[start, end)` 数组，渲染时合并重叠区间，逐段包 `<mark>`：

```
highlight("workspace-tree-expansion-persistence.ts", ["workspace", "persistence"])
  → <mark>workspace</mark>-tree-expansion-<mark>persistence</mark>.ts
```

> 这一段是这次方案的核心交互价值——多 token 命中后必须每段都高亮，否则用户视觉上会以为只是单字段匹配。落地时不能省。

### 3.4 边界 case

| 输入        | 行为                                                |
| ----------- | --------------------------------------------------- |
| `"  foo  "` | trim + collapse 空白 → `["foo"]`                    |
| `"foo  bar"`| 多个空白合并 → `["foo", "bar"]`                     |
| `'"a b"'`   | **不**特殊处理引号（避免复杂度）；要带空格请用 quick open 之外的工具 |
| 中文 query  | 按字符匹配，无需分词（`"会议 纪要"` 当作两 token）   |
| 含 `-`      | `"foo-bar"` 是 1 个 token，整体 includes（保留这种用法） |

---

## 4. 伪代码

```ts
// src/client/utils/fuzzy-match.ts (新增)

export interface MatchResult {
  score: number;
  ranges: Array<[number, number]>;  // 命中区间，已合并去重
}

export function tokenize(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

export function fuzzyMatch(text: string, tokens: string[]): MatchResult | null {
  if (tokens.length === 0) return { score: 0, ranges: [] };
  const lower = text.toLowerCase();
  const ranges: Array<[number, number]> = [];
  let totalScore = 0;

  for (const t of tokens) {
    const idx = lower.indexOf(t);
    if (idx === -1) return null;
    ranges.push([idx, idx + t.length]);
    totalScore += scoreToken(lower, t, idx);
  }

  return { score: totalScore + boundaryBonus(text, tokens), ranges: mergeRanges(ranges) };
}

function scoreToken(lower: string, token: string, idx: number): number {
  if (lower === token) return 400;
  if (idx === 0) return 320;
  const prev = lower[idx - 1];
  if (prev === '-' || prev === '_' || prev === '/' || prev === ' ' || prev === '.') return 280;
  return 240;
}

function mergeRanges(rs: Array<[number, number]>): Array<[number, number]> {
  rs.sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [];
  for (const r of rs) {
    if (out.length && out[out.length - 1][1] >= r[0]) {
      out[out.length - 1][1] = Math.max(out[out.length - 1][1], r[1]);
    } else {
      out.push([...r]);
    }
  }
  return out;
}
```

---

## 5. 在本项目中的落地点（统一到一份代码）

**核心约束：匹配算法必须只有一份实现**——客户端与服务端共用，避免两边规则漂移导致「服务端搜得到、客户端高亮不上」之类的诡异 bug。

新增一个共享模块：`src/shared/fuzzy-match.ts`（纯函数、无 DOM/无 Node API），导出 `tokenize / fuzzyMatch / mergeRanges / scoreToken`。然后所有调用点都从这一份 import：

| 位置                                                | 现在做的事                              | 改动                                          |
| --------------------------------------------------- | --------------------------------------- | --------------------------------------------- |
| `src/utils.ts:105` `scoreFileMatch`                 | 服务端打分（substring）                 | 删除本地实现，调 `fuzzyMatch`，把 score 字段直接透传 |
| `src/client/ui/sidebar-workspace.ts:401, 569, 580`  | 客户端工作区树过滤（substring）         | 三处都换成 `fuzzyMatch(text, tokens) !== null` |
| `src/client/ui/file-row.ts:35` `highlightQuery`     | 单段 `<mark>` 高亮                      | 改为接收 ranges 数组，多段高亮（用 `fuzzyMatch` 返回的 ranges） |
| `src/client/ui/quick-open.ts:206` `highlightMatch`  | 用 regex 高亮单个 query                 | 同上，删本地 regex，改用 ranges                |

> 上面 4 处目前各写了一套 lower-case + includes 的过滤/高亮，是规则漂移的高发区。统一后只有 `src/shared/fuzzy-match.ts` 一处需要测试和维护；高亮也由同一份 ranges 数据驱动，行为天然一致。

服务端目前是 Bun/Node，客户端是浏览器 ESM，TS 共享一份纯函数文件没有运行时兼容问题。`src/shared/` 目录之前没有，这次顺手建立。

---

## 6. 何时该升级到完整 fzf（方案 D）

如果出现下面的使用模式，fzf-lite 不够，要升级：

- 用户开始用缩写：`fbb` 想找 `foo-bar-baz.md`、`pdfvw` 想找 `pdf-viewer.ts`
- 路径很长、token 选择困难，希望「输几个字母就到」
- 跨语言项目里频繁用 camelCase/snake_case 混合，希望词边界感更强

升级路径：
1. 把 `fuzzyMatch` 的实现从「token AND substring」换成字符级子序列；
2. 加 word-boundary detection（识别 camelCase 转折、`-_/.` 分隔）；
3. 加连续匹配奖励（`foo` 连续命中比散开 3 个字符分高）；
4. 用类似 [fzy 算法](https://github.com/jhawthorn/fzy/blob/master/SCORING.md) 的动态规划找最优匹配位置。

接口（`tokenize` + `fuzzyMatch` 返回 `{score, ranges}`）保持不变即可，调用点零改动。

---

## 7. 推荐与暂存

- **推荐做 B（fzf-lite）**：覆盖用户提到的具体痛点，4-5 处统一改造，约半天工作量，回归风险低。
- **D（完整 fzf）作为 TODO**：等用户反馈缩写式查询的需求出现再做，接口已经设计好了不会有重写。
- **不要做 C 单独存在**：C 在没有词边界加分的情况下短 query 很容易过匹配（`ab` 命中一切包含 a 后跟 b 的路径），体验比 B 差。要做就直接做 D。

---

## 8. 参考

- fzf 项目：https://github.com/junegunn/fzf
- fzy 打分算法：https://github.com/jhawthorn/fzy/blob/master/SCORING.md
- VSCode fuzzy scorer 源码：`src/vs/base/common/fuzzyScorer.ts`（`scoreFuzzy`）
