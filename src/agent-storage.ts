import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { getDb } from "./annotation-db.ts";
import { normalizeDocPath } from "./annotation-storage.ts";

export interface AgentSession {
  docPath: string;
  sessionId: string;
  running: boolean;
  runId: string | null;
  updatedAt: number;
}

interface AgentSessionRow {
  doc_path: string;
  session_id: string;
  running: number;
  run_id: string | null;
  updated_at: number;
}

function rowToSession(row: AgentSessionRow): AgentSession {
  return {
    docPath: row.doc_path,
    sessionId: row.session_id,
    running: row.running === 1,
    runId: row.run_id,
    updatedAt: row.updated_at,
  };
}

export function getAgentSession(docPath: string): AgentSession | null {
  const path = normalizeDocPath(docPath);
  const row = getDb().query("SELECT * FROM agent_sessions WHERE doc_path = ?").get(path) as AgentSessionRow | null;
  return row ? rowToSession(row) : null;
}

/** 把文档指向某个 session id：已有记录则更新，没有则插入（running/run_id 重置为空闲）。 */
function upsertSessionId(path: string, existing: AgentSession | null, sessionId: string): void {
  if (existing) {
    getDb().query("UPDATE agent_sessions SET session_id = ?, updated_at = ? WHERE doc_path = ?").run(sessionId, Date.now(), path);
  } else {
    getDb().query(
      "INSERT INTO agent_sessions (doc_path, session_id, running, run_id, updated_at) VALUES (?, ?, 0, NULL, ?)"
    ).run(path, sessionId, Date.now());
  }
}

function workspaceDocPrefix(workspacePath: string): string {
  return workspacePath.endsWith("/") ? workspacePath : workspacePath + "/";
}

/** workspace 当前使用的 session id（没有显式设置过则为 null）。 */
export function getWorkspaceSessionId(workspacePath: string): string | null {
  const row = getDb().query("SELECT session_id FROM agent_workspace_sessions WHERE workspace_path = ?")
    .get(workspacePath) as { session_id: string } | null;
  return row?.session_id ?? null;
}

function putWorkspaceSessionId(workspacePath: string, sessionId: string): void {
  getDb().query(`
    INSERT INTO agent_workspace_sessions (workspace_path, session_id, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(workspace_path) DO UPDATE SET session_id = excluded.session_id, updated_at = excluded.updated_at
  `).run(workspacePath, sessionId, Date.now());
}

/** 该 session 当前正在运行的 run id（任意文档发起的都算）。 */
function getRunningRunIdForSession(sessionId: string): string | null {
  const row = getDb().query("SELECT run_id FROM agent_sessions WHERE session_id = ? AND running = 1 LIMIT 1")
    .get(sessionId) as { run_id: string | null } | null;
  return row?.run_id ?? null;
}

/** 该 session 是否有任意文档正在运行（同一 session 并发 --resume 会写坏 jsonl，所以锁在 session 级）。 */
export function isAgentSessionRunning(sessionId: string): boolean {
  return !!getDb().query("SELECT 1 FROM agent_sessions WHERE session_id = ? AND running = 1 LIMIT 1").get(sessionId);
}

function isWorkspaceRunning(workspacePath: string): boolean {
  const prefix = workspaceDocPrefix(workspacePath);
  const rows = getDb().query("SELECT doc_path FROM agent_sessions WHERE running = 1").all() as Array<{ doc_path: string }>;
  return rows.some((r) => r.doc_path === workspacePath || r.doc_path.startsWith(prefix));
}

/**
 * workspace 的默认 session：显式设置过就用它；否则取该 workspace 下最近用过的文档 session
 * （老数据迁移，"关联到最近的 session"）；都没有就新建一个。结果会落库，后续稳定返回同一个。
 */
function ensureWorkspaceSessionId(workspacePath: string, seed?: string): string {
  const existing = getWorkspaceSessionId(workspacePath);
  if (existing) return existing;
  const prefix = workspaceDocPrefix(workspacePath);
  const rows = getDb().query("SELECT * FROM agent_sessions ORDER BY updated_at DESC, rowid DESC").all() as AgentSessionRow[];
  const recent = rows.find((r) => r.doc_path === workspacePath || r.doc_path.startsWith(prefix));
  const sessionId = recent?.session_id || seed || randomUUID();
  putWorkspaceSessionId(workspacePath, sessionId);
  return sessionId;
}

/**
 * 获取（或按需创建）文档对应的 session id。
 * - 文档属于某个 workspace：用 workspace 当前 session（所有文档共享），文档行同步指向它，
 *   这样运行锁和 session 列表里的"关联文档"都还是读 agent_sessions。
 * - 不属于任何 workspace：退回文档级 session；sessionIdOverride 用于手动关联到已有会话。
 */
