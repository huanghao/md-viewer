#!/usr/bin/env bun
/**
 * MD Viewer CLI - 命令行客户端
 * 用法: md-viewer-cli <文件路径> [选项]
 */

import { resolve, basename } from "path";
import { existsSync, statSync } from "fs";
import { spawn } from "child_process";

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "localhost";

interface CliOptions {
  port: number;
  host: string;
  help: boolean;
}

function showHelp() {
  console.log(`
📖 MD Viewer CLI - Markdown Viewer 命令行客户端

用法:
  md-viewer-cli <文件路径>  在浏览器中打开指定 Markdown 文件
  md-viewer-cli --help      显示帮助信息

选项:
  -p, --port <端口>        指定服务器端口 (默认: 3000)
  -h, --host <主机>        指定服务器主机 (默认: localhost)

示例:
  md-viewer-cli README.md              # 打开当前目录的 README.md
  md-viewer-cli /path/to/document.md   # 打开指定路径的文件
  md-viewer-cli -p 3001 notes.md       # 使用端口 3001

注意:
  使用前请确保 MD Viewer Server 已启动:
    bun run src/server.ts
  或
    bun run dev
`);
}

function parseArgs(args: string[]): { filePath: string | null; options: CliOptions } {
  const options: CliOptions = {
    port: DEFAULT_PORT,
    host: DEFAULT_HOST,
    help: false,
  };

  let filePath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      // 检查是否是 -h 作为 host 的简写
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        options.host = args[++i];
      } else {
        options.help = true;
      }
    } else if (arg === "--port" || arg === "-p") {
      const port = parseInt(args[++i], 10);
      if (!isNaN(port)) {
        options.port = port;
      }
    } else if (arg === "--host") {
      options.host = args[++i];
    } else if (!arg.startsWith("-") && !filePath) {
      filePath = arg;
    }
  }

  return { filePath, options };
}

function validateFile(filePath: string): { valid: boolean; absolutePath: string; error?: string } {
  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    return { valid: false, absolutePath, error: `文件不存在: ${filePath}` };
  }

  const stats = statSync(absolutePath);
  if (!stats.isFile()) {
    return { valid: false, absolutePath, error: `不是文件: ${filePath}` };
  }

  if (!filePath.endsWith(".md") && !filePath.endsWith(".markdown")) {
    console.warn(`⚠️  警告: ${basename(filePath)} 可能不是 Markdown 文件`);
  }

  return { valid: true, absolutePath };
}

function openBrowser(url: string) {
  const platform = process.platform;
  let command: string;

  switch (platform) {
    case "darwin":
      command = "open";
      break;
    case "win32":
      command = "start";
      break;
    default:
      command = "xdg-open";
  }

  console.log(`🌐 正在打开浏览器: ${url}`);
  spawn(command, [url], { detached: true, stdio: "ignore" });
}

async function checkServer(host: string, port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://${host}:${port}/`, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const { filePath, options } = parseArgs(args);

  if (options.help || !filePath) {
    showHelp();
    process.exit(filePath ? 0 : 1);
  }

  // 验证文件
  const validation = validateFile(filePath);
  if (!validation.valid) {
    console.error(`❌ ${validation.error}`);
    process.exit(1);
  }

  console.log(`📄 文件: ${basename(validation.absolutePath)}`);
  console.log(`📂 路径: ${validation.absolutePath}`);

  // 检查服务器是否运行
  const serverRunning = await checkServer(options.host, options.port);
  if (!serverRunning) {
    console.error(`\n❌ 无法连接到 MD Viewer Server`);
    console.error(`   请确保服务器已启动:`);
    console.error(`   bun run src/server.ts`);
    console.error(`   或`);
    console.error(`   bun run dev`);
    process.exit(1);
  }

  // 构建 URL 并打开浏览器
  const encodedPath = encodeURIComponent(validation.absolutePath);
  const url = `http://${options.host}:${options.port}/?open=${encodedPath}`;

  console.log(`✅ 服务器已连接 (${options.host}:${options.port})`);
  openBrowser(url);
}

main().catch((err) => {
  console.error("❌ 错误:", err);
  process.exit(1);
});
