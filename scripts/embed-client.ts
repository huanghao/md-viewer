#!/usr/bin/env bun
/**
 * 嵌入客户端脚本
 * 将 dist/client.js 的内容嵌入到 TypeScript 文件中
 */

import { readFileSync, writeFileSync, existsSync } from "fs";

const clientJsPath = "dist/client.js";
const outputPath = "src/client/embedded-client.ts";

if (!existsSync(clientJsPath)) {
  console.error(`❌ 客户端脚本不存在: ${clientJsPath}`);
  console.error(`   请先运行: bun run build:client`);
  process.exit(1);
}

// 读取客户端脚本
const clientJs = readFileSync(clientJsPath, "utf-8");

// 转义反引号和 ${
const escapedClientJs = clientJs
  .replace(/\\/g, "\\\\")
  .replace(/`/g, "\\`")
  .replace(/\$/g, "\\$");

// 生成 TypeScript 文件
const tsContent = `// 自动生成的文件，不要手动编辑
// 由 scripts/embed-client.ts 生成

export const EMBEDDED_CLIENT_JS = \`${escapedClientJs}\`;
`;

writeFileSync(outputPath, tsContent, "utf-8");

console.log(`✅ 客户端脚本已嵌入到: ${outputPath}`);
console.log(`   大小: ${(clientJs.length / 1024).toFixed(1)} KB`);
