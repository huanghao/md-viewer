import { readFileSync, existsSync, statSync, readdirSync } from "fs";
import { resolve, basename } from "path";

// ==================== 日志 ====================

export function log(msg: string) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}

// ==================== 文件相关 ====================

export function isMarkdown(path: string): boolean {
  return path.endsWith(".md") || path.endsWith(".markdown");
}

export function isUrl(path: string): boolean {
  try {
    const url = new URL(path);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function readMarkdownFile(path: string): { content: string; error?: string } {
  try {
    if (!existsSync(path)) {
      return { content: "", error: `文件不存在: ${path}` };
    }
    const content = readFileSync(path, "utf-8");
    return { content };
  } catch (e) {
    return { content: "", error: `读取失败: ${e}` };
  }
}

export function getLastModified(path: string): number | undefined {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return undefined;
  }
}

export function getFileList(dir: string): string[] {
  try {
    const files = readdirSync(dir, { recursive: true }) as string[];
    return files
      .filter((f) => isMarkdown(f))
      .map((f) => resolve(dir, f))
      .sort();
  } catch {
    return [];
  }
}

// ==================== 远程文件相关 ====================

// 支持的文本 content-type 白名单
const SUPPORTED_TEXT_TYPES = [
  "text/markdown",
  "text/x-markdown",
  "text/plain",
  "text/x-plain",
  "application/octet-stream", // 有些服务器用默认类型
];

const UNSUPPORTED_TYPES = [
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/json",
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/zip",
];

export function isSupportedContentType(contentType: string): { supported: boolean; reason?: string } {
  const type = contentType.toLowerCase().split(";")[0].trim();
  
  // 检查是否在支持列表
  if (SUPPORTED_TEXT_TYPES.some(t => type.includes(t) || t.includes(type))) {
    return { supported: true };
  }
  
  // 检查是否明确不支持
  if (UNSUPPORTED_TYPES.some(t => type.includes(t))) {
    return { 
      supported: false, 
      reason: `不支持的文件类型: ${contentType}` 
    };
  }
  
  // 未知类型，尝试当作文本处理（如 text/*）
  if (type.startsWith("text/")) {
    return { supported: true };
  }
  
  // 其他未知类型，保守起见允许尝试
  return { supported: true };
}

export async function checkRemoteContentType(url: string): Promise<{ ok: boolean; contentType?: string; error?: string }> {
  try {
    // 先用 HEAD 预检
    const headResponse = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "MD-Viewer/1.0",
      },
    });
    
    if (!headResponse.ok) {
      return { ok: false, error: `HTTP ${headResponse.status}: ${headResponse.statusText}` };
    }
    
    const contentType = headResponse.headers.get("content-type") || "";
    const check = isSupportedContentType(contentType);
    
    if (!check.supported) {
      return { ok: false, contentType, error: check.reason };
    }
    
    return { ok: true, contentType };
  } catch (e: any) {
    return { ok: false, error: `预检失败: ${e.message}` };
  }
}

export async function fetchRemoteMarkdown(url: string): Promise<{ content: string; error?: string; contentType?: string }> {
  // 先预检 content-type
  const check = await checkRemoteContentType(url);
  if (!check.ok) {
    return { content: "", error: check.error };
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "MD-Viewer/1.0",
      },
    });
    if (!response.ok) {
      return { content: "", error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const contentType = response.headers.get("content-type") || "";
    const content = await response.text();
    
    // 二次检查：如果内容是 HTML 标签开头，也拒绝
    const trimmed = content.trim().toLowerCase();
    if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<head") || trimmed.startsWith("<body")) {
      return { 
        content, 
        contentType: "text/html",
        error: "该 URL 返回的是 HTML 网页而非 Markdown 文件。提示: 尝试添加 /README.md 到 URL 末尾"
      };
    }
    
    return { content, contentType };
  } catch (e: any) {
    return { content: "", error: `请求失败: ${e.message}` };
  }
}
