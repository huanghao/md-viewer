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
  handleWriteFile,
  handleGetClientConfig,
  handleListTodos,
  handleCreateTodo,
  handleUpdateTodo,
  handleDeleteTodo,
  handleTidyTodos,
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

// API: 写入 sidecar 文件
app.post("/api/file-write", handleWriteFile);

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

// API: Todos
app.get('/api/todos', handleListTodos);
app.post('/api/todos', handleCreateTodo);
app.post('/api/todos/update', handleUpdateTodo);
app.post('/api/todos/delete', handleDeleteTodo);
app.post('/api/todos/tidy', handleTidyTodos);

// API: 会话状态（标签页）
app.get("/api/session-state", handleGetSessionState);
app.post("/api/session-state", handleUpdateSessionState);

// API: 客户端配置
app.get("/api/config", (c) => handleGetClientConfig());

// API: 焦点信号采集（写 SQLite DB，用于 frecency 策略评估）
import { insertFocusSignal, queryFocusSignals, pruneFocusSignals } from "./annotation-storage.ts";
import { existsSync, readFileSync } from "fs";

// One-time migration: import legacy jsonl into DB then delete the file
const LEGACY_SIGNALS_PATH = "logs/focus-signals.jsonl";
if (existsSync(LEGACY_SIGNALS_PATH)) {
  try {
    const lines = readFileSync(LEGACY_SIGNALS_PATH, "utf-8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const { ts, type, file } = JSON.parse(line);
        if (ts && type && file) {
          // Use original timestamp from jsonl, insert directly
          try {
            const db = (await import("./annotation-storage.ts")).getDb();
            db.prepare(`INSERT INTO focus_signals (ts, type, file) VALUES (?, ?, ?)`).run(ts, type, file);
          } catch { /* skip duplicates */ }
        }
      } catch { /* skip malformed lines */ }
    }
    // Remove legacy file after migration
    import("fs").then(({ unlinkSync }) => { try { unlinkSync(LEGACY_SIGNALS_PATH); } catch {} });
  } catch { /* migration best-effort */ }
}

app.post("/api/focus-signal", async (c) => {
  try {
    const { type, file } = await c.req.json<{ type: string; file: string }>();
    if (!type || !file) return c.json({ ok: false }, 400);
    insertFocusSignal(type, file);
    // Prune old signals (keep 7 days) — run occasionally, not every request
    if (Math.random() < 0.01) pruneFocusSignals(7);
  } catch { /* 静默失败，不影响主流程 */ }
  return c.json({ ok: true });
});

// API: 读取焦点信号（最近 N 天）
app.get("/api/focus-signals", (c) => {
  const days = Number(c.req.query("days") ?? "7");
  try {
    return c.json({ signals: queryFocusSignals(days) });
  } catch {
    return c.json({ signals: [] });
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

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
}
