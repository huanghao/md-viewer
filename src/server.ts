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

// ==================== 翻译（内嵌 ONNX）====================

import path from "path";
import { initTranslator, translate, translatorReady } from "./translation/index.ts";

function resolveModelDir(): string {
  if (process.env.MODELS_DIR) return path.join(process.env.MODELS_DIR, "opus-mt-en-zh");
  const base = Bun.main.endsWith(".ts")
    ? path.join(import.meta.dir, "..")
    : path.dirname(process.execPath);
  return path.join(base, "models", "opus-mt-en-zh");
}

app.post("/api/translate", async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!text || typeof text !== "string") {
    return c.json({ error: "missing text" }, 400);
  }
  if (translatorReady === false) {
    return c.json({ error: "翻译模型加载失败，请检查 models/ 目录" }, 503);
  }
  if (translatorReady === null) {
    return c.json({ error: "翻译模型正在加载，请稍后重试" }, 503);
  }
  try {
    const translatedText = await translate(text);
    return c.json({ translatedText });
  } catch (e: any) {
    return c.json({ error: e.message ?? "translate failed" }, 500);
  }
});

// ==================== 启动服务 ====================

const PORT = getServerPort(config);
const HOST = getServerHost(config);

if (import.meta.main) {
  Bun.serve({
    port: PORT,
    hostname: HOST,
    fetch: app.fetch,
    idleTimeout: 255,
  });

  log(`🚀 MD Viewer Server 启动于 http://${HOST}:${PORT}/`);
  log(`📖 使用方法: 在浏览器中打开，然后添加 Markdown/HTML 文件路径`);

  const modelDir = resolveModelDir();
  initTranslator(modelDir)
    .then(() => broadcastEvent({ type: "translate-status", up: true }))
    .catch(() => broadcastEvent({ type: "translate-status", up: false }));

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
}
