#!/usr/bin/env bun
/**
 * MD Viewer CLI - 统一命令行工具
 * 文件操作、服务管理、配置管理、运维统计
 */

import { resolve, join, dirname } from "path";
import { existsSync, readFileSync, writeFileSync, unlinkSync, statSync, openSync } from "fs";
import { spawn } from "child_process";
import { loadConfig, getConfigDir, getConfigPath, initConfig } from "./config.ts";
import { appendAnnotationReply, getAnnotationsByDocument, listAnnotatedDocuments, tidyAnnotations, tidyMissingFiles } from "./annotation-storage.ts";
import { findGitRoot, filterCommentDocsByWorkspace } from "./comments-filter.ts";

// ==================== 配置 ====================

const config = loadConfig();
const DEFAULT_HOST = config.server.host;

function getPidFilePath(): string {
  return join(getConfigDir(), "server.pid");
}

function getLogFilePath(): string {
  return join(getConfigDir(), "server.log");
}

// ==================== 服务管理 ====================

interface ServerStatus {
  running: boolean;
  pid?: number;
  port?: number;
  host?: string;
  startTime?: number;
  memoryUsage?: number;
}

function getServerStatus(): ServerStatus {
  const pidFile = getPidFilePath();

  if (!existsSync(pidFile)) {
    return { running: false };
  }

  try {
    const pidStr = readFileSync(pidFile, "utf-8").trim();
    const pid = parseInt(pidStr, 10);

    if (isNaN(pid)) {
      return { running: false };
    }

    // 检查进程是否存在
    try {
      process.kill(pid, 0); // 发送信号 0 只检查进程存在性

      // 读取进程信息（仅 macOS/Linux）
      let startTime: number | undefined;
      let memoryUsage: number | undefined;

      try {
        // macOS: ps -p PID -o lstart=,rss=
        const { execSync } = require("child_process");
        const psOutput = execSync(`ps -p ${pid} -o lstart=,rss=`, { encoding: "utf-8" });
        const parts = psOutput.trim().split(/\s+/);
        if (parts.length >= 6) {
          // 解析启动时间（简化处理）
          const rssKB = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(rssKB)) {
            memoryUsage = rssKB * 1024; // 转换为字节
          }
        }
      } catch {
        // 忽略错误
      }

      return {
        running: true,
        pid,
        port: config.server.port,
        host: config.server.host,
        startTime,
        memoryUsage,
      };
    } catch {
      // 进程不存在，清理 PID 文件
      unlinkSync(pidFile);
      return { running: false };
    }
  } catch {
    return { running: false };
  }
}

/**
 * 检测端口上是否运行着 md-viewer server（通过 /api/files 端点识别）
 */
