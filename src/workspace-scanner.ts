import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, extname, relative } from "path";
import { homedir } from "os";
import { minimatch } from "minimatch";
import { isSupportedTextFile } from "./utils.ts";

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
  fileCount?: number;
  lastModified?: number;
  ignorePatterns?: string[];
}

const ALWAYS_SKIP = new Set(["node_modules", "dist", "build", ".git"]);

function loadLocalPatterns(dir: string): string[] {
  const p = join(dir, ".mdvignore");
  if (!existsSync(p)) return [];
  try {
    return readFileSync(p, "utf-8").split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
  } catch { return []; }
}

let _globalPatterns: string[] | null = null;
function globalPatterns(): string[] {
  if (_globalPatterns !== null) return _globalPatterns;
  _globalPatterns = loadLocalPatterns(homedir());
  return _globalPatterns;
}

type Pattern = { base: string; pattern: string };

function isIgnored(fullPath: string, patterns: Pattern[]): boolean {
  return patterns.some(({ base, pattern }) => {
    const rel = relative(base, fullPath);
    return minimatch(rel, pattern, { dot: true }) ||
           minimatch(rel + "/", pattern, { dot: true });
  });
}

interface WalkCallbacks {
  onEnterDir?: (path: string, name: string, localPatterns: string[]) => void;
  onLeaveDir?: (path: string, fileCount: number) => void;
  onFile: (path: string, name: string, mtime: number) => void;
}

function walk(dir: string, ancestorPatterns: Pattern[], cb: WalkCallbacks): number {
  const localPatterns = loadLocalPatterns(dir);
  const patterns: Pattern[] = [
    ...ancestorPatterns,
    ...localPatterns.map((p) => ({ base: dir, pattern: p })),
  ];

  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return 0; }

  let fileCount = 0;
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    if (ALWAYS_SKIP.has(e.name)) continue;
    const fullPath = join(dir, e.name);
    if (isIgnored(fullPath, patterns)) continue;

    if (e.isDirectory()) {
      cb.onEnterDir?.(fullPath, e.name, localPatterns);
      const count = walk(fullPath, patterns, cb);
      cb.onLeaveDir?.(fullPath, count);
      fileCount += count;
    } else if (e.isFile()) {
      let mtime = 0;
      try { mtime = statSync(fullPath).mtimeMs; } catch {}
      cb.onFile(fullPath, e.name, mtime);
      fileCount++;
    }
  }
  return fileCount;
}

// Returns a FileTreeNode tree (for the workspace sidebar).
export function scanWorkspaceTree(rootPath: string): FileTreeNode {
  const nodeMap = new Map<string, FileTreeNode>();

  const rootLocalPatterns = loadLocalPatterns(rootPath);
  const root: FileTreeNode = {
    name: rootPath.split("/").pop() ?? rootPath,
    path: rootPath,
    type: "directory",
    children: [],
    fileCount: 0,
    ...(rootLocalPatterns.length > 0 ? { ignorePatterns: rootLocalPatterns } : {}),
  };
  nodeMap.set(rootPath, root);

  const rootAncestorPatterns: Pattern[] = [
    ...globalPatterns().map((p) => ({ base: rootPath, pattern: p })),
    ...rootLocalPatterns.map((p) => ({ base: rootPath, pattern: p })),
  ];
  walk(rootPath, rootAncestorPatterns, {
    onEnterDir(path, name, _localPatterns) {
      const node: FileTreeNode = { name, path, type: "directory", children: [], fileCount: 0 };
      nodeMap.set(path, node);
    },
    onLeaveDir(path, fileCount) {
      const node = nodeMap.get(path)!;
      // attach .mdvignore patterns for the client-side ignore-filter
      const local = loadLocalPatterns(path);
      if (local.length > 0) node.ignorePatterns = local;
      if (fileCount === 0) { nodeMap.delete(path); return; }
      node.fileCount = fileCount;
      const parentPath = path.substring(0, path.lastIndexOf("/"));
      nodeMap.get(parentPath)?.children!.push(node);
    },
    onFile(path, name, mtime) {
      const parentPath = path.substring(0, path.lastIndexOf("/"));
      if (!isSupportedTextFile(name.toLowerCase())) return;
      nodeMap.get(parentPath)?.children!.push({ name, path, type: "file", lastModified: mtime });
    },
  });

  // aggregate fileCount up to root and sort children at every level
  function finalize(node: FileTreeNode): number {
    if (node.type === "file") return 1;
    node.children!.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.fileCount = node.children!.reduce((n, c) => n + finalize(c), 0);
    return node.fileCount;
  }
  finalize(root);

  return root;
}

// Returns a flat list of .md/.markdown files (for RAG indexer).
export function collectWorkspaceMdFiles(rootPath: string): string[] {
  if (!existsSync(rootPath)) return [];
  const files: string[] = [];
  const rootLocalPatterns = loadLocalPatterns(rootPath);
  const rootAncestorPatterns: Pattern[] = [
    ...globalPatterns().map((p) => ({ base: rootPath, pattern: p })),
    ...rootLocalPatterns.map((p) => ({ base: rootPath, pattern: p })),
  ];

  walk(rootPath, rootAncestorPatterns, {
    onFile(path, name) {
      if ([".md", ".markdown"].includes(extname(name))) files.push(path);
    },
  });

  return files;
}
