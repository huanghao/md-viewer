import type { Hono } from "hono";
import {
  handleDeleteAnnotation,
  handleGetAnnotationSummaries,
  handleGetAnnotations,
  handleGetQuickComments,
  handleMigrateAnnotations,
  handleReplyAnnotation,
  handleResolveAllAnnotations,
  handleSyncAnnotationAnchors,
  handleUpdateAnnotationStatus,
  handleUpsertAnnotation,
  handleUpsertQuickComments,
} from "../handlers/annotation-handlers.ts";

export function registerAnnotationRoutes(app: Hono): void {
  app.get("/api/annotations/summaries", handleGetAnnotationSummaries);
  app.get("/api/annotations", handleGetAnnotations);
  app.post("/api/annotations/item", handleUpsertAnnotation);
  app.post("/api/annotations/reply", handleReplyAnnotation);
  app.post("/api/annotations/anchors", handleSyncAnnotationAnchors);
  app.post("/api/annotations/delete", handleDeleteAnnotation);
  app.post("/api/annotations/status", handleUpdateAnnotationStatus);
  app.post("/api/annotations/resolve-all", handleResolveAllAnnotations);
  app.post("/api/annotations/migrate", handleMigrateAnnotations);
  app.get("/api/quick-comments", handleGetQuickComments);
  app.post("/api/quick-comments", handleUpsertQuickComments);
}
