// Bun Worker: runs embedding model in a separate thread so the main
// event loop (HTTP server) is never blocked by ONNX inference.
import { pipeline, env } from "@huggingface/transformers";
import { join } from "path";

const MODEL_NAME = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const MODEL_DTYPE = "q8";
env.cacheDir = join(process.env.HOME ?? "~", ".cache", "huggingface");

let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;

async function init() {
  self.postMessage({ type: "status", status: "loading" });
  embedder = await pipeline("feature-extraction", MODEL_NAME, { dtype: MODEL_DTYPE });
  self.postMessage({ type: "status", status: "ready" });
}

const BATCH_SIZE = 4;

self.onmessage = async (event: MessageEvent) => {
  const { id, texts } = event.data as { id: number; texts: string[] };
  if (!embedder) {
    self.postMessage({ id, error: "model_not_ready" });
    return;
  }
  try {
    const results: Float32Array[] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const output = await (embedder as any)(batch, { pooling: "mean", normalize: true });
      const dim = output.data.length / batch.length;
      for (let j = 0; j < batch.length; j++) {
        results.push(output.data.slice(j * dim, (j + 1) * dim) as Float32Array);
      }
    }
    // Transfer buffers to avoid copying
    const transferables = results.map(v => v.buffer);
    self.postMessage({ id, vectors: results }, transferables);
  } catch (e: any) {
    self.postMessage({ id, error: String(e?.message ?? e) });
  }
};

init();
