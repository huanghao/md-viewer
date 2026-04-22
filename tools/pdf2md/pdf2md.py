#!/usr/bin/env python3
"""
pdf2md.py — 学术 PDF → 结构化 Markdown

用法:
  python pdf2md.py paper.pdf
  python pdf2md.py paper.pdf --force   # 强制重新生成（默认跳过已有输出）
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

from pypdf import PdfReader


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

    # references 总在 appendix 之前；若 appendix 出现在 references 之前（如 Contributors 在正文里），
    # 以 references 为准切分 body，appendix 取 references 之后的内容
    if references_line is not None and appendix_line is not None:
        if appendix_line < references_line:
            # appendix 在 references 之前：appendix 是正文的一部分，不切分 body
            body_end = references_line
            refs_end = n
            appendix_line = None  # 不单独提取 appendix
        else:
            body_end = references_line
            refs_end = appendix_line
    elif references_line is not None:
        body_end = references_line
        refs_end = n
    elif appendix_line is not None:
        body_end = appendix_line
        refs_end = n
    else:
        body_end = n
        refs_end = n

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


def clean_cid_noise(text: str) -> str:
    """
    把含 CID 字符引用的段落替换为公式占位符。
    markitdown 无法解析 PDF 数学公式，输出形如 (cid:18) 的乱码。
    策略：把相邻非空行合并为段落，对整个段落检测 CID 密度。
    """
    lines = text.splitlines()
    result: list[str] = []
    para: list[str] = []

    def flush_para():
        if not para:
            return
        block = "\n".join(para)
        cid_count = len(re.findall(r'\(cid:\d+\)', block))
        # 任意 CID 出现即替换（公式段落通常包含至少一个 CID）
        if cid_count >= 1:
            result.append("> **[Formula]**")
        else:
            result.extend(para)
        para.clear()

    for line in lines:
        if not line.strip():
            flush_para()
            result.append(line)
        else:
            para.append(line)
    flush_para()
    return "\n".join(result)


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
    reader = PdfReader(str(pdf_path))
    outline = reader.outline
    if not outline:
        return []

    result: list[dict] = []
    counters: list[int] = []

    def _walk(items: list, depth: int) -> None:
        while len(counters) <= depth:
            counters.append(0)

        for item in items:
            if isinstance(item, list):
                _walk(item, depth + 1)
            else:
                # 重置更深层计数器
                del counters[depth + 1:]
                counters[depth] += 1

                num = ".".join(str(c) for c in counters[:depth + 1])
                try:
                    page_num = item.page.page_number + 1
                except Exception:
                    page_num = 0

                result.append({
                    "num": num,
                    "title": item.title,
                    "level": depth + 1,
                    "pageNum": page_num,
                })

    _walk(outline, 0)
    return result


# ---------------------------------------------------------------------------
# 标题插入
# ---------------------------------------------------------------------------

def insert_headings(body: str, toc: list[dict], audit_path: Path) -> str:
    """
    在 body 文本中按 TOC 插入 Markdown 标题。
    策略 A: 精确匹配；策略 B: 模糊匹配；策略 C: 跳过并记录 audit。

    返回插入标题后的 body 文本。
    """
    lines = body.splitlines()
    insertions: dict[int, int] = {}  # toc_index -> line_index
    last_found_line = 0

    for toc_idx, entry in enumerate(toc):
        title = entry["title"]
        found_line = _find_title_line(lines, title, after=last_found_line)

        if found_line is not None:
            insertions[toc_idx] = found_line
            last_found_line = found_line
        else:
            _append_audit(audit_path, {
                "ts": datetime.now(timezone.utc).isoformat(),
                "step": "structure",
                "section": f"{entry['num']}. {title}",
                "strategy": "not_found",
            })

    # 按行号倒序插入，避免行号偏移；toc_idx 作为 tiebreaker 保证同行时顺序正确
    result_lines = lines[:]
    # 标记需要删除的行（匹配到的纯文本标题行，插入 MD 标题后删掉原文）
    lines_to_delete: set[int] = set()
    for toc_idx, line_idx in insertions.items():
        entry = toc[toc_idx]
        line_text = lines[line_idx].strip()
        # 如果匹配行的内容就是标题文字本身（纯文本重复行），标记删除
        # 比较时去掉数字前缀（如 "1. Introduction" → "introduction"）
        title_words = re.sub(r'[^\w\s]', ' ', entry["title"]).lower().split()
        line_words = re.sub(r'[^\w\s]', ' ', line_text).lower().split()
        # 去掉行首的数字前缀（TOC 编号）
        while line_words and re.match(r'^\d+$', line_words[0]):
            line_words = line_words[1:]
        if line_words and title_words and line_words == title_words:
            lines_to_delete.add(line_idx)

    for toc_idx in sorted(insertions.keys(), key=lambda i: (insertions[i], i), reverse=True):
        entry = toc[toc_idx]
        level = entry["level"]
        prefix = "#" * level
        heading_line = f"{prefix} {entry['num']}. {entry['title']}"
        insert_at = insertions[toc_idx]
        if insert_at in lines_to_delete:
            # 替换而不是插入，避免重复
            result_lines[insert_at] = heading_line
            lines_to_delete.discard(insert_at)
        else:
            result_lines.insert(insert_at, heading_line)

    return "\n".join(result_lines)


def _find_title_line(lines: list[str], title: str, after: int) -> int | None:
    title_clean = re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', title).lower()).strip()

    # 策略 A: 优先匹配"标题行"——内容与标题高度相似的短行
    # 形如 "2.1. Group Relative Policy Optimization"（带编号前缀或纯标题）
    for i in range(after, len(lines)):
        line = lines[i].strip()
        if not line:
            continue
        line_clean = re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', line).lower()).strip()
        # 去掉行首数字前缀后比较
        line_words = line_clean.split()
        while line_words and re.match(r'^\d+$', line_words[0]):
            line_words = line_words[1:]
        line_no_num = ' '.join(line_words)
        if line_no_num == title_clean:
            return i

    # 策略 B: 精确子串匹配（标题文字出现在行中）
    for i in range(after, len(lines)):
        if title in lines[i]:
            return i

    # 策略 C: 去标点后匹配
    for i in range(after, len(lines)):
        line_clean = re.sub(r'\s+', ' ', re.sub(r'[^\w\s]', ' ', lines[i]).lower()).strip()
        if title_clean in line_clean:
            return i

    # 策略 D: 只匹配前 4 个词
    words = title.split()[:4]
    if len(words) >= 2:
        prefix_pattern = r'\s+'.join(re.escape(w) for w in words)
        for i in range(after, len(lines)):
            if re.search(prefix_pattern, lines[i], re.IGNORECASE):
                return i

    return None


def _append_audit(audit_path: Path, entry: dict) -> None:
    with audit_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------------------
# 翻译 sidecar
# ---------------------------------------------------------------------------

TRANSLATE_API = "http://localhost:3000/api/translate"


def translate_text(text: str) -> str:
    """调用 mdv 本地翻译服务，返回译文。"""
    payload = json.dumps({"text": text}).encode()
    req = urllib.request.Request(
        TRANSLATE_API,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
        return data["translatedText"]


def extract_paragraphs(md_text: str) -> list[tuple[str, str]]:
    """
    从带标题的 MD 文本提取段落，返回 [(para_id, text), ...]。
    段落 ID 格式：{section_num}-p{index}，如 3.1.1-p0
    """
    lines = md_text.splitlines()
    section_path = "0"
    para_counts: dict[str, int] = {}
    paragraphs: list[tuple[str, str]] = []
    current_para: list[str] = []

    def flush():
        if not current_para:
            return
        text = "\n".join(current_para).strip()
        current_para.clear()
        if not text or len(text) < 20:
            return
        if text.startswith("> **[Figure") or text.startswith("> **[Table"):
            return
        if text.startswith("$$"):
            return
        idx = para_counts.get(section_path, 0)
        para_counts[section_path] = idx + 1
        paragraphs.append((f"{section_path}-p{idx}", text))

    for line in lines:
        m = re.match(r'^#{1,3}\s+(\d+(?:\.\d+)*)\.?\s+', line)
        if m:
            flush()
            section_path = m.group(1)
            continue
        if not line.strip():
            flush()
            continue
        current_para.append(line)

    flush()
    return paragraphs


def generate_translation_sidecar(
    main_md: str, out_path: Path, checkpoint_every: int = 5
) -> None:
    """生成翻译 sidecar JSON 文件，增量保存。"""
    paragraphs = extract_paragraphs(main_md)
    print(f"  共提取 {len(paragraphs)} 个段落")

    existing: dict[str, str] = {}
    if out_path.exists():
        existing = json.loads(out_path.read_text(encoding="utf-8"))
        print(f"  已有翻译 {len(existing)} 条，跳过已翻译段落")

    new_count = 0
    for i, (para_id, text) in enumerate(paragraphs):
        if para_id in existing:
            continue
        text_to_translate = text[:500] + "..." if len(text) > 500 else text
        try:
            result = translate_text(text_to_translate)
            existing[para_id] = result
            new_count += 1
            print(f"  [{i+1}/{len(paragraphs)}] {para_id}: {text[:40]!r} → {result[:30]!r}")
            if new_count % checkpoint_every == 0:
                out_path.write_text(
                    json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8"
                )
        except Exception as e:
            print(f"  [{i+1}/{len(paragraphs)}] {para_id} 翻译失败: {e}")
        time.sleep(0.05)

    out_path.write_text(
        json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"  完成！新增 {new_count} 条，总计 {len(existing)} 条")


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def run(pdf_path: Path, model: str, force: bool) -> None:
    # model 参数保留给未来的 LLM 标题插入 fallback（见 TODO），当前未使用
    out_dir = pdf_path.parent / pdf_path.stem
    out_dir.mkdir(exist_ok=True)
    audit_path = out_dir / "audit.jsonl"

    # 跳过已有输出（除非 --force）
    main_md_path = out_dir / "main.md"
    if main_md_path.exists() and not force:
        print(f"已有输出目录 {out_dir.name}/，跳过转换（使用 --force 强制重新生成）")
        print(f"完成！输出目录: {out_dir}/")
        return

    # Step 1: markitdown → raw.md
    print(f"[1/4] markitdown 转换: {pdf_path.name}")
    from markitdown import MarkItDown
    raw_text = MarkItDown().convert(str(pdf_path)).text_content
    (out_dir / "raw.md").write_text(raw_text, encoding="utf-8")
    print(f"      raw.md: {len(raw_text.splitlines())} 行")

    # Step 2: 拆分论文 + 清洗 CID 乱码
    print("[2/4] 拆分论文各部分")
    parts = split_paper(raw_text)
    meta = parse_meta(parts["meta_lines"])
    (out_dir / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    if parts["appendix"]:
        (out_dir / "appendix.md").write_text(parts["appendix"], encoding="utf-8")
    print(f"      abstract: {len(parts['abstract'])} chars, "
          f"body: {len(parts['body'].splitlines())} 行, "
          f"references: {len(parts['references'])} chars")

    # Step 3: 提取 TOC
    print("[3/4] 提取 TOC")
    toc = extract_toc(pdf_path)
    (out_dir / "toc.json").write_text(
        json.dumps(toc, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"      {len(toc)} 个章节")

    # Step 4: 插入标题，清洗公式噪音，组合 main.md
    print("[4/4] 插入章节标题，生成 main.md")
    body_with_headings = insert_headings(parts["body"], toc, audit_path)
    body_clean = clean_cid_noise(body_with_headings)

    sections = []
    if parts["abstract"]:
        sections.append(f"## Abstract\n\n{clean_cid_noise(parts['abstract'])}")
    sections.append(body_clean)
    if parts["references"]:
        sections.append(f"## References\n\n{parts['references']}")
    main_md = "\n\n---\n\n".join(sections)
    main_md_path.write_text(main_md, encoding="utf-8")
    print(f"      main.md: {len(main_md.splitlines())} 行")

    # manifest
    (out_dir / "manifest.json").write_text(
        json.dumps({
            "version": 1,
            "pdf": pdf_path.name,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }, indent=2),
        encoding="utf-8",
    )

    print(f"\n完成！输出目录: {out_dir}/")


def main() -> None:
    from dotenv import load_dotenv
    load_dotenv()

    parser = argparse.ArgumentParser(description="PDF → 结构化 Markdown")
    parser.add_argument("pdf", type=Path, help="输入 PDF 文件")
    parser.add_argument("--force", action="store_true",
                        help="强制重新生成（默认跳过已有输出目录）")
    parser.add_argument("--model", default="claude-haiku-4-5",
                        help="LLM 模型（默认 claude-haiku-4-5，保留给未来 LLM fallback）")
    args = parser.parse_args()

    if not args.pdf.exists():
        print(f"错误：文件不存在: {args.pdf}", file=sys.stderr)
        sys.exit(1)

    run(args.pdf, args.model, args.force)


if __name__ == "__main__":
    main()
