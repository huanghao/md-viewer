import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { handleEvents } from "../../src/handlers/session-handlers.ts";

describe("handleEvents (SSE)", () => {
  test("建立连接后立即收到 connected 事件，客户端断开不抛错", async () => {
    const app = new Hono();
    app.get("/api/events", handleEvents);
    const ac = new AbortController();
    const res = await app.request("/api/events", { signal: ac.signal });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const reader = res.body!.getReader();
    const { value } = await reader.read();
    expect(new TextDecoder().decode(value)).toContain("event: connected");
    ac.abort();
    await reader.cancel();
  });
});
