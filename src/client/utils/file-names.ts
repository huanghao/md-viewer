import type { FileInfo } from '../types';

export type FileInfoWithDisplayName = FileInfo & {
  /** 纯文本展示名，同名时为 `目录/文件名`，用于 key、比较等非渲染场景 */
  displayName: string;
  /** 同名文件的区分目录；文件名唯一时为空 */
  nameHint?: string;
};

// 为同名文件生成区分名称（与最近视图共用 duplicateNameHints，保证各处区分方式一致）
export function generateDistinctNames(files: Map<string, FileInfo>): FileInfoWithDisplayName[] {
  const fileArray = Array.from(files.values());
  const hints = duplicateNameHints(fileArray.map(f => f.path));
  return fileArray.map((file): FileInfoWithDisplayName => {
    const nameHint = hints.get(file.path);
    return { ...file, nameHint, displayName: nameHint ? `${nameHint}/${file.name}` : file.name };
  });
}

/**
 * 平铺列表里同名文件的区分提示：取能区分同名文件的最短父目录后缀。
 * 如 doris/README.md 与 trino/README.md → 'doris' / 'trino'；
 * a/x/README.md 与 b/x/README.md → 'a/x' / 'b/x'。文件名唯一的不返回。
 */
export function duplicateNameHints(paths: string[]): Map<string, string> {
  const groups = new Map<string, string[]>();
  for (const p of paths) {
    const name = p.split('/').pop() ?? p;
    const g = groups.get(name);
    if (g) g.push(p); else groups.set(name, [p]);
  }
  const hints = new Map<string, string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const dirs = group.map(p => p.split('/').filter(Boolean).slice(0, -1));
    const maxDepth = Math.max(...dirs.map(d => d.length));
    let depth = 1;
    const suffix = (d: string[]) => d.slice(Math.max(0, d.length - depth)).join('/');
    while (depth < maxDepth && new Set(dirs.map(suffix)).size < group.length) depth++;
    group.forEach((p, i) => { const h = suffix(dirs[i]); if (h) hints.set(p, h); });
  }
  return hints;
}
