/**
 * km-cli 命令封装
 * 提供与学城交互的接口
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface KmDocResult {
  success: boolean;
  docId?: string;
  url?: string;
  title?: string;
  error?: string;
  output?: string;
  command?: string; // 执行的命令
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function dedupeSections(sections: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const section of sections) {
    const normalized = normalizeWhitespace(section);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function isHtmlResponseError(text: string): boolean {
  const normalized = (text || "").toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes("parse json response") &&
    normalized.includes("invalid character '<'") &&
    (normalized.includes("response preview: <!doctype html") ||
      normalized.includes("response preview: <html"))
  );
}

function buildAuthExpiredHint(): string {
  return [
    "检测到学城接口返回了 HTML 页面而不是 JSON，通常是登录态失效或认证跳转导致。",
    "请先在终端重新登录 km-cli 后重试（例如：`km-cli auth login`）。",
  ].join("\n");
}

/**
 * 创建学城文档
 */
export async function createKmDoc(options: {
  parentId: string;
  title: string;
  markdownFile: string;
}): Promise<KmDocResult> {
  const cmd = `km-cli doc create --parent-id "${options.parentId}" --title "${options.title}" --markdown-file "${options.markdownFile}" --json`;
  const outputFallback = (
    stdout: string | undefined,
    stderr: string | undefined,
    message?: string
  ): string => {
    const rawSections = [
      stdout && stdout.trim() ? `STDOUT:\n${stdout}` : "",
      stderr && stderr.trim() ? `STDERR:\n${stderr}` : "",
      message ? `ERROR:\n${message}` : "",
    ].filter(Boolean) as string[];

    const parts = dedupeSections(rawSections);

    if (parts.length > 0) return parts.join("\n\n");
    return "km-cli 未返回可读输出（stdout/stderr 为空）。请检查 km-cli 登录状态与网络。";
  };

  try {
    const { stdout, stderr } = await execAsync(cmd);

    // 检查是否有错误输出
    if (stderr && stderr.trim()) {
      return {
        success: false,
        error: "km-cli 执行失败",
        output: outputFallback(stdout, stderr),
        command: cmd,
      };
    }

    // 检查输出是否包含 "Error:" 或 "Usage:"
    if (stdout.includes("Error:") || stdout.includes("Usage:")) {
      return {
        success: false,
        error: "km-cli 执行失败",
        output: stdout,
        command: cmd,
      };
    }

    // 尝试解析 JSON 输出
    try {
      const result = JSON.parse(stdout);

      // km-cli 返回的字段可能是 id 或 contentId
      const docId = result.id || result.contentId || result.docId;
      const url = result.url || result.link || `https://km.woa.com/pages/${docId}`;

      return {
        success: true,
        docId,
        url,
        title: result.title || options.title,
        command: cmd,
        output: stdout, // 成功时也保存输出
      };
    } catch (parseError) {
      // JSON 解析失败，但命令可能成功了
      // 尝试从输出中提取信息
      const urlMatch = stdout.match(/https?:\/\/[^\s]+/);
      const idMatch = stdout.match(/\b\d{6,}\b/);

      if (urlMatch || idMatch) {
        return {
          success: true,
          docId: idMatch ? idMatch[0] : undefined,
          url: urlMatch ? urlMatch[0] : undefined,
          title: options.title,
          command: cmd,
          output: stdout,
        };
      }

      // 完全无法解析，返回原始输出
      return {
        success: false,
        error: "无法解析 km-cli 输出",
        output: outputFallback(stdout, stderr, "无法解析 km-cli 输出"),
        command: cmd,
      };
    }
  } catch (error: any) {
    // 命令执行失败（通常是 exit code 非 0）
    const output = outputFallback(error.stdout, error.stderr, error.message);
    const authExpired = isHtmlResponseError(output);

    return {
      success: false,
      error: authExpired ? "学城登录状态失效，请重新登录 km-cli" : "km-cli 执行失败",
      output: authExpired ? `${buildAuthExpiredHint()}\n\n${output}` : output,
      command: cmd,
    };
  }
}

/**
 * 获取文档元数据
 */
export async function getKmDocMeta(contentId: string): Promise<any> {
  const cmd = `km-cli doc get-meta --content-id "${contentId}" --json`;

  try {
    const { stdout } = await execAsync(cmd);
    return JSON.parse(stdout);
  } catch (error: any) {
    const output = [
      error?.stdout ? `STDOUT:\n${error.stdout}` : "",
      error?.stderr ? `STDERR:\n${error.stderr}` : "",
      error?.message ? `ERROR:\n${error.message}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    if (isHtmlResponseError(output)) {
      throw new Error(`获取文档元数据失败: 学城登录状态失效，请重新登录 km-cli。\n${buildAuthExpiredHint()}`);
    }
    throw new Error(`获取文档元数据失败: ${error.message}`);
  }
}

/**
 * 验证 parent-id 是否有效
 */
export async function validateParentId(parentId: string): Promise<boolean> {
  try {
    await getKmDocMeta(parentId);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查 km-cli 是否已安装
 */
export async function checkKmCliInstalled(): Promise<boolean> {
  try {
    await execAsync("which km-cli");
    return true;
  } catch {
    return false;
  }
}
