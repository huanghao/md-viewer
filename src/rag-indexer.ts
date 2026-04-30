import { pipeline, env } from "@huggingface/transformers";
import { statSync, readdirSync, existsSync } from "fs";
import { join, extname } from "path";
import chokidar from "chokidar";
import { chunkMarkdown } from "./rag-chunker.ts";
import { upsertFileChunks, deleteFileChunks, getFileMtime, getMeta, setMeta } from "./rag-storage.ts";

export const MODEL_NAME = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
env.cacheDir = join(process.env.HOME ?? "~", ".cache", "huggingface");

let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;

export function getEmbedder() {
  return embedder;
}

export async function loadModel(): Promise<void> {
  console.log("[rag] Loading embedding model (first run downloads ~118MB to ~/.cache/huggingface)...");
  embedder = await pipeline("feature-extraction", MODEL_NAME, { dtype: "fp32" });
  console.log("[rag] Model ready.");

  const stored = getMeta("model_name");
  if (stored && stored !== MODEL_NAME) {
    console.log("[rag] Model changed, clearing old vectors...");
    const { getDb } = await import("./rag-storage.ts");
    getDb().exec("DELETE FROM rag_vectors; DELETE FROM rag_chunks;");
  }
  setMeta("model_name", MODEL_NAME);
}

async function embedTexts(texts: string[]): Promise<Float32Array[]> {
  if (!embedder) throw new Error("Model not loaded");
  const output = await (embedder as any)(texts, { pooling: "mean", normalize: true });
  const dim = output.data.length / texts.length;
  return texts.map((_, i) => output.data.slice(i * dim, (i + 1) * dim) as Float32Array);
}

export async function indexFile(filePath: string): Promise<void> {
  if (!embedder) return;
  try {
    const stat = statSync(filePath);
    const mtime = stat.mtimeMs;

    const stored = getFileMtime(filePath);
    if (stored === mtime) return;

    const content = await Bun.file(filePath).text();
    if (content.length > 1_000_000) {
      console.log(`[rag] Skipping (>1MB): ${filePath}`);
      return;
    }

    const chunks = chunkMarkdown(content);
    if (chunks.length === 0) {
      deleteFileChunks(filePath);
      return;
    }

    console.log(`[rag] Indexing ${filePath} (${chunks.length} chunks)...`);
    const vectors = await embedTexts(chunks.map(c => c.text));
    upsertFileChunks(
      chunks.map((c, i) => ({
        path: filePath,
        chunkIndex: i,
        heading: c.heading,
        text: c.text,
        charStart: c.charStart,
        fileMtime: mtime,
      })),
      vectors
    );
  } catch (e) {
    console.error(`[rag] Error indexing ${filePath}:`, e);
  }
}

function collectMdFiles(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;
  try {
    const entries = readdirSync(dir, { recursive: true, withFileTypes: true }) as any[];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const name: string = entry.name;
      if (![".md", ".markdown"].includes(extname(name))) continue;
      if (name.startsWith(".")) continue;
      const parentPath: string = entry.parentPath ?? entry.path ?? dir;
      const full = join(parentPath, name);
      if (full.includes("node_modules") || full.includes("/.git/")) continue;
      files.push(full);
    }
  } catch {}
  return files;
}

export async function scanWorkspace(workspacePath: string): Promise<void> {
  console.log(`[rag] Scanning workspace: ${workspacePath}`);
  const files = collectMdFiles(workspacePath);
  console.log(`[rag] Found ${files.length} markdown files`);
  for (const f of files) {
    await indexFile(f);
  }
  console.log(`[rag] Workspace scan complete: ${workspacePath}`);
}

const indexQueue: Set<string> = new Set();
let queueRunning = false;

async function drainQueue(): Promise<void> {
  if (queueRunning) return;
  queueRunning = true;
  while (indexQueue.size > 0) {
    const path = indexQueue.values().next().value!;
    indexQueue.delete(path);
    await indexFile(path);
  }
  queueRunning = false;
}

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleIndex(p: string): void {
  if (![".md", ".markdown"].includes(extname(p))) return;
  const existing = debounceTimers.get(p);
  if (existing) clearTimeout(existing);
  debounceTimers.set(p, setTimeout(() => {
    debounceTimers.delete(p);
    indexQueue.add(p);
    drainQueue();
  }, 2000));
}

export function watchWorkspace(workspacePath: string): void {
  chokidar.watch(workspacePath, {
    persistent: true,
    ignoreInitial: true,
    usePolling: true,
    interval: 500,
    ignored: /(node_modules|\.git)/,
  }).on("add", (p) => scheduleIndex(p))
    .on("change", (p) => scheduleIndex(p))
    .on("unlink", (p) => {
      if ([".md", ".markdown"].includes(extname(p))) {
        deleteFileChunks(p);
        console.log(`[rag] Deleted: ${p}`);
      }
    });
}