async function isServerHttpReachable(host: string, port: number): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 800);
  try {
    const res = await fetch(`http://${host}:${port}/api/files`, {
      method: "GET",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 检测端口是否被其他进程占用（能连上但不是 md-viewer）
 */
async function isPortInUseByOther(host: string, port: number): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 800);
  try {
    await fetch(`http://${host}:${port}/`, {
      method: "GET",
      signal: controller.signal,
    });
    // 能连上说明端口有人在用，但 isServerHttpReachable 已排除是 md-viewer 的情况
    return true;
  } catch (e: any) {
    // ECONNREFUSED 或超时：端口空闲
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 判断当前是否以源码模式运行（bun run src/cli.ts）
 * 源码模式下 process.execPath 是 bun，编译模式下是可执行文件自身
 */
function isSourceMode(): boolean {
  const execPath = process.execPath;
  return execPath.endsWith("/bun") || execPath.endsWith("/bun-debug");
}

function startServer(daemon: boolean = false): void {
  if (!daemon) {
    // 前台模式：直接启动 server（不返回）
    console.log("🚀 启动 Server (前台模式)...");
    console.log(`   按 Ctrl+C 停止`);
    console.log("");

    // 直接调用 server 启动（会阻塞）
    startServerForeground();
    return;
  }

  // 后台模式：检查是否已运行
  const status = getServerStatus();
  if (status.running) {
    console.log(`⚠️  Server 已在运行中 (PID: ${status.pid})`);
    console.log(`   http://${status.host}:${status.port}/`);
    return;
  }

  console.log("🚀 启动 Server (后台模式)...");

  // 准备日志文件
  const logFile = getLogFilePath();
  const logFd = openSync(logFile, "a");

  let child: ReturnType<typeof spawn>;

  if (isSourceMode()) {
    // 源码模式：用 bun 运行 server.ts
    // import.meta.url 形如 file:///path/to/src/cli.ts，取目录拼 server.ts
    const serverPath = new URL("./server.ts", import.meta.url).pathname;
    child = spawn(process.execPath, ["run", serverPath], {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, NODE_ENV: "production" },
    });
  } else {
    // 编译模式：调用自身的 --internal-server-mode
    child = spawn(process.execPath, ["--internal-server-mode"], {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, NODE_ENV: "production" },
    });
  }

  child.unref();

  // 写入 PID 文件
  if (child.pid) {
    const pidFile = getPidFilePath();
    writeFileSync(pidFile, String(child.pid), "utf-8");
  } else {
    console.error("❌ 无法获取 Server PID");
    process.exit(1);
  }

  // 等待一下确保启动成功
  setTimeout(() => {
    const newStatus = getServerStatus();
    if (newStatus.running) {
      console.log(`✅ Server 已启动 (PID: ${newStatus.pid})`);
      console.log(`   http://${newStatus.host}:${newStatus.port}/`);
      console.log(`   日志: ${logFile}`);
    } else {
      console.error("❌ Server 启动失败，查看日志:");
      console.error(`   tail -f ${logFile}`);
      process.exit(1);
    }
  }, 1000);
}

async function startServerForeground(): Promise<void> {
  // 直接 import server 模块，会阻塞在这里
  await import("./server.ts");
}

function stopServer(): void {
  const status = getServerStatus();
  if (!status.running) {
    console.log("⚠️  Server 未运行");
    return;
  }

  console.log(`🛑 停止 Server (PID: ${status.pid})...`);

  try {
    process.kill(status.pid!, "SIGTERM");

    // 清理 PID 文件
    const pidFile = getPidFilePath();
    if (existsSync(pidFile)) {
      unlinkSync(pidFile);
    }

    console.log("✅ Server 已停止");
  } catch (e: any) {
    console.error(`❌ 停止失败: ${e.message}`);
    process.exit(1);
  }
}

async function restartServer(daemon: boolean = false): Promise<void> {
  console.log("🔄 重启 Server...");
  stopServer();
  await new Promise(resolve => setTimeout(resolve, 500));
  await startServer(daemon);
}

function showServerStatus(): void {
  const status = getServerStatus();

  if (status.running) {
    console.log("✅ Server 运行中");
    console.log(`   PID: ${status.pid}`);
    console.log(`   URL: http://${status.host}:${status.port}/`);
    if (status.memoryUsage) {
      console.log(`   内存: ${(status.memoryUsage / 1024 / 1024).toFixed(1)} MB`);
    }
  } else {
    console.log("⚠️  Server 未运行");
    console.log(`   使用 'mdv server start' 启动`);
  }
}

function showLogs(tail?: number): void {
  const logFile = getLogFilePath();

  if (!existsSync(logFile)) {
    console.log("⚠️  日志文件不存在");
    console.log(`   位置: ${logFile}`);
    return;
  }

  const content = readFileSync(logFile, "utf-8");
  const lines = content.split("\n");

  if (tail && tail > 0) {
    const start = Math.max(0, lines.length - tail);
    console.log(lines.slice(start).join("\n"));
  } else {
    console.log(content);
  }
}

function getAppServerPort(): number {
  // 优先读 app 写入的实际端口文件
  const portFile = join(getConfigDir(), "server.port");
  if (existsSync(portFile)) {
    const val = parseInt(readFileSync(portFile, "utf-8").trim(), 10);
    if (!isNaN(val)) return val;
  }
  return config.server.port;
}

async function ensureServerRunning(): Promise<void> {
  const port = getAppServerPort();
  const host = config.server.host;

  if (await isServerHttpReachable(host, port)) {
    return;
  }

  // 检测端口是否被其他进程占用
  if (await isPortInUseByOther(host, port)) {
    console.error(`❌ 端口 ${port} 已被其他进程占用`);
    console.error(`   请修改配置文件中的端口: mdv config set server.port <新端口>`);
    process.exit(1);
  }

  // Server 未运行，自动在后台启动
  console.error(`⚠️  Server 未运行，正在启动...`);

  const logFile = getLogFilePath();
  const logFd = openSync(logFile, "a");

  let child: ReturnType<typeof spawn>;

  if (isSourceMode()) {
    const serverPath = new URL("./server.ts", import.meta.url).pathname;
    child = spawn(process.execPath, ["run", serverPath], {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, NODE_ENV: "production" },
    });
  } else {
    child = spawn(process.execPath, ["--internal-server-mode"], {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, NODE_ENV: "production" },
    });
  }

  child.unref();

  if (child.pid) {
    const pidFile = getPidFilePath();
    writeFileSync(pidFile, String(child.pid), "utf-8");
  }

  // 等待 server 就绪，最多 5 秒
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isServerHttpReachable(host, port)) {
      return;
    }
  }

  console.error(`❌ Server 启动超时`);
  console.error(`   查看日志: tail -f ${logFile}`);
  process.exit(1);
}

