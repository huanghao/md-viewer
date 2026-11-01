import { Fragment, useEffect, useState } from 'react';
import { state } from '../state';
import { showSuccess, showError } from '../ui/toast';
import {
  fetchAgentBackends,
  fetchAgentUsage,
  fetchRecentAgentRuns,
  fetchWorkspaceAgentCommand,
  saveWorkspaceAgentCommand,
  type AgentBackendStatus,
  type AgentRun,
  type AgentUsageSummary,
} from '../api/agent';
import { registerPreferencesSaver } from './controller';

/** 上次选中的 workspace，重开设置页时保留 */
let lastWorkspace = '';

/** Agent 标签页：backend 概览、workspace 命令覆盖、用量与最近运行明细 */
export function AgentTab() {
  const workspaces = state.config.workspaces.map((ws) => ws.path).filter(Boolean);
  const [workspace, setWorkspace] = useState(() =>
    lastWorkspace && workspaces.includes(lastWorkspace) ? lastWorkspace : workspaces[0] || '',
  );
  const [command, setCommand] = useState('');
  const [backends, setBackends] = useState<AgentBackendStatus[] | null>(null);
  const [usage, setUsage] = useState<AgentUsageSummary[] | null>(null);
  const [runs, setRuns] = useState<AgentRun[] | null>(null);

  useEffect(() => {
    void fetchAgentBackends().catch(() => []).then(setBackends);
    void fetchAgentUsage(30).catch(() => [] as AgentUsageSummary[]).then(setUsage);
    void fetchRecentAgentRuns(50).catch(() => [] as AgentRun[]).then(setRuns);
  }, []);

  useEffect(() => {
    lastWorkspace = workspace;
    if (!workspace) return;
    let stale = false;
    void fetchWorkspaceAgentCommand(workspace)
      .catch(() => null)
      .then((cmd) => { if (!stale) setCommand(cmd?.join(' ') ?? ''); });
    return () => { stale = true; };
  }, [workspace]);

  useEffect(() => {
    registerPreferencesSaver(async () => {
      if (workspace) {
        const parts = command.trim().split(/\s+/).filter(Boolean);
        try {
          await saveWorkspaceAgentCommand(workspace, parts.length > 0 ? parts : null);
          showSuccess('设置已保存');
        } catch (err: any) {
          showError('保存失败: ' + err.message);
        }
      }
    });
    return () => registerPreferencesSaver(null);
  }, [workspace, command]);

  return (
    <>
      <div className="settings-group">
        <div className="settings-group-title">Agent Backend</div>
        <div className="settings-section-desc">
          默认从 <code>~/.config/agent-backends.yaml</code> 读取 backend，并通过 shim 隔离 <code>ANTHROPIC_*</code> 等环境变量。下面的 workspace 命令是兼容旧配置的完整覆盖；留空则使用默认 backend。
        </div>
        <div className="settings-kv-grid">
          {backends === null ? null : backends.length === 0 ? (
            <div className="settings-section-desc">没有发现可用 backend，将回退到 <code>claude</code>。</div>
          ) : backends.map((b) => (
            <Fragment key={b.name}>
              <div>{b.default ? '默认' : 'Backend'}</div>
              <div>
                <strong>{b.name}</strong>
                {b.description ? ` · ${b.description}` : ''}
                {b.contextWindow ? ` · ${b.contextWindow.toLocaleString()} ctx` : ''}
                <br />
                {b.unavailableReason
                  ? <span className="settings-danger">不可用：{b.unavailableReason}</span>
                  : <span>可用</span>}
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Workspace 命令覆盖</div>
        <div className="settings-section-desc">
          只有某个 workspace 需要特殊命令时才填写，比如 <code>mc --code --dangerously-skip-permissions</code>。留空则使用上面的默认 backend。
        </div>
        {workspaces.length === 0 ? (
          <div className="settings-section-desc">还没有注册任何 workspace。</div>
        ) : (
          <>
            <div className="settings-row">
              <label className="settings-label">Workspace</label>
              <select className="settings-select" id="agentWorkspaceSelect" value={workspace} onChange={(e) => setWorkspace(e.target.value)}>
                {workspaces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="settings-row">
              <label className="settings-label">命令</label>
              <input
                type="text"
                id="agentCommandInput"
                className="settings-select"
                style={{ flex: 1 }}
                placeholder="claude --dangerously-skip-permissions"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="settings-group">
        <div className="settings-group-title">用量统计（近 30 天）</div>
        <div className="settings-section-desc">按 workspace 汇总的运行次数、token 用量和花费，用于账单审计。</div>
        <div className="settings-kv-grid">
          {usage === null ? null : usage.length === 0 ? <div>暂无运行记录</div> : usage.map((s, i) => (
            <Fragment key={i}>
              <div>{s.workspacePath || '(未知 workspace)'}</div>
              <div>{s.runCount} 次 · {(s.totalInputTokens + s.totalOutputTokens).toLocaleString()} tokens · ${s.totalCostUsd.toFixed(3)}</div>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">最近运行明细</div>
        <div className="settings-section-desc">
          每次运行的 token 拆分（input / output / cache 创建 / cache 读取）和花费。cache 创建 token 通常是 <code>--resume</code> 续接旧会话时上下文变长导致的隐藏开销，明细里单独列出方便定位。
        </div>
        <div className="agent-runs-table">
          {runs === null ? null : runs.length === 0 ? (
            <div className="settings-section-desc">暂无运行记录</div>
          ) : (
            <table className="agent-runs-table-inner">
              <thead>
                <tr>
                  <th>时间</th><th>文档</th><th>状态</th>
                  <th>input</th><th>output</th><th>cache 创建</th><th>cache 读取</th><th>花费</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const name = r.docPath.split('/').pop() || r.docPath;
                  const statusCls = r.status === 'error' ? 'is-error' : r.status === 'running' ? 'is-running' : '';
                  return (
                    <tr key={r.id} className={statusCls} title={r.docPath}>
                      <td>{new Date(r.startedAt).toLocaleString()}</td>
                      <td>{name}</td>
                      <td>{r.status}</td>
                      <td>{r.usage.inputTokens?.toLocaleString() ?? '-'}</td>
                      <td>{r.usage.outputTokens?.toLocaleString() ?? '-'}</td>
                      <td>{r.usage.cacheCreationTokens?.toLocaleString() ?? '-'}</td>
                      <td>{r.usage.cacheReadTokens?.toLocaleString() ?? '-'}</td>
                      <td>{typeof r.usage.costUsd === 'number' ? '$' + r.usage.costUsd.toFixed(3) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
