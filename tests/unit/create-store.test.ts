import { describe, expect, it } from "bun:test";
import { createStore } from "../../src/client/utils/create-store";

describe("createStore", () => {
  it("merge 合并补丁并通知订阅者", () => {
    const s = createStore({ a: 1, b: "x" });
    let calls = 0;
    s.subscribe(() => calls++);
    s.merge({ a: 2 });
    expect(s.getState()).toEqual({ a: 2, b: "x" });
    expect(calls).toBe(1);
  });

  it("replace 不传比较函数时总是通知", () => {
    const s = createStore({ a: 1 });
    let calls = 0;
    s.subscribe(() => calls++);
    s.replace({ a: 1 });
    expect(calls).toBe(1);
  });

  it("replace 传入比较函数且相等时不通知、不替换引用", () => {
    const s = createStore({ a: 1 });
    const before = s.getState();
    let calls = 0;
    s.subscribe(() => calls++);
    s.replace({ a: 1 }, (x, y) => x.a === y.a);
    expect(calls).toBe(0);
    expect(s.getState()).toBe(before);
    s.replace({ a: 2 }, (x, y) => x.a === y.a);
    expect(calls).toBe(1);
  });

  it("取消订阅后不再通知", () => {
    const s = createStore({ a: 1 });
    let calls = 0;
    const off = s.subscribe(() => calls++);
    off();
    s.merge({ a: 2 });
    expect(calls).toBe(0);
  });
});
