import type { Context } from "hono";
import { deleteSnapshot, getSnapshot, saveSnapshot } from "../snapshot-storage.ts";

export async function handleGetSnapshot(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);
  const snap = getSnapshot(path);
  if (!snap) return c.json({ exists: false }, 404);
  return c.json({ exists: true, content: snap.content, savedAt: snap.savedAt });
}

export async function handleSaveSnapshot(c: Context) {
  try {
    const body = await c.req.json();
    const { path, content } = body ?? {};
    if (!path || typeof content !== "string") return c.json({ error: "缺少 path 或 content 参数" }, 400);
    const created = saveSnapshot(path, content);
    return c.json({ ok: true, created });
  } catch (e: any) {
    return c.json({ error: e?.message || "保存失败" }, 500);
  }
}

export async function handleDeleteSnapshot(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);
  deleteSnapshot(path);
  return c.json({ ok: true });
}