// ==================== 文件操作 ====================

function isUrl(path: string): boolean {
  try {
    const url = new URL(path);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function openFile(filePath: string, focus: boolean = true): Promise<void> {
  await ensureServerRunning();

  const host = config.server.host;
  const port = getAppServerPort();
  const url = `http://${host}:${port}/api/open-file`;

  // 判断是 URL 还是本地文件
  const isRemoteUrl = isUrl(filePath);
  let targetPath: string;

  if (isRemoteUrl) {
    targetPath = filePath;
  } else {
    // 验证本地文件存在
    const absolutePath = resolve(filePath);
    if (!existsSync(absolutePath)) {
      console.error(`❌ 文件不存在: ${filePath}`);
      process.exit(1);
    }
    targetPath = absolutePath;

    // 只允许 md/markdown/txt/html/htm
    const ext = targetPath.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
    if (ext && !["md", "markdown", "txt", "html", "htm"].includes(ext)) {
      console.error(`❌ 不支持的文件类型: .${ext}（CLI 仅支持 md/markdown/txt/html/htm）`);
      process.exit(1);
    }
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: targetPath, focus }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const action = focus ? "已添加并切换" : "已添加";
    console.log(`✅ ${action}: ${result.filename}`);
  } catch (e: any) {
    if (e.cause?.code === "ECONNREFUSED") {
      console.error(`❌ 无法连接到 MDViewer (${host}:${port})`);
      console.error(`   请确保 MDViewer.app 已启动`);
    } else {
      console.error(`❌ 错误: ${e.message}`);
    }
    process.exit(1);
  }
}

// ==================== 配置管理 ====================

function showConfig(): void {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    console.log("⚠️  配置文件不存在");
    console.log(`   位置: ${configPath}`);
    return;
  }

  const content = readFileSync(configPath, "utf-8");
  console.log(`📝 配置文件: ${configPath}`);
  console.log("");
  console.log(content);
}

function getConfigValue(key: string): void {
  const keys = key.split(".");
  let value: any = config;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      console.error(`❌ 配置项不存在: ${key}`);
      process.exit(1);
    }
  }

  console.log(JSON.stringify(value, null, 2));
}

function setConfigValue(key: string, value: string): void {
  const configPath = getConfigPath();
  const currentConfig = existsSync(configPath)
    ? JSON.parse(readFileSync(configPath, "utf-8"))
    : {};

  const keys = key.split(".");
  let target: any = currentConfig;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in target)) {
      target[k] = {};
    }
    target = target[k];
  }

  const lastKey = keys[keys.length - 1];

  // 尝试解析值
  let parsedValue: any = value;
  if (value === "true") parsedValue = true;
  else if (value === "false") parsedValue = false;
  else if (!isNaN(Number(value))) parsedValue = Number(value);

  target[lastKey] = parsedValue;

  writeFileSync(configPath, JSON.stringify(currentConfig, null, 2) + "\n", "utf-8");
  console.log(`✅ 已设置 ${key} = ${JSON.stringify(parsedValue)}`);
  console.log(`   配置文件: ${configPath}`);
}

// ==================== 运维统计 ====================

