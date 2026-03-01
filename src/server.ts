#!/usr/bin/env bun
/**
 * MD Viewer Server - Markdown Viewer Server
 * 简单的 HTTP 服务，提供 Markdown 文件浏览功能
 */

import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { log } from "./utils.ts";
import { generateClientHTML } from "./client/html.ts";
import {
  handleGetFile,
  handleGetFiles,
  handleGetNearby,
  handlePathSuggestions,
  handleDetectPath,
  handleOpenFile,
  handleOpenLocalFile,
  handleEvents,
  handleGetRecentParents,
  handleGetSyncParentMeta,
  handleSyncExecute,
  handleGetSyncStatus,
  handleCleanupSync,
  handleGetSyncStats,
  handleGetSyncPreferences,
  handleSetSyncPreferences,
  handleInferWorkspace,
  handleScanWorkspace,
} from "./handlers.ts";
import { loadConfig, getServerPort, getServerHost, initConfig } from "./config.ts";

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

// 静态文件服务（favicon 等）
app.get("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));

// API: 获取文件内容
app.get("/api/file", handleGetFile);

// API: 获取目录下的 Markdown 文件列表
app.get("/api/files", handleGetFiles);

// API: 获取附近的文件
app.get("/api/nearby", handleGetNearby);
app.get("/api/path-suggestions", handlePathSuggestions);
app.post("/api/detect-path", handleDetectPath);

// API: 同步相关
app.get("/api/sync/recent-parents", handleGetRecentParents);
app.get("/api/sync/parent-meta", handleGetSyncParentMeta);
app.post("/api/sync/execute", handleSyncExecute);
app.get("/api/sync/status", handleGetSyncStatus);
app.post("/api/sync/cleanup", handleCleanupSync);
app.get("/api/sync/stats", handleGetSyncStats);
app.get("/api/sync/preferences", handleGetSyncPreferences);
app.post("/api/sync/preferences", handleSetSyncPreferences);

// API: CLI 调用 - 打开文件
app.post("/api/open-file", handleOpenFile);
app.post("/api/open-local-file", handleOpenLocalFile);

// API: SSE 事件流
app.get("/api/events", handleEvents);

// API: 工作区相关
app.post("/api/infer-workspace", handleInferWorkspace);
app.post("/api/scan-workspace", handleScanWorkspace);

// ==================== 启动服务 ====================

const PORT = getServerPort(config);
const HOST = getServerHost(config);

export default {
  port: PORT,
  hostname: HOST,
  fetch: app.fetch,
  idleTimeout: 255, // SSE 长连接 255 秒超时（Bun 最大值）
};

log(`🚀 MD Viewer Server 启动于 http://${HOST}:${PORT}/`);
log(`📖 使用方法: 在浏览器中打开，然后添加 Markdown/HTML 文件路径`);
