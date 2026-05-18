import { basename, resolve, dirname, join, extname } from "path";
import { scanWorkspaceTree } from "./workspace-scanner.ts";
import { existsSync, readdirSync, statSync, readFileSync } from "fs";
import type { Dirent } from "fs";
import { homedir } from "os";
import { spawnSync } from "child_process";
import type { Context } from "hono";
import {
  isUrl,
  readMarkdownFile,
  fetchRemoteMarkdown,
  getLastModified,
  getFileList,
  searchFilesInRoots,
  log,
  isSupportedTextFile,
} from "./utils.ts";
import { fuzzyScore } from "./client/utils/fuzzy-search.ts";
import { broadcastFileOpened, addClient, removeClient, broadcastEvent } from "./sse.ts";

const encoder = new TextEncoder();

function getGitCreatedAt(filePath: string): number | undefined {
  try {
    const result = spawnSync(
      'git',
      ['log', '--follow', '--diff-filter=A', '--format=%at', '--', filePath],
      { cwd: dirname(filePath), encoding: 'utf8', timeout: 3000 }
    );
    if (result.status === 0) {
      const lines = result.stdout.trim().split('\n').filter(Boolean);
      // git log 从新到旧，取最后一行（最早的 commit）
      const ts = lines.length > 0 ? parseInt(lines[lines.length - 1], 10) * 1000 : NaN;
      return isNaN(ts) ? undefined : ts;
    }
  } catch { /* not a git repo or git not available */ }
  return undefined;
}
import { watchFile, watchWorkspace } from "./file-watcher.ts";
import {
  listAnnotations,
  listAnnotatedDocuments,
  importLegacyAnnotations,
  clearAllAnnotations,
  upsertAnnotation,
  appendAnnotationReply,
  deleteAnnotation,
  updateAnnotationStatus,
  listQuickComments,
  replaceQuickComments,
} from "./annotation-storage.ts";
import { createTodo, listTodos, updateTodo, deleteTodo, tidyTodos } from './todo-storage.ts';
import { upsertWorkspacePath, getWorkspacePaths, deleteWorkspacePath, searchByFilename } from './rag-storage.ts';
import { calculateOpenCount } from "./annotation-status.ts";

function expandHomePath(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/")) return join(homedir(), input.slice(2));
  return input;
}

function isMarkdownFilename(name: string): boolean {
  return isSupportedTextFile(name.toLowerCase());
}


// API: 获取文件内容
export async function handleGetFile(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);

  // 处理远程 URL
  if (isUrl(path)) {
    const { content, error, contentType } = await fetchRemoteMarkdown(path);
    if (error) return c.json({ error }, 400);

    const url = new URL(path);
    // 从路径提取文件名，如果路径是根目录则从 hostname 提取
    let filename = basename(url.pathname);
    if (!filename || filename === "/") {
      // 从 hostname 提取，例如 "soul.md" -> "soul.md"
      filename = url.hostname.replace(/^www\./, "");
    }
    // 如果没有后缀，按 content-type 推断默认后缀
    if (!filename.includes(".")) {
      filename += contentType?.toLowerCase().includes("text/html") ? ".html" : ".md";
    }

    return c.json({
      content,
      path,
      filename,
      lastModified: Date.now(),
      isRemote: true,
    });
  }

  const resolvedPath = resolve(path);
  const { content, error } = readMarkdownFile(resolvedPath);
  if (error) return c.json({ error }, 404);

  // 添加文件到监听列表
  watchFile(resolvedPath);

  return c.json({
    content,
    path: resolvedPath,
    filename: basename(resolvedPath),
    lastModified: getLastModified(resolvedPath),
    isRemote: false,
  });
}

