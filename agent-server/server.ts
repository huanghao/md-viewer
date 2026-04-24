import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { serveStatic } from "hono/bun";
import { Agent } from "@mariozechner/pi-agent-core";
import type { AgentEvent } from "@mariozechner/pi-agent-core";
import { registerBuiltInApiProviders } from "@mariozechner/pi-ai";
registerBuiltInApiProviders();
import type { Model } from "@mariozechner/pi-ai";
import { SessionManager } from "@mariozechner/pi-coding-agent";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { getAuthToken } from "./auth.ts";
import { AGENT_TOOLS } from "./tools.ts";

// ── Session storage directory ─────────────────────────────────────────────────
const SESSIONS_DIR = join(homedir(), ".mdv", "agent-sessions");
mkdirSync(SESSIONS_DIR, { recursive: true });

// ── Session index (sessionId → actual JSONL file path) ────────────────────────
const INDEX_FILE = join(SESSIONS_DIR, "sessions-index.json");

interface IndexEntry {
  path: string;       // actual JSONL file path
  filePath?: string;  // the document file this session is associated with
}

type IndexData = Record<string, IndexEntry>;

function loadIndex(): Map<string, IndexEntry> {
  if (!existsSync(INDEX_FILE)) return new Map();
  try {
    const raw = JSON.parse(readFileSync(INDEX_FILE, "utf-8")) as IndexData;
    // Support old format (string values) and new format (object values)
    return new Map(Object.entries(raw).map(([k, v]) => [
      k,
      typeof v === "string" ? { path: v } : v,
    ]));
  } catch { return new Map(); }
}

const sessionIndex = loadIndex();

function saveIndex(): void {
  const obj: IndexData = {};
  for (const [k, v] of sessionIndex) obj[k] = v;
  writeFileSync(INDEX_FILE, JSON.stringify(obj, null, 2));
}

// ── Model descriptor ──────────────────────────────────────────────────────────
function buildModel(): Model<"anthropic-messages"> {
  return {
    id: process.env.MODEL ?? "claude-haiku-4-5",
    name: "Claude (agent-server)",
    api: "anthropic-messages",
    provider: "anthropic",
    baseUrl: process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 200000,
    maxTokens: 4096,
    headers: {
      "X-Working-Dir": process.env.WORKING_DIR ?? process.cwd(),
    },
  };
}

// ── Base system prompt ────────────────────────────────────────────────────────
const BASE_SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ??
  "你是 mdv 的 AI 助手，帮助用户阅读和编辑文档。优先根据提供的文档上下文直接回答，需要更多信息时使用 read_file 工具。修改文件前先确认。";

// ── Context injection ─────────────────────────────────────────────────────────
interface DocContext {
  filePath?: string;
  quotePrefix?: string;
  quote?: string;
  quoteSuffix?: string;
  lineNumber?: number;
}

function buildSystemPrompt(ctx: DocContext): string {
  if (!ctx.filePath) return BASE_SYSTEM_PROMPT;
  let prompt = BASE_SYSTEM_PROMPT;
  prompt += `\n\n# 当前文档\n路径：${ctx.filePath}`;
  if (ctx.lineNumber) prompt += `（第 ${ctx.lineNumber} 行附近）`;
  prompt += `\n如需查看文件内容，使用 read_file 工具读取 ${ctx.filePath}。`;
  if (ctx.quote) {
    prompt += `\n\n## 用户选中内容`;
    if (ctx.quotePrefix) prompt += `\n[前文]\n${ctx.quotePrefix}`;
    prompt += `\n[选中内容]\n${ctx.quote}`;
    if (ctx.quoteSuffix) prompt += `\n[后文]\n${ctx.quoteSuffix}`;
  }
  return prompt;
}

// ── Session store ─────────────────────────────────────────────────────────────
interface SessionEntry {
  agent: Agent;
  sessionMgr: SessionManager;
}

const sessions = new Map<string, SessionEntry>();

function sessionFilePath(sessionId: string): string {
  return join(SESSIONS_DIR, `${sessionId}.jsonl`);
}

