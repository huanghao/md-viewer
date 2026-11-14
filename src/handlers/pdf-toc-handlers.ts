import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import type { Context } from "hono";
import { getDataDir } from "../config.ts";

// PDF 目录缓存由服务端自己管：按 PDF 绝对路径的哈希存进数据目录，
// 不写进用户文档目录，也不接受客户端指定任意写入路径。
function tocCacheFile(pdfPath: string): string {
  const key = createHash("sha1").update(resolve(pdfPath)).digest("hex");
  return join(getDataDir(), "pdf-toc", `${key}.json`);
}

export async function handleGetPdfToc(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);
  const file = tocCacheFile(path);
  if (!existsSync(file)) return c.json({ error: "无缓存" }, 404);
  try {
    return c.json({ toc: JSON.parse(readFileSync(file, "utf-8")) });
  } catch {
    return c.json({ error: "缓存损坏" }, 404);
  }
}

export async function handlePutPdfToc(c: Context) {
  try {
    const body = await c.req.json() as { path?: string; toc?: unknown };
    if (!body.path || !Array.isArray(body.toc)) {
      return c.json({ error: "缺少 path 或 toc 参数" }, 400);
    }
    const file = tocCacheFile(body.path);
    mkdirSync(join(getDataDir(), "pdf-toc"), { recursive: true });
    writeFileSync(file, JSON.stringify(body.toc), "utf-8");
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error?.message || "保存失败" }, 500);
  }
}
