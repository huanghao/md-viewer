import { statSync, existsSync } from "fs";
import { join, extname } from "path";
import { collectWorkspaceMdFiles } from "./workspace-scanner.ts";
import chokidar from "chokidar";
import { chunkMarkdown } from "./rag-chunker.ts";
import { upsertFileChunks, deleteFileChunks, getFileMtime, getMeta, setMeta } from "./rag-storage.ts";
import { invalidateChunksForPath, appendChunks, getVectorCache } from "./rag-vector-cache.ts";

export const MODEL_NAME = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const MODEL_DTYPE = "q8";

// ── Worker state ─────────────────────────────────────────────────────────────

type ModelStatus = "loading" | "ready" | "error";

let worker: Worker | null = null;
let modelStatus: ModelStatus = "loading";
let pendingId = 0;
const pending = new Map<number, { resolve: (v: Float32Array[]) => void; reject: (e: Error) => void }>();

export function getModelStatus(): ModelStatus {
  return modelStatus;
}

// Backwards-compat shim used by rag-server.ts search handler
export function getEmbedder(): unknown {
  return modelStatus === "ready" ? true : null;
}

// ── Index queue stats (exported for /status) ─────────────────────────────────

let _queueSize = 0;
let _indexedFiles = 0;
let _lastIndexedAt: number | null = null;

export function getIndexStats() {
  return {
    modelStatus,
    queueSize: _queueSize,
    indexedFiles: _indexedFiles,
    totalChunks: getVectorCache().length,
    lastIndexedAt: _lastIndexedAt,
  };
}

// ── Worker init ───────────────────────────────────────────────────────────────

export function loadModel(): Promise<void> {
  console.log("[rag] Starting embed worker (model: " + MODEL_NAME + ")...");

  worker = new Worker(new URL("./rag-embed-worker.ts", import.meta.url), { type: "module" });

  // Resolve once model signals "ready"
  return new Promise<void>((resolve, reject) => {
    worker!.onmessage = async (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === "status") {
        modelStatus = msg.status;
        if (msg.status === "ready") {
          console.log("[rag] Model ready.");
          // Check if model config changed → clear old vectors
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
          // Switch to normal message handler for embed requests
          worker!.onmessage = handleWorkerMessage;
          resolve();
        }
        return;
      }
      // embed responses that arrive before ready (shouldn't happen, but safe)
      handleWorkerMessage(event);
    };
    worker!.onerror = (e) => {
      console.error("[rag] Worker error:", e.message);
      modelStatus = "error";
      reject(new Error(e.message));
    };
  });
}

function handleWorkerMessage(event: MessageEvent) {
  const msg = event.data;
  if (msg.type === "status") {
    modelStatus = msg.status;
    return;
  }
  const p = pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  if (msg.error) p.reject(new Error(msg.error));
  else p.resolve(msg.vectors as Float32Array[]);
}

// ── Embed via worker ──────────────────────────────────────────────────────────

async function embedTexts(texts: string[]): Promise<Float32Array[]> {
  if (!worker || modelStatus !== "ready") throw new Error("model_not_ready");
  const id = ++pendingId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage({ id, texts });
  });
}

// Exported for rag-server.ts /search handler
export { embedTexts as embedTextsForSearch };

// ── File indexing ─────────────────────────────────────────────────────────────

export async function indexFile(filePath: string): Promise<void> {
  if (modelStatus !== "ready") return;
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
      id: -1,
      path: c.path,
      heading: c.heading,
      text: c.text,
      charStart: c.charStart,
      vector: vectors[i],
    })));
    _indexedFiles++;
    _lastIndexedAt = Date.now();
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
  console.log(`[rag] Workspace scan complete: ${workspacePath}`);
}

// ── Index queue ───────────────────────────────────────────────────────────────

const indexQueue: Set<string> = new Set();
let queueRunning = false;

async function drainQueue(): Promise<void> {
  if (queueRunning) return;
  queueRunning = true;
  while (indexQueue.size > 0) {
    _queueSize = indexQueue.size;
    const path = indexQueue.values().next().value!;
    indexQueue.delete(path);
    await indexFile(path);
  }
  _queueSize = 0;
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
      if (name.includes(".") && ![".md", ".markdown"].includes(extname(name))) return true;
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