export function ensureAgentSessionId(docPath: string, sessionIdOverride?: string, workspacePath?: string | null): string {
  const path = normalizeDocPath(docPath);
  const existing = getAgentSession(path);
  if (workspacePath) {
    const sessionId = ensureWorkspaceSessionId(workspacePath, sessionIdOverride);
    if (existing?.sessionId !== sessionId) upsertSessionId(path, existing, sessionId);
    return sessionId;
  }
  if (existing) return existing.sessionId;
  const sessionId = sessionIdOverride || randomUUID();
  upsertSessionId(path, existing, sessionId);
  return sessionId;
}

/** 文档当前生效的 session（含运行状态）：workspace 内以 workspace session 为准，运行态按 session 级算。 */
export function getEffectiveAgentSession(docPath: string, workspacePath?: string | null): AgentSession | null {
  const path = normalizeDocPath(docPath);
  const doc = getAgentSession(path);
  const wsSession = workspacePath ? getWorkspaceSessionId(workspacePath) : null;
  if (!wsSession) return doc;
  return {
    docPath: path,
    sessionId: wsSession,
    running: isAgentSessionRunning(wsSession),
    // 工程内共用会话：别的文档发起的运行也要能认出来，否则切到另一篇文档就接不上进度事件
    runId: getRunningRunIdForSession(wsSession),
    updatedAt: doc?.updatedAt ?? Date.now(),
  };
}

/** 把 workspace 的默认 session 指向某个已有 session。workspace 内有运行中的 Agent 时不允许改。 */
export function setWorkspaceAgentSession(workspacePath: string, sessionId: string): boolean {
  if (isWorkspaceRunning(workspacePath) || isAgentSessionRunning(sessionId)) return false;
  putWorkspaceSessionId(workspacePath, sessionId);
  return true;
}

/** 给 workspace 换一个全新的 session，之后该 workspace 下的文档都用它。运行中不允许换。 */
export function resetWorkspaceAgentSession(workspacePath: string): string | null {
  if (isWorkspaceRunning(workspacePath)) return null;
  const sessionId = randomUUID();
  putWorkspaceSessionId(workspacePath, sessionId);
  return sessionId;
}

/** 尝试把某文档标记为"运行中"，成功返回 true；已在运行中则返回 false（并发锁）。 */
export function tryMarkAgentRunning(docPath: string, runId: string): boolean {
  const path = normalizeDocPath(docPath);
  const existing = getAgentSession(path);
  if (existing?.running) return false;
  if (existing && isAgentSessionRunning(existing.sessionId)) return false;
  getDb().query(
    "UPDATE agent_sessions SET running = 1, run_id = ?, updated_at = ? WHERE doc_path = ?"
  ).run(runId, Date.now(), path);
  return true;
}

export function markAgentIdle(docPath: string): void {
  const path = normalizeDocPath(docPath);
  getDb().query(
    "UPDATE agent_sessions SET running = 0, updated_at = ? WHERE doc_path = ?"
  ).run(Date.now(), path);
}

/**
 * 服务启动时清掉上一次进程留下的"运行中"标记。开发时 `bun --watch` 一存文件就重启，
 * 之前那次 Agent 运行的子进程即便还活着，父进程一没，stdout 管道就断了——服务端再也
 * 收不到它的输出、没法调用 finishAgentRun/markAgentIdle，运行记录会卡在 running 状态，
 * 那份文档的"该文档已有 Agent 运行中"锁也会一直锁死，直到手动清库。启动时扫一遍归零。
 */
export function resetStuckRunningAgentSessions(): number {
  const db = getDb();
  const stuckRuns = db.query("SELECT id, doc_path FROM agent_runs WHERE status = 'running'").all() as Array<{ id: string; doc_path: string }>;
  if (stuckRuns.length === 0) return 0;
  db.query("UPDATE agent_runs SET status = 'error', finished_at = ?, error = ? WHERE status = 'running'")
    .run(Date.now(), "服务重启，运行中断");
  db.query("UPDATE agent_sessions SET running = 0, run_id = NULL WHERE running = 1").run();
  return stuckRuns.length;
}

/** 把某文档手动指向另一个已有 session（多文档共享会话）。不允许在运行中改。 */
export function setAgentSessionId(docPath: string, sessionId: string): boolean {
  const path = normalizeDocPath(docPath);
  const existing = getAgentSession(path);
  if (existing?.running) return false;
  upsertSessionId(path, existing, sessionId);
  return true;
}

/** 给文档换一个全新的 session（放弃旧的关联）。运行中不允许换。 */
export function resetAgentSessionId(docPath: string): string | null {
  const path = normalizeDocPath(docPath);
  const existing = getAgentSession(path);
  if (existing?.running) return null;
  const sessionId = randomUUID();
  upsertSessionId(path, existing, sessionId);
  return sessionId;
}

