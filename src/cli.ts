#!/usr/bin/env bun
/**
 * MD Viewer CLI - 统一命令行工具
 * 文件操作、配置管理、评论管理
 */

import { resolve, join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { loadConfig, getConfigDir, getConfigPath, initConfig } from "./config.ts";
import { appendAnnotationReply, getAnnotationsByDocument, listAnnotatedDocuments, listRecentlyResolvedAnnotations, tidyAnnotations, tidyMissingFiles, updateAnnotationStatus, type ResolvedAnnotationEntry } from "./annotation-storage.ts";
import { findGitRoot, filterCommentDocsByWorkspace } from "./comments-filter.ts";

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = 60_000, hour = 60 * min, day = 24 * hour;
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ==================== 配置 ====================

const config = loadConfig();
const DEFAULT_HOST = config.server.host;

// ==================== 服务连接 ====================

/**
 * 检测端口上是否运行着 md-viewer server（通过 /api/files 端点识别）
 */
async function isServerHttpReachable(host: string, port: number): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`http://${host}:${port}/api/config`, {
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
  const timeout = setTimeout(() => controller.abort(), 2000);
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

  console.error(`❌ md-viewer 服务未运行 (${host}:${port})`);
  console.error(`   请通过 nanny/app-nanny 启动服务，或在项目目录运行: just dev`);
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

    // 只允许 md/markdown/txt/html/htm/pdf
    const ext = targetPath.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
    if (ext && !["md", "markdown", "txt", "html", "htm", "pdf"].includes(ext)) {
      console.error(`❌ 不支持的文件类型: .${ext}（CLI 仅支持 md/markdown/txt/html/htm/pdf）`);
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
      console.error(`❌ 无法连接到 md-viewer 服务 (${host}:${port})`);
      console.error(`   请确保服务已启动（bun run dev）`);
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

async function reopenComment(filePath: string | undefined, nth: number | undefined): Promise<void> {
  const LIMIT = 10;
  const resolved = listRecentlyResolvedAnnotations(LIMIT, filePath);

  if (resolved.length === 0) {
    console.log(filePath
      ? `✅ ${filePath} 没有已解决的评论`
      : '✅ 没有已解决的评论');
    return;
  }

  // --nth 直接指定，不弹交互
  if (nth !== undefined) {
    if (nth < 1 || nth > resolved.length) {
      console.error(`❌ --nth ${nth} 超出范围，最近共 ${resolved.length} 条已解决评论`);
      process.exit(1);
    }
    const ann = resolved[nth - 1];
    const nextStatus = (ann.confidence || 0) <= 0 ? 'unanchored' : 'anchored';
    const result = updateAnnotationStatus(ann.docPath, { id: ann.id }, nextStatus as any);
    if (!result.ok) {
      console.error(`❌ 重新打开失败: ${result.error}`);
      process.exit(1);
    }
    const displayPath = ann.docPath.split('/').slice(-2).join('/');
    const quote = ann.quote.substring(0, 30);
    console.log(`✓ 已重新打开：[${displayPath}] #${ann.serial} "${quote}${quote.length >= 30 ? '…' : ''}"`);
    return;
  }

  // 交互式
  const relPath = (p: string) => p.split('/').slice(-2).join('/');
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (d >= 1) return `${d} 天前`;
    if (h >= 1) return `${h} 小时前`;
    return `${Math.max(1, m)} 分钟前`;
  };

  console.log(`最近已解决的评论（最近 ${resolved.length} 条）：\n`);
  for (const [i, ann] of resolved.entries()) {
    const quote = ann.quote.substring(0, 30);
    const ellipsis = quote.length >= 30 ? '…' : '';
    console.log(`  #${i + 1}  [${relPath(ann.docPath)}]  #${ann.serial} | "${quote}${ellipsis}"   解决于 ${formatTime(ann.updatedAt)}`);
  }

  process.stdout.write(`\n输入序号 (1-${resolved.length}) 重新打开，或按 Ctrl+C 取消：> `);

  const input = await new Promise<string>((resolveInput) => {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let buf = '';
    process.stdin.on('data', (chunk: string) => {
      buf += chunk;
      const nl = buf.indexOf('\n');
      if (nl >= 0) {
        process.stdin.pause();
        resolveInput(buf.slice(0, nl).trim());
      }
    });
  });

  const idx = parseInt(input, 10);
  if (!Number.isFinite(idx) || idx < 1 || idx > resolved.length) {
    console.error('❌ 无效序号，已取消');
    process.exit(1);
  }

  const ann = resolved[idx - 1];
  const nextStatus = (ann.confidence || 0) <= 0 ? 'unanchored' : 'anchored';
  const result = updateAnnotationStatus(ann.docPath, { id: ann.id }, nextStatus as any);
  if (!result.ok) {
    console.error(`❌ 重新打开失败: ${result.error}`);
    process.exit(1);
  }
  const displayPath = ann.docPath.split('/').slice(-2).join('/');
  const quote = ann.quote.substring(0, 30);
  console.log(`✓ 已重新打开：[${displayPath}] #${ann.serial} "${quote}${quote.length >= 30 ? '…' : ''}"`);
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
    console.error("❌ 无法连接到 md-viewer 服务");
    console.error("   请确保服务已启动（bun run dev）");
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
  mdv comments reopen [--file <FILE>] [--nth <N>]
                                       重新打开已解决评论（不加 --nth 则交互式选择）
  mdv --help                           显示帮助

选项:
  --no-focus                           添加文件但不切换焦点
  --json                               JSON 输出（用于脚本）
  --limit <N>                          结果数量限制（默认 100）
  --offset <N>                         结果偏移（默认 0）
  --seq <N>                            评论序号（用于 reply，推荐）
  --id <ID>                            评论唯一 ID（用于 reply）
  --author <NAME>                      回复作者（必填，如 codex/claude/huanghao）
  --text <TEXT>                        回复内容（用于 reply）
  --input <PATH|->                     批量回复输入（JSON 文件路径或 stdin）
  --days <N>                           清理天数阈值（用于 tidy，默认 7）
  --missing                            同时清理已删除文件的评论（用于 tidy）
  --nth <N>                            倒数第 N 个已解决评论（用于 reopen）

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
  mdv comments reopen                  交互式选择重新打开已解决评论
  mdv comments reopen --nth 2          重新打开倒数第 2 条已解决评论
  mdv comments reopen --file README.md --nth 1  指定文件的倒数第 1 条

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
  includeDone?: boolean;
  nth?: number;
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
    limit: 100,
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
    } else if (arg === "--include-done") {
      options.includeDone = true;
    } else if (arg === "--nth") {
      options.nth = parseInt(args[++i], 10);
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

  if (args[0] === "--internal-server-mode") {
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
    } else if (subcmd === "reopen") {
      await reopenComment(options.file, options.nth);
    } else {
      console.error(`❌ 未知的 comments 子命令: ${subcmd}`);
      console.error(`   可用: list, get, reply, reply-batch, stats, tidy, reopen`);
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
