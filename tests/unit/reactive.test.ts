import { describe, expect, it } from "bun:test";
import { createReactive, ReactiveMap, ReactiveSet, subscribeReactive } from "../../src/client/utils/reactive";

function counter() {
  let n = 0;
  const off = subscribeReactive(() => n++);
  return { get: () => n, off };
}

describe("createReactive — 普通属性", () => {
  it("值变化时通知，值不变时不通知", () => {
    const s = createReactive({ a: 1, nested: { b: 2 } });
    const c = counter();
    s.a = 2;
    expect(c.get()).toBe(1);
    s.a = 2;
    expect(c.get()).toBe(1);
    c.off();
  });

  it("嵌套对象的深层写入同样通知（通过读取得到的代理）", () => {
    const s = createReactive({ list: [{ content: "a" }] });
    const c = counter();
    s.list[0].content = "b";
    expect(c.get()).toBe(1);
    expect(s.list[0].content).toBe("b");
    c.off();
  });

  it("数组 push 与删除属性会通知", () => {
    const s = createReactive({ tabs: [] as string[], extra: { x: 1 } as Record<string, number> });
    const c = counter();
    s.tabs.push("a");
    expect(c.get()).toBeGreaterThan(0);
    const before = c.get();
    delete (s.extra as any).x;
    expect(c.get()).toBe(before + 1);
    c.off();
  });

  it("读取同一嵌套对象得到同一个代理（身份稳定）", () => {
    const s = createReactive({ cfg: { k: 1 } });
    expect(s.cfg).toBe(s.cfg);
  });

  it("JSON 序列化与展开不受影响", () => {
    const s = createReactive({ cfg: { k: 1 }, list: [1, 2] });
    expect(JSON.parse(JSON.stringify(s))).toEqual({ cfg: { k: 1 }, list: [1, 2] });
    expect({ ...s.cfg }).toEqual({ k: 1 });
  });
});

describe("createReactive — Map / Set", () => {
  it("初始 Map 被转为 ReactiveMap，且 instanceof Map 成立", () => {
    const s = createReactive({ files: new Map([["a", { content: "x" }]]) });
    expect(s.files).toBeInstanceOf(Map);
    expect(s.files).toBeInstanceOf(ReactiveMap);
    expect(s.files.get("a")?.content).toBe("x");
  });

  it("set / delete / clear 通知；重复 set 同一值不通知", () => {
    const s = createReactive({ m: new Map<string, number>() });
    const c = counter();
    s.m.set("a", 1);
    expect(c.get()).toBe(1);
    s.m.set("a", 1);
    expect(c.get()).toBe(1);
    s.m.delete("a");
    expect(c.get()).toBe(2);
    s.m.delete("missing");
    expect(c.get()).toBe(2);
    s.m.set("b", 2);
    s.m.clear();
    expect(c.get()).toBe(4);
    c.off();
  });

  it("Map 中对象值的深层写入通知", () => {
    const s = createReactive({ files: new Map([["p", { content: "a" }]]) });
    const c = counter();
    const f = s.files.get("p")!;
    f.content = "b";
    expect(c.get()).toBe(1);
    expect(s.files.get("p")!.content).toBe("b");
    c.off();
  });

  it("给根属性赋普通 Map 会转为 ReactiveMap", () => {
    const s = createReactive({ m: new Map<string, number>() });
    s.m = new Map([["x", 1]]);
    expect(s.m).toBeInstanceOf(ReactiveMap);
    const c = counter();
    s.m.set("y", 2);
    expect(c.get()).toBe(1);
    c.off();
  });

  it("ReactiveSet add / delete 通知", () => {
    const s = createReactive({ ids: new Set<string>() });
    const c = counter();
    s.ids.add("a");
    s.ids.add("a");
    expect(c.get()).toBe(1);
    s.ids.delete("a");
    expect(c.get()).toBe(2);
    expect(s.ids).toBeInstanceOf(ReactiveSet);
    c.off();
  });
});
