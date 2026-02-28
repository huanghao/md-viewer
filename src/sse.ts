import type { SSEClient } from "./types.ts";

const sseClients = new Set<SSEClient>();

export function broadcastFileOpened(
  fileInfo: { path: string; filename: string; content: string; lastModified: number; isRemote: boolean },
  focus: boolean
) {
  const message = `event: file-opened\ndata: ${JSON.stringify({ ...fileInfo, focus })}\n\n`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);

  for (const client of sseClients) {
    try {
      client.controller.enqueue(bytes);
    } catch {
      // 客户端已断开
      sseClients.delete(client);
    }
  }
}

export function addClient(client: SSEClient) {
  sseClients.add(client);
}

export function removeClient(client: SSEClient) {
  sseClients.delete(client);
}

export function getClients(): Set<SSEClient> {
  return sseClients;
}

export function broadcastFileChanged(path: string, lastModified: number) {
  const message = `event: file-changed\ndata: ${JSON.stringify({ path, lastModified })}\n\n`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);

  for (const client of sseClients) {
    try {
      client.controller.enqueue(bytes);
    } catch {
      sseClients.delete(client);
    }
  }
}

export function broadcastFileDeleted(path: string) {
  const message = `event: file-deleted\ndata: ${JSON.stringify({ path })}\n\n`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);

  for (const client of sseClients) {
    try {
      client.controller.enqueue(bytes);
    } catch {
      sseClients.delete(client);
    }
  }
}
