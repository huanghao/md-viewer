import type { Hono } from "hono";
import { insertFocusSignal, pruneFocusSignals, queryFocusSignals } from "../focus-signal-storage.ts";

export function registerFocusRoutes(app: Hono): void {
  app.post("/api/focus-signal", async (c) => {
    try {
      const { type, file } = await c.req.json<{ type: string; file: string }>();
      if (!type || !file) return c.json({ ok: false }, 400);
      insertFocusSignal(type, file);
      if (Math.random() < 0.01) pruneFocusSignals(7);
    } catch {
      // Focus signals must not affect primary reader workflows.
    }
    return c.json({ ok: true });
  });

  app.get("/api/focus-signals", (c) => {
    const days = Number(c.req.query("days") ?? "7");
    try {
      return c.json({ signals: queryFocusSignals(days) });
    } catch {
      return c.json({ signals: [] });
    }
  });
}