async function showStats(): Promise<void> {
  console.log("📊 MD Viewer 运维统计");
  console.log("=====================");
  console.log("");

  // 1. 服务器状态
  const port = getAppServerPort();
  const host = config.server.host;
  const reachable = await isServerHttpReachable(host, port);
  console.log("服务器状态:");
  if (reachable) {
    console.log(`  运行中`);
    console.log(`  地址: http://${host}:${port}/`);
  } else {
    console.log(`  未运行`);
  }
  console.log("");

  // 2. 打开的文件数量（需要从 server 获取）
  if (reachable) {
    try {
      const response = await fetch(`http://${host}:${port}/api/files`);
      if (response.ok) {
        const files = await response.json();
        console.log("打开的文件:");
        console.log(`  当前数量: ${files.length}`);
        console.log("");
      }
    } catch {
      // 忽略错误
    }
  }

  // 4. 日志文件大小
  const logFile = getLogFilePath();
  if (existsSync(logFile)) {
    const stat = statSync(logFile);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
    console.log("日志文件:");
    console.log(`  大小: ${sizeMB} MB`);
    console.log(`  位置: ${logFile}`);
  }
}

// ==================== 评论功能 ====================

function formatCompactTime(ts: number): string {
  if (!ts) return "0";
  return new Date(ts).toISOString();
}

function printComments(path: string, json: boolean, limit: number, offset: number): void {
  const result = getAnnotationsByDocument(path, limit, offset, "open");
  if (json) {
    console.log(JSON.stringify({
      ...result,
      totalReturned: result.annotations.length,
    }, null, 2));
    return;
  }
  if (result.annotations.length === 0) {
    console.log("无未解决评论");
    return;
  }
  for (const [index, ann] of result.annotations.entries()) {
    const stableSerial = Number(ann?.serial);
    const displayID = Number.isFinite(stableSerial) && stableSerial > 0
      ? Math.floor(stableSerial)
      : (offset + index + 1);
    console.log(`#${displayID}`);
    const quoted = (ann.quote || "")
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    console.log(quoted || "> ");
    const prefix = typeof (ann as any).quotePrefix === "string"
      ? (ann as any).quotePrefix.replace(/\s+/g, " ").trim()
      : "";
    const suffix = typeof (ann as any).quoteSuffix === "string"
      ? (ann as any).quoteSuffix.replace(/\s+/g, " ").trim()
      : "";
    if (prefix || suffix) {
      const cxt = [prefix, ann.quote?.trim(), suffix].filter(Boolean).join(" … ");
      console.log(`cxt: ${cxt}`);
    }
    const thread = Array.isArray((ann as any).thread) ? (ann as any).thread : [];
    const root = thread.find((item: any) => item?.type === "comment") || thread[0];
    const rootAuthor = String(root?.author || "me");
    console.log(`${rootAuthor}: ${root?.note || ann.note || "（无评论内容）"}`);
    const replies = thread.filter((item: any) => item?.type === "reply");
    for (const reply of replies) {
      const author = String(reply?.author || "me");
      console.log(`- ${author}: ${String(reply?.note || "").trim()}`);
    }
    console.log("");
  }
}

function replyComment(path: string, ref: { id?: string; serial?: number }, text: string, author: string, json: boolean): void {
  if (!ref.id && typeof ref.serial !== "number") {
    console.error("❌ 无效的评论引用，请使用 --seq 或 --id");
    process.exit(1);
  }
  const result = appendAnnotationReply(path, ref, text, author);
  if (!result.ok) {
    console.error(`❌ ${result.error || "回复失败"}`);
    process.exit(1);
  }
  if (json) {
    const replyCount = (result.updated?.thread || []).filter((item) => item.type === "reply").length;
    console.log(JSON.stringify({
      success: true,
      path: resolve(path),
      annotationId: result.updated?.id,
      serial: result.updated?.serial,
      author,
      replyCount,
    }, null, 2));
    return;
  }
  const serial = Number(result.updated?.serial || 0);
  console.log(`已回复 #${serial > 0 ? serial : (ref.id || "unknown")}`);
  console.log(`作者: ${author}`);
  console.log(text.trim());
}

interface ReplyBatchItem {
  id?: string;
  seq?: number;
  text: string;
}

