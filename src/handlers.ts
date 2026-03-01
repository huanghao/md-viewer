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
  log,
} from "./utils.ts";
import { broadcastFileOpened, addClient, removeClient } from "./sse.ts";
import { createKmDoc, getKmDocMeta } from "./km-cli.ts";
import {
  getRecentParents,
  addRecentParent,
  getSyncedFile,
  saveSyncedFile,
  getDefaultParentId,
  cleanupAllExpiredRecords,
  getSyncRecordsStats,
  getSyncPreferences,
  setSyncPreference,
} from "./sync-storage.ts";
import { watchFile } from "./file-watcher.ts";

function expandHomePath(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/")) return join(homedir(), input.slice(2));
  return input;
}

function isMarkdownFilename(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".markdown");
}

// API: 获取文件内容
export async function handleGetFile(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);

  // 处理远程 URL
  if (isUrl(path)) {
    const { content, error } = await fetchRemoteMarkdown(path);
    if (error) return c.json({ error }, 400);

    const url = new URL(path);
    // 从路径提取文件名，如果路径是根目录则从 hostname 提取
    let filename = basename(url.pathname);
    if (!filename || filename === "/") {
      // 从 hostname 提取，例如 "soul.md" -> "soul.md"
      filename = url.hostname.replace(/^www\./, "");
    }
    // 如果没有后缀，默认添加 .md
    if (!filename.includes(".")) {
      filename += ".md";
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

// API: 获取目录下的 Markdown 文件列表
export function handleGetFiles(c: Context) {
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
    // 获取当前目录的所有 .md 文件（兄弟文件）
    const siblings = readdirSync(currentDir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => ({
        name: f,
        path: join(currentDir, f),
      }));

    // 获取父目录（如果存在）
    const parentDir = dirname(currentDir);
    const hasParent = parentDir !== currentDir;

    // 获取子目录（包含 .md 文件的目录）
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

// API: 检测路径类型（md 文件 / 其他文件 / 目录）
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
      return c.json({
        kind: isMd ? "md_file" : "other_file",
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
      return c.json({
        kind: isMd ? "md_file" : "other_file",
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
    const { content, error } = await fetchRemoteMarkdown(path);
    if (error) {
      return c.json({ error }, 400);
    }

    const url = new URL(path);
    let filename = basename(url.pathname);
    if (!filename || filename === "/") {
      filename = url.hostname.replace(/^www\./, "");
    }
    if (!filename.includes(".")) {
      filename += ".md";
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
export function handleGetRecentParents(c: Context) {
  const parents = getRecentParents();
  const defaultParentId = getDefaultParentId();

  return c.json({
    parents,
    defaultParentId,
  });
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

    if (!filePath || !parentId || !title) {
      return c.json({ error: "缺少必要参数" }, 400);
    }

    const resolvedPath = resolve(filePath);

    if (!existsSync(resolvedPath)) {
      return c.json({ error: "文件不存在" }, 404);
    }

    // 调用 km-cli 创建文档
    const result = await createKmDoc({
      parentId,
      title,
      markdownFile: resolvedPath,
    });

    if (!result.success) {
      return c.json({
        success: false,
        error: result.error || "同步失败",
        output: result.output || "",
        command: result.command,
      });
    }

    // 保存同步记录
    saveSyncedFile(resolvedPath, {
      kmDocId: result.docId!,
      kmUrl: result.url!,
      kmTitle: title,
      parentId,
      lastSyncTime: Date.now(),
      command: result.command,
    });

    // 更新最近使用的位置
    // 尝试获取父文档的真实标题
    let parentTitle = `Parent ${parentId}`;
    let parentUrl = result.url!;
    try {
      const parentMeta = await getKmDocMeta(parentId);
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
    addRecentParent(parentId, parentTitle, parentUrl);

    log(`🔄 同步成功: ${title} -> ${result.url}`);

    return c.json({
      success: true,
      kmDocId: result.docId,
      kmUrl: result.url,
      kmTitle: title,
      openAfterSync,
      command: result.command,
      output: result.output,
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

  if (!syncInfo) {
    return c.json({ synced: false });
  }

  return c.json({
    synced: true,
    kmDocId: syncInfo.kmDocId,
    kmUrl: syncInfo.kmUrl,
    kmTitle: syncInfo.kmTitle,
    lastSyncTime: syncInfo.lastSyncTime,
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

    const tree = scanDirectory(resolvedPath);
    return c.json(tree);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

// 扫描目录，构建文件树（只包含 .md 文件和包含 .md 的目录）
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
        // 只添加包含 md 文件的目录
        if (subTree.fileCount > 0) {
          tree.children.push(subTree);
          tree.fileCount += subTree.fileCount;
        }
      } else if (entry.name.endsWith('.md')) {
        tree.children.push({
          name: entry.name,
          path: fullPath,
          type: 'file'
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

// 辅助函数
function fileExists(path: string): boolean {
  return existsSync(path);
}
