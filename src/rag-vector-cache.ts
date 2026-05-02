import { getAllVectors, type StoredChunk } from "./rag-storage.ts";

// In-memory vector cache — loaded once at startup, updated incrementally.
// Avoids deserializing all SQLite blobs on every search query.

let cache: StoredChunk[] | null = null;

export function getVectorCache(): StoredChunk[] {
  if (cache === null) {
    cache = getAllVectors();
    console.log(`[rag] Vector cache loaded: ${cache.length} chunks`);
  }
  return cache;
}

export function invalidateChunksForPath(path: string): void {
  if (cache === null) return;
  cache = cache.filter(c => c.path !== path);
}

export function appendChunks(chunks: StoredChunk[]): void {
  if (cache === null) return;
  cache.push(...chunks);
}

export function resetCache(): void {
  cache = null;
}
