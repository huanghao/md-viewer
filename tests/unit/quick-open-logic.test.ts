import { describe, expect, it } from "bun:test";
import { baseNameOf, buildQuickOpenResults, parentDirOf, sectionStartsOf } from "../../src/client/quick-open/logic";
import { quickOpenStore } from "../../src/client/quick-open/store";

describe("quick-open logic", () => {
  it("空查询列出全部已打开文件，显示文件名", () => {
    const r = buildQuickOpenResults(["/a/x.md", "/b/y.md"], [], "");
    expect(r).toEqual([
      { path: "/a/x.md", display: "x.md", isOpen: true },
      { path: "/b/y.md", display: "y.md", isOpen: true },
    ]);
  });

  it("有查询时已打开的命中排在前面，保持各自原有顺序", () => {
    const r = buildQuickOpenResults(
      ["/w/open2.md"],
      [
        { path: "/w/other.md", display: "other.md" },
        { path: "/w/open2.md", display: "open2.md" },
        { path: "/w/another.md", display: "another.md" },
      ],
      "o",
    );
    expect(r.map((x) => x.path)).toEqual(["/w/open2.md", "/w/other.md", "/w/another.md"]);
    expect(r.map((x) => x.isOpen)).toEqual([true, false, false]);
  });

  it("分段标题只在每组第一项出现", () => {
    const results = buildQuickOpenResults(
      ["/a.md"],
      [{ path: "/a.md", display: "a.md" }, { path: "/b.md", display: "b.md" }, { path: "/c.md", display: "c.md" }],
      "x",
    );
    expect(sectionStartsOf(results)).toEqual(["已打开", "文件", null]);
  });

  it("路径工具函数", () => {
    expect(baseNameOf("/a/b/c.md")).toBe("c.md");
    expect(parentDirOf("/a/b/c.md")).toBe("/a/b/");
    expect(parentDirOf("c.md")).toBe("");
  });
});

describe("quickOpenStore", () => {
  it("setResults 默认高亮第一项，无结果时为 -1，setActive 夹在范围内", () => {
    quickOpenStore.open();
    quickOpenStore.setResults([
      { path: "/a.md", display: "a.md", isOpen: true },
      { path: "/b.md", display: "b.md", isOpen: false },
    ]);
    expect(quickOpenStore.getState().activeIndex).toBe(0);
    quickOpenStore.setActive(9);
    expect(quickOpenStore.getState().activeIndex).toBe(1);
    quickOpenStore.setActive(-5);
    expect(quickOpenStore.getState().activeIndex).toBe(0);
    quickOpenStore.setResults([]);
    expect(quickOpenStore.getState().activeIndex).toBe(-1);
    quickOpenStore.close();
    expect(quickOpenStore.getState().visible).toBe(false);
  });
});
