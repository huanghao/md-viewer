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

/**
 * 原样提供本地文件，供“在浏览器打开”在新标签页里当真页面打开。
 * 路径直接是 URL 路径（/raw/Users/x/a.html），所以页面里的相对资源和链接会自然落到同目录。
 * 有意不加 sandbox：目标是让 agent 写的 HTML 拥有完整的原生能力（localStorage、fetch 同目录资源、模块脚本）。
 * 页面与 mdv 同源，/api 对它是可达的；只打开自己或 agent 写的文件。
 */
export async function handleGetRawFile(c: Context): Promise<Response> {
  let path: string;
  try {
    path = decodeURIComponent(c.req.path.slice("/raw".length));
  } catch {
    return c.text("路径编码错误", 400);
  }
  if (!path.startsWith("/")) return c.text("路径无效", 400);

  const resolvedPath = resolve(path);
  let stat;
  try {
    stat = statSync(resolvedPath);
  } catch {
    return c.text("文件不存在", 404);
  }
  if (!stat.isFile()) return c.text("目标不是文件", 400);

  return new Response(Bun.file(resolvedPath), {
    headers: {
      "Content-Type": getAssetContentType(resolvedPath),
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
