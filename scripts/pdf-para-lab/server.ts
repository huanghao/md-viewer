#!/usr/bin/env bun
/**
 * PDF 段落质量分析工具 — 独立服务
 *
 *   bun run scripts/pdf-para-lab/server.ts
 *   打开 http://localhost:4322
 *
 * 环境变量：
 *   PDF_DIR  指定 PDF 目录（默认 /Users/huanghao/workspace/walle/bots-tmp/0408-llm-wiki/raw/inbox）
 *   PORT     端口（默认 4322）
 */

import { readFileSync } from "fs";
import { readdir } from "fs/promises";
import { resolve } from "path";

const PORT = Number(process.env.PORT) || 4322;
const PDF_DIR = process.env.PDF_DIR || "/Users/huanghao/workspace/walle/bots-tmp/0408-llm-wiki/raw/inbox";
const HTML_PATH = resolve(import.meta.dir, "index.html");

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      const html = readFileSync(HTML_PATH, "utf-8");
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    // PDF 文件列表
    if (url.pathname === "/pdfs") {
      try {
        const files = await readdir(PDF_DIR);
        const pdfs = files
          .filter(f => f.toLowerCase().endsWith(".pdf"))
          .map(f => ({ name: f, path: `${PDF_DIR}/${f}` }));
        return new Response(JSON.stringify(pdfs), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
          headers: { "Content-Type": "application/json" },
          status: 500,
        });
      }
    }

    // 提供 PDF 文件（仅限本地路径）
    if (url.pathname === "/pdf") {
      const filePath = url.searchParams.get("path");
      if (!filePath) return new Response("path required", { status: 400 });
      if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return new Response("remote PDFs not supported", { status: 400 });
      }
      try {
        const file = Bun.file(resolve(filePath));
        return new Response(file, { headers: { "Content-Type": "application/pdf" } });
      } catch (e) {
        return new Response(String(e), { status: 500 });
      }
    }

    return new Response("not found", { status: 404 });
  },
});

console.log(`PDF 段落分析工具已启动`);
console.log(`  http://localhost:${PORT}`);
console.log(`  PDF 目录: ${PDF_DIR}`);
