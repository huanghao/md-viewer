import type { Hono } from "hono";
import {
  handleDeleteSnapshot,
  handleGetSnapshot,
  handleSaveSnapshot,
} from "../handlers/snapshot-handlers.ts";

export function registerSnapshotRoutes(app: Hono): void {
  app.get("/api/snapshot", handleGetSnapshot);
  app.post("/api/snapshot", handleSaveSnapshot);
  app.delete("/api/snapshot", handleDeleteSnapshot);
}
