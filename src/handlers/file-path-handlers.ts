import { basename, dirname, extname, join, resolve } from "path";
import { existsSync, readdirSync, statSync } from "fs";
import type { Context } from "hono";
import { getFileList, isSupportedTextFile, isUrl } from "../utils.ts";
import { expandHomePath } from "./file-utils.ts";

export function handleGetNearby(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);

  if (isUrl(path)) {
    return c.json({ error: "远程文件不支持附近文件功能" });
  }

  const resolvedPath = resolve(path);
  if (!existsSync(resolvedPath)) {
    return c.json({ error: "文件不存在" }, 404);
  }

  const currentDir = dirname(resolvedPath);

  try {
    const siblings = readdirSync(currentDir)
      .filter((f) => isSupportedTextFile(f.toLowerCase()))
      .sort()
      .map((f) => ({
        name: f,
        path: join(currentDir, f),
      }));

    const parentDir = dirname(currentDir);
    const hasParent = parentDir !== currentDir;

    const subdirs = readdirSync(currentDir)
      .filter((f) => {
        const fullPath = join(currentDir, f);
        try {
          return statSync(fullPath).isDirectory();
        } catch {
          return false;
        }
      })
      .map((dir) => {
        const dirPath = join(currentDir, dir);
        const mdFiles = getFileList(dirPath);
        return {
          name: dir,
          path: dirPath,
          count: mdFiles.length,
        };
      })
      .filter((dir) => dir.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    return c.json({
      currentDir: basename(currentDir),
      parentDir: hasParent ? parentDir : null,
      siblings,
      subdirs,
    });
  } catch (e) {
    return c.json({ error: "读取目录失败: " + (e as Error).message }, 500);
  }
}

export function handlePathSuggestions(c: Context) {
  const rawInput = (c.req.query("input") || "").trim();
  const kind = c.req.query("kind") === "directory" ? "directory" : "file";
  const markdownOnly = c.req.query("markdownOnly") !== "false";
  const limit = 30;

  const expandedInput = expandHomePath(rawInput);
  const resolvedInput = expandedInput
    ? resolve(expandedInput)
    : process.cwd();

  let targetDir = resolvedInput;
  let prefix = "";

  try {
    const hasTrailingSlash = expandedInput.endsWith("/");
    const isExistingDir = existsSync(resolvedInput) && statSync(resolvedInput).isDirectory();

    if (!hasTrailingSlash && !isExistingDir) {
      targetDir = dirname(resolvedInput);
      prefix = basename(resolvedInput);
    }

    if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
      return c.json({ baseDir: targetDir, suggestions: [] });
    }

    const prefixLower = prefix.toLowerCase();
    const entries = readdirSync(targetDir, { withFileTypes: true });
    const suggestions: Array<{ path: string; display: string; type: "file" | "directory" }> = [];

    for (const entry of entries) {
      if (!entry.name.toLowerCase().startsWith(prefixLower)) continue;
      if (entry.name.startsWith(".")) continue;

      const fullPath = join(targetDir, entry.name);

      if (entry.isDirectory()) {
        suggestions.push({
          path: `${fullPath}/`,
          display: `${entry.name}/`,
          type: "directory",
        });
        continue;
      }

      if (kind === "directory") continue;
      if (!entry.isFile()) continue;
      if (markdownOnly && !isSupportedTextFile(entry.name.toLowerCase())) continue;

      suggestions.push({
        path: fullPath,
        display: entry.name,
        type: "file",
      });
    }

    const sortedSuggestions = suggestions
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.display.localeCompare(b.display);
      })
      .slice(0, limit);

    return c.json({
      baseDir: targetDir,
      suggestions: sortedSuggestions,
    });
  } catch (e: any) {
    return c.json({ error: `获取路径建议失败: ${e.message}` }, 500);
  }
}

export async function handleDetectPath(c: Context) {
  try {
    const body = await c.req.json() as any;
    const rawPath = typeof body?.path === "string" ? body.path.trim() : "";
    if (!rawPath) {
      return c.json({ kind: "invalid", path: "", error: "缺少 path 参数" }, 400);
    }

    if (isUrl(rawPath)) {
      const url = new URL(rawPath);
      const ext = extname(url.pathname || "").toLowerCase();
      const isMd = ext === ".md" || ext === ".markdown";
      const isHtml = ext === ".html" || ext === ".htm";
      const isPdfFile = ext === ".pdf";
      return c.json({
        kind: isMd ? "md_file" : (isHtml ? "html_file" : (isPdfFile ? "pdf_file" : "other_file")),
        path: rawPath,
        ext: ext || null,
        isUrl: true,
      });
    }

    const expandedPath = expandHomePath(rawPath);
    const resolvedPath = resolve(expandedPath);
    if (!existsSync(resolvedPath)) {
      return c.json({ kind: "not_found", path: resolvedPath });
    }

    let fileStat;
    try {
      fileStat = statSync(resolvedPath);
    } catch (e: any) {
      return c.json({
        kind: "invalid",
        path: resolvedPath,
        error: e?.message || "无法访问路径",
      });
    }

    if (fileStat.isDirectory()) {
      return c.json({ kind: "directory", path: resolvedPath });
    }

    if (fileStat.isFile()) {
      const ext = extname(resolvedPath).toLowerCase();
      const isMd = ext === ".md" || ext === ".markdown";
      const isHtml = ext === ".html" || ext === ".htm";
      const isPdfFile = ext === ".pdf";
      return c.json({
        kind: isMd ? "md_file" : (isHtml ? "html_file" : (isPdfFile ? "pdf_file" : "other_file")),
        path: resolvedPath,
        ext: ext || null,
      });
    }

    return c.json({ kind: "invalid", path: resolvedPath, error: "不支持的路径类型" });
  } catch (error: any) {
    return c.json({
      kind: "invalid",
      path: "",
      error: error.message || "路径检测失败",
    }, 500);
  }
}

export async function handleInferWorkspace(c: Context) {
  const body = await c.req.json() as any;
  const filePath = typeof body?.filePath === "string" ? body.filePath.trim() : "";
  if (!filePath) return c.json({ error: "缺少 filePath 参数" }, 400);

  let dir = dirname(resolve(filePath));
  while (true) {
    if (existsSync(join(dir, ".git"))) {
      return c.json({ workspacePath: dir, workspaceName: basename(dir) });
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return c.json({ error: "未找到 .git 目录" }, 404);
}
