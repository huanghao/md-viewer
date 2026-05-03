import { state } from './state';
import { getAgentUrl } from './ui/chat-panel.js';
import { switchAnnotationTab } from './annotation';
import { type PdfViewerEntry } from './pdf-registry';

export type { PdfViewerEntry };

// ==================== 系统监控浮窗 ====================
const MEM_PER_PAGE_MB = 27; // A4 @ scale=1.5, dpr=2
const PDF_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

let monitorPollTimer: ReturnType<typeof setInterval> | null = null;
let monitorActiveTab: 'memory' | 'sessions' = 'memory';

let _registry: Map<string, PdfViewerEntry> | null = null;

type FileData = import('./types').FileData;
type SwitchFileFn = (path: string) => Promise<void>;
type LoadFileFn = (path: string, silent: boolean) => Promise<FileData | null>;
type OnFileLoadedFn = (data: FileData, focus: boolean) => Promise<void>;

let _switchFile: SwitchFileFn | null = null;
let _loadFile: LoadFileFn | null = null;
let _onFileLoaded: OnFileLoadedFn | null = null;

export function initMemoryMonitor(
  registry: Map<string, PdfViewerEntry>,
  switchFile: SwitchFileFn,
  loadFile: LoadFileFn,
  onFileLoaded: OnFileLoadedFn,
): void {
  _registry = registry;
  _switchFile = switchFile;
  _loadFile = loadFile;
  _onFileLoaded = onFileLoaded;
}

export function getPdfMemStats(): Array<{ path: string; rendered: number; total: number; memMB: number; idleMins: number | null }> {
  if (!_registry) return [];
  return Array.from(_registry.entries()).map(([path, entry]) => {
    const rendered = entry.viewer.getRenderedCount();
    const total = entry.viewer.getTotalPages();
    const memMB = rendered * MEM_PER_PAGE_MB;
    const idleSecs = entry.idleTimer ? (PDF_IDLE_TIMEOUT_MS - (Date.now() - entry.lastActiveAt)) / 1000 : null;
    const idleMins = idleSecs !== null ? Math.max(0, Math.round(idleSecs / 60)) : null;
    return { path: path.split('/').pop() || path, rendered, total, memMB, idleMins };
  });
}

export function renderMemoryTab(): void {
  const el = document.getElementById('monitorTabMemory');
  if (!el) return;
  const stats = getPdfMemStats();
  if (stats.length === 0) {
    el.innerHTML = '<div class="pdf-mem-row pdf-mem-empty">暂无 PDF 数据</div>';
    return;
  }
  const totalMB = stats.reduce((s, r) => s + r.memMB, 0);
  el.innerHTML = stats.map(r => `
    <div class="pdf-mem-row">
      <span class="pdf-mem-name" title="${r.path}">${r.path}</span>
      <span class="pdf-mem-pages">${r.rendered}/${r.total} 页</span>
      <span class="pdf-mem-mb">~${r.memMB}MB</span>
      ${r.idleMins !== null ? `<span class="pdf-mem-idle">${r.idleMins}min 后回收</span>` : ''}
    </div>
  `).join('') + `<div class="pdf-mem-total">合计 ~${totalMB}MB</div>`;
}

export function updateMonitorPanel(): void {
  if (monitorActiveTab === 'memory') renderMemoryTab();
  else if (monitorActiveTab === 'sessions') void renderSessionsTab();
}

export function switchMonitorTab(tab: 'memory' | 'sessions'): void {
  monitorActiveTab = tab;
  const labels: Record<string, string> = { memory: '内存', sessions: 'Agent Sessions' };
  document.querySelectorAll('.monitor-tab').forEach(btn => {
    btn.classList.toggle('is-active', (btn as HTMLElement).textContent?.trim() === labels[tab]);
  });
  const memEl = document.getElementById('monitorTabMemory');
  const sessEl = document.getElementById('monitorTabSessions');
  if (memEl) memEl.style.display = tab === 'memory' ? '' : 'none';
  if (sessEl) sessEl.style.display = tab === 'sessions' ? '' : 'none';
  if (monitorPollTimer) { clearInterval(monitorPollTimer); monitorPollTimer = null; }
  if (tab === 'memory') monitorPollTimer = setInterval(updateMonitorPanel, 2000);
  updateMonitorPanel();
}

