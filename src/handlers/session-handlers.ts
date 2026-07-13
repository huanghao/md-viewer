import type { Context } from "hono";
import { addClient, broadcastEvent, removeClient } from "../sse.ts";

const encoder = new TextEncoder();

interface SessionStateRequest {
  requestId: string;
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const pendingStateRequests = new Map<string, SessionStateRequest>();

export function handleEvents(c: Context) {
  let client: { controller: ReadableStreamDefaultController<Uint8Array> } | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      client = { controller };
      addClient(client);

      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({})}\n\n`));
      c.req.signal.addEventListener("abort", () => {
        removeClient(client!);
      });
    },
    cancel() {
      if (client) removeClient(client);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function handleGetSessionState(c: Context) {
  const requestId = `state-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const statePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingStateRequests.delete(requestId);
      reject(new Error("客户端响应超时"));
    }, 3000);

    pendingStateRequests.set(requestId, { requestId, resolve, reject, timeout });
  });

  broadcastStateRequest(requestId);

  try {
    const data = await statePromise;
    return c.json(data);
  } catch (error: any) {
    return c.json({
      error: error.message,
      currentFile: null,
      openFiles: [],
      lastUpdate: Date.now(),
    }, 500);
  }
}

export async function handleUpdateSessionState(c: Context) {
  const body = await c.req.json();
  const requestId = body.requestId;

  if (!requestId) {
    return c.json({ error: "缺少 requestId" }, 400);
  }

  const request = pendingStateRequests.get(requestId);
  if (!request) {
    return c.json({ error: "请求已过期或不存在" }, 404);
  }

  clearTimeout(request.timeout);
  pendingStateRequests.delete(requestId);

  request.resolve({
    currentFile: body.currentFile || null,
    openFiles: body.openFiles || [],
    lastUpdate: Date.now(),
  });

  return c.json({ success: true });
}

function broadcastStateRequest(requestId: string) {
  const event = {
    type: "state-request",
    requestId,
    timestamp: Date.now(),
  };

  broadcastEvent(event);
}

export function handleGetClientConfig(): Response {
  const clientConfig = {
    pdf: {
      defaultScale: 1.5,
    },
  };
  return new Response(JSON.stringify(clientConfig), {
    headers: { "Content-Type": "application/json" },
  });
}
