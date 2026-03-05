import { beforeEach, describe, expect, test } from "bun:test";
import { state } from "../../src/client/state";
import { removeWorkspace } from "../../src/client/workspace";
import {
  getWorkspaceExpandedState,
  removeWorkspaceExpandedState,
  restoreWorkspaceExpandedStateFromStorage,
  setWorkspaceExpandedState,
} from "../../src/client/workspace-tree-expansion-persistence";

class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

if (!(globalThis as any).localStorage) {
  (globalThis as any).localStorage = new MemoryStorage();
}

describe("workspace tree expansion persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    state.config.workspaces = [];
    state.fileTree.clear();
    state.currentWorkspace = null;
    restoreWorkspaceExpandedStateFromStorage();
  });

  test("persists and restores expanded state by workspace id", () => {
    const wsId = "ws-1";
    const initial = new Map<string, boolean>([
      ["/repo/docs", false],
      ["/repo/src", true],
    ]);
    setWorkspaceExpandedState(wsId, initial);

    restoreWorkspaceExpandedStateFromStorage();
    const restored = getWorkspaceExpandedState(wsId);

    expect(restored).toBeDefined();
    expect(restored?.get("/repo/docs")).toBe(false);
    expect(restored?.get("/repo/src")).toBe(true);
  });

  test("remove workspace also clears persisted expanded state", () => {
    const wsId = "ws-remove";
    setWorkspaceExpandedState(wsId, new Map([[ "/repo/docs", false ]]));
    expect(getWorkspaceExpandedState(wsId)?.get("/repo/docs")).toBe(false);

    state.config.workspaces = [
      { id: wsId, name: "repo", path: "/repo", isExpanded: true },
    ];
    state.currentWorkspace = wsId;

    removeWorkspace(wsId);

    expect(getWorkspaceExpandedState(wsId)).toBeUndefined();

    restoreWorkspaceExpandedStateFromStorage();
    expect(getWorkspaceExpandedState(wsId)).toBeUndefined();

    // cleanup explicit call should be idempotent
    removeWorkspaceExpandedState(wsId);
    expect(getWorkspaceExpandedState(wsId)).toBeUndefined();
  });
});
