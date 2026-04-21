# pdf2md 工具设计

## 目标

一个独立的 Python 脚本，把学术 PDF 转换成可在 mdv 中阅读的结构化 Markdown，并可选生成翻译 sidecar。个人单机使用，不发布。

## 使用方式

```bash
# 基本转换
python pdf2md.py paper.pdf

# 带翻译（需要 mdv 翻译服务在线）
python pdf2md.py paper.pdf --translate

# 指定 LLM 模型（标题插入用）
python pdf2md.py paper.pdf --model claude-opus-4-7

# 只翻译，跳过转换（已有 main.md 时）
python pdf2md.py paper.pdf --translate-only
```

## 输出目录结构

```
paper/                               # 以 PDF 文件名命名的目录
  ├── manifest.json                  # 元信息（版本、生成时间）
  ├── main.md                        # 主文件：摘要 + 带标题的正文 + 参考文献
  ├── main.translation.json          # 翻译 sidecar（--translate 时生成）
  ├── meta.json                      # 论文元信息（标题、作者、日期等，从 arxiv 头部解析）
  ├── appendix.md                    # 附录（Contributors、Acknowledgements、Appendix 等）
  ├── toc.json                       # PDF outline（扁平化，带编号）
  ├── raw.md                         # markitdown 原始输出（debug 用）
  └── audit.jsonl                    # LLM 调用记录
```

`manifest.json` 示例：
```json
{
  "version": 1,
  "pdf": "paper.pdf",
  "created_at": "2026-04-22T10:00:00Z"
}
```

`version` 代表目录布局的 API 版本，未来若调整文件结构需递增。

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
| 元信息结束 | 搜索 `^Abstract` | arxiv 头部（作者、日期、arXiv 号等）在 Abstract 之前 |
| 摘要开始 | 搜索 `^Abstract` | arxiv 论文摘要标题 |
| 目录区域 | `Abstract` 之后到正文开始之间，若存在大量 `^\d+\.?\s` 密集行则为目录 | 丢弃 |
| 正文开始 | 跳过目录区域后的第一个 `^\d+\.?\s` 行 | 如 `1 Introduction`、`1. Overview` |
| 参考文献 | 搜索 `^References` | |
| 附录开始 | 搜索 `^Contributors` / `^Acknowledgements` / `^Appendix` | 取最早出现的 |

拆分结果：
- **meta.json**：raw.md 开头到 `Abstract` 之前，解析为结构化 JSON（标题、作者、日期、arXiv 号）
- **abstract**（写入 main.md 开头）：`Abstract` 行到正文开始之间，去掉目录区域
- **body**（写入 main.md 中段）：正文第一章 → 参考文献之前
- **references**（写入 main.md 末尾）：`References` 行之后，附录之前
- **appendix.md**：Contributors、Acknowledgements、Appendix 等，单独保存

`main.md` 组合顺序：abstract → body（含插入标题）→ references

`meta.json` 示例：
```json
{
  "title": "The Llama 3 Herd of Models",
  "authors": ["Llama Team, AI @ Meta"],
  "date": "2024-07-23",
  "arxiv_id": "2407.21783",
  "url": "https://arxiv.org/abs/2407.21783"
}
```

arxiv 元信息解析规则（基于 markitdown 输出的固定格式）：
- 标题：第一个非空行（在作者行之前）
- 日期：匹配 `Date: \w+ \d+, \d{4}`
- arXiv 号：匹配 `\d{4}\.\d{4,5}`
- 作者：`^[A-Z][a-z]+ Team` 或类似格式（可选，解析失败留空）

边界找不到时的处理：
- 找不到 `Abstract`：meta.json 为空，abstract 为空，以第一个 `^\d` 行作为正文开始
- 找不到正文开始标志：整个 raw.md 作为 body
- 找不到 `References`：references 为空
- 找不到附录标志：appendix.md 为空

### Step 3：提取 TOC

用 `pypdf` 直接读 PDF outline，生成扁平化的带编号标题列表，写入 `toc.json`：

```json
[
  {"num": "1", "title": "Introduction", "level": 1, "pageNum": 1},
  {"num": "2", "title": "General Overview", "level": 1, "pageNum": 2},
  {"num": "3", "title": "Pre-Training", "level": 1, "pageNum": 4},
  {"num": "3.1", "title": "Pre-Training Data", "level": 2, "pageNum": 4},
  {"num": "3.1.1", "title": "Web Data Curation", "level": 3, "pageNum": 4}
]
```

