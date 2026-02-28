#!/usr/bin/env bun
/**
 * MD Viewer CLI - 命令行客户端
 * 向 Server 发送请求，添加文件到展示列表
 */

import { resolve } from "path";
import { existsSync } from "fs";
import { loadConfig, getConfigDir } from "./config.ts";

const config = loadConfig();
const DEFAULT_PORT = config.server.port;
const DEFAULT_HOST = config.server.host;

interface CliOptions {
  port: number;
  host: string;
  focus: boolean;
  noFocus: boolean;
  help: boolean;
}

function showHelp() {
  console.log(`
📖 MD Viewer CLI - 命令行客户端

用法:
  md-viewer-cli <文件路径>      将文件添加到 Server 展示列表
  md-viewer-cli --help          显示帮助信息

选项:
  -p, --port <端口>             指定服务器端口 (默认: ${DEFAULT_PORT})
  -h, --host <主机>             指定服务器主机 (默认: ${DEFAULT_HOST})
  --no-focus                    添加后不切换到该文件（默认会切换）

配置文件:
  ${getConfigDir()}/config.json

示例:
  md-viewer-cli README.md               # 添加并切换到该文件（默认）
  md-viewer-cli --no-focus README.md    # 添加文件，不切换
  md-viewer-cli -p 3001 notes.md        # 指定端口并切换
`);
}

function isUrl(path: string): boolean {
  try {
    const url = new URL(path);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseArgs(args: string[]): { filePath: string | null; options: CliOptions } {
  const options: CliOptions = {
    port: DEFAULT_PORT,
    host: DEFAULT_HOST,
    focus: true,
    noFocus: false,
    help: false,
  };

  let filePath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help") {
      options.help = true;
    } else if (arg === "--port" || arg === "-p") {
      const port = parseInt(args[++i], 10);
      if (!isNaN(port)) {
        options.port = port;
      }
    } else if (arg === "--host" || arg === "-h") {
      options.host = args[++i];
    } else if (arg === "--no-focus") {
      options.noFocus = true;
    } else if (!arg.startsWith("-") && !filePath) {
      filePath = arg;
    }
  }

  return { filePath, options };
}

async function openFile(host: string, port: number, filePath: string, focus: boolean): Promise<void> {
  const url = `http://${host}:${port}/api/open-file`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath, focus }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  const action = focus ? "已添加并切换" : "已添加";
  console.log(`✅ ${action}: ${result.filename}`);
}

async function main() {
  const args = process.argv.slice(2);
  const { filePath, options } = parseArgs(args);

  if (options.help || !filePath) {
    showHelp();
    process.exit(filePath ? 0 : 1);
  }

  // 判断是 URL 还是本地文件
  const isRemoteUrl = isUrl(filePath);
  let targetPath: string;

  if (isRemoteUrl) {
    targetPath = filePath;
  } else {
    // 验证本地文件存在
    const absolutePath = resolve(filePath);
    if (!existsSync(absolutePath)) {
      console.error(`❌ 文件不存在: ${filePath}`);
      process.exit(1);
    }
    targetPath = absolutePath;

    // 检查文件类型，非 MD 文件给出警告
    const ext = targetPath.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
    if (ext && ext !== 'md' && ext !== 'markdown') {
      console.warn(`⚠️  警告: ${filePath} 不是 Markdown 文件 (.${ext})，可能显示异常`);
    }
  }

  try {
    const shouldFocus = !options.noFocus;
    await openFile(options.host, options.port, targetPath, shouldFocus);
  } catch (e: any) {
    if (e.cause?.code === "ECONNREFUSED") {
      console.error(`❌ 无法连接到 Server (${options.host}:${options.port})`);
      console.error(`   请确保 Server 已启动: bun run dev`);
    } else {
      console.error(`❌ 错误: ${e.message}`);
    }
    process.exit(1);
  }
}

main();
