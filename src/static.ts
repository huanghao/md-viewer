import { readFileSync, existsSync } from "fs";
import { join } from "path";

// In dev mode, serve from public/ (HTML) and dist/ (built assets).
// In production mode, return null and fall back to generateClientHTML().
const isDev = process.env.NODE_ENV !== 'production';
const publicDir = join(process.cwd(), "public");
const distDir = join(process.cwd(), "dist");

export function serveStatic(file: string): string | null {
  if (!isDev) return null;
  const dir = file === 'index.html' ? publicDir : distDir;
  const filePath = join(dir, file);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf-8');
}
