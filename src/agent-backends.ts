import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, statSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface AgentBackend {
  name: string;
  description: string;
  command: string;
  env: Record<string, string>;
  envUnset: string[];
  contextWindow: number | null;
  default: boolean;
}

export interface AgentBackendStatus {
  name: string;
  description: string;
  default: boolean;
  defaultModel: string | null;
  contextWindow: number | null;
  unavailableReason: string | null;
}

export interface AgentCommandResolution {
  command: string[];
  source: "workspace-command" | "backend";
  backendName: string | null;
}

const CONFIG_PATH = () => join(homedir(), ".config", "agent-backends.yaml");
const SHIM_DIR = () => join(homedir(), ".cache", "agent-client");
const ZSHRC_LOCAL = () => join(homedir(), ".zshrc.local");

const HIJACK_VARS = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_FABLE_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
];

const DEFAULT_CODE_AGENT_ARGS = ["--dangerously-skip-permissions"];

function unquote(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function stripComment(line: string): string {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if ((ch === '"' || ch === "'") && line[i - 1] !== "\\") {
      quote = quote === ch ? null : quote || ch;
    }
    if (ch === "#" && !quote) return line.slice(0, i);
  }
  return line;
}

function parseScalar(value: string): string | number | boolean | null {
  const text = unquote(value);
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "null") return null;
  if (/^\d+$/.test(text)) return Number(text);
  return text;
}

/**
 * Minimal YAML parser for ~/.config/agent-backends.yaml.
 * It intentionally supports only the shape used by kolab's shared backend file.
 */
