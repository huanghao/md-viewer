#!/usr/bin/env bun
/**
 * MD Viewer Server - Markdown Viewer Server
 * 简单的 HTTP 服务，提供 Markdown 文件浏览功能
 */

import { Hono } from "hono";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { log } from "./utils.ts";
import { generateClientHTML } from "./client/html.ts";
import { broadcastEvent } from "./sse.ts";
import {
  handleGetFile,
  handleGetFileAsset,
  handleGetPdfAsset,
  handleGetFiles,
  handleGetNearby,
  handlePathSuggestions,
  handleDetectPath,
  handleOpenFile,
  handleOpenLocalFile,
  handleEvents,
  handleInferWorkspace,
  handleScanWorkspace,
  handleGetAnnotations,
  handleGetAnnotationSummaries,
  handleUpsertAnnotation,
  handleReplyAnnotation,
  handleDeleteAnnotation,
  handleUpdateAnnotationStatus,
  handleMigrateAnnotations,
  handleClearAllAnnotations,
  handleGetSessionState,
  handleUpdateSessionState,
} from "./handlers.ts";
import { loadConfig, getServerPort, getServerHost, initConfig } from "./config.ts";

// ==================== 嵌入的静态资源 ====================

const FAVICON_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="16" fill="#3b82f6"/>
  <path d="M 9 11 L 9 21 L 11 21 L 11 14.5 L 16 19.5 L 21 14.5 L 21 21 L 23 21 L 23 11 L 16 18.5 Z" fill="white"/>
</svg>`;

// ==================== 初始化配置 ====================

initConfig();
const config = loadConfig();

// ==================== 配置 ====================

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

// ==================== HTTP 服务 ====================

const app = new Hono();

// 前端页面
app.get("/", (c) => {
  // 设置 no-cache 头，确保浏览器不缓存 HTML
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  return c.html(generateClientHTML());
});

// 嵌入的静态资源
app.get("/favicon.svg", (c) => {
  c.header('Content-Type', 'image/svg+xml');
  c.header('Cache-Control', 'public, max-age=31536000'); // 缓存 1 年
  return c.body(FAVICON_SVG);
});

// API: 获取文件内容
app.get("/api/file", handleGetFile);
app.get("/api/file-asset", handleGetFileAsset);
app.get("/api/pdf-asset", handleGetPdfAsset);

// API: 获取目录下的 Markdown 文件列表
app.get("/api/files", handleGetFiles);

// API: 获取附近的文件
app.get("/api/nearby", handleGetNearby);
app.get("/api/path-suggestions", handlePathSuggestions);
app.post("/api/detect-path", handleDetectPath);


// API: CLI 调用 - 打开文件
app.post("/api/open-file", handleOpenFile);
app.post("/api/open-local-file", handleOpenLocalFile);

// API: SSE 事件流
app.get("/api/events", handleEvents);

// API: 工作区相关
app.post("/api/infer-workspace", handleInferWorkspace);
app.post("/api/scan-workspace", handleScanWorkspace);

// API: 评论相关（SQLite 持久化）
app.get("/api/annotations/summaries", handleGetAnnotationSummaries);
app.get("/api/annotations", handleGetAnnotations);
app.post("/api/annotations/item", handleUpsertAnnotation);
app.post("/api/annotations/reply", handleReplyAnnotation);
app.post("/api/annotations/delete", handleDeleteAnnotation);
app.post("/api/annotations/status", handleUpdateAnnotationStatus);
app.post("/api/annotations/migrate", handleMigrateAnnotations);
app.post("/api/annotations/clear", handleClearAllAnnotations);

// API: 会话状态（标签页）
app.get("/api/session-state", handleGetSessionState);
app.post("/api/session-state", handleUpdateSessionState);

// API: 翻译代理 → 本地 Python opus-mt 服务
const TRANSLATE_SERVICE_URL = "http://127.0.0.1:17823";

app.post("/api/translate", async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!text || typeof text !== "string") {
    return c.json({ error: "missing text" }, 400);
  }
  let res: Response;
  try {
    res = await fetch(`${TRANSLATE_SERVICE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return c.json({ error: "翻译服务未启动，请运行 src/translate_server.py" }, 503);
  }
  const data = await res.json() as any;
  if (!res.ok) return c.json({ error: data.error || "translate failed" }, 502);
  return c.json({ translatedText: data.translatedText });
});

// ==================== 翻译子进程 ====================

import path from "path";

let translateProc: ReturnType<typeof Bun.spawn> | null = null;
export let translateServiceUp = false;

function setTranslateServiceUp(up: boolean) {
  translateServiceUp = up;
  broadcastEvent({ type: 'translate-status', up });
}

async function startTranslateService(): Promise<void> {
  const scriptPath = path.join(import.meta.dir, "translate_server.py");
  // 找 conda env 里的 python，fallback 到系统 python3
  const condaEnvPython = path.join(
    process.env.HOME || "",
    "miniconda3/envs/3.12/bin/python3"
  );
  const python = await Bun.file(condaEnvPython).exists() ? condaEnvPython : "python3";

  translateProc = Bun.spawn([python, scriptPath], {
    stdout: "pipe",
    stderr: "pipe",
  });

  // 打印模型加载日志
  const stdout = translateProc.stdout;
  if (stdout && typeof (stdout as any).getReader === "function") {
    const reader = (stdout as ReadableStream<Uint8Array>).getReader();
    const dec = new TextDecoder();
    (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        dec.decode(value).split("\n").filter(Boolean).forEach((l) => log(`[translate] ${l}`));
      }
    })().catch(() => {});
  }

  // 轮询等待服务 ready，最多等 60 秒
  (async () => {
    for (let i = 0; i < 60; i++) {
      await Bun.sleep(1000);
      if (!translateProc) break; // 进程已退出
      try {
        const r = await fetch(`${TRANSLATE_SERVICE_URL}/health`, { signal: AbortSignal.timeout(1000) });
        if (r.ok) { setTranslateServiceUp(true); log('[translate] 翻译服务已就绪'); return; }
      } catch { /* 还没好 */ }
    }
    log('[translate] 翻译服务启动超时');
  })();

  // 进程退出时清理
  translateProc.exited.then((code) => {
    if (code !== 0) log(`[translate] 翻译服务异常退出 (code ${code})`);
    translateProc = null;
    setTranslateServiceUp(false);
  });
}

function stopTranslateService(): void {
  if (translateProc) {
    translateProc.kill();
    translateProc = null;
  }
}

// ==================== 启动服务 ====================

const PORT = getServerPort(config);
const HOST = getServerHost(config);

// 检测是否被直接运行（bun run src/server.ts）或被 import
if (import.meta.main) {
  Bun.serve({
    port: PORT,
    hostname: HOST,
    fetch: app.fetch,
    idleTimeout: 255, // SSE 长连接 255 秒超时（Bun 最大值）
  });

  log(`🚀 MD Viewer Server 启动于 http://${HOST}:${PORT}/`);
  log(`📖 使用方法: 在浏览器中打开，然后添加 Markdown/HTML 文件路径`);

  startTranslateService().catch((e) => log(`[translate] 启动失败: ${e}`));

  process.on("exit", stopTranslateService);
  process.on("SIGINT", () => { stopTranslateService(); process.exit(0); });
  process.on("SIGTERM", () => { stopTranslateService(); process.exit(0); });
}