export interface AgentSessionSummary {
  sessionId: string;
  docPaths: string[];
  updatedAt: number;
  /** 这个 session 第一条 prompt 的预览，用于在下拉框里认人不认 id（跟 kolab 用首问预览是一个思路） */
  firstPrompt: string | null;
}

/** session 第一次运行时发的 prompt，从 agent_runs.command（CLI argv）里取 -p 后面那一项 */
function getSessionFirstPrompt(sessionId: string): string | null {
  const row = getDb()
    .query(`SELECT command FROM agent_runs WHERE session_id = ? ORDER BY started_at ASC LIMIT 1`)
    .get(sessionId) as { command: string | null } | null;
  if (!row?.command) return null;
  try {
    const argv: string[] = JSON.parse(row.command);
    // claude/kc/mc/codex 是 "-p <prompt>" 紧挨着；pi 的 flag 全部排在前面、prompt 是
    // argv 最后一项（见 pi-agent.ts buildPiArgv 的注释），两种形状都要认——不然 pi 跑出来的
    // session 这里会把 "-p" 后面那个 flag（比如 "--session-id"）错当成 prompt 预览文本
    const idx = argv.indexOf("-p");
    const afterDashP = idx >= 0 ? argv[idx + 1] : null;
    const prompt = afterDashP && !afterDashP.startsWith("-") ? afterDashP : argv[argv.length - 1];
    if (!prompt || prompt.startsWith("-")) return null;
    // 自定义 prompt 会被自动加上 [当前文档: xxx]\n 前缀（见 handleStartAgentRun），对预览没用，去掉
    const cleaned = prompt.replace(/^\[当前文档:[^\]]*\]\n/, "").trim();
    if (!cleaned) return null;
    return cleaned.length > 60 ? cleaned.slice(0, 60) + "…" : cleaned;
  } catch {
    return null;
  }
}

/**
 * 列出某 workspace 下所有已关联的 session（用于"关联到已有会话"的选择列表）。
 * 按 session_id 去重——同一个 session 可能被多个文档指向（比如 B 关联了 A 的 session），
 * 不去重的话下拉框里会出现「看起来不同、实际是同一个」的重复项，只能靠比 session id
 * 前缀才能看出来是同一个，这里直接在数据层面合并掉。
 */
export function listAgentSessionsForWorkspace(workspacePath: string): AgentSessionSummary[] {
  const rows = getDb().query("SELECT * FROM agent_sessions ORDER BY updated_at DESC").all() as AgentSessionRow[];
  const prefix = workspacePath.endsWith("/") ? workspacePath : workspacePath + "/";
  const inWorkspace = rows.filter((r) => r.doc_path === workspacePath || r.doc_path.startsWith(prefix));

  const bySession = new Map<string, AgentSessionSummary>();
  for (const row of inWorkspace) {
    const existing = bySession.get(row.session_id);
    if (existing) {
      existing.docPaths.push(row.doc_path);
      existing.updatedAt = Math.max(existing.updatedAt, row.updated_at);
    } else {
      bySession.set(row.session_id, {
        sessionId: row.session_id,
        docPaths: [row.doc_path],
        updatedAt: row.updated_at,
        firstPrompt: null,
      });
    }
  }
  // 刚新建、还没跑过的当前 session 没有任何文档行，也要出现在列表里，否则切换后看不到"当前"
  const current = getWorkspaceSessionId(workspacePath);
  if (current && !bySession.has(current)) {
    const row = getDb().query("SELECT updated_at FROM agent_workspace_sessions WHERE workspace_path = ?")
      .get(workspacePath) as { updated_at: number };
    bySession.set(current, { sessionId: current, docPaths: [], updatedAt: row.updated_at, firstPrompt: null });
  }
  const summaries = Array.from(bySession.values());
  for (const s of summaries) s.firstPrompt = getSessionFirstPrompt(s.sessionId);
  summaries.sort((a, b) => b.updatedAt - a.updatedAt);
  return summaries;
}

/**
 * 清掉指向已经不存在的文档的 session 关联（doc_path 对应文件已被删除/移走）。
 * 只删 agent_sessions 这张"指针表"，不动 agent_runs——运行历史是审计日志，别的文档
 * 如果还指着同一个 session 也不受影响。服务启动时跑一次即可，不需要更高频率。
 */
export function pruneOrphanedAgentSessions(): number {
  const rows = getDb().query("SELECT doc_path FROM agent_sessions WHERE running = 0").all() as Array<{ doc_path: string }>;
  let removed = 0;
  for (const row of rows) {
    if (!existsSync(row.doc_path)) {
      getDb().query("DELETE FROM agent_sessions WHERE doc_path = ?").run(row.doc_path);
      removed++;
    }
  }
  return removed;
}

export interface AgentRunUsage {
  inputTokens?: number;
  outputTokens?: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  costUsd?: number;
  model?: string;
}

