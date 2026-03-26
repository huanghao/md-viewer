import { basename, resolve, dirname, join, extname } from "path";
import { existsSync, readdirSync, statSync } from "fs";
import { homedir } from "os";
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
import { broadcastFileOpened, addClient, removeClient, broadcastEvent } from "./sse.ts";
import { createKmDoc, getKmDocMeta } from "./km-cli.ts";
import {
  getRecentParents,
  addRecentParent,
  updateRecentParentMeta,
  getSyncedFile,
  getSyncHistory,
  saveSyncedFile,
  appendSyncHistory,
  getDefaultParentId,
  cleanupAllExpiredRecords,
  getSyncRecordsStats,
  getSyncPreferences,
  setSyncPreference,
} from "./sync-storage.ts";
import { watchFile, watchWorkspace } from "./file-watcher.ts";
import {
  listAnnotations,
  importLegacyAnnotations,
  clearAllAnnotations,
  upsertAnnotation,
  appendAnnotationReply,
  deleteAnnotation,
  updateAnnotationStatus,
} from "./annotation-storage.ts";

function expandHomePath(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/")) return join(homedir(), input.slice(2));
  return input;
}

function isMarkdownFilename(name: string): boolean {
  return isSupportedTextFile(name.toLowerCase());
}

const PARENT_URL_SKIP_SEGMENTS = new Set(["doc", "docs", "page", "pages", "content", "wiki"]);

function normalizeParentIdInput(raw: string): string {
  const input = (raw || "").trim();
  if (!input) return "";

  const pickFromPath = (path: string): string => {
    const segments = path
      .split("/")
      .map((s) => decodeURIComponent(s).trim())
      .filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      if (!seg) continue;
      if (PARENT_URL_SKIP_SEGMENTS.has(seg.toLowerCase())) continue;
      return seg;
    }
    return "";
  };

  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const picked = pickFromPath(url.pathname);
      return picked || input;
    } catch {
      return input;
    }
  }

  if (input.includes("/")) {
    const picked = pickFromPath(input);
    return picked || input;
  }

  return input;
}

