import { describe, expect, it } from "bun:test";
import { DEFAULT_DURATION, HIDE_MS, normalizeToastOptions, toastStore } from "../../src/client/toast/store";

describe("normalizeToastOptions", () => {
  it("字符串等同于 info 类型、默认时长", () => {
    expect(normalizeToastOptions("hi")).toEqual({ message: "hi", type: "info", duration: DEFAULT_DURATION, action: undefined });
  });
  it("未传或负数时长回到默认值，0 保持常驻", () => {
    expect(normalizeToastOptions({ message: "a" }).duration).toBe(DEFAULT_DURATION);
    expect(normalizeToastOptions({ message: "a", duration: -1 }).duration).toBe(DEFAULT_DURATION);
    expect(normalizeToastOptions({ message: "a", duration: 0 }).duration).toBe(0);
  });
});

describe("toastStore", () => {
  it("add 加入列表，到时自动标记为隐藏并移除", async () => {
    const id = toastStore.add({ message: "bye", duration: 10 });
    expect(toastStore.getState().toasts.some((t) => t.id === id)).toBe(true);
    await Bun.sleep(10 + 20);
    expect(toastStore.getState().toasts.find((t) => t.id === id)?.hiding).toBe(true);
    await Bun.sleep(HIDE_MS + 50);
    expect(toastStore.getState().toasts.some((t) => t.id === id)).toBe(false);
  });

  it("常驻提示不会自动关闭，只能手动 hide", async () => {
    const id = toastStore.add({ message: "sticky", duration: 0, type: "error" });
    await Bun.sleep(30);
    expect(toastStore.getState().toasts.find((t) => t.id === id)?.hiding).toBe(false);
    toastStore.hide(id);
    expect(toastStore.getState().toasts.find((t) => t.id === id)?.hiding).toBe(true);
    await Bun.sleep(HIDE_MS + 50);
    expect(toastStore.getState().toasts.some((t) => t.id === id)).toBe(false);
  });

  it("重复 hide 不会重复启动移除", () => {
    const id = toastStore.add({ message: "x", duration: 0 });
    toastStore.hide(id);
    toastStore.hide(id);
    expect(toastStore.getState().toasts.filter((t) => t.id === id && t.hiding).length).toBe(1);
  });
});