function getAssetContentType(path: string): string {
  const ext = extname(path).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".bmp":
      return "image/bmp";
    case ".ico":
      return "image/x-icon";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

// API: 获取本地静态资源（用于 Markdown 内嵌图片/动图/视频）
export async function handleGetFileAsset(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);
  if (isUrl(path)) return c.json({ error: "不支持远程 URL" }, 400);

  const resolvedPath = resolve(path);
  if (!existsSync(resolvedPath)) return c.json({ error: "资源不存在" }, 404);

  let stat;
  try {
    stat = statSync(resolvedPath);
  } catch (e) {
    return c.json({ error: "读取资源失败: " + (e as Error).message }, 500);
  }
  if (!stat.isFile()) return c.json({ error: "目标不是文件" }, 400);

  const file = Bun.file(resolvedPath);
  return new Response(file, {
    headers: {
      "Content-Type": getAssetContentType(resolvedPath),
      "Cache-Control": "no-cache",
    },
  });
}

// API: 获取 PDF 文件
export async function handleGetPdfAsset(c: Context): Promise<Response> {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "path required" }, 400);
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return c.json({ error: "remote PDFs not supported" }, 400);
  }
  const resolvedPath = resolve(path);
  try {
    const file = Bun.file(resolvedPath);
    const exists = await file.exists();
    if (!exists) return c.json({ error: "file not found" }, 404);
    const buffer = await file.arrayBuffer();
    return new Response(buffer, {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
}

// API: 获取目录下的可展示文本文件列表（Markdown / HTML）
export function handleGetFiles(c: Context) {
  const query = (c.req.query("query") || "").trim();
  const limitRaw = Number(c.req.query("limit") || "50");
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw)) : 50;

  if (query) {
    const url = new URL(c.req.url);
    const roots = url.searchParams.getAll("root").map((p) => p.trim()).filter(Boolean);
    const effectiveRoots = roots.length > 0 ? roots : [process.cwd()];
    const matched = searchFilesInRoots(query, effectiveRoots, limit);

    return c.json({
      files: matched.map((f) => ({ path: f, name: basename(f) })),
      roots: effectiveRoots.map((root) => resolve(root)),
      query,
    });
  }

  const dir = c.req.query("dir") || ".";
  const files = getFileList(resolve(dir));
  return c.json({ files: files.map((f) => ({ path: f, name: basename(f) })) });
}

// API: 获取附近的文件（同目录、父目录、子目录）
export function handleGetNearby(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);

  // 远程文件不支持附近文件功能
  if (isUrl(path)) {
    return c.json({ error: "远程文件不支持附近文件功能" });
  }

  const resolvedPath = resolve(path);
  if (!existsSync(resolvedPath)) {
    return c.json({ error: "文件不存在" }, 404);
  }

  const currentDir = dirname(resolvedPath);
  const currentFile = basename(resolvedPath);

  try {
    // 获取当前目录的所有可展示文件（兄弟文件）
    const siblings = readdirSync(currentDir)
      .filter((f) => isSupportedTextFile(f.toLowerCase()))
      .sort()
      .map((f) => ({
        name: f,
        path: join(currentDir, f),
      }));

    // 获取父目录（如果存在）
    const parentDir = dirname(currentDir);
    const hasParent = parentDir !== currentDir;

    // 获取子目录（包含可展示文件的目录）
    const subdirs = readdirSync(currentDir)
      .filter((f) => {
        const fullPath = join(currentDir, f);
        try {
          return statSync(fullPath).isDirectory();
        } catch {
          return false;
        }
      })
      .map((dir) => {
        const dirPath = join(currentDir, dir);
        const mdFiles = getFileList(dirPath);
        return {
          name: dir,
          path: dirPath,
          count: mdFiles.length,
        };
      })
      .filter((dir) => dir.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    return c.json({
      currentDir: basename(currentDir),
      parentDir: hasParent ? parentDir : null,
      siblings,
      subdirs,
    });
  } catch (e) {
    return c.json({ error: "读取目录失败: " + (e as Error).message }, 500);
  }
}

