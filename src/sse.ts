import type { SSEClient } from "./types.ts";

const sseClients = new Set<SSEClient>();

export function broadcastFileOpened(
  fileInfo: { path: string; filename: string; content: string; lastModified: number; isRemote: boolean },
  focus: boolean
) {
  const data = `data: ${JSON.stringify({ type: "file-opened", data: fileInfo, focus })}\n\n`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  
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
