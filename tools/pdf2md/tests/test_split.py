import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from pdf2md import split_paper, parse_meta

SAMPLE_RAW = """\
4
2
0
2

v
o
N
2
3

The Llama 3 Herd of Models
Llama Team, AI @ Meta

Date: July 23, 2024
Website: https://llama.meta.com/

arXiv:2407.21783

Abstract

Modern artificial intelligence systems are powered by foundation models.
This paper presents a new set of foundation models, called Llama 3.

1 Introduction

Foundation models are general models of language, vision, speech.

The development of modern foundation models consists of two main stages.

2 General Overview

This section provides an overview of the Llama 3 development.

References

Amro Abbas et al. Semdedup. arXiv:2303.09540, 2023.

Contributors

Alice, Bob, Charlie contributed to this work.

Acknowledgements

We thank the team for their support.
"""


def test_split_body_contains_introduction():
    result = split_paper(SAMPLE_RAW)
    assert "Foundation models are general models" in result["body"]


def test_split_body_excludes_references():
    result = split_paper(SAMPLE_RAW)
    assert "Amro Abbas" not in result["body"]


def test_split_references_present():
    result = split_paper(SAMPLE_RAW)
    assert "Amro Abbas" in result["references"]


def test_split_abstract_present():
    result = split_paper(SAMPLE_RAW)
    assert "Modern artificial intelligence" in result["abstract"]


def test_split_abstract_excludes_body():
    result = split_paper(SAMPLE_RAW)
    assert "Foundation models are general models" not in result["abstract"]


def test_split_appendix_contains_contributors():
    result = split_paper(SAMPLE_RAW)
    assert "Alice, Bob, Charlie" in result["appendix"]


def test_split_appendix_contains_acknowledgements():
    result = split_paper(SAMPLE_RAW)
    assert "We thank the team" in result["appendix"]


def test_split_meta_lines_before_abstract():
    result = split_paper(SAMPLE_RAW)
    meta_text = "\n".join(result["meta_lines"])
    assert "The Llama 3 Herd of Models" in meta_text
    assert "Modern artificial intelligence" not in meta_text


def test_parse_meta_title():
    result = split_paper(SAMPLE_RAW)
    meta = parse_meta(result["meta_lines"])
    assert meta["title"] == "The Llama 3 Herd of Models"


def test_parse_meta_date():
    result = split_paper(SAMPLE_RAW)
    meta = parse_meta(result["meta_lines"])
    assert meta["date"] == "2024-07-23"


def test_parse_meta_arxiv_id():
    result = split_paper(SAMPLE_RAW)
    meta = parse_meta(result["meta_lines"])
    assert meta["arxiv_id"] == "2407.21783"


def test_parse_meta_url():
    result = split_paper(SAMPLE_RAW)
    meta = parse_meta(result["meta_lines"])
    assert meta["url"] == "https://arxiv.org/abs/2407.21783"


def test_split_no_abstract():
    raw = "1 Introduction\n\nSome text here.\n\n2 Methods\n\nMore text.\n"
    result = split_paper(raw)
    assert result["abstract"] == ""
    assert "Some text here." in result["body"]


def test_split_no_references():
    raw = "Abstract\n\nSome abstract.\n\n1 Introduction\n\nSome text.\n"
    result = split_paper(raw)
    assert result["references"] == ""


def test_split_toc_region_excluded_from_abstract():
    raw = """\
Abstract

Some abstract text here.

1 Introduction
2 Methods
3 Results
4 Conclusion

1 Introduction

Actual introduction text here.

References

Some ref.
"""
    result = split_paper(raw)
    assert result["abstract"].strip() == "Some abstract text here."
    assert "Actual introduction text here." in result["body"]


def test_parse_meta_authors():
    result = split_paper(SAMPLE_RAW)
    meta = parse_meta(result["meta_lines"])
    assert meta["authors"] == ["Llama Team, AI @ Meta"]


def test_split_appendix_after_references():
    """appendix 在 references 之后时，references 正常提取"""
    raw = """\
Abstract

Some abstract.

1 Introduction

Body text here.

References

Ref 1. Some paper.

Contributors

Alice, Bob.
"""
    result = split_paper(raw)
    assert "Ref 1." in result["references"]
    assert "Alice, Bob." in result["appendix"]


def test_split_appendix_before_references():
    """appendix 在 references 之前（如 Contributors 在正文里）时，references 仍正常提取"""
    raw = """\
Abstract

Some abstract.

1 Introduction

Body text here.

Contributors

Alice, Bob contributed.

References

Ref 1. Some paper.
"""
    result = split_paper(raw)
    assert "Ref 1." in result["references"]
    # appendix 在 references 之前时不单独提取（归入 body）
    assert result["appendix"] == ""


# ---------------------------------------------------------------------------
# clean_cid_noise tests
# ---------------------------------------------------------------------------

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from pdf2md import clean_cid_noise


def test_cid_formula_replaced():
    text = "Normal paragraph.\n\n(cid:18) x (cid:19) = (cid:20) y\n\nAnother paragraph."
    result = clean_cid_noise(text)
    assert "> **[Formula]**" in result
    assert "Normal paragraph." in result
    assert "Another paragraph." in result


def test_cid_normal_text_preserved():
    text = "This text has no CID references at all.\n\nAnother clean paragraph."
    result = clean_cid_noise(text)
    assert result == text


def test_cid_single_occurrence_replaced():
    """单个 CID 引用也触发替换（公式段落）"""
    text = "Almost normal text with one (cid:18) reference here in a longer sentence."
    result = clean_cid_noise(text)
    assert "> **[Formula]**" in result
