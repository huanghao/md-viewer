import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import pytest
import tempfile
from pdf2md import insert_headings

BODY = """\
Foundation models are general models of language.

The development of modern foundation models consists of two main stages.

Pre-Training Data

We curate data from the web using a multi-stage pipeline.

Web Data Curation

We process web data using the following steps.

Determining the Data Mix

We use a data mix that balances quality and diversity.
"""

TOC = [
    {"num": "1", "title": "Introduction", "level": 1, "pageNum": 1},
    {"num": "3", "title": "Pre-Training", "level": 1, "pageNum": 4},
    {"num": "3.1", "title": "Pre-Training Data", "level": 2, "pageNum": 4},
    {"num": "3.1.1", "title": "Web Data Curation", "level": 3, "pageNum": 4},
    {"num": "3.1.2", "title": "Determining the Data Mix", "level": 3, "pageNum": 6},
]


def test_insert_exact_match():
    with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as f:
        audit_path = Path(f.name)
    result = insert_headings(BODY, TOC, audit_path)
    assert "## 3.1. Pre-Training Data" in result
    assert "### 3.1.1. Web Data Curation" in result
    assert "### 3.1.2. Determining the Data Mix" in result


def test_insert_heading_before_text():
    with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as f:
        audit_path = Path(f.name)
    result = insert_headings(BODY, TOC, audit_path)
    lines = result.splitlines()
    heading_idx = next(i for i, l in enumerate(lines) if "## 3.1. Pre-Training Data" in l)
    text_idx = next(i for i, l in enumerate(lines) if "We curate data from the web" in l)
    assert heading_idx < text_idx


def test_insert_not_found_recorded_in_audit():
    with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as f:
        audit_path = Path(f.name)
    toc_with_missing = TOC + [
        {"num": "99", "title": "Nonexistent Section XYZ", "level": 1, "pageNum": 99}
    ]
    insert_headings(BODY, toc_with_missing, audit_path)
    entries = [json.loads(l) for l in audit_path.read_text().splitlines() if l.strip()]
    not_found = [e for e in entries if e.get("strategy") == "not_found"]
    assert any("Nonexistent Section XYZ" in e.get("section", "") for e in not_found)


def test_insert_fuzzy_match():
    body = "Pre-Training: Data Preparation\n\nSome content here.\n"
    toc = [{"num": "3.1", "title": "Pre-Training Data Preparation", "level": 2, "pageNum": 4}]
    with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as f:
        audit_path = Path(f.name)
    result = insert_headings(body, toc, audit_path)
    assert "## 3.1. Pre-Training Data Preparation" in result


def test_insert_preserves_body_content():
    with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as f:
        audit_path = Path(f.name)
    result = insert_headings(BODY, TOC, audit_path)
    assert "Foundation models are general models" in result
    assert "We process web data using the following steps." in result
