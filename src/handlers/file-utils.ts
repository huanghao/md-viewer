import { dirname, extname, join } from "path";
import { homedir } from "os";

export function expandHomePath(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/")) return join(homedir(), input.slice(2));
  return input;
}

// git 首次提交时间：文件的创建时间不会变，正结果永久缓存；失败（非仓库 / 未提交）短期缓存，
// 避免每次打开或每次启动都重新跑 git。异步执行，不阻塞服务端事件循环。
const GIT_CREATED_AT_TIMEOUT_MS = 3000;
const GIT_CREATED_AT_NEGATIVE_TTL_MS = 60_000;
const gitCreatedAtCache = new Map<string, { value: number | undefined; expiresAt: number }>();

export async function getGitCreatedAt(filePath: string): Promise<number | undefined> {
  const now = Date.now();
  const hit = gitCreatedAtCache.get(filePath);
  if (hit && (hit.value !== undefined || hit.expiresAt > now)) return hit.value;
  const value = await runGitCreatedAt(filePath);
  gitCreatedAtCache.set(filePath, {
    value,
    expiresAt: value === undefined ? now + GIT_CREATED_AT_NEGATIVE_TTL_MS : Infinity,
  });
  return value;
}

async function runGitCreatedAt(filePath: string): Promise<number | undefined> {
  try {
    const proc = Bun.spawn(
      ["git", "log", "--follow", "--diff-filter=A", "--format=%at", "--", filePath],
      { cwd: dirname(filePath), stdout: "pipe", stderr: "ignore" }
    );
    const timer = setTimeout(() => proc.kill(), GIT_CREATED_AT_TIMEOUT_MS);
    try {
      const [out, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
      if (code !== 0) return undefined;
      const lines = out.trim().split("\n").filter(Boolean);
      const ts = lines.length > 0 ? parseInt(lines[lines.length - 1], 10) * 1000 : NaN;
      return isNaN(ts) ? undefined : ts;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // not a git repo or git not available
    return undefined;
  }
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
