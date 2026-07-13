import type { Hono } from "hono";
import {
  handleEvents,
  handleGetClientConfig,
  handleGetSessionState,
  handleUpdateSessionState,
} from "../handlers/session-handlers.ts";

export function registerSessionRoutes(app: Hono): void {
  app.get("/api/events", handleEvents);
  app.get("/api/session-state", handleGetSessionState);
  app.post("/api/session-state", handleUpdateSessionState);
  app.get("/api/config", () => handleGetClientConfig());
}
