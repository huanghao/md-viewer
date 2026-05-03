import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Dev: serve from public/ (HTML) and dist/ (built assets).
// Prod: serve from static/ directory bundled alongside the server.
const isDev = process.env.NODE_ENV !== 'production';
const publicDir = join(process.cwd(), "public");
const distDir = join(process.cwd(), "dist");
const prodStaticDir = join(process.cwd(), "static");

export function serveStatic(file: string): string | null {
  if (isDev) {
    const dir = file === 'index.html' ? publicDir : distDir;
    const filePath = join(dir, file);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
  }

  // Production: read from static/ bundled with server
  const filePath = join(prodStaticDir, file);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf-8');
}
