import type { Hono } from "hono";
import {
  handleGetFileAsset,
  handleGetPdfAsset,
} from "../handlers/file-asset-handlers.ts";
import {
  handleFileCreatedAt,
  handleOpenFile,
  handleOpenInEditor,
  handleOpenLocalFile,
} from "../handlers/file-open-handlers.ts";
import {
  handleDetectPath,
  handleGetNearby,
  handlePathSuggestions,
} from "../handlers/file-path-handlers.ts";
import {
  handleGetFile,
  handleGetFiles,
  handleUnwatchFile,
} from "../handlers/file-read-handlers.ts";
import {
  handleWriteFile,
} from "../handlers/file-write-handlers.ts";

export function registerFileRoutes(app: Hono): void {
  app.get("/api/file", handleGetFile);
  app.post("/api/unwatch-file", handleUnwatchFile);
  app.get("/api/file-asset", handleGetFileAsset);
  app.get("/api/pdf-asset", handleGetPdfAsset);
  app.post("/api/file-write", handleWriteFile);
  app.get("/api/files", handleGetFiles);
  app.get("/api/nearby", handleGetNearby);
  app.get("/api/path-suggestions", handlePathSuggestions);
  app.post("/api/detect-path", handleDetectPath);
  app.post("/api/open-file", handleOpenFile);
  app.post("/api/open-local-file", handleOpenLocalFile);
  app.post("/api/open-in-editor", handleOpenInEditor);
  app.post("/api/file-created-at", handleFileCreatedAt);
}
