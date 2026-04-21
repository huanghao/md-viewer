# pdf2md

学术 PDF → 结构化 Markdown 工具。

## 安装

```bash
pip install -r requirements.txt
```

## 配置

在工程根目录的 `.env` 中配置（仅翻译功能需要 LLM）：

```bash
ANTHROPIC_BASE_URL=...
ANTHROPIC_AUTH_TOKEN=...
```

## 用法

```bash
# 基本转换
python pdf2md.py paper.pdf

# 带翻译（需要 mdv 翻译服务在线：mdv server start）
python pdf2md.py paper.pdf --translate

# 只翻译（已有 main.md 时）
python pdf2md.py paper.pdf --translate-only

# 指定 LLM 模型
python pdf2md.py paper.pdf --model claude-opus-4-7
```

## 输出

```
paper/
  ├── manifest.json      # 元信息（版本、生成时间）
  ├── main.md            # 主文件（摘要 + 正文 + 参考文献）
  ├── main.translation.json  # 翻译 sidecar（--translate 时）
  ├── meta.json          # 论文元信息（标题、作者等）
  ├── appendix.md        # 附录
  ├── toc.json           # PDF 目录
  ├── raw.md             # 原始输出（debug）
  └── audit.jsonl        # LLM 调用记录
```
