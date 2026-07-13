import { resolve } from "path";
import { existsSync, statSync } from "fs";
import type { Context } from "hono";
import { isUrl } from "../utils.ts";
import { getAssetContentType } from "./file-utils.ts";

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
