import { readFileSync, existsSync } from "fs";
import { join } from "path";

// In dev mode, serve from public/ (HTML) and dist/ (built assets).
// In production mode, return null and fall back to generateClientHTML().
const isDev = process.env.NODE_ENV !== 'production';

const publicDir = join(process.cwd(), "public");
const distDir = join(process.cwd(), "dist");

const distFiles = new Set(['client.js', 'styles.css', 'vendor-github-markdown.css', 'vendor-highlight-github.css']);

export function serveStatic(file: string): string | null {
  if (!isDev) return null;

  const dir = distFiles.has(file) ? distDir : publicDir;
  const filePath = join(dir, file);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf-8');
}
