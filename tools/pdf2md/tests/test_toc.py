import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from unittest.mock import MagicMock, patch
from pdf2md import extract_toc


def _make_dest(title: str, page_number: int):
    """构造 pypdf Destination mock（page_number 从 0 开始）"""
    item = MagicMock()
    item.title = title
    page_obj = MagicMock()
    page_obj.page_number = page_number
    item.page = page_obj
    # 让 isinstance(item, list) 返回 False
    item.__class__ = type('Destination', (), {})
    return item


def test_extract_toc_flat():
    outline = [
        _make_dest("Introduction", 0),
        _make_dest("Methods", 4),
        _make_dest("Results", 9),
    ]
    with patch("pdf2md.PdfReader") as mock_reader:
        mock_reader.return_value.outline = outline
        result = extract_toc(Path("fake.pdf"))

    assert len(result) == 3
    assert result[0] == {"num": "1", "title": "Introduction", "level": 1, "pageNum": 1}
    assert result[1] == {"num": "2", "title": "Methods", "level": 1, "pageNum": 5}
    assert result[2] == {"num": "3", "title": "Results", "level": 1, "pageNum": 10}


def test_extract_toc_nested():
    outline = [
        _make_dest("Introduction", 0),
        [
            _make_dest("Background", 1),
            _make_dest("Related Work", 2),
        ],
        _make_dest("Methods", 4),
    ]
    with patch("pdf2md.PdfReader") as mock_reader:
        mock_reader.return_value.outline = outline
        result = extract_toc(Path("fake.pdf"))

    nums = [e["num"] for e in result]
    assert "1" in nums
    assert "1.1" in nums
    assert "1.2" in nums
    assert "2" in nums


def test_extract_toc_empty_outline():
    with patch("pdf2md.PdfReader") as mock_reader:
        mock_reader.return_value.outline = []
        result = extract_toc(Path("fake.pdf"))
    assert result == []


def test_extract_toc_levels():
    outline = [
        _make_dest("Chapter", 0),
        [
            _make_dest("Section", 1),
            [
                _make_dest("Subsection", 2),
            ],
        ],
    ]
    with patch("pdf2md.PdfReader") as mock_reader:
        mock_reader.return_value.outline = outline
        result = extract_toc(Path("fake.pdf"))

    levels = {e["title"]: e["level"] for e in result}
    assert levels["Chapter"] == 1
    assert levels["Section"] == 2
    assert levels["Subsection"] == 3
