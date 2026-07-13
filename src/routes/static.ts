import type { Hono } from "hono";
import { serveStatic } from "../static.ts";

const FAVICON_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="16" fill="#3b82f6"/>
  <path d="M 9 11 L 9 21 L 11 21 L 11 14.5 L 16 19.5 L 21 14.5 L 21 21 L 23 21 L 23 11 L 16 18.5 Z" fill="white"/>
</svg>`;

export function registerStaticRoutes(app: Hono): void {
  app.get("/", (c) => {
    c.header("Cache-Control", "no-cache, no-store, must-revalidate");
    c.header("Pragma", "no-cache");
    c.header("Expires", "0");
    const html = serveStatic("index.html");
    if (html) return c.html(html);
    return c.notFound();
  });

  app.get("/client.js", (c) => {
    const content = serveStatic("client.js");
    if (!content) return c.notFound();
    c.header("Content-Type", "application/javascript");
    c.header("Cache-Control", "no-cache");
    return c.body(content);
  });

  app.get("/client.css", (c) => {
    const content = serveStatic("client.css");
    if (!content) return c.notFound();
    c.header("Content-Type", "text/css");
    c.header("Cache-Control", "no-cache");
    return c.body(content);
  });

  app.get("/favicon.svg", (c) => {
    c.header("Content-Type", "image/svg+xml");
    c.header("Cache-Control", "public, max-age=31536000");
    return c.body(FAVICON_SVG);
  });
}
