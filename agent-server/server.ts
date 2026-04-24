import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { serveStatic } from "hono/bun";
import { Agent } from "@mariozechner/pi-agent-core";
import type { AgentEvent } from "@mariozechner/pi-agent-core";
import { registerBuiltInApiProviders } from "@mariozechner/pi-ai";
registerBuiltInApiProviders();
import type { Model } from "@mariozechner/pi-ai";
import { readFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { getAuthToken } from "./auth.ts";
import { AGENT_TOOLS } from "./tools.ts";

// ── Session persistence (JSONL) ───────────────────────────────────────────────
const SESSIONS_DIR = join(homedir(), ".mdv", "agent-sessions");

interface SessionEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function sessionPath(sessionId: string): string {
  return join(SESSIONS_DIR, `${sessionId}.jsonl`);
}

function loadSessionHistory(sessionId: string): SessionEntry[] {
  const path = sessionPath(sessionId);
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SessionEntry);
}

function appendSessionEntry(sessionId: string, entry: SessionEntry): void {
  const path = sessionPath(sessionId);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(entry) + "\n", "utf-8");
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
  quotePrefix?: string;   // 选中文字前 ~200 字
  quote?: string;         // 选中文字
  quoteSuffix?: string;   // 选中文字后 ~200 字
  lineNumber?: number;
}

function buildSystemPrompt(ctx: DocContext): string {
  if (!ctx.filePath) return BASE_SYSTEM_PROMPT;

  let prompt = BASE_SYSTEM_PROMPT;
  prompt += `\n\n# 当前文档\n路径：${ctx.filePath}`;
  if (ctx.lineNumber) prompt += `（第 ${ctx.lineNumber} 行附近）`;
  prompt += `\n如需查看文件内容，使用 read_file 工具读取 ${ctx.filePath}。`;

  // 仅注入选中文字及其前后上下文，不主动读取全文
  if (ctx.quote) {
    prompt += `\n\n## 用户选中内容`;
    if (ctx.quotePrefix) prompt += `\n[前文]\n${ctx.quotePrefix}`;
    prompt += `\n[选中内容]\n${ctx.quote}`;
    if (ctx.quoteSuffix) prompt += `\n[后文]\n${ctx.quoteSuffix}`;
  }

  return prompt;
}

// ── Session store ─────────────────────────────────────────────────────────────
const sessions = new Map<string, Agent>();

function getOrCreateAgent(sessionId: string): Agent {
  if (sessions.has(sessionId)) return sessions.get(sessionId)!;

  // Restore history from JSONL
  const history = loadSessionHistory(sessionId);
  const messages = history.map((e) => ({
    role: e.role,
    content: e.content,
    timestamp: e.timestamp,
  }));

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

  sessions.set(sessionId, agent);
  return agent;
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
  const agent = getOrCreateAgent(sessionId);

  // Update model if specified
  if (model && agent.state.model.id !== model) {
    agent.state.model = { ...agent.state.model, id: model };
  }

  // Update system prompt with current doc context on every message
  if (context) {
    agent.state.systemPrompt = buildSystemPrompt(context);
  }

  // Persist user message
  appendSessionEntry(sessionId, { role: "user", content: message, timestamp: Date.now() });

  return streamSSE(c, async (stream) => {
    const emit = async (ev: ChatEvent) => {
      await stream.write(`data: ${JSON.stringify(ev)}\n\n`);
    };

    let streamingText = "";
    let finalAssistantText = "";

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
                  finalAssistantText = newText;
                  await emit({ type: "text_delta", delta });
                }
              }
            }
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
            streamingText = "";
            // Persist assistant response
            if (finalAssistantText) {
              appendSessionEntry(sessionId, { role: "assistant", content: finalAssistantText, timestamp: Date.now() });
            }
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

// DELETE /session/:id — clear session (memory + JSONL)
app.delete("/session/:id", (c) => {
  const id = c.req.param("id");
  sessions.delete(id);
  const path = sessionPath(id);
  if (existsSync(path)) {
    import("fs").then(({ unlinkSync }) => unlinkSync(path));
  }
  return c.json({ ok: true });
});

// GET /session/:id/history — return session history for resume
app.get("/session/:id/history", (c) => {
  const history = loadSessionHistory(c.req.param("id"));
  return c.json({ history });
});

// Serve frontend
app.get("/", serveStatic({ path: "./agent-server/index.html" }));

const PORT = Number(process.env.PORT ?? 3003);
export default { port: PORT, fetch: app.fetch, idleTimeout: 0 };
console.log(`[agent-server] http://localhost:${PORT}`);
