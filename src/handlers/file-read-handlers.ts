import { basename, resolve } from "path";
import type { Context } from "hono";
import { fetchRemoteMarkdown, getFileList, getLastModified, isUrl, readMarkdownFile, searchFilesInRoots } from "../utils.ts";
import { unwatchFile, watchFile } from "../file-watcher.ts";

export async function handleGetFile(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);

  if (isUrl(path)) {
    const { content, error, contentType } = await fetchRemoteMarkdown(path);
    if (error) return c.json({ error }, 400);

    const url = new URL(path);
    let filename = basename(url.pathname);
    if (!filename || filename === "/") {
      filename = url.hostname.replace(/^www\./, "");
    }
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

  watchFile(resolvedPath);

  return c.json({
    content,
    path: resolvedPath,
    filename: basename(resolvedPath),
    lastModified: getLastModified(resolvedPath),
    isRemote: false,
  });
}

export async function handleUnwatchFile(c: Context) {
  const body = await c.req.json<{ path?: string }>();
  const path = body?.path;
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);
  if (isUrl(path)) return c.json({ success: true, unwatched: false });

  const resolvedPath = resolve(path);
  const unwatched = unwatchFile(resolvedPath);
  return c.json({ success: true, unwatched });
}

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
