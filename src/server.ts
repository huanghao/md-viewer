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
import {
  handleGetFile,
  handleGetFileAsset,
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

// API: 健康检查（供 macOS App 检测 Server 是否就绪）
app.get("/api/health", (c) => c.json({ status: "ok" }));

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
}
