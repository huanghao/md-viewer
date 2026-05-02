import { pipeline, env } from "@huggingface/transformers";
import { statSync, existsSync } from "fs";
import { join, extname } from "path";
import { collectWorkspaceMdFiles } from "./workspace-scanner.ts";
import chokidar from "chokidar";
import { chunkMarkdown } from "./rag-chunker.ts";
import { upsertFileChunks, deleteFileChunks, getFileMtime, getMeta, setMeta, getIndexedPaths } from "./rag-storage.ts";
import { invalidateChunksForPath, appendChunks } from "./rag-vector-cache.ts";

export const MODEL_NAME = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const MODEL_DTYPE = "q8";
env.cacheDir = join(process.env.HOME ?? "~", ".cache", "huggingface");

let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;

export function getEmbedder() {
  return embedder;
}

export async function loadModel(): Promise<void> {
  console.log("[rag] Loading embedding model (first run downloads ~118MB to ~/.cache/huggingface)...");
  embedder = await pipeline("feature-extraction", MODEL_NAME, { dtype: MODEL_DTYPE });
  console.log("[rag] Model ready.");

  const { getDb } = await import("./rag-storage.ts");
  const storedName = getMeta("model_name");
  const storedDtype = getMeta("model_dtype");
  if ((storedName && storedName !== MODEL_NAME) || (storedDtype && storedDtype !== MODEL_DTYPE)) {
    console.log("[rag] Model config changed, clearing old vectors...");
    getDb().exec("DELETE FROM rag_vectors; DELETE FROM rag_chunks;");
    const { resetCache } = await import("./rag-vector-cache.ts");
    resetCache();
  }
  setMeta("model_name", MODEL_NAME);
  setMeta("model_dtype", MODEL_DTYPE);
}

const EMBED_BATCH_SIZE = 4;

async function embedTexts(texts: string[]): Promise<Float32Array[]> {
  if (!embedder) throw new Error("Model not loaded");
  const results: Float32Array[] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
    const output = await (embedder as any)(batch, { pooling: "mean", normalize: true });
    const dim = output.data.length / batch.length;
    for (let j = 0; j < batch.length; j++) {
      results.push(output.data.slice(j * dim, (j + 1) * dim) as Float32Array);
    }
  }
  return results;
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
      invalidateChunksForPath(filePath);
      return;
    }

    console.log(`[rag] Indexing ${filePath} (${chunks.length} chunks)...`);
    const vectors = await embedTexts(chunks.map(c => c.text));
    const ragChunks = chunks.map((c, i) => ({
      path: filePath,
      chunkIndex: i,
      heading: c.heading,
      text: c.text,
      charStart: c.charStart,
      fileMtime: mtime,
    }));
    upsertFileChunks(ragChunks, vectors);
    invalidateChunksForPath(filePath);
    appendChunks(ragChunks.map((c, i) => ({
      id: -1, // not used in search
      path: c.path,
      heading: c.heading,
      text: c.text,
      charStart: c.charStart,
      vector: vectors[i],
    })));
  } catch (e) {
    console.error(`[rag] Error indexing ${filePath}:`, e);
  }
}


export async function scanWorkspace(workspacePath: string): Promise<void> {
  console.log(`[rag] Scanning workspace: ${workspacePath}`);
  const files = await collectWorkspaceMdFiles(workspacePath);
  console.log(`[rag] Found ${files.length} markdown files`);
  for (const f of files) {
    await indexFile(f);
    await new Promise(r => setTimeout(r, 0));
  }

  // 清理已索引但文件已不存在的孤立 chunks（属于本 workspace 下的路径）
  const fileSet = new Set(files);
  const indexed = getIndexedPaths().filter(p => p.startsWith(workspacePath));
  for (const p of indexed) {
    if (!fileSet.has(p) && !existsSync(p)) {
      deleteFileChunks(p);
      console.log(`[rag] Pruned missing file: ${p}`);
    }
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
    ignored: (p: string) => {
      const name = p.split("/").pop() ?? "";
      if (name.startsWith(".")) return true;
      // skip non-md files (avoid watching large binary/data dirs)
      if (name.includes(".") && ![".md", ".markdown"].includes(extname(name))) return true;
      // skip always-ignored dirs by name
      if (/(node_modules|\.git|\.pytest_cache|\.claude)/.test(p)) return true;
      return false;
    },
  }).on("add", (p) => scheduleIndex(p))
    .on("change", (p) => scheduleIndex(p))
    .on("unlink", (p) => {
      if ([".md", ".markdown"].includes(extname(p))) {
        deleteFileChunks(p);
        invalidateChunksForPath(p);
        console.log(`[rag] Deleted: ${p}`);
      }
    });
}