async function loadReplyBatchItems(input: string): Promise<ReplyBatchItem[]> {
  const source = String(input || "").trim();
  if (!source) {
    throw new Error("缺少 --input");
  }
  // 支持内联 JSON（以 [ 或 { 开头），否则当文件路径处理
  const raw = source === "-"
    ? await new Response(Bun.stdin.stream()).text()
    : (source.startsWith("[") || source.startsWith("{"))
      ? source
      : readFileSync(resolve(source), "utf-8");
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("批量输入必须是 JSON");
  }
  // 兼容两种格式：{"replies":[...]} 或直接 [...]
  const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.replies) ? parsed.replies : [];
  if (rows.length === 0) {
    throw new Error("批量输入为空，缺少 replies[]");
  }
  const items: ReplyBatchItem[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const seq = Number(row.seq);
    const text = String(row.text || "").trim();
    if ((!id && (!Number.isFinite(seq) || seq <= 0)) || !text) continue;
    items.push({
      id: id || undefined,
      seq: Number.isFinite(seq) && seq > 0 ? Math.floor(seq) : undefined,
      text,
    });
  }
  if (items.length === 0) {
    throw new Error("批量输入无有效项（每项需要 id/seq + text）");
  }
  return items;
}

async function replyCommentBatch(
  path: string,
  author: string,
  input: string,
  json: boolean
): Promise<void> {
  const items = await loadReplyBatchItems(input);
  const results = items.map((item, index) => {
    const ref = item.seq ? { serial: item.seq } : { id: item.id };
    const result = appendAnnotationReply(path, ref, item.text, author);
    return {
      index: index + 1,
      ref: item.seq ? `#${item.seq}` : (item.id || ""),
      ok: result.ok,
      error: result.error || null,
      serial: result.updated?.serial || null,
      annotationId: result.updated?.id || null,
    };
  });
  const success = results.filter((item) => item.ok).length;
  const failed = results.length - success;
  if (json) {
    console.log(JSON.stringify({
      success: failed === 0,
      path: resolve(path),
      author,
      total: results.length,
      successCount: success,
      failedCount: failed,
      results,
    }, null, 2));
    return;
  }
  console.log(`批量回复完成：成功 ${success}，失败 ${failed}`);
  for (const row of results.filter((item) => !item.ok)) {
    console.log(`- 第${row.index}条 ${row.ref}: ${row.error}`);
  }
}


function printCommentDocs(json: boolean, all: boolean, limit: number, offset: number): void {
  // SQL 已按 latest_updated_at DESC 排序，只过滤有 open 评论的文档
  let docs = listAnnotatedDocuments(1000, 0).filter((d) => d.anchoredCount > 0);

  // 默认按工作区过滤：从 cwd 向上找 git root，只显示该工作区内的文档
  let workspaceRoot: string | null = null;
  if (!all) {
    const { filtered, workspaceRoot: root } = filterCommentDocsByWorkspace(docs, findGitRoot(process.cwd()));
    docs = filtered;
    workspaceRoot = root;
  }
  docs = docs.slice(offset, offset + limit);

  if (json) {
    console.log(JSON.stringify({ totalReturned: docs.length, workspaceRoot, docs }, null, 2));
    return;
  }
  if (workspaceRoot) {
    console.log(`# 有评论的文档（${workspaceRoot}）`);
  } else {
    console.log(`# 有评论的文档`);
  }
  console.log(`共返回 ${docs.length} 条`);
  console.log("");
  for (const item of docs) {
    console.log(`- ${item.path}`);
    console.log(`  - 评论数: ${item.count}`);
    console.log(`  - 可定位: ${item.anchoredCount}`);
    console.log(`  - 失锚: ${item.unanchoredCount}`);
    if (item.resolvedCount > 0) console.log(`  - 已解决: ${item.resolvedCount}`);
    console.log(`  - 更新时间: ${formatCompactTime(item.latestUpdatedAt)}`);
    console.log("");
  }
}

function runTidy(days: number, missing: boolean, json: boolean): void {
  const stale = tidyAnnotations(days);
  const gone = missing ? tidyMissingFiles() : { deleted: 0, documents: 0 };
  const totalDeleted = stale.deleted + gone.deleted;
  const totalDocs = stale.documents + gone.documents;
  if (json) {
    console.log(JSON.stringify({
      deleted: totalDeleted,
      documents: totalDocs,
      stale: { deleted: stale.deleted, documents: stale.documents, olderThanDays: days },
      missingFiles: { deleted: gone.deleted, documents: gone.documents },
    }));
    return;
  }
  if (stale.deleted === 0 && gone.deleted === 0) {
    console.log(`✅ 无需清理`);
    return;
  }
  if (stale.deleted > 0) {
    console.log(`✅ 已清理 ${stale.deleted} 条过期评论（来自 ${stale.documents} 个文档，${days} 天前已解决/失锚）`);
  }
  if (gone.deleted > 0) {
    console.log(`✅ 已清理 ${gone.deleted} 条孤儿评论（来自 ${gone.documents} 个已删除文件）`);
  }
}

