import type { MiddlewareHandler } from "hono";
import { SpanStatusCode } from "@opentelemetry/api";
import { getTracer } from "./otel.ts";

// 长连接不适合按请求生命周期建 span（span 会挂到连接关闭才结束），单独跳过。
const SKIP_PATHS = new Set(["/api/events", "/otel/v1/traces"]);

export const otelMiddleware: MiddlewareHandler = async (c, next) => {
  const tracer = getTracer();
  if (!tracer || SKIP_PATHS.has(c.req.path)) {
    await next();
    return;
  }

  await tracer.startActiveSpan(`${c.req.method} ${c.req.path}`, async (span) => {
    span.setAttribute("http.method", c.req.method);
    span.setAttribute("http.target", c.req.path);
    try {
      await next();
      span.setAttribute("http.status_code", c.res.status);
      if (c.res.status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
      throw err;
    } finally {
      span.end();
    }
  });
};
