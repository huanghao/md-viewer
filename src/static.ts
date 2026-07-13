import { readFileSync, existsSync } from "fs";
import { dirname, join, resolve } from "path";

// Dev: serve from public/ (HTML) and dist/ (built assets).
// Prod: serve from static/ directory bundled alongside the server.
const isDev = process.env.NODE_ENV !== 'production';
const publicDir = join(process.cwd(), "public");
const distDir = join(process.cwd(), "dist");
function getProdStaticDirs(): string[] {
  const dirs = [join(process.cwd(), "static")];

  if (process.execPath) {
    dirs.push(join(dirname(process.execPath), "static"));
  }
  if (Bun.argv[0]) {
    dirs.push(join(dirname(resolve(Bun.argv[0])), "static"));
  }

  return [...new Set(dirs)];
}

export function serveStatic(file: string): string | null {
  if (isDev) {
    const dir = file === 'index.html' ? publicDir : distDir;
    const filePath = join(dir, file);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf-8');
  }

  // Production: read from static/ beside the current working dir or compiled binary.
  for (const dir of getProdStaticDirs()) {
    const filePath = join(dir, file);
    if (existsSync(filePath)) return readFileSync(filePath, 'utf-8');
  }
  return null;
}
