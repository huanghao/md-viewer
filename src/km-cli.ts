/**
 * oa-skills citadel 命令封装
 * 提供与学城交互的接口
 */

import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const execAsync = promisify(exec);

function getMisId(): string {
  const catpawConfig = join(homedir(), ".catpaw", "sso_config.json");
  if (existsSync(catpawConfig)) {
    try {
      const cfg = JSON.parse(readFileSync(catpawConfig, "utf-8"));
      if (cfg.misId) return cfg.misId;
    } catch {
      // ignore
    }
  }
  return "";
}

function buildMisFlag(): string {
  const mis = getMisId();
  return mis ? `--mis ${mis}` : "";
}

/**
 * oa-skills 把日志和 JSON 都输出到 stdout，提取最后一个完整 JSON 对象/数组
 */
function extractJson(stdout: string): any {
  // 找最后一个以 { 或 [ 开头的行，往后截取
  const lines = stdout.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const candidate = lines.slice(i).join("\n");
      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }
  }
  // 再试一次：直接找第一个完整 JSON 块
  const match = stdout.match(/(\{[\s\S]*\}|\[[\s\S]*\])\s*$/);
  if (match) return JSON.parse(match[1]);
  throw new Error("无法从输出中提取 JSON");
}

export interface KmDocResult {
  success: boolean;
  docId?: string;
  url?: string;
  title?: string;
  error?: string;
  output?: string;
  command?: string;
}

/**
 * 创建学城文档
 */
export async function createKmDoc(options: {
  parentId: string;
  title: string;
  markdownFile: string;
}): Promise<KmDocResult> {
  const mis = buildMisFlag();
  const cmd = `oa-skills citadel createDocument --parentId "${options.parentId}" --title "${options.title}" --file "${options.markdownFile}" --raw${mis ? ` ${mis}` : ""}`;

  try {
    const { stdout } = await execAsync(cmd);

    try {
      const result = extractJson(stdout);
      const docId = result.contentId || result.id || result.docId;
      const url = result.url || result.link || (docId ? `https://km.sankuai.com/collabpage/${docId}` : undefined);

      if (!docId) {
        return {
          success: false,
          error: "oa-skills 未返回文档 ID",
          output: stdout,
          command: cmd,
        };
      }

      return {
        success: true,
        docId,
        url,
        title: result.title || options.title,
        command: cmd,
        output: stdout,
      };
    } catch {
      // JSON 解析失败，尝试从输出中提取 URL/ID
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

      return {
        success: false,
        error: "无法解析 oa-skills 输出",
        output: stdout || "oa-skills 未返回可读输出",
        command: cmd,
      };
    }
  } catch (error: any) {
    const output = [
      error?.stdout?.trim() ? `STDOUT:\n${error.stdout}` : "",
      error?.stderr?.trim() ? `STDERR:\n${error.stderr}` : "",
      error?.message ? `ERROR:\n${error.message}` : "",
    ].filter(Boolean).join("\n\n");

    return {
      success: false,
      error: "oa-skills 执行失败",
      output: output || "oa-skills 未返回可读输出",
      command: cmd,
    };
  }
}

/**
 * 获取文档元数据（返回包含 title、contentId 的对象）
 */
export async function getKmDocMeta(contentId: string): Promise<any> {
  const mis = buildMisFlag();
  const cmd = `oa-skills citadel getMarkdown --contentId "${contentId}" --raw${mis ? ` ${mis}` : ""}`;

  try {
    const { stdout } = await execAsync(cmd);
    return extractJson(stdout);
  } catch (error: any) {
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
 * 检查 oa-skills 是否已安装
 */
export async function checkKmCliInstalled(): Promise<boolean> {
  try {
    await execAsync("which oa-skills");
    return true;
  } catch {
    return false;
  }
}