function showCommentsStats(): void {
  const docs = listAnnotatedDocuments(1000, 0);

  console.log("📝 评论统计");
  console.log("===========");
  console.log("");
  console.log(`文档数: ${docs.length}`);

  if (docs.length > 0) {
    const totalAnnotations = docs.reduce((sum, doc) => sum + doc.count, 0);
    const totalAnchored = docs.reduce((sum, doc) => sum + doc.anchoredCount, 0);
    const totalUnanchored = docs.reduce((sum, doc) => sum + doc.unanchoredCount, 0);
    const unanchoredRate = totalAnnotations > 0
      ? ((totalUnanchored / totalAnnotations) * 100).toFixed(1)
      : "0.0";

    console.log(`总评论数: ${totalAnnotations}`);
    console.log(`  - 可定位: ${totalAnchored}`);
    console.log(`  - 失锚: ${totalUnanchored} (${unanchoredRate}%)`);
  }
}

// ==================== 数据清理 ====================

function cleanupExpired(): void {
  console.log("🧹 清理过期同步记录...");
  console.log("");

  const cleanedCount = cleanupAllExpiredRecords();
  console.log(`✅ 已清理 ${cleanedCount} 条过期记录（超过 6 个月）`);
}

// ==================== 帮助信息 ====================

// ==================== 标签页管理 ====================

