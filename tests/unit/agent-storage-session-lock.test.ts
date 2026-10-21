import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  ensureAgentSessionId,
  getAgentSession,
  getEffectiveAgentSession,
  getWorkspaceSessionId,
  listAgentSessionsForWorkspace,
  resetWorkspaceAgentSession,
  setWorkspaceAgentSession,
  insertAgentRun,
  markAgentIdle,
  resetAgentSessionId,
  resetStuckRunningAgentSessions,
  setAgentSessionId,
  tryMarkAgentRunning,
} from "../../src/agent-storage";
import { resetDbForTesting } from "../../src/annotation-db";

// 跟 tests/unit/annotation-storage.test.ts 用同一套隔离手法：agent_sessions/agent_runs
// 跟 annotations 共用一个 sqlite 文件（annotation-db.ts 的 getDb()），走 MDV_DATA_DIR
// 换目录 + resetDbForTesting() 隔离，不是给 pi-models.ts 那种要显式传路径的场景。
let tempConfigHome = "";
let oldConfigHome: string | undefined;

beforeAll(() => {
  oldConfigHome = process.env.MDV_DATA_DIR;
  tempConfigHome = mkdtempSync(join(tmpdir(), "mdv-agent-storage-"));
  process.env.MDV_DATA_DIR = tempConfigHome;
  resetDbForTesting();
});

afterEach(() => {
  resetDbForTesting();
});

afterAll(() => {
  if (oldConfigHome === undefined) delete process.env.MDV_DATA_DIR;
  else process.env.MDV_DATA_DIR = oldConfigHome;
  if (tempConfigHome) rmSync(tempConfigHome, { recursive: true, force: true });
});

describe("ensureAgentSessionId", () => {
  it("文档没有 session 时创建一个新的，之后重复调用返回同一个", () => {
    const id1 = ensureAgentSessionId("/tmp/a.md");
    const id2 = ensureAgentSessionId("/tmp/a.md");
    expect(id1).toBe(id2);
  });

  it("sessionIdOverride 只在首次创建时生效，用来手动关联到已有会话", () => {
    const id = ensureAgentSessionId("/tmp/b.md", "existing-session-123");
    expect(id).toBe("existing-session-123");
    // 已经有 session 了，再传 override 也不会覆盖——这是"确保存在"不是"强制设置"
    const idAgain = ensureAgentSessionId("/tmp/b.md", "another-override");
    expect(idAgain).toBe("existing-session-123");
  });
});

describe("tryMarkAgentRunning / markAgentIdle 并发锁", () => {
  it("空闲文档能标记为运行中；已在运行中的文档标记失败（并发锁生效）", () => {
    ensureAgentSessionId("/tmp/c.md");
    expect(tryMarkAgentRunning("/tmp/c.md", "run-1")).toBe(true);
    expect(tryMarkAgentRunning("/tmp/c.md", "run-2")).toBe(false);

    const session = getAgentSession("/tmp/c.md");
    expect(session?.running).toBe(true);
    expect(session?.runId).toBe("run-1");
  });

  it("markAgentIdle 之后能重新标记为运行中", () => {
    ensureAgentSessionId("/tmp/d.md");
    expect(tryMarkAgentRunning("/tmp/d.md", "run-1")).toBe(true);
    markAgentIdle("/tmp/d.md");
    expect(getAgentSession("/tmp/d.md")?.running).toBe(false);
    expect(tryMarkAgentRunning("/tmp/d.md", "run-2")).toBe(true);
  });

  it("对没有 agent_sessions 记录的文档标记运行中，不报错但也不会凭空建记录", () => {
    // tryMarkAgentRunning 内部走 UPDATE，不是 upsert——真实调用路径里 ensureAgentSessionId
    // 总是先跑过，这里验证一下"没跑过 ensure 直接调用"不会抛异常这个边界行为
    expect(() => tryMarkAgentRunning("/tmp/never-created.md", "run-x")).not.toThrow();
    expect(getAgentSession("/tmp/never-created.md")).toBeNull();
  });
});

describe("setAgentSessionId / resetAgentSessionId", () => {
  it("运行中的文档不允许手动切换或重置 session", () => {
    ensureAgentSessionId("/tmp/e.md");
    tryMarkAgentRunning("/tmp/e.md", "run-1");

    expect(setAgentSessionId("/tmp/e.md", "other-session")).toBe(false);
    expect(resetAgentSessionId("/tmp/e.md")).toBeNull();
    // 没有真的被改掉
    expect(getAgentSession("/tmp/e.md")?.sessionId).not.toBe("other-session");
  });

  it("空闲文档可以手动切换到已有 session，也可以重置成全新 session", () => {
    const original = ensureAgentSessionId("/tmp/f.md");
    expect(setAgentSessionId("/tmp/f.md", "shared-session-1")).toBe(true);
    expect(getAgentSession("/tmp/f.md")?.sessionId).toBe("shared-session-1");

    const resetId = resetAgentSessionId("/tmp/f.md");
    expect(resetId).not.toBeNull();
    expect(resetId).not.toBe(original);
    expect(resetId).not.toBe("shared-session-1");
    expect(getAgentSession("/tmp/f.md")?.sessionId).toBe(resetId);
  });
});

