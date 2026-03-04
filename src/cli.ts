#!/usr/bin/env bun
/**
 * MD Viewer CLI - 命令行客户端
 * 向 Server 发送请求，添加文件到展示列表
 */

import { resolve } from "path";
import { existsSync } from "fs";
import { loadConfig, getConfigDir } from "./config.ts";
import { getAnnotationsByDocument, listAnnotatedDocuments } from "./annotation-storage.ts";

const config = loadConfig();
const DEFAULT_PORT = config.server.port;
const DEFAULT_HOST = config.server.host;

interface CliOptions {
  port: number;
  host: string;
  focus: boolean;
  noFocus: boolean;
  help: boolean;
  json: boolean;
  limit: number;
  offset: number;
  file?: string;
}

function showHelp() {
  console.log(`
MD Viewer CLI

SYNOPSIS
  md-viewer-cli <FILE>
  md-viewer-cli comments list [--limit N] [--offset N] [--json]
  md-viewer-cli comments get --file <FILE> [--limit N] [--offset N] [--json]
  md-viewer-cli --help

GLOBAL OPTIONS
  -p, --port <PORT>             Server port (default: ${DEFAULT_PORT})
  -h, --host <HOST>             Server host (default: ${DEFAULT_HOST})
  --no-focus                    Add file without switching focus
  --json                        JSON output (recommended for agents)
  --limit <N>                   Result limit (default: 20)
  --offset <N>                  Result offset (default: 0)

FILES
  ${getConfigDir()}/config.json

EXAMPLES
  md-viewer-cli README.md
  md-viewer-cli --no-focus README.md
  md-viewer-cli -p 3001 notes.md
  md-viewer-cli comments list --limit 50 --json
  md-viewer-cli comments get --file README.md --json
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

type CliCommand = "open" | "comments-list" | "comments-get" | "invalid";

function parseArgs(args: string[]): { command: CliCommand; filePath: string | null; options: CliOptions; error?: string } {
  const options: CliOptions = {
    port: DEFAULT_PORT,
    host: DEFAULT_HOST,
    focus: true,
    noFocus: false,
    help: false,
    json: false,
    limit: 20,
    offset: 0,
  };

  let command: CliCommand = "open";
  let filePath: string | null = null;
  const words: string[] = [];
  let error: string | undefined;

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
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--limit") {
      const limit = parseInt(args[++i], 10);
      if (!isNaN(limit)) {
        options.limit = limit;
      }
    } else if (arg === "--offset") {
      const offset = parseInt(args[++i], 10);
      if (!isNaN(offset)) {
        options.offset = offset;
      }
    } else if (arg === "--file") {
      options.file = args[++i];
    } else if (!arg.startsWith("-") && !filePath) {
      words.push(arg);
    } else if (!arg.startsWith("-")) {
      words.push(arg);
    }
  }

  if (words[0] === "comments" && words[1] === "list") {
    command = "comments-list";
  } else if (words[0] === "comments" && words[1] === "get") {
    command = "comments-get";
  } else if (words[0] === "comments") {
    command = "invalid";
    error = `comments 子命令缺失或无效: ${words.slice(1).join(" ") || "(empty)"}`;
  } else if (words[0]) {
    filePath = words[0];
  }

  return { command, filePath, options, error };
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

function formatCompactTime(ts: number): string {
  if (!ts) return "0";
  return new Date(ts).toISOString();
}

function printComments(path: string, options: CliOptions): void {
  const result = getAnnotationsByDocument(path, options.limit, options.offset);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`# ${result.path}`);
  console.log(`共 ${result.total} 条，当前返回 ${result.annotations.length} 条`);
  console.log('');
  for (const ann of result.annotations) {
    const statusTag = ann.status === 'unanchored' ? ' [定位失败]' : '';
    console.log(`${ann.id} ${formatCompactTime(ann.createdAt)}${statusTag}`);
    const quoted = (ann.quote || '').split('\n').map((line) => `> ${line}`).join('\n');
    console.log(quoted || '> ');
    console.log(ann.note || '（无评论内容）');
    console.log('');
  }
}

function printCommentDocs(options: CliOptions): void {
  const docs = listAnnotatedDocuments(options.limit, options.offset);
  if (options.json) {
    console.log(JSON.stringify({ totalReturned: docs.length, docs }, null, 2));
    return;
  }
  console.log(`# 有评论的文档`);
  console.log(`共返回 ${docs.length} 条`);
  console.log('');
  for (const item of docs) {
    console.log(`- ${item.path}`);
    console.log(`  - 评论数: ${item.count}`);
    console.log(`  - 可定位: ${item.anchoredCount}`);
    console.log(`  - 失锚: ${item.unanchoredCount}`);
    console.log(`  - 更新时间: ${formatCompactTime(item.latestUpdatedAt)}`);
    console.log('');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const { command, filePath, options, error } = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (command === "invalid") {
    console.error(`❌ 参数错误: ${error || "无效命令"}`);
    console.error("");
    showHelp();
    process.exit(1);
  }

  if (command === "comments-list") {
    printCommentDocs(options);
    process.exit(0);
  }

  if (command === "comments-get") {
    const target = options.file || filePath;
    if (!target) {
      console.error("❌ 缺少文档路径: mdv comments get --file <文档路径>");
      console.error("");
      showHelp();
      process.exit(1);
    }
    printComments(target, options);
    process.exit(0);
  }

  if (!filePath) {
    console.error("❌ 缺少文件路径");
    console.error("");
    showHelp();
    process.exit(1);
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

    // 只允许 md/markdown/txt
    const ext = targetPath.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
    if (ext && !['md', 'markdown', 'txt'].includes(ext)) {
      console.error(`❌ 不支持的文件类型: .${ext}（CLI 仅支持 md/markdown/txt）`);
      process.exit(1);
    }
  }

  try {
    const shouldFocus = !options.noFocus;
    await openFile(options.host, options.port, targetPath, shouldFocus);
    process.exit(0);
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