export async function renderSessionsTab(): Promise<void> {
  const el = document.getElementById('monitorTabSessions');
  if (!el) return;

  const agentUrl = getAgentUrl();
  let statusHtml = '';
  let sessionsHtml = '';

  try {
    const [statusRes, sessionsRes] = await Promise.all([
      fetch(`${agentUrl}/status`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${agentUrl}/sessions`, { signal: AbortSignal.timeout(3000) }),
    ]);

    if (statusRes.ok) {
      const status = await statusRes.json() as { ok: boolean; totalActive: number; sessionsDir: string; activeSessions: Array<{id: string; messages: number; streaming: boolean; model: string}> };
      statusHtml = `
        <div style="margin-bottom:10px;padding:8px;background:var(--color-bg-subtle);border-radius:var(--radius-md);border:1px solid var(--color-border);">
          <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:4px;">Agent Server: <span style="color:var(--color-success);font-weight:600;">● 在线</span> · 活跃 ${status.totalActive} 个</div>
          <div style="font-size:10px;color:var(--color-text-muted);word-break:break-all;">${status.sessionsDir}</div>
          ${status.activeSessions.map(s => `
            <div style="font-size:11px;margin-top:4px;color:var(--color-text-secondary);">
              ${s.streaming ? '⏳' : '💬'} <code style="font-size:10px;">${s.id}…</code> · ${s.messages} 条 · ${s.model}
            </div>`).join('')}
        </div>`;
    }

    if (sessionsRes.ok) {
      type SessionData = {
        id: string; messageCount: number; firstMessage: string; model: string;
        modified: string | null; created: string | null; active: boolean;
        filePath: string | null;
        tokenUsage: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number };
      };
      const data = await sessionsRes.json() as { sessions: SessionData[]; total: number };

      if (data.sessions.length === 0) {
        sessionsHtml = `<div style="color:var(--color-text-muted);font-size:12px;padding:8px 0;">暂无 session</div>`;
      } else {
        // 汇总统计
        const allSessions = data.sessions;
        const totalInput = allSessions.reduce((s, x) => s + x.tokenUsage.input, 0);
        const totalOutput = allSessions.reduce((s, x) => s + x.tokenUsage.output, 0);
        const totalCacheRead = allSessions.reduce((s, x) => s + x.tokenUsage.cacheRead, 0);
        const totalCacheWrite = allSessions.reduce((s, x) => s + x.tokenUsage.cacheWrite, 0);
        const totalAll = allSessions.reduce((s, x) => s + x.tokenUsage.total, 0);
        const cacheHitRate = (totalCacheRead + totalCacheWrite) > 0
          ? Math.round(totalCacheRead / (totalCacheRead + totalCacheWrite) * 100) : 0;

        const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

        const summaryHtml = `
          <div style="margin-bottom:10px;padding:8px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:var(--radius-md);">
            <div style="font-size:11px;font-weight:600;color:#0369a1;margin-bottom:6px;">全部 ${data.total} 个 Session 汇总</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;">
              <div style="color:var(--color-text-secondary);">总 tokens</div>
              <div style="font-weight:600;color:var(--color-text-primary);">${fmt(totalAll)}</div>
              <div style="color:var(--color-text-secondary);">输入</div>
              <div style="color:var(--color-text-primary);">${fmt(totalInput)}</div>
              <div style="color:var(--color-text-secondary);">输出</div>
              <div style="color:var(--color-text-primary);">${fmt(totalOutput)}</div>
              <div style="color:var(--color-text-secondary);">缓存命中</div>
              <div style="color:${cacheHitRate > 50 ? 'var(--color-success)' : 'var(--color-text-muted)'};">${fmt(totalCacheRead)} (${cacheHitRate}%)</div>
              <div style="color:var(--color-text-secondary);">缓存写入</div>
              <div style="color:var(--color-text-primary);">${fmt(totalCacheWrite)}</div>
            </div>
          </div>`;

        const sessionRows = allSessions.map(s => {
          const u = s.tokenUsage;
          const modified = s.modified ? new Date(s.modified).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
          const sessionCacheHit = (u.cacheRead + u.cacheWrite) > 0
            ? Math.round(u.cacheRead / (u.cacheRead + u.cacheWrite) * 100) : null;

          // token bar: input / output / cacheRead / cacheWrite
          const barTotal = u.input + u.output + u.cacheRead + u.cacheWrite;
          const barHtml = barTotal > 0 ? `
            <div style="display:flex;height:4px;border-radius:2px;overflow:hidden;margin-top:4px;gap:1px;">
              <div style="flex:${u.input};background:#93c5fd;" title="输入 ${fmt(u.input)}"></div>
              <div style="flex:${u.output};background:#86efac;" title="输出 ${fmt(u.output)}"></div>
              <div style="flex:${u.cacheRead};background:#fde68a;" title="缓存命中 ${fmt(u.cacheRead)}"></div>
              <div style="flex:${u.cacheWrite};background:#e9d5ff;" title="缓存写入 ${fmt(u.cacheWrite)}"></div>
            </div>
            <div style="display:flex;gap:8px;margin-top:2px;font-size:9px;color:var(--color-text-muted);">
              <span style="color:#3b82f6;">■ 输入 ${fmt(u.input)}</span>
              <span style="color:#22c55e;">■ 输出 ${fmt(u.output)}</span>
              ${u.cacheRead > 0 ? `<span style="color:#f59e0b;">■ 缓存命中 ${fmt(u.cacheRead)}</span>` : ''}
              ${u.cacheWrite > 0 ? `<span style="color:#a855f7;">■ 缓存写入 ${fmt(u.cacheWrite)}</span>` : ''}
            </div>` : '';

          const fileName = s.filePath ? s.filePath.split('/').pop() : null;
          const canJump = !!s.filePath;
          return `
            <div data-session-id="${s.id}" data-file-path="${s.filePath ?? ''}"
              style="padding:7px 8px;margin-bottom:6px;background:${s.active ? 'var(--color-success-bg)' : '#fff'};border:1px solid ${s.active ? 'var(--color-success)' : 'var(--color-border)'};border-radius:var(--radius-md);font-size:12px;${canJump ? 'cursor:pointer;' : ''}">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <code style="font-size:10px;color:var(--color-text-muted);">${s.id.slice(0, 12)}…</code>
                ${s.active ? '<span style="font-size:10px;color:var(--color-success);font-weight:600;">活跃</span>' : ''}
                ${fileName ? `<span style="font-size:10px;color:var(--color-accent);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px;" title="${s.filePath}">📄 ${fileName}</span>` : ''}
                <span style="margin-left:auto;font-size:10px;color:var(--color-text-muted);">${modified}</span>
              </div>
              <div style="color:var(--color-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;">${s.firstMessage || '(空)'}</div>
              <div style="display:flex;gap:8px;margin-top:3px;font-size:10px;color:var(--color-text-muted);">
                <span>${s.messageCount} 条</span>
                <span>总 ${fmt(u.total)} tokens</span>
                ${sessionCacheHit !== null ? `<span style="color:${sessionCacheHit > 50 ? 'var(--color-success)' : 'inherit'};">缓存 ${sessionCacheHit}%</span>` : ''}
                ${s.model ? `<span>${s.model.replace('claude-', '')}</span>` : ''}
              </div>
              ${barHtml}
              ${canJump ? `<div style="font-size:10px;color:var(--color-accent);margin-top:3px;">点击跳转到文件并切换到此 Session →</div>` : ''}
            </div>`;
        }).join('');

        sessionsHtml = summaryHtml + sessionRows;
      }
    }
  } catch {
    statusHtml = `<div style="color:var(--color-error);font-size:12px;padding:8px 0;">Agent Server 未连接 (${agentUrl})</div>`;
  }

  el.innerHTML = `
    <div style="padding:8px 0;">
      ${statusHtml}
      <div style="font-size:11px;font-weight:600;color:var(--color-text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Sessions</div>
      ${sessionsHtml}
    </div>`;

  // Wire up click-to-jump on session cards
  el.querySelectorAll('[data-session-id]').forEach((card) => {
    const sessionId = (card as HTMLElement).dataset.sessionId;
    const filePath = (card as HTMLElement).dataset.filePath;
    if (!sessionId || !filePath) return;
    card.addEventListener('click', async () => {
      // Close monitor panel
      toggleMonitorPanel();
      // Open the file
      const fileData = state.sessionFiles.get(filePath);
      if (fileData) {
        await _switchFile!(filePath);
      } else {
        // File not open yet — load it
        try {
          const data = await _loadFile!(filePath, true);
          if (data) await _onFileLoaded!(data, true);
        } catch { /* file might not exist */ }
      }
      // Resume the session in chat panel
      import('./ui/chat-panel.js').then(({ resumeSession, renderChatPanel }) => {
        resumeSession(sessionId);
        switchAnnotationTab('chat');
        setTimeout(() => renderChatPanel(), 100);
      });
    });
  });
}

export function toggleMonitorPanel(): void {
  const panel = document.getElementById('monitorPanel');
  if (!panel) return;
  const isVisible = panel.style.display !== 'none';
  if (isVisible) {
    panel.style.display = 'none';
    if (monitorPollTimer) { clearInterval(monitorPollTimer); monitorPollTimer = null; }
  } else {
    panel.style.display = 'block';
    updateMonitorPanel();
    if (monitorActiveTab === 'memory') {
      monitorPollTimer = setInterval(updateMonitorPanel, 2000);
    }
  }
}
