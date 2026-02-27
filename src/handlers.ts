import { basename, resolve, dirname, join } from "path";
import { existsSync, readdirSync, statSync } from "fs";
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
import { createKmDoc } from "./km-cli.ts";
import {
  getRecentParents,
  addRecentParent,
  getSyncedFile,
  saveSyncedFile,
  getDefaultParentId,
  cleanupAllExpiredRecords,
  getSyncRecordsStats,
} from "./sync-storage.ts";

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
    // 从 km-cli 获取 parent 的标题（如果可能）
    addRecentParent(parentId, `Parent ${parentId}`, result.url!);

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
export function handleScanWorkspace(c: Context) {
  try {
    const { path } = c.req.json() as any;
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
