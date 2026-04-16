#!/usr/bin/env bun
/**
 * Config Module - 配置管理
 * 从 ~/.config/md-viewer/config.json 读取用户配置
 */

import { readFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";

// ==================== 默认配置 ====================

export interface Config {
  server: {
    port: number;
    host: string;
  };
  client: {
    defaultFocus: boolean;
    theme: "light" | "dark" | "auto";
  };
  editor: {
    fontSize: number;
    lineHeight: number;
  };
  files: {
    autoRefresh: boolean;
    rememberOpenFiles: boolean;
  };
}

const DEFAULT_CONFIG: Config = {
  server: {
    port: 3000,
    host: "127.0.0.1",
  },
  client: {
    defaultFocus: true,
    theme: "light",
  },
  editor: {
    fontSize: 14,
    lineHeight: 1.6,
  },
  files: {
    autoRefresh: true,
    rememberOpenFiles: true,
  },
};

// ==================== 配置路径 ====================

export function getConfigDir(): string {
  const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(configHome, "md-viewer");
}

export function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

// ==================== 配置加载 ====================

export function loadConfig(): Config {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const userConfig = JSON.parse(content);
    return mergeConfig(DEFAULT_CONFIG, userConfig);
  } catch (e) {
    console.warn(`⚠️  配置文件读取失败: ${configPath}，使用默认配置`);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 深度合并配置，用户配置覆盖默认配置
 */
function mergeConfig(defaults: Config, user: Partial<Config>): Config {
  return {
    server: { ...defaults.server, ...user.server },
    client: { ...defaults.client, ...user.client },
    editor: { ...defaults.editor, ...user.editor },
    files: { ...defaults.files, ...user.files },
  };
}

// ==================== 配置初始化 ====================

export function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

/**
 * 创建默认配置文件（如果不存在）
 */
export function initConfig(): void {
  ensureConfigDir();
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    const defaultContent = JSON.stringify(DEFAULT_CONFIG, null, 2);
    // 注意：这里使用动态导入避免循环依赖
    const { writeFileSync } = require("fs");
    writeFileSync(configPath, defaultContent + "\n", "utf-8");
    console.log(`📝 已创建默认配置文件: ${configPath}`);
  }
}

// ==================== 环境变量覆盖 ====================

/**
 * 从环境变量获取配置覆盖
 * 优先级：环境变量 > 配置文件 > 默认值
 */
export function getServerPort(config: Config): number {
  const envPort = process.env.PORT;
  if (envPort) {
    const port = parseInt(envPort, 10);
    if (!isNaN(port)) return port;
  }
  return config.server.port;
}

export function getServerHost(config: Config): string {
  return process.env.HOST || config.server.host;
}

// ==================== 导出单例 ====================

export const config = loadConfig();
