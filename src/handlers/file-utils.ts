import { dirname, extname, join } from "path";
import { homedir } from "os";
import { spawnSync } from "child_process";

export function expandHomePath(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/")) return join(homedir(), input.slice(2));
  return input;
}

export function getGitCreatedAt(filePath: string): number | undefined {
  try {
    const result = spawnSync(
      "git",
      ["log", "--follow", "--diff-filter=A", "--format=%at", "--", filePath],
      { cwd: dirname(filePath), encoding: "utf8", timeout: 3000 }
    );
    if (result.status === 0) {
      const lines = result.stdout.trim().split("\n").filter(Boolean);
      const ts = lines.length > 0 ? parseInt(lines[lines.length - 1], 10) * 1000 : NaN;
      return isNaN(ts) ? undefined : ts;
    }
  } catch {
    // not a git repo or git not available
  }
  return undefined;
}

export function getAssetContentType(path: string): string {
  const ext = extname(path).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".bmp":
      return "image/bmp";
    case ".ico":
      return "image/x-icon";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}