// API: 路径补全建议（文件/目录）
export function handlePathSuggestions(c: Context) {
  const rawInput = (c.req.query("input") || "").trim();
  const kind = c.req.query("kind") === "directory" ? "directory" : "file";
  const markdownOnly = c.req.query("markdownOnly") !== "false";
  const limit = 30;

  const expandedInput = expandHomePath(rawInput);
  const resolvedInput = expandedInput
    ? resolve(expandedInput)
    : process.cwd();

  let targetDir = resolvedInput;
  let prefix = "";

  try {
    const hasTrailingSlash = expandedInput.endsWith("/");
    const isExistingDir = existsSync(resolvedInput) && statSync(resolvedInput).isDirectory();

    if (!hasTrailingSlash && !isExistingDir) {
      targetDir = dirname(resolvedInput);
      prefix = basename(resolvedInput);
    }

    if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
      return c.json({ baseDir: targetDir, suggestions: [] });
    }

    const prefixLower = prefix.toLowerCase();
    const entries = readdirSync(targetDir, { withFileTypes: true });
    const suggestions: Array<{ path: string; display: string; type: "file" | "directory" }> = [];

    for (const entry of entries) {
      if (!entry.name.toLowerCase().startsWith(prefixLower)) continue;
      if (entry.name.startsWith(".")) continue;

      const fullPath = join(targetDir, entry.name);

      if (entry.isDirectory()) {
        suggestions.push({
          path: `${fullPath}/`,
          display: `${entry.name}/`,
          type: "directory",
        });
        continue;
      }

      if (kind === "directory") continue;
      if (!entry.isFile()) continue;
      if (markdownOnly && !isMarkdownFilename(entry.name)) continue;

      suggestions.push({
        path: fullPath,
        display: entry.name,
        type: "file",
      });
    }

    const sortedSuggestions = suggestions
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.display.localeCompare(b.display);
      })
      .slice(0, limit);

    return c.json({
      baseDir: targetDir,
      suggestions: sortedSuggestions,
    });
  } catch (e: any) {
    return c.json({ error: `获取路径建议失败: ${e.message}` }, 500);
  }
}

// API: 检测路径类型（md/html 文件 / 其他文件 / 目录）
export async function handleDetectPath(c: Context) {
  try {
    const body = await c.req.json() as any;
    const rawPath = typeof body?.path === "string" ? body.path.trim() : "";
    if (!rawPath) {
      return c.json({ kind: "invalid", path: "", error: "缺少 path 参数" }, 400);
    }

    if (isUrl(rawPath)) {
      const url = new URL(rawPath);
      const ext = extname(url.pathname || "").toLowerCase();
      const isMd = ext === ".md" || ext === ".markdown";
      const isHtml = ext === ".html" || ext === ".htm";
      const isPdfFile = ext === ".pdf";
      return c.json({
        kind: isMd ? "md_file" : (isHtml ? "html_file" : (isPdfFile ? "pdf_file" : "other_file")),
        path: rawPath,
        ext: ext || null,
        isUrl: true,
      });
    }

    const expandedPath = expandHomePath(rawPath);
    const resolvedPath = resolve(expandedPath);
    if (!existsSync(resolvedPath)) {
      return c.json({ kind: "not_found", path: resolvedPath });
    }

    let fileStat;
    try {
      fileStat = statSync(resolvedPath);
    } catch (e: any) {
      return c.json({
        kind: "invalid",
        path: resolvedPath,
        error: e?.message || "无法访问路径",
      });
    }

    if (fileStat.isDirectory()) {
      return c.json({ kind: "directory", path: resolvedPath });
    }

    if (fileStat.isFile()) {
      const ext = extname(resolvedPath).toLowerCase();
      const isMd = ext === ".md" || ext === ".markdown";
      const isHtml = ext === ".html" || ext === ".htm";
      const isPdfFile = ext === ".pdf";
      return c.json({
        kind: isMd ? "md_file" : (isHtml ? "html_file" : (isPdfFile ? "pdf_file" : "other_file")),
        path: resolvedPath,
        ext: ext || null,
      });
    }

    return c.json({ kind: "invalid", path: resolvedPath, error: "不支持的路径类型" });
  } catch (error: any) {
    return c.json({
      kind: "invalid",
      path: "",
      error: error.message || "路径检测失败",
    }, 500);
  }
}

