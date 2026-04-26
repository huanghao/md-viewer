// agent-demo/agent-server/tools.ts
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Type } from "@mariozechner/pi-ai";
import { readFileSync, writeFileSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "read_file",
    label: "读取文件",
    description: "读取本地文件内容",
    parameters: Type.Object({
      path: Type.String({ description: "文件路径" }),
    }),
    execute: async (_toolCallId, params) => {
      try {
        const text = readFileSync(params.path, "utf-8");
        return { content: [{ type: "text", text }], details: { path: params.path } };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.message}` }], details: { error: e.message } };
      }
    },
  },
  {
    name: "write_file",
    label: "写入文件",
    description: "写入内容到本地文件",
    parameters: Type.Object({
      path: Type.String({ description: "文件路径" }),
      content: Type.String({ description: "写入内容" }),
    }),
    execute: async (_toolCallId, params) => {
      try {
        writeFileSync(params.path, params.content, "utf-8");
        // Notify mdv to update focus signals for the written file
        const mdvUrl = process.env.MDV_URL ?? 'http://localhost:3000';
        fetch(`${mdvUrl}/api/focus-signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'mtime', file: params.path }),
        }).catch(() => {});
        const text = `写入成功: ${params.path}`;
        return { content: [{ type: "text", text }], details: { path: params.path } };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Error: ${e.message}` }], details: { error: e.message } };
      }
    },
  },
  {
    name: "bash",
    label: "执行命令",
    description: "执行 shell 命令，返回 stdout+stderr",
    parameters: Type.Object({
      command: Type.String({ description: "shell 命令" }),
    }),
    execute: async (_toolCallId, params, signal) => {
      try {
        const execAsync = promisify(exec);
        const { stdout, stderr } = await execAsync(params.command, {
          timeout: 30000,
          shell: "/bin/zsh",
          cwd: process.env.WORKING_DIR ?? process.cwd(),
          signal,
        } as any);
        const text = (stdout + stderr).trim();
        return { content: [{ type: "text", text }], details: { command: params.command } };
      } catch (e: any) {
        const text = `Error: ${e.message}\n${(e as any).stderr ?? ""}`.trim();
        return { content: [{ type: "text", text }], details: { error: e.message } };
      }
    },
  },
];
