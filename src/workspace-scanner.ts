import { existsSync, readFileSync } from "fs";
import { readdir, stat } from "fs/promises";
import { join, extname, relative } from "path";
import { homedir } from "os";
import { minimatch } from "minimatch";
import { isSupportedTextFile } from "./utils.ts";
import { markExploded } from "./scan-guard.ts";

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
  fileCount?: number;
  lastModified?: number;
  ignorePatterns?: string[];
  // 仅根节点：本次扫描中被熔断跳过的目录（见 MAX_DIR_ENTRIES）
  scanWarnings?: ScanWarning[];
}

export interface ScanWarning {
  path: string;
  entryCount: number;
}

// 熔断阈值：单个目录下的条目数超过此值就不再递归展开，只记录告警。
// 正常手写的源码/文档目录很少在一层里堆到这个数量；数据导出目录、虚拟环境等
// "爆炸目录" 往往是几万个文件，扫描/监听它们是内存和 CPU 突刺的主要来源。
export const MAX_DIR_ENTRIES = 2000;

// Built-in default patterns, equivalent to a global .mdvignore that ships with the tool.
// Users can override via ~/.mdvignore or a per-directory .mdvignore.
export const DEFAULT_PATTERNS = ["node_modules", "dist", "build", ".git", ".venv", "venv"];

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
  _globalPatterns = [...DEFAULT_PATTERNS, ...loadLocalPatterns(homedir())];
  return _globalPatterns;
}

type Pattern = { base: string; pattern: string };

function isIgnored(fullPath: string, patterns: Pattern[]): boolean {
  return patterns.some(({ base, pattern }) => {
    const rel = relative(base, fullPath);
    return minimatch(rel, pattern, { dot: true, matchBase: true }) ||
           minimatch(rel + "/", pattern, { dot: true, matchBase: true });
  });
}

async function walk(
  dir: string,
  ancestorPatterns: Pattern[],
  nodeMap: Map<string, FileTreeNode>,
  parentNode: FileTreeNode,
  warnings: ScanWarning[],
): Promise<number> {
  const localPatterns = loadLocalPatterns(dir);
  const patterns: Pattern[] = [
    ...ancestorPatterns,
    ...localPatterns.map((p) => ({ base: dir, pattern: p })),
  ];

  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return 0; }

  if (entries.length > MAX_DIR_ENTRIES) {
    // 熔断：不递归展开这个目录，当作空目录处理（会被上层剪掉），只记录告警。
    warnings.push({ path: dir, entryCount: entries.length });
    markExploded(dir, entries.length); // 顺带让 file-watcher 退订这个路径
    return 0;
  }

  let fileCount = 0;

  for (const e of entries) {
    const fullPath = join(dir, e.name);
    if (isIgnored(fullPath, patterns)) continue;

    if (e.isDirectory()) {
      const dirNode: FileTreeNode = { name: e.name, path: fullPath, type: "directory", children: [], fileCount: 0 };
      nodeMap.set(fullPath, dirNode);
      const count = await walk(fullPath, patterns, nodeMap, dirNode, warnings);
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

  const warnings: ScanWarning[] = [];
  await walk(rootPath, rootAncestorPatterns, nodeMap, root, warnings);

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

  if (warnings.length > 0) {
    root.scanWarnings = warnings;
    for (const w of warnings) {
      console.warn(`[workspace-scanner] 目录条目数过多，已跳过扫描: ${w.path} (${w.entryCount} 项，超过 ${MAX_DIR_ENTRIES})`);
    }
  }

  return root;
}

// Returns a flat list of Markdown files for workspace-level file operations.
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

    if (entries.length > MAX_DIR_ENTRIES) {
      console.warn(`[workspace-scanner] 目录条目数过多，已跳过索引: ${dir} (${entries.length} 项，超过 ${MAX_DIR_ENTRIES})`);
      markExploded(dir, entries.length);
      return;
    }

    for (const e of entries) {
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