export async function handleInferWorkspace(c: Context) {
  const body = await c.req.json() as any;
  const filePath = typeof body?.filePath === 'string' ? body.filePath.trim() : '';
  if (!filePath) return c.json({ error: '缺少 filePath 参数' }, 400);

  let dir = dirname(resolve(filePath));
  while (true) {
    if (existsSync(join(dir, '.git'))) {
      return c.json({ workspacePath: dir, workspaceName: basename(dir) });
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return c.json({ error: '未找到 .git 目录' }, 404);
}

// API: CLI 调用 - 打开文件
export async function handleOpenFile(c: Context) {
  const body = await c.req.json<{ path?: string; focus?: boolean }>();
  const path = body?.path;
  const focus = body?.focus ?? false;
  
  if (!path) {
    return c.json({ error: "缺少 path 参数" }, 400);
  }

  // 处理远程 URL
  if (isUrl(path)) {
    const { content, error, contentType } = await fetchRemoteMarkdown(path);
    if (error) {
      return c.json({ error }, 400);
    }

    const url = new URL(path);
    let filename = basename(url.pathname);
    if (!filename || filename === "/") {
      filename = url.hostname.replace(/^www\./, "");
    }
    if (!filename.includes(".")) {
      filename += contentType?.toLowerCase().includes("text/html") ? ".html" : ".md";
    }

    const fileInfo = {
      path,
      filename,
      content,
      lastModified: Date.now(),
      isRemote: true,
    };

    // 推送给所有连接的客户端
    broadcastFileOpened(fileInfo, focus);

    log(`📄 CLI 打开远程文件: ${filename}${focus ? " (并切换)" : ""}`);
    
    return c.json({ success: true, filename: fileInfo.filename });
  }

  const resolvedPath = resolve(path);
  
  if (!fileExists(resolvedPath)) {
    return c.json({ error: "文件不存在" }, 404);
  }

  const { content, error } = readMarkdownFile(resolvedPath);
  if (error) {
    return c.json({ error }, 500);
  }

  const fileInfo = {
    path: resolvedPath,
    filename: basename(resolvedPath),
    content,
    lastModified: getLastModified(resolvedPath) ?? Date.now(),
    createdAt: (() => { try { return statSync(resolvedPath).birthtimeMs; } catch { return undefined; } })(),
    gitCreatedAt: getGitCreatedAt(resolvedPath),
    isRemote: false,
  };

  watchFile(resolvedPath);

  // 推送给所有连接的客户端
  broadcastFileOpened(fileInfo, focus);

  log(`📄 CLI 打开文件: ${fileInfo.filename}${focus ? " (并切换)" : ""}`);
  
  return c.json({ success: true, filename: fileInfo.filename });
}

// API: 让系统默认浏览器直接打开本地文件（macOS: open）
export async function handleOpenLocalFile(c: Context) {
  try {
    const body = await c.req.json<{ path?: string }>();
    const rawPath = body?.path?.trim();
    if (!rawPath) {
      return c.json({ error: "缺少 path 参数" }, 400);
    }
    if (isUrl(rawPath)) {
      return c.json({ error: "仅支持本地文件" }, 400);
    }

    const resolvedPath = resolve(rawPath);
    if (!existsSync(resolvedPath)) {
      return c.json({ error: "文件不存在" }, 404);
    }

    const ext = extname(resolvedPath).toLowerCase();
    if (ext !== ".html" && ext !== ".htm") {
      return c.json({ error: "仅支持 html/htm 文件" }, 400);
    }

    const proc = Bun.spawn(["open", resolvedPath], {
      stdout: "ignore",
      stderr: "pipe",
    });
    const code = await proc.exited;
    if (code !== 0) {
      const err = await new Response(proc.stderr).text();
      return c.json({ error: err || `open 失败，退出码 ${code}` }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error?.message || "打开失败" }, 500);
  }
}


export async function handleFileCreatedAt(c: Context) {
  try {
    const body = await c.req.json<{ paths: string[] }>();
    const paths = Array.isArray(body?.paths) ? body.paths : [];
    const result: Record<string, { createdAt?: number; gitCreatedAt?: number }> = {};
    for (const p of paths) {
      const resolved = resolve(p);
      let createdAt: number | undefined;
      let gitCreatedAt: number | undefined;
      try { createdAt = statSync(resolved).birthtimeMs; } catch { /* skip */ }
      gitCreatedAt = getGitCreatedAt(resolved);
      result[p] = { createdAt, gitCreatedAt };
    }
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
}

export async function handleOpenInEditor(c: Context) {
  try {
    const body = await c.req.json<{ path?: string }>();
    const rawPath = body?.path?.trim();
    if (!rawPath) return c.json({ error: "缺少 path 参数" }, 400);

    const resolvedPath = resolve(rawPath);
    if (!existsSync(resolvedPath)) return c.json({ error: "文件不存在" }, 404);

    const proc = Bun.spawn(["code", resolvedPath], {
      stdout: "ignore",
      stderr: "pipe",
    });
    const code = await proc.exited;
    if (code !== 0) {
      const err = await new Response(proc.stderr).text();
      return c.json({ error: err || `code 失败，退出码 ${code}` }, 500);
    }
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error?.message || "打开失败" }, 500);
  }
}

// API: SSE 事件流
export function handleEvents(c: Context) {
  let client: { controller: ReadableStreamDefaultController<Uint8Array> } | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      client = { controller };
      addClient(client);

      // 发送初始连接成功消息
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({})}\n\n`));
      // 清理断开连接的客户端
      c.req.signal.addEventListener("abort", () => {
        removeClient(client!);
      });
    },
    cancel() {
      if (client) removeClient(client);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// API: 推断工作区（从文件路径推断 git 仓库根目录）
// API: 扫描工作区，构建文件树
// 扫描结果缓存 + in-flight dedup：同路径并发请求共享同一次扫描
const scanCache = new Map<string, { tree: any; ts: number }>();
const scanInFlight = new Map<string, Promise<any>>();
const SCAN_CACHE_TTL_MS = 10_000;

export async function handleScanWorkspace(c: Context) {
  try {
    const { path } = await c.req.json() as any;
    if (!path) {
      return c.json({ error: "缺少 path 参数" }, 400);
    }

    const resolvedPath = resolve(path);
    if (!existsSync(resolvedPath)) {
      return c.json({ error: `目录不存在: ${resolvedPath}` }, 404);
    }

    const cached = scanCache.get(resolvedPath);
    if (cached && Date.now() - cached.ts < SCAN_CACHE_TTL_MS) {
      return c.json(cached.tree);
    }

    // 如果已有正在进行的扫描，等它完成共享结果
    const inFlight = scanInFlight.get(resolvedPath);
    if (inFlight) {
      const tree = await inFlight;
      return c.json(tree);
    }

    watchWorkspace(resolvedPath);

    const scanPromise = scanWorkspaceTree(resolvedPath).then((tree) => {
      scanCache.set(resolvedPath, { tree, ts: Date.now() });
      scanInFlight.delete(resolvedPath);
      return tree;
    }).catch((err) => {
      scanInFlight.delete(resolvedPath);
      throw err;
    });
    scanInFlight.set(resolvedPath, scanPromise);

    const tree = await scanPromise;
    return c.json(tree);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}


// API: 获取所有文档的批注摘要（仅含 open 批注 > 0 的文档）
export async function handleGetAnnotationSummaries(c: Context) {
  try {
    const docs = listAnnotatedDocuments(1000, 0);
    const summaries: Record<string, { count: number; unanchoredCount: number; updatedAt: number }> = {};
    for (const doc of docs) {
      const openCount = calculateOpenCount(doc.anchoredCount, doc.unanchoredCount, doc.resolvedCount);
      const unanchoredCount = doc.unanchoredCount ?? 0;
      if (openCount > 0 || unanchoredCount > 0) {
        summaries[doc.path] = {
          count: openCount,
          unanchoredCount,
          updatedAt: doc.latestUpdatedAt,
        };
      }
    }
    return c.json({ summaries });
  } catch (error: any) {
    return c.json({ error: error?.message || "获取批注摘要失败" }, 500);
  }
}

// API: 获取评论（按文件）
export async function handleGetAnnotations(c: Context) {
  try {
    const filePath = c.req.query("path") || "";
    if (!filePath) return c.json({ annotations: [] });
    const annotations = listAnnotations(filePath);
    return c.json({ annotations });
  } catch (error: any) {
    return c.json({ error: error?.message || "获取评论失败" }, 500);
  }
}

interface AnnotationRef {
  path: string;
  id: string | undefined;
  serial: number | undefined;
}

function parseAnnotationRef(body: any): AnnotationRef {
  const path = typeof body?.path === "string" ? body.path : "";
  const id = typeof body?.id === "string" ? body.id : undefined;
  const serial = Number(body?.serial);
  const validSerial = Number.isFinite(serial) && serial > 0 ? Math.floor(serial) : undefined;
  return { path, id, serial: validSerial };
}

// API: 保存单条评论（增量 upsert）
export async function handleUpsertAnnotation(c: Context) {
  try {
    const body = await c.req.json();
    const { path } = parseAnnotationRef(body);
    const annotation = body?.annotation;
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = upsertAnnotation(path, annotation);
    if (!result.ok) return c.json({ error: result.error || "保存评论失败" }, 400);
    return c.json({ success: true, annotation: result.annotation });
  } catch (error: any) {
    return c.json({ error: error?.message || "保存评论失败" }, 500);
  }
}

// API: 追加评论回复（增量）
export async function handleReplyAnnotation(c: Context) {
  try {
    const body = await c.req.json();
    const { path, id, serial } = parseAnnotationRef(body);
    const text = typeof body?.text === "string" ? body.text : "";
    const author = typeof body?.author === "string" ? body.author : "me";
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = appendAnnotationReply(
      path,
      { id, serial },
      text,
      author
    );
    if (!result.ok) return c.json({ error: result.error || "回复评论失败" }, 400);
    return c.json({ success: true, annotation: result.updated });
  } catch (error: any) {
    return c.json({ error: error?.message || "回复评论失败" }, 500);
  }
}

// API: 删除单条评论（增量）
export async function handleDeleteAnnotation(c: Context) {
  try {
    const body = await c.req.json();
    const { path, id, serial } = parseAnnotationRef(body);
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = deleteAnnotation(path, { id, serial });
    if (!result.ok) return c.json({ error: result.error || "删除评论失败" }, 400);
    return c.json({ success: true, deleted: true });
  } catch (error: any) {
    return c.json({ error: error?.message || "删除评论失败" }, 500);
  }
}

// API: 更新评论状态（增量）
export async function handleUpdateAnnotationStatus(c: Context) {
  try {
    const body = await c.req.json();
    const { path, id, serial } = parseAnnotationRef(body);
    const statusRaw = String(body?.status || "anchored");
    const status = statusRaw === "resolved" || statusRaw === "unanchored" ? statusRaw : "anchored";
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = updateAnnotationStatus(path, { id, serial }, status);
    if (!result.ok) return c.json({ error: result.error || "更新评论状态失败" }, 400);
    return c.json({ success: true, annotation: result.updated });
  } catch (error: any) {
    return c.json({ error: error?.message || "更新评论状态失败" }, 500);
  }
}

// API: 从 localStorage 一次性迁移评论到 SQLite
export async function handleMigrateAnnotations(c: Context) {
  try {
    const body = await c.req.json();
    const byPath = body?.byPath && typeof body.byPath === "object" ? body.byPath : {};
    const result = importLegacyAnnotations(byPath);
    return c.json({ success: true, ...result });
  } catch (error: any) {
    return c.json({ error: error?.message || "迁移评论失败" }, 500);
  }
}

// API: 清空所有评论（SQLite）
export async function handleClearAllAnnotations(c: Context) {
  try {
    const result = clearAllAnnotations();
    return c.json({ success: true, ...result });
  } catch (error: any) {
    return c.json({ error: error?.message || "清空评论失败" }, 500);
  }
}

// API: 获取会话状态（标签页、当前文档）
// 设计：服务端不存储状态，而是通过 SSE 向客户端请求

interface SessionStateRequest {
  requestId: string;
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const pendingStateRequests = new Map<string, SessionStateRequest>();

export async function handleGetSessionState(c: Context) {
  const requestId = `state-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // 创建一个 Promise 等待客户端响应
  const statePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingStateRequests.delete(requestId);
      reject(new Error('客户端响应超时'));
    }, 3000); // 3 秒超时

    pendingStateRequests.set(requestId, { requestId, resolve, reject, timeout });
  });

  // 通过 SSE 向所有客户端广播请求
  broadcastStateRequest(requestId);

  try {
    const data = await statePromise;
    return c.json(data);
  } catch (error: any) {
    return c.json({
      error: error.message,
      currentFile: null,
      openFiles: [],
      lastUpdate: Date.now(),
    }, 500);
  }
}

