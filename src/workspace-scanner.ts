import { existsSync, readFileSync } from "fs";
import { readdir, stat } from "fs/promises";
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

async function walk(
  dir: string,
  ancestorPatterns: Pattern[],
  nodeMap: Map<string, FileTreeNode>,
  parentNode: FileTreeNode,
): Promise<number> {
  const localPatterns = loadLocalPatterns(dir);
  const patterns: Pattern[] = [
    ...ancestorPatterns,
    ...localPatterns.map((p) => ({ base: dir, pattern: p })),
  ];

  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return 0; }

  let fileCount = 0;

  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    if (ALWAYS_SKIP.has(e.name)) continue;
    const fullPath = join(dir, e.name);
    if (isIgnored(fullPath, patterns)) continue;

    if (e.isDirectory()) {
      const dirNode: FileTreeNode = { name: e.name, path: fullPath, type: "directory", children: [], fileCount: 0 };
      nodeMap.set(fullPath, dirNode);
      const count = await walk(fullPath, patterns, nodeMap, dirNode);
      if (count === 0) {
        nodeMap.delete(fullPath);
        continue;
      }
      const local = loadLocalPatterns(fullPath);
      if (local.length > 0) dirNode.ignorePatterns = local;
      dirNode.fileCount = count;
      parentNode.children!.push(dirNode);
      fileCount += count;
    } else if (e.isFile()) {
      if (!isSupportedTextFile(e.name.toLowerCase())) continue;
      let mtime = 0;
      try { mtime = (await stat(fullPath)).mtimeMs; } catch {}
      parentNode.children!.push({ name: e.name, path: fullPath, type: "file", lastModified: mtime });
      fileCount++;
    }
  }

  return fileCount;
}

// Returns a FileTreeNode tree (for the workspace sidebar).
export async function scanWorkspaceTree(rootPath: string): Promise<FileTreeNode> {
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

  await walk(rootPath, rootAncestorPatterns, nodeMap, root);

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
export async function collectWorkspaceMdFiles(rootPath: string): Promise<string[]> {
  if (!existsSync(rootPath)) return [];
  const files: string[] = [];
  const rootLocalPatterns = loadLocalPatterns(rootPath);
  const rootAncestorPatterns: Pattern[] = [
    ...globalPatterns().map((p) => ({ base: rootPath, pattern: p })),
    ...rootLocalPatterns.map((p) => ({ base: rootPath, pattern: p })),
  ];

  async function collectFiles(dir: string, ancestorPatterns: Pattern[]): Promise<void> {
    const localPatterns = loadLocalPatterns(dir);
    const patterns: Pattern[] = [
      ...ancestorPatterns,
      ...localPatterns.map((p) => ({ base: dir, pattern: p })),
    ];
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); }
    catch { return; }

    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      if (ALWAYS_SKIP.has(e.name)) continue;
      const fullPath = join(dir, e.name);
      if (isIgnored(fullPath, patterns)) continue;
      if (e.isDirectory()) {
        await collectFiles(fullPath, patterns);
      } else if (e.isFile() && [".md", ".markdown"].includes(extname(e.name))) {
        files.push(fullPath);
      }
    }
  }

  await collectFiles(rootPath, rootAncestorPatterns);
  return files;
}
