import type { Hono } from "hono";

/**
 * 前端 trace 上报代理。浏览器直接 POST 本地 otel collector（localhost:4318）会
 * 因跨端口触发 CORS（collector 没配 CORS 头），改成同源打到这个接口，服务端再转发，
 * 天然绕开跨域。otel 没起来时 fetch 失败直接吞掉，不影响正常请求。
 */
export function registerOtelRoutes(app: Hono): void {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";

  app.post("/otel/v1/traces", async (c) => {
    try {
      const body = await c.req.arrayBuffer();
      await fetch(`${endpoint}/v1/traces`, {
        method: "POST",
        headers: { "Content-Type": c.req.header("Content-Type") ?? "application/json" },
        body,
      });
    } catch {
      // otel 未启动/不可达：静默丢弃，前端遥测不应影响正常使用。
    }
    return c.body(null, 204);
  });
}
