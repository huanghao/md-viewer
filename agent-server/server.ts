// agent-demo/agent-server/server.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { serveStatic } from "hono/bun";
import { Agent } from "@mariozechner/pi-agent-core";
import type { AgentEvent } from "@mariozechner/pi-agent-core";
import { registerBuiltInApiProviders } from "@mariozechner/pi-ai";
registerBuiltInApiProviders();
import type { Model } from "@mariozechner/pi-ai";
import { getAuthToken } from "./auth.ts";
import { AGENT_TOOLS } from "./tools.ts";

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

// ── Session store ─────────────────────────────────────────────────────────────
const sessions = new Map<string, Agent>();

function getOrCreateAgent(sessionId: string): Agent {
  if (sessions.has(sessionId)) return sessions.get(sessionId)!;

  const agent = new Agent({
    initialState: {
      systemPrompt: process.env.SYSTEM_PROMPT ?? "你是一个有用的 AI 助手，可以读写文件和执行 shell 命令。",
      model: buildModel(),
      thinkingLevel: "off",
      messages: [],
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
  const { sessionId, message } = await c.req.json() as { sessionId: string; message: string };
  const agent = getOrCreateAgent(sessionId);

  return streamSSE(c, async (stream) => {
    const emit = async (ev: ChatEvent) => {
      await stream.write(`data: ${JSON.stringify(ev)}\n\n`);
    };

    // Collect streaming text for text_delta events
    let streamingText = "";

    const unsubscribe = agent.subscribe(async (event: AgentEvent) => {
      try {
        switch (event.type) {
          case "message_update": {
            // Extract new text from the streaming assistant message
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
          case "tool_execution_start":
            streamingText = ""; // reset for next message
            await emit({
              type: "tool_start",
              name: event.toolName,
              input: JSON.stringify(event.args),
            });
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

// DELETE /session/:id — clear session
app.delete("/session/:id", (c) => {
  sessions.delete(c.req.param("id"));
  return c.json({ ok: true });
});

// Serve frontend
app.get("/", serveStatic({ path: "./agent-server/index.html" }));

const PORT = Number(process.env.PORT ?? 3003);
export default { port: PORT, fetch: app.fetch };
console.log(`[agent-server] http://localhost:${PORT}`);