async function showTabs(json: boolean = false): Promise<void> {
  const port = getAppServerPort();
  let data: any = null;

  try {
    const res = await fetch(`http://${DEFAULT_HOST}:${port}/api/session-state`, {
      signal: AbortSignal.timeout(500),
    });
    if (res.ok) {
      data = await res.json();
    }
  } catch {
    // ignore
  }

  if (!data) {
    console.error("❌ 无法连接到 MDViewer App");
    console.error("   请确保 MDViewer.app 已启动");
    process.exit(1);
  }

  try {
    if (json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    console.log("# 标签页状态\n");

    if (data.currentFile) {
      console.log(`当前文档: ${data.currentFile}`);
    } else {
      console.log("当前文档: （无）");
    }

    console.log(`\n打开的标签页 (${data.openFiles.length}):\n`);
    if (data.openFiles.length === 0) {
      console.log("  （无）");
    } else {
      for (const file of data.openFiles) {
        const marker = file.path === data.currentFile ? "▸" : " ";
        console.log(`  ${marker} ${file.name}`);
        console.log(`    ${file.path}`);
      }
    }

    const updateTime = new Date(data.lastUpdate).toLocaleString();
    console.log(`\n更新时间: ${updateTime}`);
  } catch (error: any) {
    console.error("❌ 显示标签页失败");
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
MD Viewer CLI - 命令行工具

用法:
  mdv <FILE>                           打开文件
  mdv tabs [--json]                    查看标签页和当前文档
  mdv config [get|set] [KEY] [VALUE]   配置管理
  mdv comments list                    列出当前工作区有 open 评论的文档
  mdv comments list --all              列出所有工作区的评论文档
  mdv comments get --file <FILE>       查看文档评论
  mdv comments reply --file <FILE> [--seq <N> | --id <ID>] --author <NAME> --text <TEXT>
                                       回复一条评论
  mdv comments reply-batch --file <FILE> --author <NAME> --input <JSON|->
                                       批量回复评论
  mdv comments stats                   评论统计
  mdv comments tidy [--days <N>] [--missing]  清理过期评论；--missing 同时清理已删除文件的评论
  mdv --help                           显示帮助

选项:
  --no-focus                           添加文件但不切换焦点
  --json                               JSON 输出（用于脚本）
  --limit <N>                          结果数量限制（默认 20）
  --offset <N>                         结果偏移（默认 0）
  --seq <N>                            评论序号（用于 reply，推荐）
  --id <ID>                            评论唯一 ID（用于 reply）
  --author <NAME>                      回复作者（必填，如 codex/claude/huanghao）
  --text <TEXT>                        回复内容（用于 reply）
  --input <PATH|->                     批量回复输入（JSON 文件路径或 stdin）
  --days <N>                           清理天数阈值（用于 tidy，默认 7）
  --missing                            同时清理已删除文件的评论（用于 tidy）

示例:
  mdv README.md                        打开文件
  mdv report.html                      打开 HTML 文件
  mdv --no-focus notes.md              添加但不切换
  mdv tabs                             查看当前打开的标签页
  mdv tabs --json                      JSON 格式输出标签页
  mdv config                           查看完整配置
  mdv config get server.port           获取端口配置
  mdv config set server.port 3001      设置端口
  mdv comments list --json             列出当前工作区评论文档（JSON）
  mdv comments list --all --json       列出所有评论文档（JSON）
  mdv comments tidy                    清理 7 天前的已解决/失锚评论
  mdv comments tidy --days 30          清理 30 天前的已解决/失锚评论
  mdv comments tidy --missing          同时清理已删除文件的评论
  mdv comments get --file README.md    查看评论
  mdv comments reply --file README.md --seq 2 --author codex --text "我会补充这部分"
  mdv comments reply-batch --file README.md --author codex --input replies.json
  mdv comments stats                   评论统计

配置文件:
  ${getConfigPath()}
`);
}

// ==================== 命令解析 ====================

interface CliOptions {
  noFocus: boolean;
  json: boolean;
  all: boolean;
  limit: number;
  offset: number;
  tail?: number;
  file?: string;
  seq?: number;
  id?: string;
  text?: string;
  author?: string;
  input?: string;
  daemon: boolean;
  days?: number;
  missing?: boolean;
}

function parseArgs(args: string[]): {
  command: string[];
  options: CliOptions;
  filePath?: string;
} {
  const options: CliOptions = {
    noFocus: false,
    json: false,
    all: false,
    limit: 20,
    offset: 0,
    daemon: false,
  };

  const command: string[] = [];
  let filePath: string | undefined;
  const topLevelCommands = new Set(["tabs", "config", "comments"]);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help") {
      showHelp();
      process.exit(0);
    } else if (arg === "--no-focus") {
      options.noFocus = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--daemon" || arg === "-d") {
      options.daemon = true;
    } else if (arg === "--limit") {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === "--offset") {
      options.offset = parseInt(args[++i], 10);
    } else if (arg === "--tail") {
      options.tail = parseInt(args[++i], 10);
    } else if (arg === "--file") {
      options.file = args[++i];
    } else if (arg === "--seq") {
      options.seq = parseInt(args[++i], 10);
    } else if (arg === "--id") {
      options.id = args[++i];
    } else if (arg === "--text") {
      options.text = args[++i];
    } else if (arg === "--author") {
      options.author = args[++i];
    } else if (arg === "--input") {
      options.input = args[++i];
    } else if (arg === "--days") {
      options.days = parseInt(args[++i], 10);
    } else if (arg === "--missing") {
      options.missing = true;
    } else if (arg === "--all") {
      options.all = true;
    } else if (!arg.startsWith("-")) {
      if (command.length === 0 && !topLevelCommands.has(arg)) {
        // 兼容 `mdv <FILE>`：首个非选项参数且非保留命令时，按文件路径处理。
        // 文件是否存在由 openFile() 统一校验并给出明确错误。
        filePath = arg;
      } else {
        command.push(arg);
      }
    }
  }

  return { command, options, filePath };
}

// ==================== 主函数 ====================

async function main() {
  // 确保配置目录存在
  initConfig();

  const args = process.argv.slice(2);

  // 检测内部 server 模式
  if (args[0] === "--internal-server-mode") {
    // 启动 server
    await import("./server.ts");
    return;
  }

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const { command, options, filePath } = parseArgs(args);

  // 如果第一个参数是文件，直接打开
  if (filePath) {
    await openFile(filePath, !options.noFocus);
    process.exit(0);
  }

  // 处理命令
  const [cmd, subcmd, ...rest] = command;

  if (cmd === "tabs") {
    await showTabs(options.json);
  } else if (cmd === "config") {
    if (!subcmd) {
      showConfig();
    } else if (subcmd === "get") {
      if (!rest[0]) {
        console.error("❌ 缺少配置项名称");
        console.error("   用法: mdv config get <KEY>");
        process.exit(1);
      }
      getConfigValue(rest[0]);
    } else if (subcmd === "set") {
      if (!rest[0] || !rest[1]) {
        console.error("❌ 缺少配置项名称或值");
        console.error("   用法: mdv config set <KEY> <VALUE>");
        process.exit(1);
      }
      setConfigValue(rest[0], rest[1]);
    } else {
      console.error(`❌ 未知的 config 子命令: ${subcmd}`);
      console.error(`   可用: get, set`);
      process.exit(1);
    }
  } else if (cmd === "comments") {
    if (subcmd === "list") {
      printCommentDocs(options.json, options.all, options.limit, options.offset);
    } else if (subcmd === "get") {
      const target = options.file || rest[0];
      if (!target) {
        console.error("❌ 缺少文档路径");
        console.error("   用法: mdv comments get --file <FILE>");
        process.exit(1);
      }
      printComments(target, options.json, options.limit, options.offset);
    } else if (subcmd === "reply") {
      const target = options.file || rest[0];
      if (!target) {
        console.error("❌ 缺少文档路径");
        console.error("   用法: mdv comments reply --file <FILE> [--seq <N> | --id <ID>] --author <NAME> --text <TEXT>");
        process.exit(1);
      }
      const seq = Number(options.seq);
      const id = String(options.id || "").trim();
      if ((Number.isFinite(seq) && seq > 0) && id) {
        console.error("❌ --seq 与 --id 不能同时使用");
        console.error("   用法: mdv comments reply --file <FILE> [--seq <N> | --id <ID>] --author <NAME> --text <TEXT>");
        process.exit(1);
      }
      if ((!Number.isFinite(seq) || seq <= 0) && !id) {
        console.error("❌ 缺少评论引用，请使用 --seq 或 --id");
        console.error("   用法: mdv comments reply --file <FILE> [--seq <N> | --id <ID>] --author <NAME> --text <TEXT>");
        process.exit(1);
      }
      const author = String(options.author || "").trim();
      if (!author) {
        console.error("❌ 缺少回复作者");
        console.error("   用法: mdv comments reply --file <FILE> [--seq <N> | --id <ID>] --author <NAME> --text <TEXT>");
        process.exit(1);
      }
      const text = String(options.text || "").trim();
      if (!text) {
        console.error("❌ 缺少回复内容");
        console.error("   用法: mdv comments reply --file <FILE> [--seq <N> | --id <ID>] --author <NAME> --text <TEXT>");
        process.exit(1);
      }
      replyComment(
        target,
        Number.isFinite(seq) && seq > 0 ? { serial: Math.floor(seq) } : { id },
        text,
        author,
        options.json
      );
    } else if (subcmd === "reply-batch") {
      const target = options.file || rest[0];
      if (!target) {
        console.error("❌ 缺少文档路径");
        console.error("   用法: mdv comments reply-batch --file <FILE> --author <NAME> --input <JSON|->");
        process.exit(1);
      }
      const author = String(options.author || "").trim();
      if (!author) {
        console.error("❌ 缺少回复作者");
        console.error("   用法: mdv comments reply-batch --file <FILE> --author <NAME> --input <JSON|->");
        process.exit(1);
      }
      const input = String(options.input || "").trim();
      if (!input) {
        console.error("❌ 缺少批量输入");
        console.error("   用法: mdv comments reply-batch --file <FILE> --author <NAME> --input <JSON|->");
        process.exit(1);
      }
      try {
        await replyCommentBatch(target, author, input, options.json);
      } catch (error: any) {
        console.error(`❌ ${error?.message || "批量回复失败"}`);
        process.exit(1);
      }
    } else if (subcmd === "stats") {
      showCommentsStats();
    } else if (subcmd === "tidy") {
      const days = Number.isFinite(Number(options.days)) && Number(options.days) > 0
        ? Math.floor(Number(options.days))
        : 7;
      runTidy(days, options.missing === true, options.json);
    } else {
      console.error(`❌ 未知的 comments 子命令: ${subcmd}`);
      console.error(`   可用: list, get, reply, reply-batch, stats, tidy`);
      process.exit(1);
    }
  } else {
    console.error(`❌ 未知命令: ${cmd}`);
    console.error("");
    showHelp();
    process.exit(1);
  }
}

main();
