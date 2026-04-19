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
const HTML_DOM_PATH = resolve(import.meta.dir, "index-dom-select.html");

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // 提供 index.html（Canvas 拉框版）
    if (url.pathname === "/" || url.pathname === "/index.html") {
      try {
        const html = readFileSync(HTML_PATH, "utf-8");
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      } catch {
        return new Response("index.html not found", { status: 404 });
      }
    }

    // 提供 index-dom-select.html（原版 DOM 三路径对比）
    if (url.pathname === "/dom-select") {
      try {
        const html = readFileSync(HTML_DOM_PATH, "utf-8");
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      } catch {
        return new Response("index-dom-select.html not found", { status: 404 });
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

    // 保存样本
    if (url.pathname === "/save-sample" && req.method === "POST") {
      const entry = await req.json();
      const samplesPath = resolve(import.meta.dir, "samples/selection-samples.json");
      let samples: any[] = [];
      try {
        const raw = await Bun.file(samplesPath).text();
        samples = JSON.parse(raw);
      } catch {}
      const id = `s${String(samples.length + 1).padStart(3, "0")}`;
      samples.push({ id, ...entry });
      await Bun.write(samplesPath, JSON.stringify(samples, null, 2));
      console.log(`SAMPLE_SAVED id=${id} wanted="${entry.userWanted}" path3="${entry.path3}"`);
      return new Response("ok", { headers: { "Content-Type": "text/plain" } });
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
console.log(`  http://localhost:${PORT}            ← Canvas 拉框版`);
console.log(`  http://localhost:${PORT}/dom-select  ← 原版 DOM 三路径对比\n`);
