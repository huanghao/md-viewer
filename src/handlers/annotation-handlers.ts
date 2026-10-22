import type { Context } from "hono";
import { calculateOpenCount } from "../annotation-status.ts";
import {
  appendAnnotationReply,
  clearAllAnnotations,
  deleteAnnotation,
  importLegacyAnnotations,
  listAnnotatedDocuments,
  listAnnotations,
  listQuickComments,
  replaceQuickComments,
  resolveAllOpenAnnotations,
  syncAnnotationAnchors,
  updateAnnotationStatus,
  upsertAnnotation,
} from "../annotation-storage.ts";

export async function handleGetAnnotationSummaries(c: Context) {
  try {
    const docs = listAnnotatedDocuments(1000, 0);
    const summaries: Record<string, { count: number; unanchoredCount: number; updatedAt: number }> = {};
    for (const doc of docs) {
      const openCount = calculateOpenCount(doc.anchoredCount, doc.unanchoredCount, doc.resolvedCount);
      const unanchoredCount = doc.unanchoredCount ?? 0;
      if (openCount > 0) {
        summaries[doc.path] = {
          count: openCount,
          unanchoredCount,
          updatedAt: doc.latestUpdatedAt,
        };
      }
    }
    return c.json({ summaries });
  } catch (error: any) {
    return c.json({ error: error?.message || "获取批注摘要失败" }, 500);
  }
}

export async function handleGetAnnotations(c: Context) {
  try {
    const filePath = c.req.query("path") || "";
    if (!filePath) return c.json({ annotations: [] });
    const annotations = listAnnotations(filePath);
    return c.json({ annotations });
  } catch (error: any) {
    return c.json({ error: error?.message || "获取评论失败" }, 500);
  }
}

interface AnnotationRef {
  path: string;
  id: string | undefined;
  serial: number | undefined;
}

function parseAnnotationRef(body: any): AnnotationRef {
  const path = typeof body?.path === "string" ? body.path : "";
  const id = typeof body?.id === "string" ? body.id : undefined;
  const serial = Number(body?.serial);
  const validSerial = Number.isFinite(serial) && serial > 0 ? Math.floor(serial) : undefined;
  return { path, id, serial: validSerial };
}

export async function handleUpsertAnnotation(c: Context) {
  try {
    const body = await c.req.json();
    const { path } = parseAnnotationRef(body);
    const annotation = body?.annotation;
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = upsertAnnotation(path, annotation);
    if (!result.ok) return c.json({ error: result.error || "保存评论失败" }, 400);
    return c.json({ success: true, annotation: result.annotation });
  } catch (error: any) {
    return c.json({ error: error?.message || "保存评论失败" }, 500);
  }
}

export async function handleSyncAnnotationAnchors(c: Context) {
  try {
    const body = await c.req.json();
    const { path } = parseAnnotationRef(body);
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);
    const items = Array.isArray(body?.anchors) ? body.anchors : [];
    return c.json({ success: true, ...syncAnnotationAnchors(path, items) });
  } catch (error: any) {
    return c.json({ error: error?.message || "同步评论锚点失败" }, 500);
  }
}

export async function handleReplyAnnotation(c: Context) {
  try {
    const body = await c.req.json();
    const { path, id, serial } = parseAnnotationRef(body);
    const text = typeof body?.text === "string" ? body.text : "";
    const author = typeof body?.author === "string" ? body.author : "me";
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = appendAnnotationReply(path, { id, serial }, text, author);
    if (!result.ok) return c.json({ error: result.error || "回复评论失败" }, 400);
    return c.json({ success: true, annotation: result.updated });
  } catch (error: any) {
    return c.json({ error: error?.message || "回复评论失败" }, 500);
  }
}

export async function handleDeleteAnnotation(c: Context) {
  try {
    const body = await c.req.json();
    const { path, id, serial } = parseAnnotationRef(body);
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = deleteAnnotation(path, { id, serial });
    if (!result.ok) return c.json({ error: result.error || "删除评论失败" }, 400);
    return c.json({ success: true, deleted: true });
  } catch (error: any) {
    return c.json({ error: error?.message || "删除评论失败" }, 500);
  }
}

export async function handleUpdateAnnotationStatus(c: Context) {
  try {
    const body = await c.req.json();
    const { path, id, serial } = parseAnnotationRef(body);
    const statusRaw = String(body?.status || "anchored");
    const status = statusRaw === "resolved" || statusRaw === "unanchored" ? statusRaw : "anchored";
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = updateAnnotationStatus(path, { id, serial }, status);
    if (!result.ok) return c.json({ error: result.error || "更新评论状态失败" }, 400);
    return c.json({ success: true, annotation: result.updated });
  } catch (error: any) {
    return c.json({ error: error?.message || "更新评论状态失败" }, 500);
  }
}

export async function handleResolveAllAnnotations(c: Context) {
  try {
    const body = await c.req.json();
    const path = String(body?.path || "");
    if (!path) return c.json({ error: "缺少 path 参数" }, 400);

    const result = resolveAllOpenAnnotations(path);
    return c.json({ success: true, updated: result.updated });
  } catch (error: any) {
    return c.json({ error: error?.message || "批量解决评论失败" }, 500);
  }
}

export async function handleMigrateAnnotations(c: Context) {
  try {
    const body = await c.req.json();
    const byPath = body?.byPath && typeof body.byPath === "object" ? body.byPath : {};
    const result = importLegacyAnnotations(byPath);
    return c.json({ success: true, ...result });
  } catch (error: any) {
    return c.json({ error: error?.message || "迁移评论失败" }, 500);
  }
}

export async function handleClearAllAnnotations(c: Context) {
  try {
    const result = clearAllAnnotations();
    return c.json({ success: true, ...result });
  } catch (error: any) {
    return c.json({ error: error?.message || "清空评论失败" }, 500);
  }
}

export function handleGetQuickComments(c: Context) {
  return c.json({ items: listQuickComments() });
}

export async function handleUpsertQuickComments(c: Context) {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid JSON" }, 400);
  }
  if (!Array.isArray(body.items)) return c.json({ error: "items must be array" }, 400);
  const sanitized = body.items
    .map((it: any) => ({ text: String(it.text ?? "").trim() }))
    .filter((it: { text: string }) => it.text.length > 0)
    .slice(0, 50);
  replaceQuickComments(sanitized);
  return c.json({ ok: true });
}
