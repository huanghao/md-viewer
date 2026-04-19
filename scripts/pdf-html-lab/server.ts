#!/usr/bin/env bun
/**
 * PDF → HTML 重建实验服务
 *   bun run scripts/pdf-html-lab/server.ts
 *   http://localhost:4323
 */

import { readFileSync } from "fs";
import { readdir } from "fs/promises";
import { resolve } from "path";

const PORT = 4323;
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
        return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/pdf") {
      const filePath = url.searchParams.get("path");
      if (!filePath) return new Response("path required", { status: 400 });
      try {
        return new Response(Bun.file(resolve(filePath)), { headers: { "Content-Type": "application/pdf" } });
      } catch (e) {
        return new Response(String(e), { status: 500 });
      }
    }

    return new Response("not found", { status: 404 });
  },
});

console.log(`PDF HTML 重建实验`);
console.log(`  http://localhost:${PORT}`);
console.log(`  PDF 目录: ${PDF_DIR}`);