describe("resetStuckRunningAgentSessions", () => {
  it("把状态卡在 running 的 agent_runs 标成 error，并解开对应文档的运行中锁", () => {
    const sessionId = ensureAgentSessionId("/tmp/g.md");
    tryMarkAgentRunning("/tmp/g.md", "run-stuck");
    insertAgentRun({ id: "run-stuck", docPath: "/tmp/g.md", sessionId, workspacePath: null, command: ["claude", "-p", "hi"] });

    const count = resetStuckRunningAgentSessions();
    expect(count).toBe(1);
    expect(getAgentSession("/tmp/g.md")?.running).toBe(false);

    // 再跑一次是幂等的，没有更多卡住的记录了
    expect(resetStuckRunningAgentSessions()).toBe(0);
  });

  it("没有卡住的记录时返回 0，不影响正常运行中的记录", () => {
    ensureAgentSessionId("/tmp/h.md");
    tryMarkAgentRunning("/tmp/h.md", "run-live");
    // 没有对应的 agent_runs 行处于 running 状态，扫描应该是 0
    expect(resetStuckRunningAgentSessions()).toBe(0);
    // 文档本身的运行中标记不受影响（这个函数只认 agent_runs.status，不是 agent_sessions.running）
    expect(getAgentSession("/tmp/h.md")?.running).toBe(true);
  });
});

describe("workspace 级默认 session", () => {
  // 测试共用同一个 sqlite 文件（resetDbForTesting 只重开连接不清数据），每个用例用独立 workspace 防串扰
  let n = 0;
  let ws = "";
  beforeEach(() => { ws = `/tmp/ws-case-${++n}`; });

  it("同一 workspace 下的文档共享同一个 session", () => {
    const a = ensureAgentSessionId(`${ws}/a.md`, undefined, ws);
    const b = ensureAgentSessionId(`${ws}/b.md`, undefined, ws);
    expect(a).toBe(b);
    expect(getWorkspaceSessionId(ws)).toBe(a);
  });

  it("没有 workspace 默认时，沿用该 workspace 下最近用过的文档 session", () => {
    ensureAgentSessionId(`${ws}/old.md`, "legacy-1");
    ensureAgentSessionId(`${ws}/new.md`, "legacy-2");
    expect(ensureAgentSessionId(`${ws}/c.md`, undefined, ws)).toBe("legacy-2");
  });

  it("新建会话后整个 workspace 切到新 session，也可以手动切回旧的", () => {
    const old = ensureAgentSessionId(`${ws}/a.md`, undefined, ws);
    const fresh = resetWorkspaceAgentSession(ws)!;
    expect(fresh).not.toBe(old);
    expect(ensureAgentSessionId(`${ws}/b.md`, undefined, ws)).toBe(fresh);
    expect(getEffectiveAgentSession(`${ws}/a.md`, ws)?.sessionId).toBe(fresh);
    expect(setWorkspaceAgentSession(ws, old)).toBe(true);
    expect(ensureAgentSessionId(`${ws}/a.md`, undefined, ws)).toBe(old);
  });

  it("不同 workspace 互不影响", () => {
    const a = ensureAgentSessionId(`${ws}/a.md`, undefined, ws);
    const other = ensureAgentSessionId(`${ws}-b/a.md`, undefined, `${ws}-b`);
    expect(other).not.toBe(a);
  });

  it("同 session 下一个文档在跑时，另一个文档不能并发运行，也不能切换会话", () => {
    ensureAgentSessionId(`${ws}/a.md`, undefined, ws);
    ensureAgentSessionId(`${ws}/b.md`, undefined, ws);
    expect(tryMarkAgentRunning(`${ws}/a.md`, "run-1")).toBe(true);
    expect(tryMarkAgentRunning(`${ws}/b.md`, "run-2")).toBe(false);
    expect(getEffectiveAgentSession(`${ws}/b.md`, ws)?.running).toBe(true);
    expect(resetWorkspaceAgentSession(ws)).toBeNull();
    markAgentIdle(`${ws}/a.md`);
    expect(tryMarkAgentRunning(`${ws}/b.md`, "run-3")).toBe(true);
  });

  it("刚新建、还没跑过的当前 session 也会出现在列表里", () => {
    const fresh = resetWorkspaceAgentSession(ws)!;
    expect(listAgentSessionsForWorkspace(ws).map((s) => s.sessionId)).toContain(fresh);
  });
});
