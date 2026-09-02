#!/usr/bin/env bun
/**
 * MD Viewer Server - Markdown Viewer Server
 * 简单的 HTTP 服务，提供 Markdown 文件浏览功能
 */

import "./otel.ts"; // 必须最先加载，注册 tracer provider 后其它模块的埋点才拿得到 tracer

import { Hono } from "hono";
import { log } from "./utils.ts";
import { broadcastEvent } from "./sse.ts";
import { bootstrapWorkspaceIndexes } from "./handlers/workspace-handlers.ts";
import { pruneScanMetrics } from "./scan-metrics-storage.ts";
import { pruneOrphanedAgentSessions, resetStuckRunningAgentSessions } from "./agent-storage.ts";
import { loadConfig, getServerPort, getServerHost, initConfig } from "./config.ts";
import { otelMiddleware } from "./otel-middleware.ts";
import { registerAgentRoutes } from "./routes/agent.ts";
import { registerAnnotationRoutes } from "./routes/annotations.ts";
import { registerFileRoutes } from "./routes/files.ts";
import { registerFocusRoutes } from "./routes/focus.ts";
import { registerOtelRoutes } from "./routes/otel.ts";
import { registerSessionRoutes } from "./routes/session.ts";
import { registerSnapshotRoutes } from "./routes/snapshots.ts";
import { registerStaticRoutes } from "./routes/static.ts";
import { registerWorkspaceRoutes } from "./routes/workspaces.ts";

// ==================== 初始化配置 ====================

initConfig();
const config = loadConfig();

// ==================== HTTP 服务 ====================

const app = new Hono();

app.use("*", otelMiddleware);

registerStaticRoutes(app);
registerOtelRoutes(app);
registerFileRoutes(app);
registerSessionRoutes(app);
registerWorkspaceRoutes(app);
registerAnnotationRoutes(app);
registerSnapshotRoutes(app);
registerFocusRoutes(app);
registerAgentRoutes(app);

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

  void bootstrapWorkspaceIndexes();
  pruneScanMetrics(30);
  const prunedSessions = pruneOrphanedAgentSessions();
  if (prunedSessions > 0) log(`🧹 清理了 ${prunedSessions} 条指向已删除文档的 Agent session 关联`);
  const stuckRuns = resetStuckRunningAgentSessions();
  if (stuckRuns > 0) log(`🧹 清理了 ${stuckRuns} 条上次进程重启时卡在"运行中"的 Agent 记录`);

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
}