function getOrCreateSession(sessionId: string, filePath?: string): SessionEntry {
  if (sessions.has(sessionId)) {
    // Update filePath in index if provided and not already set
    const entry = sessionIndex.get(sessionId);
    if (filePath && entry && !entry.filePath) {
      entry.filePath = filePath;
      saveIndex();
    }
    return sessions.get(sessionId)!;
  }

  const indexEntry = sessionIndex.get(sessionId);
  const knownPath = indexEntry?.path;
  let sessionMgr: SessionManager;

  if (knownPath && existsSync(knownPath)) {
    sessionMgr = SessionManager.open(knownPath, SESSIONS_DIR);
  } else {
    sessionMgr = SessionManager.create(process.env.WORKING_DIR ?? process.cwd(), SESSIONS_DIR);
    const actualPath: string | undefined = (sessionMgr as any).getSessionFile?.();
    if (actualPath) {
      sessionIndex.set(sessionId, { path: actualPath, filePath });
      saveIndex();
    }
  }

  const context = sessionMgr.buildSessionContext();
  const messages = context.messages;

  const agent = new Agent({
    initialState: {
      systemPrompt: BASE_SYSTEM_PROMPT,
      model: buildModel(),
      thinkingLevel: "off",
      messages,
      tools: AGENT_TOOLS,
    },
    toolExecution: "parallel",
    getApiKey: async () => getAuthToken(),
  });

  const entry: SessionEntry = { agent, sessionMgr };
  sessions.set(sessionId, entry);
  return entry;
}

// ── SSE event types (frontend protocol) ──────────────────────────────────────
type ChatEvent =
  | { type: "text_delta"; delta: string }
  | { type: "tool_start"; name: string; input: string }
  | { type: "tool_end"; result: string; isError: boolean }
  | { type: "done" }
  | { type: "error"; message: string };

// ── App ───────────────────────────────────────────────────────────────────────
const app = new Hono();
app.use("*", cors());

app.post("/chat", async (c) => {
  const body = await c.req.json() as {
    sessionId: string;
    message: string;
    model?: string;
    context?: DocContext;
  };
  const { sessionId, message, model, context } = body;
  const { agent, sessionMgr } = getOrCreateSession(sessionId, context?.filePath);

  // Update model if specified
  if (model && agent.state.model.id !== model) {
    agent.state.model = { ...agent.state.model, id: model };
  }

  // Update system prompt with current doc context
  if (context) {
    agent.state.systemPrompt = buildSystemPrompt(context);
  }

  // Persist user message via SessionManager
  sessionMgr.appendMessage({
    role: "user",
    content: message,
    timestamp: Date.now(),
  } as any);

  return streamSSE(c, async (stream) => {
    const emit = async (ev: ChatEvent) => {
      await stream.write(`data: ${JSON.stringify(ev)}\n\n`);
    };

    let streamingText = "";

    const unsubscribe = agent.subscribe(async (event: AgentEvent) => {
      try {
        switch (event.type) {
          case "message_update": {
            const msg = event.message as any;
            if (msg?.role === "assistant" && Array.isArray(msg.content)) {
              const textBlock = msg.content.find((b: any) => b.type === "text");
              if (textBlock) {
                const newText: string = textBlock.text ?? "";
                if (newText.length > streamingText.length) {
                  const delta = newText.slice(streamingText.length);
                  streamingText = newText;
                  await emit({ type: "text_delta", delta });
                }
              }
            }
            break;
          }
          case "message_end": {
            // Persist completed assistant/toolResult messages with usage data
            const msg = event.message as any;
            if (msg?.role === "assistant" || msg?.role === "toolResult") {
              try { sessionMgr.appendMessage(msg); } catch { /* ignore type mismatch */ }
            }
            streamingText = "";
            break;
          }
          case "tool_execution_start":
            streamingText = "";
            await emit({ type: "tool_start", name: event.toolName, input: JSON.stringify(event.args) });
            break;
          case "tool_execution_end":
            await emit({
              type: "tool_end",
              result: String(event.result?.content?.[0]?.text ?? "").slice(0, 500),
              isError: event.isError,
            });
            break;
          case "agent_end":
            await emit({ type: "done" });
            break;
        }
      } catch {
        // stream may already be closed, ignore
      }
    });

    try {
      await agent.prompt(message);
    } catch (e: any) {
      await emit({ type: "error", message: e.message });
    } finally {
      unsubscribe();
    }
  });
});

