#!/usr/bin/env python3
"""
pdf2md.py — 学术 PDF → 结构化 Markdown

用法:
  python pdf2md.py paper.pdf
  python pdf2md.py paper.pdf --translate
  python pdf2md.py paper.pdf --translate-only
  python pdf2md.py paper.pdf --model claude-opus-4-7
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# 论文拆分
# ---------------------------------------------------------------------------

def split_paper(raw_text: str) -> dict:
    """
    把 markitdown 输出的原始 MD 文本拆分为各部分。

    返回:
        {
            "meta_lines": [...],   # Abstract 之前的行
            "abstract": str,       # Abstract 正文（不含 Abstract 标题行）
            "body": str,           # 正文（第一章到 References 之前）
            "references": str,     # References 之后，附录之前
            "appendix": str,       # Contributors/Acknowledgements/Appendix 等
        }
    """
    pass


def parse_meta(meta_lines: list[str]) -> dict:
    """
    从 arxiv 元信息行解析结构化 JSON。

    返回:
        {
            "title": str | None,
            "authors": list[str],
            "date": str | None,      # YYYY-MM-DD
            "arxiv_id": str | None,
            "url": str | None,
        }
    """
    pass


# ---------------------------------------------------------------------------
# TOC 提取
# ---------------------------------------------------------------------------

def extract_toc(pdf_path: Path) -> list[dict]:
    """
    用 pypdf 读取 PDF outline，返回扁平化带编号的列表。

    返回:
        [{"num": "3.1", "title": "Pre-Training Data", "level": 2, "pageNum": 4}, ...]
    """
    pass


# ---------------------------------------------------------------------------
# 标题插入
# ---------------------------------------------------------------------------

def insert_headings(body: str, toc: list[dict], audit_path: Path) -> str:
    """
    在 body 文本中按 TOC 插入 Markdown 标题。
    策略 A: 精确匹配；策略 B: 模糊匹配；策略 C: 跳过并记录 audit。

    返回插入标题后的 body 文本。
    """
    pass


# ---------------------------------------------------------------------------
# 翻译 sidecar
# ---------------------------------------------------------------------------

TRANSLATE_API = "http://localhost:3000/api/translate"


def translate_text(text: str) -> str:
    """调用 mdv 本地翻译服务，返回译文。"""
    pass


def extract_paragraphs(md_text: str) -> list[tuple[str, str]]:
    """
    从带标题的 MD 文本提取段落，返回 [(para_id, text), ...]。
    段落 ID 格式：{section_num}-p{index}，如 3.1.1-p0
    """
    pass


def generate_translation_sidecar(
    main_md: str, out_path: Path, checkpoint_every: int = 5
) -> None:
    """生成翻译 sidecar JSON 文件，增量保存。"""
    pass


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def run(pdf_path: Path, model: str, do_translate: bool, translate_only: bool) -> None:
    pass


def main() -> None:
    from dotenv import load_dotenv
    load_dotenv()

    parser = argparse.ArgumentParser(description="PDF → 结构化 Markdown")
    parser.add_argument("pdf", type=Path, help="输入 PDF 文件")
    parser.add_argument("--translate", action="store_true", help="生成翻译 sidecar")
    parser.add_argument("--translate-only", action="store_true",
                        help="只翻译（已有 main.md 时跳过转换）")
    parser.add_argument("--model", default="claude-haiku-4-5",
                        help="LLM 模型（默认 claude-haiku-4-5）")
    args = parser.parse_args()

    if not args.pdf.exists():
        print(f"错误：文件不存在: {args.pdf}", file=sys.stderr)
        sys.exit(1)

    run(args.pdf, args.model, args.translate, args.translate_only)


if __name__ == "__main__":
    main()
