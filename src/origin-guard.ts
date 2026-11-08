// 同源校验：拦截来自其它站点的浏览器写请求（CSRF）。
// 非浏览器客户端（CLI、脚本）不带 Origin 头，照常放行；浏览器的跨站 POST/DELETE 会带上
// 发起页面的 Origin，与本服务地址不一致时拒绝。GET/HEAD/OPTIONS 不做校验。
import type { MiddlewareHandler } from "hono";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isAllowedOrigin(method: string, origin: string | undefined, requestUrl: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  if (origin === undefined) return true;
  let expected: string;
  try {
    expected = new URL(requestUrl).origin;
  } catch {
    return false;
  }
  return origin === expected;
}

export const originGuard: MiddlewareHandler = async (c, next) => {
  if (!isAllowedOrigin(c.req.method, c.req.header("origin"), c.req.url)) {
    return c.json({ error: "跨站请求已拒绝" }, 403);
  }
  await next();
};
