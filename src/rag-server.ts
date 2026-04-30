import { Hono } from "hono";
import { loadModel, scanWorkspace, watchWorkspace, getEmbedder } from "./rag-indexer.ts";
import { getAllVectors } from "./rag-storage.ts";

const RAG_PORT = 3001;
const MAIN_SERVER_URL = "http://localhost:3000";

const app = new Hono();

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

app.get("/search", async (c) => {
  const q = c.req.query("q")?.trim();
  const limit = Math.min(parseInt(c.req.query("limit") ?? "10"), 50);
  if (!q) return c.json({ results: [], queryTime: 0 });

  const embedder = getEmbedder();
  if (!embedder) return c.json({ results: [], error: "model_loading" });

  const t0 = Date.now();
  const out = await (embedder as any)([q], { pooling: "mean", normalize: true });
  const queryVec = out.data.slice(0, out.data.length) as Float32Array;

  const chunks = getAllVectors();
  const scored = chunks.map(ch => ({ ...ch, score: cosine(queryVec, ch.vector) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit).map(ch => ({
    path: ch.path,
    heading: ch.heading,
    text: ch.text.slice(0, 300),
    score: Math.round(ch.score * 1000) / 1000,
    charStart: ch.charStart,
  }));

  return c.json({ results: top, queryTime: Date.now() - t0 });
});

app.get("/health", (c) => c.json({ status: "ok" }));

async function getWorkspacePaths(): Promise<string[]> {
  try {
    const resp = await fetch(`${MAIN_SERVER_URL}/api/workspaces`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await resp.json() as { paths: string[] };
    return data.paths ?? [];
  } catch {
    console.log("[rag] Could not fetch workspaces from main server — starting with empty list");
    return [];
  }
}

async function main() {
  await loadModel();

  const workspacePaths = await getWorkspacePaths();
  for (const p of workspacePaths) {
    await scanWorkspace(p);
    watchWorkspace(p);
  }

  Bun.serve({ fetch: app.fetch, port: RAG_PORT });
  console.log(`[rag] Server running on http://localhost:${RAG_PORT}`);
}

if (import.meta.main) main();
