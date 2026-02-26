#!/usr/bin/env bun
/**
 * MD Viewer CLI - 命令行客户端
 * 向 Server 发送请求，添加文件到展示列表
 */

import { resolve } from "path";
import { existsSync } from "fs";

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "localhost";

interface CliOptions {
  port: number;
  host: string;
  help: boolean;
}

function showHelp() {
  console.log(`
📖 MD Viewer CLI - 命令行客户端

用法:
  md-viewer-cli <文件路径>      将文件添加到 Server 展示列表
  md-viewer-cli --help          显示帮助信息

选项:
  -p, --port <端口>             指定服务器端口 (默认: 3000)
  -h, --host <主机>             指定服务器主机 (默认: localhost)

示例:
  md-viewer-cli README.md               # 添加当前目录 README.md
  md-viewer-cli /path/to/document.md    # 添加指定路径文件
  md-viewer-cli -p 3001 notes.md        # 使用端口 3001
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

    if (arg === "--help") {
      options.help = true;
    } else if (arg === "--port" || arg === "-p") {
      const port = parseInt(args[++i], 10);
      if (!isNaN(port)) {
        options.port = port;
      }
    } else if (arg === "--host" || arg === "-h") {
      options.host = args[++i];
    } else if (!arg.startsWith("-") && !filePath) {
      filePath = arg;
    }
  }

  return { filePath, options };
}

async function openFile(host: string, port: number, filePath: string): Promise<void> {
  const url = `http://${host}:${port}/api/open-file`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log(`✅ 已添加: ${result.filename}`);
}

async function main() {
  const args = process.argv.slice(2);
  const { filePath, options } = parseArgs(args);

  if (options.help || !filePath) {
    showHelp();
    process.exit(filePath ? 0 : 1);
  }

  // 验证文件存在
  const absolutePath = resolve(filePath);
  if (!existsSync(absolutePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  try {
    await openFile(options.host, options.port, absolutePath);
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
