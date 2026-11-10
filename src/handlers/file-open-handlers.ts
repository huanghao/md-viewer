import { basename, extname, resolve } from "path";
import { existsSync, statSync } from "fs";
import type { Context } from "hono";
import { fetchRemoteMarkdown, getLastModified, isUrl, log, readMarkdownFile } from "../utils.ts";
import { broadcastFileOpened } from "../sse.ts";
import { watchFile } from "../file-watcher.ts";
import { getGitCreatedAt } from "./file-utils.ts";

export async function handleOpenFile(c: Context) {
  const body = await c.req.json<{ path?: string; focus?: boolean }>();
  const path = body?.path;
  const focus = body?.focus ?? false;

  if (!path) {
    return c.json({ error: "缺少 path 参数" }, 400);
  }

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

    broadcastFileOpened(fileInfo, focus);

    log(`📄 CLI 打开远程文件: ${filename}${focus ? " (并切换)" : ""}`);

    return c.json({ success: true, filename: fileInfo.filename });
  }

  const resolvedPath = resolve(path);

  if (!existsSync(resolvedPath)) {
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
    gitCreatedAt: await getGitCreatedAt(resolvedPath),
    isRemote: false,
  };

  watchFile(resolvedPath);
  broadcastFileOpened(fileInfo, focus);

  log(`📄 CLI 打开文件: ${fileInfo.filename}${focus ? " (并切换)" : ""}`);

  return c.json({ success: true, filename: fileInfo.filename });
}

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
    // 并行查询 git（各自异步、带缓存），不再逐个串行阻塞
    await Promise.all(paths.map(async (p) => {
      const resolved = resolve(p);
      let createdAt: number | undefined;
      try { createdAt = statSync(resolved).birthtimeMs; } catch { /* skip */ }
      const gitCreatedAt = await getGitCreatedAt(resolved);
      result[p] = { createdAt, gitCreatedAt };
    }));
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