export function parseAgentBackendsYaml(content: string): { defaultName: string | null; backends: AgentBackend[] } {
  const cfg: { defaultName: string | null; backends: AgentBackend[] } = { defaultName: null, backends: [] };
  let current: AgentBackend | null = null;
  let section: "env" | "env_unset" | null = null;

  for (const raw of content.split(/\r?\n/)) {
    const line = stripComment(raw).replace(/\s+$/, "");
    if (!line.trim()) continue;

    const topDefault = line.match(/^default:\s*(.+)$/);
    if (topDefault) {
      cfg.defaultName = String(parseScalar(topDefault[1]));
      section = null;
      continue;
    }

    const backendStart = line.match(/^\s*-\s+name:\s*(.+)$/);
    if (backendStart) {
      current = {
        name: String(parseScalar(backendStart[1])),
        description: "",
        command: "claude",
        env: {},
        envUnset: [],
        contextWindow: null,
        default: false,
      };
      cfg.backends.push(current);
      section = null;
      continue;
    }

    if (!current) continue;

    const sectionStart = line.match(/^\s+(env|env_unset):\s*$/);
    if (sectionStart) {
      section = sectionStart[1] as "env" | "env_unset";
      continue;
    }

    if (section === "env") {
      const envPair = line.match(/^\s+([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
      if (envPair) {
        current.env[envPair[1]] = String(parseScalar(envPair[2]));
        continue;
      }
    }

    if (section === "env_unset") {
      const item = line.match(/^\s*-\s*(.+)$/);
      if (item) {
        current.envUnset.push(String(parseScalar(item[1])));
        continue;
      }
    }

    const field = line.match(/^\s+([A-Za-z_][A-Za-z0-9_]*):\s*(.+)$/);
    if (!field) continue;
    section = null;
    const key = field[1];
    const value = parseScalar(field[2]);
    if (key === "description") current.description = String(value ?? "");
    else if (key === "command") current.command = String(value ?? "claude");
    else if (key === "context_window") current.contextWindow = typeof value === "number" ? value : null;
    else if (key === "default") current.default = value === true;
  }

  for (const backend of cfg.backends) {
    backend.default = backend.default || (!!cfg.defaultName && backend.name === cfg.defaultName);
  }
  if (cfg.backends.length > 0 && !cfg.backends.some((backend) => backend.default)) {
    cfg.backends[0].default = true;
  }
  return cfg;
}

function resolveVar(name: string): string | null {
  if (process.env[name] !== undefined) return process.env[name]!;
  const path = ZSHRC_LOCAL();
  if (!existsSync(path)) return null;
  const text = readFileSync(path, "utf-8");
  const match = text.match(new RegExp(`^(?:export\\s+)?${name}=["']?(.*?)["']?\\s*$`, "m"));
  return match ? match[1] : null;
}

function expandVars(value: string): string {
  return value.replace(/\$\{(\w+)\}/g, (_m, name) => resolveVar(name) ?? "");
}

function shQuote(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

export function checkAgentBackendAvailable(backend: AgentBackend): string | null {
  for (const [key, value] of Object.entries(backend.env)) {
    const names = value.matchAll(/\$\{(\w+)\}/g);
    for (const match of names) {
      if (resolveVar(match[1]) === null) return `环境变量 ${match[1]} 无法展开（${key} 需要）`;
    }
  }
  return null;
}

export function discoverAgentBackends(configPath = CONFIG_PATH()): AgentBackend[] {
  if (!existsSync(configPath)) {
    return [{
      name: "claude",
      description: "官方 Claude Code（默认）",
      command: "claude",
      env: {},
      envUnset: [],
      contextWindow: null,
      default: true,
    }];
  }
  return parseAgentBackendsYaml(readFileSync(configPath, "utf-8")).backends;
}

export function renderAgentShim(backend: AgentBackend): string {
  const unset = Array.from(new Set([...HIJACK_VARS, ...backend.envUnset].filter((key) => !(key in backend.env)))).sort();
  const lines = ["#!/bin/sh", `# md-viewer agent backend shim: ${backend.name}`];
  if (unset.length > 0) lines.push("unset " + unset.join(" "));
  for (const [key, value] of Object.entries(backend.env)) {
    lines.push(`export ${key}=${shQuote(expandVars(value))}`);
  }
  lines.push(`exec ${backend.command} "$@"`);
  return lines.join("\n") + "\n";
}

function ensureShim(backend: AgentBackend): string {
  const dir = SHIM_DIR();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const path = join(dir, `${backend.name}.sh`);
  const content = renderAgentShim(backend);
  if (!existsSync(path) || readFileSync(path, "utf-8") !== content) {
    writeFileSync(path, content, "utf-8");
    chmodSync(path, (existsSync(path) ? statSync(path).mode : 0o755) | 0o111);
  }
  return path;
}

function codeAgentArgsFor(backend: AgentBackend): string[] {
  return backend.command.includes("--dangerously-skip-permissions") ? [] : DEFAULT_CODE_AGENT_ARGS;
}

export function resolveAgentCommand(
  workspaceCommand?: string[] | null,
  requestedBackendName?: string | null,
  backends = discoverAgentBackends()
): AgentCommandResolution {
  if (!requestedBackendName && workspaceCommand && workspaceCommand.length > 0) {
    return { command: workspaceCommand, source: "workspace-command", backendName: null };
  }
  const backend = requestedBackendName
    ? backends.find((item) => item.name === requestedBackendName)
    : backends.find((item) => item.default) || backends[0];
  if (requestedBackendName && !backend) {
    throw new Error(`backend ${requestedBackendName} 不存在`);
  }
  if (!backend) {
    return { command: ["claude", ...DEFAULT_CODE_AGENT_ARGS], source: "backend", backendName: "claude" };
  }
  const reason = checkAgentBackendAvailable(backend);
  if (reason) throw new Error(`backend ${backend.name} 不可用：${reason}`);
  return { command: [ensureShim(backend), ...codeAgentArgsFor(backend)], source: "backend", backendName: backend.name };
}

export function listAgentBackendStatuses(): AgentBackendStatus[] {
  return discoverAgentBackends().map((backend) => ({
    name: backend.name,
    description: backend.description,
    default: backend.default,
    defaultModel: backend.env.ANTHROPIC_MODEL ? expandVars(backend.env.ANTHROPIC_MODEL) : null,
    contextWindow: backend.contextWindow,
    unavailableReason: checkAgentBackendAvailable(backend),
  }));
}
