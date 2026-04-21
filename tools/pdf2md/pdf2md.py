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
    lines = raw_text.splitlines()
    n = len(lines)

    abstract_line = next(
        (i for i, l in enumerate(lines) if re.match(r'^Abstract\s*$', l.strip())), None
    )
    references_line = next(
        (i for i, l in enumerate(lines) if re.match(r'^References\s*$', l.strip())), None
    )
    appendix_line = next(
        (i for i, l in enumerate(lines)
         if re.match(r'^(Contributors|Acknowledgements|Appendix)\b', l.strip())), None
    )

    meta_end = abstract_line if abstract_line is not None else 0
    meta_lines = lines[:meta_end]

    body_start = _find_body_start(lines, after=abstract_line)

    body_end = references_line if references_line is not None else (
        appendix_line if appendix_line is not None else n
    )
    refs_end = appendix_line if appendix_line is not None else n

    if abstract_line is not None and body_start is not None:
        abstract_lines = [
            l for l in lines[abstract_line + 1:body_start]
            if not re.match(r'^\d+\.?\s+\S', l)
        ]
        abstract = "\n".join(abstract_lines).strip()
    else:
        abstract = ""

    if body_start is not None:
        body = "\n".join(lines[body_start:body_end]).strip()
    else:
        body = raw_text.strip()

    if references_line is not None:
        references = "\n".join(lines[references_line + 1:refs_end]).strip()
    else:
        references = ""

    if appendix_line is not None:
        appendix = "\n".join(lines[appendix_line:n]).strip()
    else:
        appendix = ""

    return {
        "meta_lines": meta_lines,
        "abstract": abstract,
        "body": body,
        "references": references,
        "appendix": appendix,
    }


def _find_body_start(lines: list[str], after: int | None) -> int | None:
    start = (after + 1) if after is not None else 0

    numbered = [
        i for i in range(start, len(lines))
        if re.match(r'^\d+\.?\s+\S', lines[i].strip())
    ]
    if not numbered:
        return None

    if len(numbered) <= 1:
        return numbered[0]

    # Detect a TOC cluster: a group of immediately-adjacent numbered lines (gap == 1).
    # In a real TOC, entries appear on consecutive lines with no blank lines between them.
    # Body sections are separated by blank lines (gap >= 2).
    # If such a cluster exists (3+ entries), everything after it is the real body.
    # Otherwise, the first numbered line is already the body start.
    gaps = [numbered[i] - numbered[i - 1] for i in range(1, len(numbered))]
    toc_cluster_size = 1
    for gap in gaps:
        if gap == 1:
            toc_cluster_size += 1
        else:
            break

    if toc_cluster_size >= 3:
        # Skip the TOC cluster; body starts at the next numbered line after the cluster
        if toc_cluster_size < len(numbered):
            return numbered[toc_cluster_size]
        # All numbered lines were TOC — no body found
        return None

    # No TOC cluster detected; first numbered line is body start
    return numbered[0]


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
    text = "\n".join(meta_lines)

    # 标题：第一个长度 > 10、不是噪音行的非空行
    _NOISE_PATTERNS = re.compile(r'^(arXiv:|arxiv:|Date:|Website:|http|\d{4}\.\d{4})')
    title = None
    title_idx = -1
    for idx, line in enumerate(meta_lines):
        line = line.strip()
        if not line:
            continue
        if len(line) <= 10:
            continue
        if re.match(r'^[\d\s]{1,5}$', line):
            continue
        if _NOISE_PATTERNS.match(line):
            continue
        title = line
        title_idx = idx
        break

    # 作者：title 之后、第一个 Date/Website/arXiv 行之前，包含逗号或 @ 或 et al 的行
    authors: list[str] = []
    if title_idx >= 0:
        for line in meta_lines[title_idx + 1:]:
            line = line.strip()
            if not line:
                continue
            if _NOISE_PATTERNS.match(line):
                break
            if ',' in line or '@' in line or 'et al' in line.lower():
                authors = [line]
                break

    date = None
    date_match = re.search(r'Date:\s+(\w+)\s+(\d+),\s+(\d{4})', text)
    if date_match:
        try:
            dt = datetime.strptime(
                f"{date_match.group(1)} {date_match.group(2)} {date_match.group(3)}",
                "%B %d %Y"
            )
            date = dt.strftime("%Y-%m-%d")
        except ValueError:
            pass

    arxiv_id = None
    arxiv_match = re.search(r'(?:arXiv:|arxiv:)?(\d{4}\.\d{4,5})', text)
    if arxiv_match:
        arxiv_id = arxiv_match.group(1)

    return {
        "title": title,
        "authors": authors,
        "date": date,
        "arxiv_id": arxiv_id,
        "url": f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else None,
    }


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
