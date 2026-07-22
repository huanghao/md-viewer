import type { Hono } from "hono";
import {
  handleGetWorkspaceAgentCommand,
  handleGetWorkspaces,
  handleRegisterWorkspace,
  handleScanWorkspace,
  handleSetWorkspaceAgentCommand,
  handleUnregisterWorkspace,
  handleWorkspaceIndexStats,
  handleWorkspaceSearch,
} from "../handlers/workspace-handlers.ts";

export function registerWorkspaceRoutes(app: Hono): void {
  app.post("/api/scan-workspace", handleScanWorkspace);
  app.post("/api/register-workspace", handleRegisterWorkspace);
  app.post("/api/unregister-workspace", handleUnregisterWorkspace);
  app.get("/api/workspaces", handleGetWorkspaces);
  app.get("/api/workspace-search", handleWorkspaceSearch);
  app.get("/api/workspace-index/stats", handleWorkspaceIndexStats);
  app.get("/api/workspace-agent-command", handleGetWorkspaceAgentCommand);
  app.post("/api/workspace-agent-command", handleSetWorkspaceAgentCommand);
}
