#!/usr/bin/env python3
"""
PDF 翻译脚本 — 调用 LongCat-Flash-Chat-Eco 生成双语 PDF

依赖：
    pip install pdf2zh

用法：
    python3 translate.py <pdf路径> [--pages 1-3] [--output <目录>]

环境变量（已在 ~/.zshrc 配置）：
    OPENAI_API_KEY   = Friday appId（即 key）
    OPENAI_BASE_URL  = https://aigc.sankuai.com/v1/openai/native

模型选择（经测试，appId=21902982684125909014 下可用）：
    LongCat-Flash-Chat-Eco  — 美团自研，~1s/段，翻译质量好（推荐）
    deepseek-v3-friday      — 备选，速度相近
    LongCat-Flash-Omni-2603 — 多模态版，需要 array content 格式，不适合此场景

注意：
    - LongCat 文字模型用标准 OpenAI 格式（string content）
    - LongCat Omni 多模态模型用 array content + output_modalities，格式不同
    - pdf2zh 会触发限速重试（RateLimit），属正常现象，最终会完成
    - 50 页论文约需 20-30 分钟，token 消耗约 15 万，成本可忽略不计

输出：
    <output>/<name>-dual.pdf   双语 PDF（原文 + 译文交替）
    <output>/<name>-mono.pdf   纯中文 PDF
"""

import argparse
import os
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description="PDF 翻译（LongCat）")
    parser.add_argument("pdf", help="PDF 文件路径")
    parser.add_argument("--pages", "-p", help="页码范围，如 1-3", default=None)
    parser.add_argument("--output", "-o", help="输出目录", default="/tmp/pdf-translate-out")
    parser.add_argument("--model", "-m", help="模型名", default="LongCat-Flash-Chat-Eco")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL", "https://aigc.sankuai.com/v1/openai/native")

    if not api_key:
        print("错误：未设置 OPENAI_API_KEY，请先 source ~/.zshrc", file=sys.stderr)
        sys.exit(1)

    os.makedirs(args.output, exist_ok=True)

    cmd = [
        "pdf2zh", args.pdf,
        "-s", "openai",
        "--output", args.output,
    ]
    if args.pages:
        cmd += ["-p", args.pages]

    env = os.environ.copy()
    env["OPENAI_API_KEY"] = api_key
    env["OPENAI_BASE_URL"] = base_url
    env["OPENAI_MODEL"] = args.model

    print(f"模型: {args.model}")
    print(f"输出: {args.output}")
    if args.pages:
        print(f"页码: {args.pages}")
    print()

    result = subprocess.run(cmd, env=env)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
