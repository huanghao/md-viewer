import type { Hono } from "hono";
import {
  handleGetAgentRuns,
  handleGetAgentSession,
  handleGetAgentUsage,
  handleGetRunsBySession,
  handleLinkAgentSession,
  handleListAgentBackends,
  handleListRecentAgentRuns,
  handleListWorkspaceAgentSessions,
  handleNewAgentSession,
  handleStartAgentRun,
} from "../handlers/agent-handlers.ts";

export function registerAgentRoutes(app: Hono): void {
  app.post("/api/agent/run", handleStartAgentRun);
  app.get("/api/agent/backends", handleListAgentBackends);
  app.get("/api/agent/runs", handleGetAgentRuns);
  app.get("/api/agent/runs/recent", handleListRecentAgentRuns);
  app.get("/api/agent/runs/by-session", handleGetRunsBySession);
  app.get("/api/agent/usage", handleGetAgentUsage);
  app.get("/api/agent/session", handleGetAgentSession);
  app.get("/api/agent/sessions", handleListWorkspaceAgentSessions);
  app.post("/api/agent/session/link", handleLinkAgentSession);
  app.post("/api/agent/session/new", handleNewAgentSession);
}