若 PDF 没有 outline，`toc.json` 为空数组，后续步骤跳过标题插入。

### Step 4：在 body 中插入标题（规则，无 LLM）

对每个 TOC 节点，在 body 文本中搜索标题文字定位插入点：

**策略 A：精确字符串匹配**

搜索标题文字（如 `Web Data Curation`）：
- 找到唯一位置 → 在该行前插入标题
- 多处匹配 → 取上一个已定位标题行号之后的第一次出现

**策略 B：模糊匹配**

若精确匹配失败：
- 去标点后匹配
- 只匹配标题前 4 个词

**策略 C：跳过**

两种策略都失败时，记录 `not_found` 到 `audit.jsonl`，跳过该标题，继续处理下一个。

插入格式：
```
# 1. Introduction
## 3.1. Pre-Training Data
### 3.1.1. Web Data Curation
```

LLM fallback 暂不实现，留作后续扩展。

### Step 5：翻译 sidecar（`--translate` 时）

对 `main.md` 中的正文段落调 mdv 本地翻译服务：
- 服务地址：`http://localhost:3000/api/translate`
- 段落 ID 格式：`{section_num}-p{index}`（如 `3.1.1-p0`）
- 输出：`paper/main.translation.json`
- 增量保存，每 5 段 checkpoint

LLM prompt（标题插入用，Step 4 策略 C 未来扩展时使用）：
```
Given the following section title from a paper's table of contents:
  "{section_num}. {title}"

Find the line in the text below where this section begins.
Return JSON: {"line": <line_number>} or {"not_found": true}

Text (lines {start}-{end}):
{context_window}
```

若 mdv 服务不在线，打印提示并跳过，不报错退出。

## LLM 调用设计

### 环境变量

通过工程根目录的 `.env` 文件或 shell export 配置（`.env` 已在 `.gitignore` 中）：

```bash
ANTHROPIC_BASE_URL=...    # API 地址，默认 https://api.anthropic.com
ANTHROPIC_AUTH_TOKEN=...  # API key（anthropic SDK 自动读取）
```

### SDK

使用 `anthropic` Python SDK，自动读取上述环境变量：

```python
import anthropic
client = anthropic.Anthropic()  # 自动从环境变量读取
response = client.messages.create(
    model=args.model,
    max_tokens=256,
    messages=[{"role": "user", "content": prompt}]
)
```

默认模型：`claude-haiku-4-5`。

### audit.jsonl 字段说明

每次 LLM 调用追加一行到 `paper/audit.jsonl`，只记录实际调用了 LLM 的操作：

| 字段 | 类型 | 说明 |
|------|------|------|
| `ts` | string | ISO 8601 时间戳 |
| `step` | string | 处理阶段：`structure`（标题插入）/ `translate`（翻译） |
| `section` | string | 当前处理的章节或段落，如 `3.1.1. Web Data Curation` |
| `prompt` | string | 发送给 LLM 的完整 prompt |
| `model` | string | 使用的模型名 |
| `input_tokens` | int | 输入 token 数 |
| `output_tokens` | int | 输出 token 数 |
| `duration_ms` | int | 耗时毫秒 |
| `response` | string | 模型返回的原始文本 |

## Python 版本与依赖

Python 版本：**3.12**（在 `tools/pdf2md/.python-version` 中声明）

依赖（`tools/pdf2md/requirements.txt`）：
```
markitdown[pdf]>=0.1.0
pypdf>=4.0.0
anthropic>=0.49.0
python-dotenv>=1.0.0
```

## 文件位置

```
tools/pdf2md/
  ├── pdf2md.py            # 主脚本（单文件入口）
  ├── requirements.txt     # Python 依赖
  ├── .python-version      # Python 版本声明（3.12）
  ├── README.md            # 使用说明
  └── tests/
      └── test_split.py    # 论文拆分逻辑的单元测试
```

环境变量配置在工程根目录的 `.env` 文件中（已在 `.gitignore`）。

## TODO

- [ ] paper directory 支持：mdv 把输出目录当成一个条目展示，点击直接打开 main.md
- [ ] 标题插入 LLM fallback：策略 C，对 not_found 的章节调 Claude API 定位
- [ ] 表格还原：识别并清洗 markitdown 输出的表格噪音
- [ ] 矢量图提取：pdftoppm + 坐标裁剪
- [ ] 引用关联：参考文献 ↔ 正文引用双向链接
