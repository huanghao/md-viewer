import { Hono } from "hono";
import { loadModel, scanWorkspace, watchWorkspace, getEmbedder, getIndexStats, embedTextsForSearch } from "./rag-indexer.ts";
import { getWorkspacePaths } from "./rag-storage.ts";
import { getVectorCache } from "./rag-vector-cache.ts";

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

  if (!getEmbedder()) return c.json({ results: [], error: "model_loading" });

  const t0 = Date.now();
  let queryVec: Float32Array;
  try {
    const vecs = await embedTextsForSearch([q]);
    queryVec = vecs[0];
  } catch {
    return c.json({ results: [], error: "embed_failed" });
  }

  const chunks = getVectorCache();
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

app.get("/status", (c) => c.json(getIndexStats()));

async function fetchWorkspacePaths(): Promise<string[]> {
  try {
    const resp = await fetch(`${MAIN_SERVER_URL}/api/workspaces`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await resp.json() as { paths: string[] };
    if (data.paths?.length) return data.paths;
  } catch {}
  const persisted = getWorkspacePaths();
  if (persisted.length) {
    console.log(`[rag] Main server unreachable — using ${persisted.length} persisted workspace(s) from DB`);
    return persisted;
  }
  console.log("[rag] No workspaces found, starting with empty list");
  return [];
}

async function main() {
  await loadModel();

  Bun.serve({ fetch: app.fetch, port: RAG_PORT });
  console.log(`[rag] Server running on http://localhost:${RAG_PORT}`);

  const workspacePaths = await fetchWorkspacePaths();
  for (const p of workspacePaths) {
    await scanWorkspace(p);
    watchWorkspace(p);
  }
  console.log(`[rag] Indexing complete`);
}

if (import.meta.main) main();
