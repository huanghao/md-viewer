# pdf2md 工具设计

## 目标

一个独立的 Python 脚本，把学术 PDF 转换成可在 mdv 中阅读的结构化 Markdown，并可选生成翻译 sidecar。个人单机使用，不发布。

## 使用方式

```bash
# 基本转换
python pdf2md.py paper.pdf

# 带翻译（需要 mdv 翻译服务在线）
python pdf2md.py paper.pdf --translate

# 指定 LLM 模型（标题插入 fallback 用）
python pdf2md.py paper.pdf --model claude-opus-4-7

# 只翻译，跳过转换（已有 body-structured.md 时）
python pdf2md.py paper.pdf --translate-only
```

## 输出目录结构

```
paper/                               # 以 PDF 文件名命名的目录
  ├── body-structured.md             # 主文件：带标题的正文（给人看）
  ├── body-structured.translation.json  # 翻译 sidecar（--translate 时生成）
  ├── abstract.md                    # 摘要
  ├── references.md                  # 参考文献
  ├── raw.md                         # markitdown 原始输出（debug 用）
  └── audit.jsonl                    # LLM 调用记录
```

## 处理流程

### Step 1：PDF → raw.md（markitdown，无 LLM）

```python
from markitdown import MarkItDown
md = MarkItDown()
result = md.convert("paper.pdf")
# 写入 paper/raw.md
```

markitdown 的特点：正文段落质量好，但不包含章节标题，表格/图片混乱（已知问题，本工具不处理）。

### Step 2：拆分论文各部分（规则，无 LLM）

在 raw.md 里用字符串搜索定位边界：

| 边界 | 匹配规则 | 说明 |
|------|----------|------|
| 正文开始 | 搜索 `^1 Introduction` 或 `^1\. Introduction` | 第一章标题 |
| 附录开始 | 搜索 `^Contributors` / `^Acknowledgements` / `^Appendix` | 取最早出现的 |
| 参考文献 | 搜索 `^References` | 在附录之后或末尾 |

拆分结果：
- **abstract**：正文开始之前的内容（去掉 arxiv 元信息噪音行）
- **body**：正文开始 → 附录/参考文献之前
- **references**：`References` 行之后到文末

边界找不到时的处理：
- 找不到 `Introduction`：整个 raw.md 作为 body，abstract 为空
- 找不到 `References`：references 为空

### Step 3：获取 TOC

优先级：
1. 读同目录的 `paper.pdf.toc.json`（mdv 已有生成能力，格式见下）
2. 若不存在，用 `pypdf` 读 PDF outline 自动生成

TOC JSON 格式（mdv 已有）：
```json
[
  {"title": "Introduction", "level": 1, "pageNum": 1, "children": []},
  {"title": "Pre-Training", "level": 1, "pageNum": 4, "children": [
    {"title": "Pre-Training Data", "level": 2, "pageNum": 4, "children": [
      {"title": "Web Data Curation", "level": 3, "pageNum": 4}
    ]}
  ]}
]
```

TOC 扁平化后生成带编号的标题列表：
```
1. Introduction
2. General Overview
3. Pre-Training
3.1. Pre-Training Data
3.1.1. Web Data Curation
...
```

### Step 4：在 body 中插入标题（规则优先，LLM fallback）

对每个 TOC 节点，按以下策略定位插入点：

**策略 A：精确字符串匹配（无 LLM）**

在 body 文本中搜索标题文字（如 `Web Data Curation`）：
- 精确匹配：找到唯一出现位置 → 在该行前插入标题
- 多处匹配：取第一次出现

**策略 B：模糊匹配（无 LLM）**

若精确匹配失败，尝试：
- 去标点后匹配
- 只匹配前 N 个词

**策略 C：LLM fallback**

前两种策略都失败时，调 Claude API：
- 输入：当前标题文字 + 前后各 30 行的上下文窗口（滑动窗口，从上一个已定位标题的行号开始）
- 输出：JSON `{"line": 342}` 或 `{"not_found": true}`
- 每次调用写入 `audit.jsonl`

插入格式：
```
# 1. Introduction
## 3.1. Pre-Training Data
### 3.1.1. Web Data Curation
```

输出写入 `paper/body-structured.md`。

### Step 5：翻译 sidecar（`--translate` 时）

复用 `translate_sidecar.py` 的段落提取和翻译逻辑：
- 调 mdv 本地翻译服务：`http://localhost:3000/api/translate`
- 输出：`paper/body-structured.translation.json`
- 增量保存，每 5 段 checkpoint

若 mdv 服务不在线，打印提示并跳过，不报错退出。

## LLM 调用设计

### 环境变量（通过 `.env` 或 shell export）

```bash
ANTHROPIC_BASE_URL=https://mcli.sankuai.com   # 默认 https://api.anthropic.com
ANTHROPIC_AUTH_TOKEN=xxx                        # API key（anthropic SDK 自动读取）
```

`.env` 文件加入 `.gitignore`，提供 `.env.example` 模板。

### SDK

使用 `anthropic` Python SDK，它自动读取 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_AUTH_TOKEN`：

```python
import anthropic
client = anthropic.Anthropic()  # 自动从环境变量读取配置
response = client.messages.create(
    model=args.model,
    max_tokens=256,
    messages=[{"role": "user", "content": prompt}]
)
```

默认模型：`claude-haiku-4-5`（快且便宜，标题定位任务简单）。

### Audit JSONL 格式

每次 LLM 调用追加一行到 `paper/audit.jsonl`：

```jsonl
{"ts": "2026-04-21T10:00:00Z", "step": "structure", "section": "3.1.1. Web Data Curation", "strategy": "llm_fallback", "model": "claude-haiku-4-5", "input_tokens": 820, "output_tokens": 18, "duration_ms": 1100, "result": {"line": 342}}
{"ts": "2026-04-21T10:00:01Z", "step": "structure", "section": "3.1.2. Determining the Data Mix", "strategy": "exact_match", "matched_line": 670}
```

`strategy` 字段：`exact_match` / `fuzzy_match` / `llm_fallback` / `not_found`

规则命中的调用不写 LLM 字段，只记录 `strategy` 和 `matched_line`，方便分析哪些章节需要 LLM。

## 依赖

```
markitdown[pdf]     # PDF → Markdown
pypdf               # 读取 PDF outline（TOC fallback）
anthropic           # Claude API SDK
python-dotenv       # 读取 .env 文件
```

安装：`pip install markitdown[pdf] pypdf anthropic python-dotenv`

## 不在范围内（已知问题，暂不处理）

- 表格清洗：markitdown 输出的表格质量差，需要专门处理
- 图片提取：矢量图需要 pdftoppm + 坐标裁剪，位图需要单独工具
- 公式清洗：部分公式在 raw md 里格式混乱
- 引用关联：参考文献与正文引用的双向链接
- 附录处理：Contributors/Acknowledgements 等直接丢弃

这些记录在 `TODO.md` 中。

## 文件位置

工具脚本放在 mdv 工程里：

```
tools/pdf2md/
  ├── pdf2md.py          # 主脚本（单文件入口）
  ├── .env.example       # 环境变量模板
  ├── README.md          # 使用说明
  └── tests/
      └── test_split.py  # 论文拆分逻辑的单元测试
```

## TODO

- [ ] bundle 支持：把输出目录当成一个「文件」在 mdv 里展示（需要 mdv 改动）
- [ ] 表格还原：识别并清洗 markitdown 输出的表格噪音
- [ ] 矢量图提取：pdftoppm + 坐标裁剪
- [ ] 引用关联：参考文献 ↔ 正文引用双向链接
