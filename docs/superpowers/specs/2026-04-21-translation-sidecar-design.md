# Translation Sidecar 双语对照模式设计

## 背景

mdv 是本地 MD/PDF 查看器。用户通过外部工具（`translate_sidecar.py`）将 markdown 文档翻译成 JSON sidecar 文件（`file.md.translation.json`），格式为段落 ID → 译文的键值对。本文设计 mdv 识别该 sidecar 并提供双语对照阅读模式的方案。

## Sidecar 格式

```
file.md                          # 原文
file.md.translation.json         # 翻译 sidecar
```

sidecar JSON 格式：
```json
{
  "1-p0": "第一节第一段的译文",
  "1-p1": "第一节第二段的译文",
  "2-p0": "第二节第一段的译文"
}
```

key 格式：`{section_path}-p{index}`，其中 section_path 是从 markdown 标题层级推导的数字路径（`"1"`, `"2.1"`, `"0"` 表示文档开头无标题区域），index 是该 section 内段落的从零计数序号。

## 功能范围

- 检测到 sidecar 文件时，工具栏出现翻译切换按钮（默认隐藏）
- 点击按钮进入双语模式：每段原文下方插入对应译文块
- 再次点击退出双语模式，恢复原始渲染
- annotation（评论/批注）在双语模式下正常工作，锚定逻辑不受影响
- `mdv comments` CLI 输出不受影响

## 不在范围内

- 对译文段落加 annotation（C 方案，工程量过大，收益有限）
- 自动翻译（翻译由外部工具完成）
- PDF 文件的翻译模式

## 架构

### 数据流

```
文件加载完成
  → GET /api/translation-sidecar?path=<file>
  → 服务端检测 <file>.translation.json
  → 有效 → 返回 {ok: true, data: {...}}  → 缓存到 translationData，显示按钮
  → 无效 → 返回 {ok: false}              → 按钮保持隐藏
```

```
点击翻译按钮（进入模式）
  → buildParagraphMap(#content DOM)       → Map<paragraphId, HTMLElement>
  → enterTranslationMode(data, map)       → 插入译文块，标记 data-translation-target
  → applyAnnotations()                    → TreeWalker 跳过译文块，偏移量不变

点击翻译按钮（退出模式）
  → exitTranslationMode()                 → 移除所有 .translation-block
  → applyAnnotations()                    → 恢复正常
```

### 组件

#### 1. 服务端：`src/handlers.ts`

新增路由 `GET /api/translation-sidecar`：

- 参数：`path`（文件绝对路径）
- 构造 sidecar 路径：`path + ".translation.json"`
- 安全检查：path 必须是已授权的文件路径（复用现有文件访问权限逻辑）
- 读取文件，解析 JSON，验证是 object 且至少有一个 key
- 成功：`{ok: true, data: Record<string, string>}`
- 失败（不存在/格式错误）：`{ok: false}`

#### 2. 客户端：段落映射 `src/client/translation/paragraph-mapper.ts`

`buildParagraphMap(contentEl: HTMLElement): Map<string, HTMLElement>`

遍历 `contentEl` 的直接子元素（或递归到 markdown-body 层），按以下规则生成段落 ID：

- 遇到 `<h1>`-`<h6>`：更新 section_path（解析标题文本中的数字前缀，如 `"1."`, `"2.1."` 等；若无数字前缀则用序号递增）
- 遇到 `<p>`：当前 section 内的段落计数器 +1，生成 key `${sectionPath}-p${index}`，记录 `<p>` 元素
- 跳过：`<blockquote>`（figure/table placeholder）、文本长度 < 20 的段落、`<pre>`（代码块）、`<table>`

此逻辑需与 `translate_sidecar.py` 的段落提取规则保持一致。

#### 3. 客户端：翻译视图 `src/client/translation/translation-view.ts`

```typescript
interface TranslationState {
  active: boolean;
  data: Record<string, string> | null;
}

function enterTranslationMode(data: Record<string, string>, paragraphMap: Map<string, HTMLElement>): void
function exitTranslationMode(): void
```

`enterTranslationMode`：
- 对 paragraphMap 中每个有对应译文的条目：
  - 给原文 `<p>` 加 `data-translation-source` 属性
  - 在其后插入 `<div class="translation-block" data-translation-target>译文内容</div>`
- 给 `#content` 加 `translation-active` class（用于 CSS 样式）

`exitTranslationMode`：
- 移除所有 `.translation-block` 元素
- 移除所有 `data-translation-source` 属性
- 移除 `#content` 的 `translation-active` class

#### 4. 客户端：annotation 兼容（`src/client/annotation.ts`）

`applyAnnotations` 内部使用 `TreeWalker` 遍历文本节点。在 TreeWalker 的 `filter` 函数中，拒绝 `data-translation-target` 属性的节点及其子节点：

```typescript
filter: (node) => {
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
  if (el?.closest('[data-translation-target]')) return NodeFilter.FILTER_REJECT;
  return NodeFilter.FILTER_ACCEPT;
}
```

这确保偏移量计算始终基于原文文本流，annotation 的 `start`/`length` 在两种模式下含义一致。

#### 5. 客户端：主流程 `src/client/main.ts`

在 `onFileLoaded()` 完成后：
```
if (file.fileType !== 'pdf') {
  fetchTranslationSidecar(file.path)
    .then(result => {
      translationData = result.ok ? result.data : null;
      updateTranslationButtonVisibility();
    });
}
```

文件切换时（现有的 `onFileLoaded` 开头）：
- 清空 `translationData`
- 如果翻译模式激活，先 `exitTranslationMode()`
- 隐藏翻译按钮

#### 6. UI：`src/client/html.ts`

在工具栏 diff 按钮附近添加翻译按钮，默认隐藏：

```html
<button class="toolbar-text-button" id="translationButton"
        onclick="handleTranslationButtonClick()"
        style="display: none;"
        title="切换双语对照模式">
  <span id="translationButtonText">[🌐 译]</span>
</button>
```

#### 7. CSS

```css
.translation-block {
  color: var(--text-muted, #666);
  font-size: 0.92em;
  border-left: 2px solid var(--accent, #4a9eff);
  padding-left: 0.8em;
  margin-top: 0.3em;
  margin-bottom: 1em;
}

[data-translation-source] {
  margin-bottom: 0.2em;
}
```

## 关键约束

1. **sidecar 数据加载一次后缓存**，切换模式不重新请求
2. **文件切换时完全重置**：清除缓存、退出翻译模式、隐藏按钮
3. **annotation 偏移量在两种模式下完全一致**：通过 TreeWalker filter 实现
4. **`mdv comments` CLI 不受任何影响**：存储层、doc_path、serial 均无变化
5. **仅支持 markdown 文件**：PDF 跳过检测

## 段落映射对齐验证

`translate_sidecar.py` 的段落提取规则（需对齐）：
- 按空行分割段落
- 跳过：以 `#` 开头的标题行、`> **[Figure` 或 `> **[Table` 开头的 blockquote、`$$` 包裹的数学公式块、长度 < 20 字符的行
- section_path 从标题的数字前缀提取（`# 1. Introduction` → `"1"`）

客户端 `paragraph-mapper.ts` 需实现等价逻辑。实现后需用实际 sidecar 文件验证映射结果与 Python 脚本一致。