export async function handleUpdateSessionState(c: Context) {
  const body = await c.req.json();
  const requestId = body.requestId;

  if (!requestId) {
    return c.json({ error: '缺少 requestId' }, 400);
  }

  const request = pendingStateRequests.get(requestId);
  if (!request) {
    return c.json({ error: '请求已过期或不存在' }, 404);
  }

  // 清理
  clearTimeout(request.timeout);
  pendingStateRequests.delete(requestId);

  // 响应等待的请求
  request.resolve({
    currentFile: body.currentFile || null,
    openFiles: body.openFiles || [],
    lastUpdate: Date.now(),
  });

  return c.json({ success: true });
}

// 广播状态请求（通过 SSE）
function broadcastStateRequest(requestId: string) {
  const event = {
    type: 'state-request',
    requestId,
    timestamp: Date.now(),
  };

  broadcastEvent(event);
}

// 辅助函数
function fileExists(path: string): boolean {
  return existsSync(path);
}

// API: 写入 sidecar 文件（仅 .toc.json）
export async function handleWriteFile(c: Context) {
  try {
    const body = await c.req.json() as { path?: string; content?: string };
    if (!body.path || typeof body.content !== 'string') {
      return c.json({ error: '缺少 path 或 content 参数' }, 400);
    }

    // 安全检查：只允许写 .toc.json sidecar 文件
    if (!body.path.endsWith('.toc.json')) {
      return c.json({ error: '仅允许写入 .toc.json 文件' }, 403);
    }

    const resolvedPath = resolve(body.path);
    await Bun.write(resolvedPath, body.content);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error?.message || '写入文件失败' }, 500);
  }
}

