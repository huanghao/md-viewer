import { describe, expect, it } from "bun:test";
import { fileTreeEquals } from "../../src/client/utils/file-tree-equal";
import type { FileTreeNode } from "../../src/client/types";

function sampleTree(overrides: Partial<FileTreeNode> = {}): FileTreeNode {
  return {
    name: "ws",
    path: "/ws",
    type: "directory",
    fileCount: 2,
    children: [
      { name: "a.md", path: "/ws/a.md", type: "file", lastModified: 100 },
      {
        name: "sub",
        path: "/ws/sub",
        type: "directory",
        fileCount: 1,
        children: [{ name: "b.md", path: "/ws/sub/b.md", type: "file", lastModified: 200 }],
      },
    ],
    ...overrides,
  };
}

describe("fileTreeEquals", () => {
  it("结构相同（不同引用）视为相等", () => {
    expect(fileTreeEquals(sampleTree(), sampleTree())).toBe(true);
  });

  it("undefined 与 false / 空 children 与缺省 children 视为相等", () => {
    const a = sampleTree();
    const b = sampleTree();
    b.children![0].isExpanded = false;
    expect(fileTreeEquals(a, b)).toBe(true);
    const c: FileTreeNode = { name: "x", path: "/x", type: "file", children: [] };
    const d: FileTreeNode = { name: "x", path: "/x", type: "file" };
    expect(fileTreeEquals(c, d)).toBe(true);
  });

  it("文件 mtime 变化视为不等", () => {
    const b = sampleTree();
    b.children![0].lastModified = 101;
    expect(fileTreeEquals(sampleTree(), b)).toBe(false);
  });

  it("新增或删除节点视为不等", () => {
    const added = sampleTree();
    added.children!.push({ name: "c.md", path: "/ws/c.md", type: "file", lastModified: 1 });
    expect(fileTreeEquals(sampleTree(), added)).toBe(false);
    const removed = sampleTree();
    removed.children!.pop();
    expect(fileTreeEquals(sampleTree(), removed)).toBe(false);
  });

  it("深层节点变化能被发现", () => {
    const b = sampleTree();
    b.children![1].children![0].name = "renamed.md";
    expect(fileTreeEquals(sampleTree(), b)).toBe(false);
  });

  it("展开状态变化视为不等（展开状态会被持久化）", () => {
    const b = sampleTree();
    b.children![1].isExpanded = true;
    expect(fileTreeEquals(sampleTree(), b)).toBe(false);
  });

  it("扫描警告变化视为不等", () => {
    const b = sampleTree({ scanWarnings: [{ path: "/ws/big", entryCount: 9000 }] });
    expect(fileTreeEquals(sampleTree(), b)).toBe(false);
  });
});
