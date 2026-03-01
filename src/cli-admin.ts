#!/usr/bin/env bun
/**
 * MD Viewer Admin CLI - 管理工具
 * 用于查看和清理状态数据
 */

import { loadConfig } from "./config.ts";
import { getSyncRecordsStats, cleanupAllExpiredRecords } from "./sync-storage.ts";

const config = loadConfig();
const DEFAULT_PORT = config.server.port;
const DEFAULT_HOST = config.server.host;

function showHelp() {
  console.log(`
📊 MD Viewer Admin CLI - 管理工具

用法:
  md-viewer-admin stats            查看状态统计信息
  md-viewer-admin cleanup          清理过期的同步记录（超过 6 个月）
  md-viewer-admin --help           显示帮助信息

选项:
  -p, --port <端口>                指定服务器端口 (默认: ${DEFAULT_PORT})
  -h, --host <主机>                指定服务器主机 (默认: ${DEFAULT_HOST})

示例:
  md-viewer-admin stats            # 查看统计信息
  md-viewer-admin cleanup          # 清理过期记录
`);
}

interface AdminOptions {
  port: number;
  host: string;
}

function parseArgs(args: string[]): { command: string | null; options: AdminOptions } {
  const options: AdminOptions = {
    port: DEFAULT_PORT,
    host: DEFAULT_HOST,
  };

  let command: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help") {
      showHelp();
      process.exit(0);
    } else if (arg === "--port" || arg === "-p") {
      const port = parseInt(args[++i], 10);
      if (!isNaN(port)) {
        options.port = port;
      }
    } else if (arg === "--host" || arg === "-h") {
      options.host = args[++i];
    } else if (!arg.startsWith("-") && !command) {
      command = arg;
    }
  }

  return { command, options };
}

async function getStatsFromServer(host: string, port: number): Promise<any> {
  const url = `http://${host}:${port}/api/sync/stats`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

async function cleanupFromServer(host: string, port: number): Promise<any> {
  const url = `http://${host}:${port}/api/sync/cleanup`;
  const response = await fetch(url, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "无";
  return new Date(timestamp).toLocaleString("zh-CN");
}

function formatDuration(timestamp: number | null): string {
  if (!timestamp) return "无";
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  return `${days} 天前`;
}

async function showStats(options: AdminOptions) {
  console.log("📊 正在获取统计信息...\n");

  try {
    // 尝试从服务器获取
    const result = await getStatsFromServer(options.host, options.port);
    const stats = result.stats;

    console.log("同步记录统计:");
    console.log(`  总文件数: ${stats.totalFiles}`);
    console.log(`  过期文件数: ${stats.expiredFiles} (超过 6 个月)`);
    console.log(`  最近位置数: ${stats.recentParents}`);
    console.log(`  最早同步: ${formatDate(stats.oldestSync)} (${formatDuration(stats.oldestSync)})`);
    console.log(`  最新同步: ${formatDate(stats.newestSync)} (${formatDuration(stats.newestSync)})`);

    if (stats.expiredFiles > 0) {
      console.log(`\n⚠️  有 ${stats.expiredFiles} 条过期记录可以清理`);
      console.log(`   运行 'md-viewer-admin cleanup' 清理`);
    }
  } catch (e: any) {
    if (e.cause?.code === "ECONNREFUSED") {
      // 服务器未运行，直接读取本地文件
      console.log("⚠️  服务器未运行，读取本地数据...\n");
      const stats = getSyncRecordsStats();

      console.log("同步记录统计:");
      console.log(`  总文件数: ${stats.totalFiles}`);
      console.log(`  过期文件数: ${stats.expiredFiles} (超过 6 个月)`);
      console.log(`  最近位置数: ${stats.recentParents}`);
      console.log(`  最早同步: ${formatDate(stats.oldestSync)} (${formatDuration(stats.oldestSync)})`);
      console.log(`  最新同步: ${formatDate(stats.newestSync)} (${formatDuration(stats.newestSync)})`);

      if (stats.expiredFiles > 0) {
        console.log(`\n⚠️  有 ${stats.expiredFiles} 条过期记录可以清理`);
        console.log(`   运行 'md-viewer-admin cleanup' 清理`);
      }
    } else {
      console.error(`❌ 获取统计信息失败: ${e.message}`);
      process.exit(1);
    }
  }
}

async function cleanupExpired(options: AdminOptions) {
  console.log("🧹 正在清理过期记录...\n");

  try {
    // 尝试从服务器清理
    const result = await cleanupFromServer(options.host, options.port);
    console.log(`✅ ${result.message}`);
  } catch (e: any) {
    if (e.cause?.code === "ECONNREFUSED") {
      // 服务器未运行，直接操作本地文件
      console.log("⚠️  服务器未运行，直接清理本地数据...\n");
      const cleanedCount = cleanupAllExpiredRecords();
      console.log(`✅ 已清理 ${cleanedCount} 条过期的同步记录`);
    } else {
      console.error(`❌ 清理失败: ${e.message}`);
      process.exit(1);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const { command, options } = parseArgs(args);

  if (!command) {
    showHelp();
    process.exit(1);
  }

  switch (command) {
    case "stats":
      await showStats(options);
      break;
    case "cleanup":
      await cleanupExpired(options);
      break;
    default:
      console.error(`❌ 未知命令: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main();
