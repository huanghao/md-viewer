import { resolve } from "path";
import type { Context } from "hono";

export async function handleWriteFile(c: Context) {
  try {
    const body = await c.req.json() as { path?: string; content?: string };
    if (!body.path || typeof body.content !== "string") {
      return c.json({ error: "缺少 path 或 content 参数" }, 400);
    }

    if (!body.path.endsWith(".toc.json")) {
      return c.json({ error: "仅允许写入 .toc.json 文件" }, 403);
    }

    const resolvedPath = resolve(body.path);
    await Bun.write(resolvedPath, body.content);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error?.message || "写入文件失败" }, 500);
  }
}