function stripVersionSuffix(title: string): string {
  const trimmed = (title || "").trim();
  if (!trimmed) return trimmed;
  return trimmed.replace(/-v\d+$/i, "").trim();
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
      return c.json({
        kind: isMd ? "md_file" : (isHtml ? "html_file" : "other_file"),
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
      return c.json({
        kind: isMd ? "md_file" : (isHtml ? "html_file" : "other_file"),
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
    isRemote: false,
  };

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

// API: SSE 事件流
export function handleEvents(c: Context) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const client = { controller };
      addClient(client);
      
      // 发送初始连接成功消息
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({})}\n\n`));
      
      // 清理断开连接的客户端
      c.req.signal.addEventListener("abort", () => {
        removeClient(client);
      });
    },
    cancel(controller) {
      // 清理
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

// API: 获取最近使用的位置
export async function handleGetRecentParents(c: Context) {
  const parents = getRecentParents();
  const defaultParentId = getDefaultParentId();

  // 兜底修复历史记录中的 "Parent <id>" 占位标题
  const refreshedParents = await Promise.all(parents.map(async (parent) => {
    const needsRefresh = !parent.title || /^Parent\s+\S+$/i.test(parent.title.trim());
    if (!needsRefresh) return parent;

    try {
      const meta = await getKmDocMeta(parent.id);
      const nextTitle = meta?.title || parent.title;
      const nextUrl = meta?.url || parent.url;
      if ((nextTitle && nextTitle !== parent.title) || (nextUrl && nextUrl !== parent.url)) {
        updateRecentParentMeta(parent.id, nextTitle, nextUrl);
      }
      return {
        ...parent,
        title: nextTitle,
        url: nextUrl,
      };
    } catch {
      return parent;
    }
  }));

  return c.json({
    parents: refreshedParents,
    defaultParentId,
  });
}

// API: 根据父文档输入（ID/URL）获取元信息
export async function handleGetSyncParentMeta(c: Context) {
  const raw = (c.req.query("value") || c.req.query("parentId") || "").trim();
  if (!raw) {
    return c.json({ success: false, error: "缺少 value 参数" }, 400);
  }

  const parentId = normalizeParentIdInput(raw);
  if (!parentId) {
    return c.json({ success: false, error: "无法解析父文档 ID" }, 400);
  }

  try {
    const meta = await getKmDocMeta(parentId);
    return c.json({
      success: true,
      parentId,
      title: meta?.title || `Parent ${parentId}`,
      url: meta?.url || meta?.link || "",
    });
  } catch (error: any) {
    return c.json({
      success: false,
      parentId,
      error: error?.message || "获取父文档信息失败",
    }, 500);
  }
}

// API: 执行同步
export async function handleSyncExecute(c: Context) {
  try {
    const body = await c.req.json<{
      filePath: string;
      parentId: string;
      title: string;
      openAfterSync?: boolean;
    }>();

    const { filePath, parentId, title, openAfterSync = false } = body;
    const normalizedParentId = normalizeParentIdInput(parentId);

    if (!filePath || !normalizedParentId || !title) {
      return c.json({ error: "缺少必要参数" }, 400);
    }

    const resolvedPath = resolve(filePath);

    if (!existsSync(resolvedPath)) {
      return c.json({ error: "文件不存在" }, 404);
    }

    const now = Date.now();
    const previous = getSyncedFile(resolvedPath);
    const baseTitle = previous?.baseTitle || stripVersionSuffix(title);
    const nextVersion = (previous?.version || 0) + 1;
    const versionedTitle = nextVersion <= 1 ? baseTitle : `${baseTitle}-v${nextVersion}`;

    // 调用 km-cli 创建文档（每次都 create，不 update）
    const result = await createKmDoc({
      parentId: normalizedParentId,
      title: versionedTitle,
      markdownFile: resolvedPath,
    });

    if (!result.success) {
      appendSyncHistory(resolvedPath, {
        version: nextVersion,
        kmTitle: versionedTitle,
        parentId: normalizedParentId,
        status: "failed",
        syncedAt: now,
        command: result.command,
        error: result.output || result.error || "同步失败",
      });
      return c.json({
        success: false,
        error: result.error || "同步失败",
        output: result.output || result.error || "oa-skills 未返回可读输出",
        command: result.command,
        version: nextVersion,
        baseTitle,
        versionedTitle,
      });
    }

    // 保存同步记录
    saveSyncedFile(resolvedPath, {
      kmDocId: result.docId!,
      kmUrl: result.url!,
      kmTitle: versionedTitle,
      baseTitle,
      version: nextVersion,
      parentId: normalizedParentId,
      lastSyncTime: now,
      command: result.command,
    });
    appendSyncHistory(resolvedPath, {
      version: nextVersion,
      kmDocId: result.docId!,
      kmUrl: result.url!,
      kmTitle: versionedTitle,
      parentId: normalizedParentId,
      status: "success",
      syncedAt: now,
      command: result.command,
    });

    // 更新最近使用的位置
    // 尝试获取父文档的真实标题
    let parentTitle = `Parent ${normalizedParentId}`;
    let parentUrl = result.url!;
    try {
      const parentMeta = await getKmDocMeta(normalizedParentId);
      if (parentMeta && parentMeta.title) {
        parentTitle = parentMeta.title;
      }
      if (parentMeta && parentMeta.url) {
        parentUrl = parentMeta.url;
      }
    } catch (error) {
      // 获取失败时使用降级方案
      log(`⚠️  获取父文档信息失败，使用降级方案: ${error}`);
    }
    addRecentParent(normalizedParentId, parentTitle, parentUrl);

    log(`🔄 同步成功: ${versionedTitle} -> ${result.url}`);

    return c.json({
      success: true,
      kmDocId: result.docId,
      kmUrl: result.url,
      kmTitle: versionedTitle,
      openAfterSync,
      command: result.command,
      output: result.output,
      version: nextVersion,
      baseTitle,
      versionedTitle,
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || "同步失败",
      output: error.stack || "",
    }, 500);
  }
}

// API: 获取文件同步状态
export function handleGetSyncStatus(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);

  const resolvedPath = resolve(path);
  const syncInfo = getSyncedFile(resolvedPath);
  const history = getSyncHistory(resolvedPath);

  if (!syncInfo) {
    return c.json({ synced: false, history: [] });
  }

  return c.json({
    synced: true,
    kmDocId: syncInfo.kmDocId,
    kmUrl: syncInfo.kmUrl,
    kmTitle: syncInfo.kmTitle,
    baseTitle: syncInfo.baseTitle,
    version: syncInfo.version,
    lastSyncTime: syncInfo.lastSyncTime,
    history,
  });
}

// API: 清理过期的同步记录
export function handleCleanupSync(c: Context) {
  try {
    const cleanedCount = cleanupAllExpiredRecords();
    return c.json({
      success: true,
      cleanedCount,
      message: `已清理 ${cleanedCount} 条过期的同步记录`,
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
}

// API: 获取同步记录统计信息
export function handleGetSyncStats(c: Context) {
  try {
    const stats = getSyncRecordsStats();
    return c.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
}

// API: 获取同步偏好设置
export function handleGetSyncPreferences(c: Context) {
  try {
    const preferences = getSyncPreferences();
    return c.json(preferences);
  } catch (error: any) {
    return c.json({
      error: error.message,
    }, 500);
  }
}

// API: 保存同步偏好设置
export async function handleSetSyncPreferences(c: Context) {
  try {
    const body = await c.req.json();
    for (const [key, value] of Object.entries(body)) {
      setSyncPreference(key, value);
    }
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
}

// API: 推断工作区（从文件路径推断 git 仓库根目录）
export async function handleInferWorkspace(c: Context) {
  try {
    const { filePath } = await c.req.json();
    if (!filePath) {
      return c.json({ error: "缺少 filePath 参数" }, 400);
    }

    const resolvedPath = resolve(filePath);
    if (!existsSync(resolvedPath)) {
      return c.json({ error: "文件不存在" }, 404);
    }

    // 从文件路径向上查找 .git 目录
    let currentDir = dirname(resolvedPath);
    let workspacePath: string | null = null;

    while (currentDir !== dirname(currentDir)) {  // 直到根目录
      if (existsSync(join(currentDir, '.git'))) {
        workspacePath = currentDir;
        break;
      }
      currentDir = dirname(currentDir);
    }

    if (!workspacePath) {
      return c.json({ workspacePath: null });
    }

    const workspaceName = basename(workspacePath);

    return c.json({
      workspacePath,
      workspaceName
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

// API: 扫描工作区，构建文件树
export async function handleScanWorkspace(c: Context) {
  try {
    const { path } = await c.req.json() as any;
    if (!path) {
      return c.json({ error: "缺少 path 参数" }, 400);
    }

    const resolvedPath = resolve(path);
    if (!existsSync(resolvedPath)) {
      return c.json({ error: "目录不存在" }, 404);
    }

    // 扫描后开启目录级监听，保证“未打开文件”也能收到删除事件。
    watchWorkspace(resolvedPath);

    const tree = scanDirectory(resolvedPath);
    return c.json(tree);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

// 扫描目录，构建文件树（只包含 md/html 文件和包含这些文件的目录）
function scanDirectory(dirPath: string): any {
  const name = basename(dirPath);
  const tree: any = {
    name,
    path: dirPath,
    type: 'directory',
    children: [],
    fileCount: 0
  };

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // 跳过隐藏文件和特殊目录
      if (entry.name.startsWith('.') ||
          ['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
        continue;
      }

      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subTree = scanDirectory(fullPath);
        // 只添加包含可展示文件的目录
        if (subTree.fileCount > 0) {
          tree.children.push(subTree);
          tree.fileCount += subTree.fileCount;
        }
      } else if (isSupportedTextFile(entry.name.toLowerCase())) {
        let lastModified = 0;
        try { lastModified = statSync(fullPath).mtimeMs; } catch { /* ignore */ }
        tree.children.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          lastModified,
        });
        tree.fileCount++;
      }
    }

    // 排序：目录在前，文件在后，同类按名称排序
    tree.children.sort((a: any, b: any) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

  } catch (error) {
    console.error(`扫描目录失败: ${dirPath}`, error);
  }

  return tree;
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

// API: 保存单条评论（增量 upsert）
export async function handleUpsertAnnotation(c: Context) {
  try {
    const body = await c.req.json();
    const path = typeof body?.path === "string" ? body.path : "";
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
    const path = typeof body?.path === "string" ? body.path : "";
    const id = typeof body?.id === "string" ? body.id : undefined;
    const serial = Number(body?.serial);
    const text = typeof body?.text === "string" ? body.text : "";
    const author = typeof body?.author === "string" ? body.author : "me";
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = appendAnnotationReply(
      path,
      {
        id,
        serial: Number.isFinite(serial) && serial > 0 ? Math.floor(serial) : undefined,
      },
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
    const path = typeof body?.path === "string" ? body.path : "";
    const id = typeof body?.id === "string" ? body.id : undefined;
    const serial = Number(body?.serial);
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = deleteAnnotation(path, {
      id,
      serial: Number.isFinite(serial) && serial > 0 ? Math.floor(serial) : undefined,
    });
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
    const path = typeof body?.path === "string" ? body.path : "";
    const id = typeof body?.id === "string" ? body.id : undefined;
    const serial = Number(body?.serial);
    const statusRaw = String(body?.status || "anchored");
    const status = statusRaw === "resolved" || statusRaw === "unanchored" ? statusRaw : "anchored";
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = updateAnnotationStatus(path, {
      id,
      serial: Number.isFinite(serial) && serial > 0 ? Math.floor(serial) : undefined,
    }, status);
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