// DELETE /session/:id — remove session from memory and delete JSONL
app.delete("/session/:id", (c) => {
  const id = c.req.param("id");
  sessions.delete(id);
  // Look up actual file path from index
  const actualPath = sessionIndex.get(id)?.path ?? sessionFilePath(id);
  if (existsSync(actualPath)) {
    try { unlinkSync(actualPath); } catch {}
  }
  sessionIndex.delete(id);
  saveIndex();
  return c.json({ ok: true });
});

// GET /session/:id/history — return session messages for resume
app.get("/session/:id/history", (c) => {
  const id = c.req.param("id");
  const actualPath = sessionIndex.get(id)?.path ?? sessionFilePath(id);
  if (!existsSync(actualPath)) return c.json({ history: [] });

  try {
    const sm = SessionManager.open(actualPath, SESSIONS_DIR);
    const context = sm.buildSessionContext();
    const history = context.messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content
          : Array.isArray(m.content)
            ? m.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("")
            : "",
      }));
    return c.json({ history });
  } catch {
    return c.json({ history: [] });
  }
});

// GET /sessions — list all sessions with metadata and token usage
app.get("/sessions", async (c) => {
  try {
    const { stat } = await import("fs/promises");
    const results = await Promise.all(
      Array.from(sessionIndex.entries()).map(async ([sessionId, indexEntry]) => {
        const jsonlPath = indexEntry.path;
        const fileStat = await stat(jsonlPath).catch(() => null);
        const created = fileStat?.birthtime?.toISOString() ?? null;
        const modified = fileStat?.mtime?.toISOString() ?? null;

        let messageCount = 0;
        let tokenUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 };
        let firstMessage = "";
        let model = "";

        try {
          const sm = SessionManager.open(jsonlPath, SESSIONS_DIR);
          const entries = sm.getEntries();
          for (const entry of entries) {
            if ((entry as any).type === "message") {
              messageCount++;
              const msg = (entry as any).message;
              if (!firstMessage && msg?.role === "user") {
                const cont = msg.content;
                firstMessage = typeof cont === "string" ? cont.slice(0, 80)
                  : Array.isArray(cont) ? cont.filter((b: any) => b.type === "text").map((b: any) => b.text).join("").slice(0, 80)
                  : "";
              }
              if (msg?.role === "assistant" && msg?.usage) {
                tokenUsage.input += msg.usage.input ?? 0;
                tokenUsage.output += msg.usage.output ?? 0;
                tokenUsage.cacheRead += msg.usage.cacheRead ?? 0;
                tokenUsage.cacheWrite += msg.usage.cacheWrite ?? 0;
                tokenUsage.total = tokenUsage.input + tokenUsage.output + tokenUsage.cacheRead + tokenUsage.cacheWrite;
              }
              if (msg?.model) model = msg.model;
            }
          }
        } catch { /* unreadable session */ }

        return {
          id: sessionId,
          path: jsonlPath,
          filePath: indexEntry.filePath ?? null,
          created,
          modified,
          messageCount,
          firstMessage,
          model,
          tokenUsage,
          active: sessions.has(sessionId),
        };
      })
    );

    results.sort((a, b) => (b.modified ?? "").localeCompare(a.modified ?? ""));
    return c.json({ sessions: results, total: results.length });
  } catch (e: any) {
    return c.json({ sessions: [], total: 0, error: e.message });
  }
});

// GET /status — health check with active session summary
app.get("/status", (c) => {
  const activeSessions = Array.from(sessions.entries()).map(([id, { agent }]) => ({
    id: id.slice(0, 8),
    messages: agent.state.messages.length,
    streaming: agent.state.isStreaming,
    model: agent.state.model.id,
  }));
  return c.json({
    ok: true,
    activeSessions,
    totalActive: sessions.size,
    sessionsDir: SESSIONS_DIR,
  });
});

// Serve frontend
app.get("/", serveStatic({ path: "./agent-server/index.html" }));

const PORT = Number(process.env.PORT ?? 3003);
export default { port: PORT, fetch: app.fetch, idleTimeout: 0 };
console.log(`[agent-server] http://localhost:${PORT}`);
