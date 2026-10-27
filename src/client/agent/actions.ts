import { startAgentRun } from '../api/agent';
import { buildTrayPromptPrefix, clearTray } from '../agent-tray';
import { showError } from '../ui/toast';
import { agentStore } from './store';

export interface SubmitInput {
  /** 当前打开的文档 */
  path: string | null;
  typed: string;
  /** 已选的 /mdv 命令 chip；mdvPath 为文档相对路径 chip（未选则 null） */
  mdvOn: boolean;
  mdvPath: string | null;
  engine: { backend: string; provider?: string; model?: string; thinking?: string };
}

function quoteIfNeeded(text: string): string {
  return /\s/.test(text) ? `"${text}"` : text;
}

/**
 * 拼出这一轮的 prompt：/mdv 命令必须在最前面才会被当成 slash command，所以托盘内容放到命令后面；
 * 只有选了 /mdv 才允许输入框为空，空消息没有意义。
 */
export function buildPrompt(typed: string, trayPrefix: string | null, mdvOn: boolean, mdvPath: string | null): string | undefined {
  const mdvCommand = mdvOn ? ['/mdv', mdvPath ? quoteIfNeeded(mdvPath) : '', typed].filter(Boolean).join(' ') : '';
  if (mdvCommand) return trayPrefix ? `${mdvCommand}\n\n${trayPrefix}` : mdvCommand;
  if (trayPrefix) return typed ? `${trayPrefix}\n\n${typed}` : trayPrefix;
  return typed || undefined;
}

/** 返回 true 表示已受理（调用方此时应清空输入框与 chip） */
export async function submitRun(input: SubmitInput, beforeSend: () => void): Promise<boolean> {
  const { path } = input;
  if (!path) {
    showError('请先打开一个文档');
    return false;
  }
  if (agentStore.getState().runId) return false;

  const prompt = buildPrompt(input.typed.trim(), buildTrayPromptPrefix(path), input.mdvOn, input.mdvPath);
  if (!prompt) {
    showError('请输入内容，或点 /mdv 处理批注');
    return false;
  }
  beforeSend();
  clearTray(path);
  agentStore.dispatch({ type: 'sent', text: prompt, now: Date.now() });

  startAgentRun(path, { ...input.engine, prompt }).then(
    ({ runId, sessionId }) => agentStore.dispatch({ type: 'runStarted', runId, sessionId }),
    (err: any) => agentStore.dispatch({ type: 'startFailed', text: err?.message || '启动 Agent 失败', now: Date.now() }),
  );
  return true;
}