export interface AgentTranscriptMsg {
  kind: "user" | "text" | "tool" | "tool-result" | "error" | "result" | "thinking";
  text: string;
  timestamp: number;
  model?: string;
}

export interface AgentRun {
  id: string;
  docPath: string;
  sessionId: string;
  workspacePath: string | null;
  command: string;
  status: "running" | "success" | "error";
  startedAt: number;
  finishedAt: number | null;
  usage: AgentRunUsage;
  error: string | null;
  transcript: AgentTranscriptMsg[];
}

export function insertAgentRun(run: {
  id: string;
  docPath: string;
  sessionId: string;
  workspacePath: string | null;
  command: string[];
}): void {
  getDb().query(`
    INSERT INTO agent_runs (id, doc_path, session_id, workspace_path, command, status, started_at)
    VALUES (?, ?, ?, ?, ?, 'running', ?)
  `).run(run.id, normalizeDocPath(run.docPath), run.sessionId, run.workspacePath, JSON.stringify(run.command), Date.now());
}

export function finishAgentRun(id: string, result: {
  status: "success" | "error";
  usage?: AgentRunUsage;
  error?: string;
  transcript?: AgentTranscriptMsg[];
}): void {
  getDb().query(`
    UPDATE agent_runs SET
      status = ?, finished_at = ?, input_tokens = ?, output_tokens = ?,
      cache_creation_tokens = ?, cache_read_tokens = ?, cost_usd = ?, model = ?, error = ?, transcript_json = ?
    WHERE id = ?
  `).run(
    result.status,
    Date.now(),
    result.usage?.inputTokens ?? null,
    result.usage?.outputTokens ?? null,
    result.usage?.cacheCreationTokens ?? null,
    result.usage?.cacheReadTokens ?? null,
    result.usage?.costUsd ?? null,
    result.usage?.model ?? null,
    result.error ?? null,
    result.transcript ? JSON.stringify(result.transcript) : null,
    id
  );
}

function rowToRun(row: any): AgentRun {
  return {
    id: row.id,
    docPath: row.doc_path,
    sessionId: row.session_id,
    workspacePath: row.workspace_path,
    command: row.command,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    usage: {
      inputTokens: row.input_tokens ?? undefined,
      outputTokens: row.output_tokens ?? undefined,
      cacheCreationTokens: row.cache_creation_tokens ?? undefined,
      cacheReadTokens: row.cache_read_tokens ?? undefined,
      costUsd: row.cost_usd ?? undefined,
      model: row.model ?? undefined,
    },
    error: row.error,
    transcript: row.transcript_json ? JSON.parse(row.transcript_json) : [],
  };
}

export function getAgentRuns(docPath: string, limit = 20): AgentRun[] {
  const path = normalizeDocPath(docPath);
  const rows = getDb().query(
    "SELECT * FROM agent_runs WHERE doc_path = ? ORDER BY started_at DESC LIMIT ?"
  ).all(path, limit) as any[];
  return rows.map(rowToRun);
}

export interface AgentUsageSummary {
  workspacePath: string | null;
  runCount: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

export function sessionHasHistory(sessionId: string): boolean {
  const row = getDb().query("SELECT 1 FROM agent_runs WHERE session_id = ? LIMIT 1").get(sessionId);
  return !!row;
}

/** 某个 session 的完整历史（跨文档，按发生顺序），用于连续对话视图。 */
export function getRunsBySession(sessionId: string, limit = 200): AgentRun[] {
  const rows = getDb().query(
    "SELECT * FROM agent_runs WHERE session_id = ? ORDER BY started_at ASC LIMIT ?"
  ).all(sessionId, limit) as any[];
  return rows.map(rowToRun);
}

export function listRecentAgentRuns(limit = 50, workspacePath?: string): AgentRun[] {
  const rows = workspacePath
    ? getDb().query("SELECT * FROM agent_runs WHERE workspace_path = ? ORDER BY started_at DESC LIMIT ?").all(workspacePath, limit) as any[]
    : getDb().query("SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT ?").all(limit) as any[];
  return rows.map(rowToRun);
}

export function getAgentUsageSummary(sinceMs: number): AgentUsageSummary[] {
  const rows = getDb().query(`
    SELECT
      workspace_path AS workspacePath,
      COUNT(*) AS runCount,
      COALESCE(SUM(cost_usd), 0) AS totalCostUsd,
      COALESCE(SUM(input_tokens), 0) AS totalInputTokens,
      COALESCE(SUM(output_tokens), 0) AS totalOutputTokens
    FROM agent_runs
    WHERE started_at >= ? AND status != 'running'
    GROUP BY workspace_path
    ORDER BY totalCostUsd DESC
  `).all(sinceMs) as AgentUsageSummary[];
  return rows;
}
