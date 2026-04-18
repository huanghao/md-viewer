#!/usr/bin/env bun
/**
 * PDF 选中功能交互测试工具
 *
 * 独立运行，不依赖主项目：
 *   bun run scripts/pdf-select-lab/server.ts
 *   然后打开 http://localhost:4321
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const PORT = 4321;
const HTML_PATH = resolve(import.meta.dir, "index.html");

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // 提供 index.html
    if (url.pathname === "/" || url.pathname === "/index.html") {
      try {
        const html = readFileSync(HTML_PATH, "utf-8");
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch {
        return new Response("index.html not found", { status: 404 });
      }
    }

    // 返回可用的 PDF 列表
    if (url.pathname === "/pdfs") {
      const dir = process.env.PDF_DIR ||
        "/Users/huanghao/workspace/walle/bots-tmp/0408-llm-wiki/raw/inbox";
      try {
        const entries = await Bun.file(dir).exists()
          .then(async () => {
            const { readdir } = await import("fs/promises");
            const files = await readdir(dir);
            return files
              .filter(f => f.endsWith(".pdf"))
              .map(f => ({ name: f, path: `${dir}/${f}` }));
          });
        return new Response(JSON.stringify(entries), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 接收选中结果并打印到 stdout
    if (url.pathname === "/report" && req.method === "POST") {
      const data = await req.json();
      console.log("SELECT_RESULT " + JSON.stringify(data));
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/plain",
        },
      });
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
        return new Response(file, {
          headers: { "Content-Type": "application/pdf" },
        });
      } catch (e) {
        return new Response(String(e), { status: 500 });
      }
    }

    return new Response("not found", { status: 404 });
  },
});

console.log(`\n  PDF 选中测试工具已启动`);
console.log(`  http://localhost:${PORT}\n`);
