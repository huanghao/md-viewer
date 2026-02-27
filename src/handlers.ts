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
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));
      
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

// 辅助函数
function fileExists(path: string): boolean {
  return existsSync(path);
}
