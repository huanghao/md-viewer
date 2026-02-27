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
}

/**
 * 创建学城文档
 */
export async function createKmDoc(options: {
  parentId: string;
  title: string;
  markdownFile: string;
}): Promise<KmDocResult> {
  try {
    const cmd = `km-cli doc create --parent-id "${options.parentId}" --title "${options.title}" --markdown-file "${options.markdownFile}" --json`;

    const { stdout, stderr } = await execAsync(cmd);

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
        };
      }

      // 完全无法解析，返回原始输出
      return {
        success: false,
        error: "无法解析 km-cli 输出",
        output: stdout + "\n" + stderr,
      };
    }
  } catch (error: any) {
    // 命令执行失败
    return {
      success: false,
      error: error.message || "km-cli 执行失败",
      output: error.stdout + "\n" + error.stderr,
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
