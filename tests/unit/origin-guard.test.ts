import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { isAllowedOrigin, originGuard } from "../../src/origin-guard";

const URL_ = "http://127.0.0.1:3000/api/file-write";

describe("isAllowedOrigin", () => {
  it("安全方法不校验", () => {
    expect(isAllowedOrigin("GET", "https://evil.example", URL_)).toBe(true);
  });
  it("无 Origin 头（CLI）放行", () => {
    expect(isAllowedOrigin("POST", undefined, URL_)).toBe(true);
  });
  it("同源放行，跨站拒绝", () => {
    expect(isAllowedOrigin("POST", "http://127.0.0.1:3000", URL_)).toBe(true);
    expect(isAllowedOrigin("DELETE", "https://evil.example", URL_)).toBe(false);
    expect(isAllowedOrigin("POST", "http://127.0.0.1:9999", URL_)).toBe(false);
    expect(isAllowedOrigin("POST", "null", URL_)).toBe(false);
  });
});

describe("originGuard middleware", () => {
  const app = new Hono();
  app.use("*", originGuard);
  app.post("/api/x", (c) => c.json({ ok: true }));

  it("跨站 POST 返回 403 且不执行处理器", async () => {
    const res = await app.request("http://127.0.0.1:3000/api/x", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(res.status).toBe(403);
  });
  it("同源与无 Origin 的 POST 正常处理", async () => {
    const same = await app.request("http://127.0.0.1:3000/api/x", {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000" },
    });
    expect(same.status).toBe(200);
    const cli = await app.request("http://127.0.0.1:3000/api/x", { method: "POST" });
    expect(cli.status).toBe(200);
  });
});
