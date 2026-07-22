async function readJsonOrThrow(response: Response): Promise<any> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}`);
  }
  return data;
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
  kind: 'user' | 'text' | 'tool' | 'tool-result' | 'error' | 'result';
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
  status: 'running' | 'success' | 'error';
  startedAt: number;
  finishedAt: number | null;
  usage: AgentRunUsage;
  error: string | null;
  transcript: AgentTranscriptMsg[];
}

export interface AgentSession {
  docPath: string;
  sessionId: string;
  running: boolean;
  runId: string | null;
  updatedAt: number;
}

export interface AgentUsageSummary {
  workspacePath: string | null;
  runCount: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

export async function startAgentRun(
  path: string,
  opts?: { model?: string; prompt?: string }
): Promise<{ runId: string; sessionId: string; resumed: boolean; command: string[] }> {
  const response = await fetch('/api/agent/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, model: opts?.model, prompt: opts?.prompt }),
  });
  return readJsonOrThrow(response);
}

export async function newAgentSession(path: string): Promise<string> {
  const response = await fetch('/api/agent/session/new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  const data = await readJsonOrThrow(response);
  return data.sessionId;
}

export async function fetchRunsBySession(sessionId: string): Promise<AgentRun[]> {
  const response = await fetch(`/api/agent/runs/by-session?sessionId=${encodeURIComponent(sessionId)}`);
  const data = await readJsonOrThrow(response);
  return Array.isArray(data?.runs) ? data.runs : [];
}

export async function fetchAgentSession(path: string): Promise<AgentSession | null> {
  const response = await fetch(`/api/agent/session?path=${encodeURIComponent(path)}`);
  const data = await readJsonOrThrow(response);
  return data?.session ?? null;
}

export async function fetchWorkspaceAgentSessions(workspace: string): Promise<AgentSession[]> {
  const response = await fetch(`/api/agent/sessions?workspace=${encodeURIComponent(workspace)}`);
  const data = await readJsonOrThrow(response);
  return Array.isArray(data?.sessions) ? data.sessions : [];
}

export async function linkAgentSession(path: string, sessionId: string): Promise<void> {
  const response = await fetch('/api/agent/session/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, sessionId }),
  });
  await readJsonOrThrow(response);
}

export async function fetchAgentRuns(path: string): Promise<AgentRun[]> {
  const response = await fetch(`/api/agent/runs?path=${encodeURIComponent(path)}`);
  const data = await readJsonOrThrow(response);
  return Array.isArray(data?.runs) ? data.runs : [];
}

export async function fetchRecentAgentRuns(limit = 50, workspace?: string): Promise<AgentRun[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (workspace) params.set('workspace', workspace);
  const response = await fetch(`/api/agent/runs/recent?${params}`);
  const data = await readJsonOrThrow(response);
  return Array.isArray(data?.runs) ? data.runs : [];
}

export async function fetchAgentUsage(sinceDays = 30): Promise<AgentUsageSummary[]> {
  const response = await fetch(`/api/agent/usage?sinceDays=${sinceDays}`);
  const data = await readJsonOrThrow(response);
  return Array.isArray(data?.summary) ? data.summary : [];
}

export async function fetchWorkspaceAgentCommand(path: string): Promise<string[] | null> {
  const response = await fetch(`/api/workspace-agent-command?path=${encodeURIComponent(path)}`);
  const data = await readJsonOrThrow(response);
  return data?.command ?? null;
}

export async function saveWorkspaceAgentCommand(path: string, command: string[] | null): Promise<void> {
  await fetch('/api/workspace-agent-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, command }),
  });
}
