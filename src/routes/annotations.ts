import type { Hono } from "hono";
import {
  handleClearAllAnnotations,
  handleDeleteAnnotation,
  handleGetAnnotationSummaries,
  handleGetAnnotations,
  handleGetQuickComments,
  handleMigrateAnnotations,
  handleReplyAnnotation,
  handleUpdateAnnotationStatus,
  handleUpsertAnnotation,
  handleUpsertQuickComments,
} from "../handlers/annotation-handlers.ts";

export function registerAnnotationRoutes(app: Hono): void {
  app.get("/api/annotations/summaries", handleGetAnnotationSummaries);
  app.get("/api/annotations", handleGetAnnotations);
  app.post("/api/annotations/item", handleUpsertAnnotation);
  app.post("/api/annotations/reply", handleReplyAnnotation);
  app.post("/api/annotations/delete", handleDeleteAnnotation);
  app.post("/api/annotations/status", handleUpdateAnnotationStatus);
  app.post("/api/annotations/migrate", handleMigrateAnnotations);
  app.post("/api/annotations/clear", handleClearAllAnnotations);
  app.get("/api/quick-comments", handleGetQuickComments);
  app.post("/api/quick-comments", handleUpsertQuickComments);
}