export function handleGetClientConfig(): Response {
  const clientConfig = {
    pdf: {
      defaultScale: 1.5,
    },
  };
  return new Response(JSON.stringify(clientConfig), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function handleGetWorkspaces(c: Context) {
  return c.json({ paths: getWorkspacePaths() });
}

export function handleRegisterWorkspace(c: Context) {
  const body = c.req.json() as any;
  return body.then(({ path }: { path: string }) => {
    if (!path) return c.json({ error: '缺少 path' }, 400);
    upsertWorkspacePath(resolve(path));
    return c.json({ ok: true });
  });
}

export function handleUnregisterWorkspace(c: Context) {
  const body = c.req.json() as any;
  return body.then(({ path }: { path: string }) => {
    if (!path) return c.json({ error: '缺少 path' }, 400);
    deleteWorkspacePath(resolve(path));
    return c.json({ ok: true });
  });
}

const RAG_SERVER = 'http://localhost:3001';

export async function handleRagSearch(c: Context) {
  const q = c.req.query('q')?.trim();
  const safeLimit = String(Math.min(parseInt(c.req.query('limit') ?? '10', 10) || 10, 50));
  if (!q) return c.json({ results: [] });

  const filenameHits = searchByFilename(q);

  try {
    const resp = await fetch(
      `${RAG_SERVER}/search?q=${encodeURIComponent(q)}&limit=${safeLimit}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!resp.ok) return c.json({ results: [], error: 'rag_error' });
    const data = await resp.json() as { results: Array<{ path: string; score: number; heading: string | null; text: string; charStart: number }> };
    const semanticResults = data.results ?? [];

    // 过滤掉文件已不存在的结果（embedding 孤立 chunk）
    const liveResults = semanticResults.filter((r) => existsSync(r.path));

    // 文件名命中但语义结果未包含的文件，补充到末尾（score=0 表示非语义匹配）
    const semanticPaths = new Set(liveResults.map((r) => r.path));
    const extras = filenameHits
      .filter((h) => !semanticPaths.has(h.path) && existsSync(h.path))
      .map((h) => ({ ...h, score: 0 }));

    return c.json({ results: [...liveResults, ...extras] });
  } catch {
    const extras = filenameHits.filter((h) => existsSync(h.path)).map((h) => ({ ...h, score: 0 }));
    return c.json({ results: extras, error: 'rag_unavailable' });
  }
}


export async function handleListTodos(c: any): Promise<Response> {
  const done = c.req.query('done');
  const filter = done === undefined ? {} : { done: done === 'true' };
  return c.json({ todos: listTodos(filter) });
}

export async function handleCreateTodo(c: any): Promise<Response> {
  let body: any;
  try { body = await c.req.json(); } catch { return c.json({ error: 'invalid JSON' }, 400); }
  const filePath = String(body.filePath || '').trim();
  const quote = String(body.quote || '').trim();
  if (!filePath || !quote) return c.json({ error: '缺少 filePath 或 quote' }, 400);
  try {
    const todo = createTodo({
      filePath, quote,
      quotePrefix: typeof body.quotePrefix === 'string' ? body.quotePrefix : undefined,
      quoteSuffix: typeof body.quoteSuffix === 'string' ? body.quoteSuffix : undefined,
      note: body.note,
    });
    return c.json({ todo });
  } catch (e: any) {
    return c.json({ error: e?.message || 'failed' }, 400);
  }
}

export async function handleUpdateTodo(c: any): Promise<Response> {
  let body: any;
  try { body = await c.req.json(); } catch { return c.json({ error: 'invalid JSON' }, 400); }
  const id = String(body.id || '').trim();
  if (!id) return c.json({ error: '缺少 id' }, 400);
  const patch: { done?: boolean; note?: string } = {};
  if (body.done !== undefined) patch.done = Boolean(body.done);
  if (body.note !== undefined) patch.note = String(body.note);
  const updated = updateTodo(id, patch);
  if (!updated) return c.json({ error: '未找到' }, 404);
  return c.json({ todo: updated });
}

export async function handleDeleteTodo(c: any): Promise<Response> {
  let body: any;
  try { body = await c.req.json(); } catch { return c.json({ error: 'invalid JSON' }, 400); }
  const id = String(body.id || '').trim();
  if (!id) return c.json({ error: '缺少 id' }, 400);
  deleteTodo(id);
  return c.json({ ok: true });
}

export async function handleTidyTodos(c: any): Promise<Response> {
  let body: any = {};
  try { body = await c.req.json(); } catch { /* body stays {} */ }
  const olderThanDays = Number.isFinite(Number(body.olderThanDays))
    ? Number(body.olderThanDays) : undefined;
  const result = tidyTodos({ olderThanDays, missingFiles: body.missingFiles === true });
  return c.json(result);
}

export function handleGetQuickComments(c: Context) {
  return c.json({ items: listQuickComments() });
}

export async function handleUpsertQuickComments(c: Context) {
  let body: any;
  try { body = await c.req.json(); } catch { return c.json({ error: 'invalid JSON' }, 400); }
  if (!Array.isArray(body.items)) return c.json({ error: 'items must be array' }, 400);
  const sanitized = body.items
    .map((it: any) => ({ text: String(it.text ?? '').trim() }))
    .filter((it: { text: string }) => it.text.length > 0)
    .slice(0, 50);
  replaceQuickComments(sanitized);
  return c.json({ ok: true });
}

export function handleWorkspaceSearch(c: Context) {
  const q = (c.req.query('q') || '').trim().toLowerCase();
  const limit = Math.min(Number(c.req.query('limit') ?? '50'), 200);

  if (!q) return c.json({ results: [] });

  const results: Array<{ path: string; display: string; workspaceRoot: string }> = [];

  function walkDir(dir: string, workspaceRoot: string): void {
    if (results.length >= limit) return;
    let entries: Dirent<string>[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (results.length >= limit) return;
      if (entry.name.startsWith('.') || ['node_modules', 'dist', 'build', '.git'].includes(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath, workspaceRoot);
      } else if (entry.isFile() && isMarkdownFilename(entry.name) && fuzzyScore(entry.name, q) !== 0) {
        results.push({ path: fullPath, display: entry.name, workspaceRoot });
      }
    }
  }

  for (const wsPath of getWorkspacePaths()) {
    walkDir(wsPath, wsPath);
  }

  return c.json({ results });
}
