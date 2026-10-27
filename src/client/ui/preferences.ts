import { state } from '../state';
import { saveConfig } from '../config';
import { renderSidebar } from './sidebar';
import { showError, showSuccess } from './toast';
import { MD_THEMES, HL_THEMES } from '../themes/index';
import { getAllStorageKeys, storageRemove } from '../utils/storage';
import {
  getRegisteredActions,
  getEffectiveKey,
  saveBinding,
  resetBinding,
  resetAllBindings,
  normalizeKeyCombo,
  type Action,
  type ActionCategory,
} from '../keybindings';
import { fetchQuickComments, saveQuickComments } from '../api/annotations';
import { loadQuickComments } from '../annotation';
import { fetchAgentBackends, fetchAgentUsage, fetchRecentAgentRuns, fetchWorkspaceAgentCommand, saveWorkspaceAgentCommand, type AgentRun, type AgentUsageSummary } from '../api/agent';

type PrefTab = '外观' | '快捷键' | '评论' | 'Agent';

let overlay: HTMLElement | null = null;
let currentTab: PrefTab = '外观';
let savedMarkdownTheme = '';
let savedCodeTheme = '';
let savedMathInline = true;
let recordingActionId: string | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let editingComments: string[] = [];
let selectedAgentWorkspace = '';
let editingAgentCommand = '';

export function showPreferences(): void {
  savedMarkdownTheme = state.config.markdownTheme || 'github';
  savedCodeTheme = state.config.codeTheme || 'github';
  savedMathInline = state.config.mathInline !== false;

  if (!overlay) overlay = buildOverlay();
  renderContent();
  overlay.classList.add('show');
}

export function closePreferences(): void {
  overlay?.classList.remove('show');
  if (recordingActionId && keydownHandler) {
    document.removeEventListener('keydown', keydownHandler, true);
    keydownHandler = null;
  }
  recordingActionId = null;
}

function buildOverlay(): HTMLElement {
  const el = document.createElement('div');
  el.id = 'preferencesOverlay';
  el.className = 'preferences-overlay';
  el.innerHTML = `
    <div class="preferences-dialog">
      <div class="preferences-header">
        偏好设置
        <button class="preferences-close" id="prefClose">×</button>
      </div>
      <div class="preferences-body">
        <nav class="preferences-nav" id="prefNav"></nav>
        <div class="preferences-content" id="prefContent"></div>
      </div>
      <div class="preferences-footer">
        <button class="preferences-btn" id="prefCancel">取消</button>
        <button class="preferences-btn primary" id="prefSave">保存</button>
      </div>
    </div>
  `;

  el.addEventListener('click', (e) => {
    if (e.target === el) closePreferences();
  });
  el.querySelector('#prefClose')!.addEventListener('click', closePreferences);
  el.querySelector('#prefCancel')!.addEventListener('click', () => {
    state.config.markdownTheme = savedMarkdownTheme;
    state.config.codeTheme = savedCodeTheme;
    state.config.mathInline = savedMathInline;
    import('../main').then((m) => m.applyTheme()).catch(() => {});
    closePreferences();
  });
  el.querySelector('#prefSave')!.addEventListener('click', saveAndClose);

  document.body.appendChild(el);
  return el;
}

function renderContent(): void {
  if (!overlay) return;
  renderNav();
  renderTab();
}

function renderNav(): void {
  const nav = overlay!.querySelector('#prefNav')!;
  const tabs: Array<{ id: PrefTab; icon: string }> = [
    { id: '外观', icon: '🎨' },
    { id: '快捷键', icon: '⌨️' },
    { id: '评论', icon: '💬' },
    { id: 'Agent', icon: '🤖' },
  ];
  nav.innerHTML = tabs
    .map(
      (t) => `
      <div class="preferences-nav-item${currentTab === t.id ? ' active' : ''}" data-tab="${t.id}">
        <span class="preferences-nav-icon">${t.icon}</span>
        ${t.id}
      </div>
    `
    )
    .join('');
  nav.querySelectorAll('.preferences-nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      currentTab = (item as HTMLElement).dataset.tab as PrefTab;
      recordingActionId = null;
      renderNav();
      renderTab();
    });
  });
}

function renderTab(): void {
  const content = overlay!.querySelector('#prefContent')!;
  if (currentTab === '外观') content.innerHTML = renderAppearanceTab();
  else if (currentTab === '快捷键') content.innerHTML = renderKeybindingsTab();
  else if (currentTab === '评论') { renderCommentsTab(content); return; }
  else if (currentTab === 'Agent') { renderAgentTab(content); return; }
  bindTabEvents();
}

// ── Appearance tab (migrated from settings.ts) ──────────────────────────────

function getClientStateSnapshot() {
  const mdvKeys = getAllStorageKeys().filter((k) => k.startsWith('md-viewer'));
  return {
    currentFile: state.currentFile || '',
    openFilesCount: state.sessionFiles.size,
    workspaceCount: state.config.workspaces.length,
    mdvKeyCount: mdvKeys.length,
    mdvKeys,
    localStorageKeyCount: localStorage.length,
    commentStateKeyCount: getAllStorageKeys().filter((k) => k.startsWith('annotation')).length,
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderAppearanceTab(): string {
  const snap = getClientStateSnapshot();
  return `
    <div class="settings-group">
      <div class="settings-group-title">外观</div>
      <div class="settings-section-desc">切换 Markdown 正文样式和代码高亮配色。</div>
      <div class="settings-row">
        <label class="settings-label">正文样式</label>
        <select id="markdownThemeSelect" class="settings-select">
          ${MD_THEMES.map((t) => `<option value="${t.key}"${state.config.markdownTheme === t.key ? ' selected' : ''}>${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="settings-row">
        <label class="settings-label">代码高亮</label>
        <select id="codeThemeSelect" class="settings-select">
          ${HL_THEMES.map((t) => `<option value="${t.key}"${state.config.codeTheme === t.key ? ' selected' : ''}>${t.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="settings-group">
      <div class="settings-group-title">数学公式</div>
      <div class="settings-section-desc">使用 KaTeX 渲染 LaTeX 公式。<code>$$...$$</code> 块级公式始终启用。</div>
      <div class="settings-row">
        <label class="settings-label">行内公式 <code>$...$</code></label>
        <label class="settings-toggle">
          <input type="checkbox" id="mathInlineCheckbox"${state.config.mathInline !== false ? ' checked' : ''}>
          <span class="settings-toggle-label">启用（关闭可避免 <code>$</code> 货币符号误触发）</span>
        </label>
      </div>
    </div>
    <div class="settings-group">
    </div>
    <div class="settings-group">
      <div class="settings-group-title">评论</div>
      <div class="settings-row">
        <label class="settings-label">乐观撤销</label>
        <label class="settings-toggle">
          <input type="checkbox" id="optimisticUndoCheckbox"${state.config.optimisticUndo !== false ? ' checked' : ''}>
          <span class="settings-toggle-label">删除/解决评论后显示撤销按钮（4 秒内可撤销）</span>
        </label>
      </div>
    </div>
    <div class="settings-group">
      <div class="settings-group-title">工作区</div>
      <div class="settings-section-desc">工作区文件树的轮询间隔，用于感知新增/删除文件。修改后刷新页面生效。</div>
      <div class="settings-row">
        <label class="settings-label">轮询间隔</label>
        <select id="pollIntervalSelect" class="settings-select">
          ${[2000, 5000, 10000, 30000].map((v) => `<option value="${v}"${(state.config.workspacePollInterval ?? 5000) === v ? ' selected' : ''}>${v / 1000}s</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="settings-group">
      <div class="settings-group-title">客户端状态</div>
      <div class="settings-section-desc">用于排查本地缓存是否脏数据，可直接清理。</div>
      <div class="settings-kv-grid">
        <div>当前文件</div><div>${escapeHtml(snap.currentFile || '无')}</div>
        <div>已打开文件数</div><div>${snap.openFilesCount}</div>
        <div>工作区数</div><div>${snap.workspaceCount}</div>
        <div>评论相关本地键数</div><div>${snap.commentStateKeyCount}</div>
        <div>md-viewer 本地键数</div><div>${snap.mdvKeyCount}</div>
        <div>localStorage 总键数</div><div>${snap.localStorageKeyCount}</div>
      </div>
      <div class="settings-key-list">
        ${snap.mdvKeys.map((key) => `<span class="settings-key-chip">${escapeHtml(key)}</span>`).join('')}
      </div>
    </div>
    <div class="settings-group">
      <div class="settings-group-title">数据清理</div>
      <div class="settings-section-desc">评论状态清理会同时删除服务端 SQLite 评论数据和客户端评论相关状态，随后自动刷新页面。</div>
      <div class="settings-actions-row">
        <button class="sync-dialog-button" id="clearAllCommentsBtn">清空评论状态</button>
        <button class="sync-dialog-button" id="clearClientStateBtn">清理客户端状态</button>
      </div>
    </div>
  `;
}

async function saveAndClose(): Promise<void> {
  if (currentTab === '评论') {
    const texts = editingComments.filter((t) => t.trim().length > 0);
    await saveQuickComments(texts);
    await loadQuickComments();
    closePreferences();
    return;
  }

  if (currentTab === 'Agent') {
    if (selectedAgentWorkspace) {
      const command = editingAgentCommand.trim().split(/\s+/).filter(Boolean);
      try {
        await saveWorkspaceAgentCommand(selectedAgentWorkspace, command.length > 0 ? command : null);
        showSuccess('设置已保存');
      } catch (err: any) {
        showError('保存失败: ' + err.message);
      }
    }
    closePreferences();
    return;
  }

  const mdSelect = document.getElementById('markdownThemeSelect') as HTMLSelectElement | null;
  const codeSelect = document.getElementById('codeThemeSelect') as HTMLSelectElement | null;
  const mathCheck = document.getElementById('mathInlineCheckbox') as HTMLInputElement | null;
  const pollSelect = document.getElementById('pollIntervalSelect') as HTMLSelectElement | null;
  const undoCheck = document.getElementById('optimisticUndoCheckbox') as HTMLInputElement | null;

  if (mdSelect) state.config.markdownTheme = mdSelect.value;
  if (codeSelect) state.config.codeTheme = codeSelect.value;
  if (mathCheck) state.config.mathInline = mathCheck.checked;
  if (pollSelect) state.config.workspacePollInterval = Number(pollSelect.value);
  if (undoCheck) state.config.optimisticUndo = undoCheck.checked;

  try {
    await saveConfig(state.config);
    renderSidebar();
    showSuccess('设置已保存');
  } catch (err: any) {
    showError('保存失败: ' + err.message);
  }
  closePreferences();
}

// ── Keybinding tab ────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  navigation: '导航',
  file: '文件',
  view: '视图',
  diff: 'Diff',
};

function renderKeybindingsTab(): string {
  const actions = getRegisteredActions().filter((a) => a.id !== 'escape');
  const byCategory = new Map<ActionCategory, Action[]>();
  for (const a of actions) {
    if (!byCategory.has(a.category)) byCategory.set(a.category, []);
    byCategory.get(a.category)!.push(a);
  }

  const isMac = navigator.platform.toUpperCase().includes('MAC');

  let html = `
    <div style="font-size:12px;color:var(--color-text-muted,#aaa);background:var(--color-bg-subtle,#fafafa);
      border:1px solid var(--color-border,#eee);border-radius:var(--radius-md,6px);padding:8px 12px;margin-bottom:20px;">
      点击 ✎ 后按下新按键即可录制。与浏览器冲突的按键会在 mdv 页面内优先捕获，不影响其他标签页。
    </div>
  `;

  for (const [cat, catActions] of byCategory) {
    html += `<div class="settings-group-title" style="margin-bottom:8px">${CATEGORY_LABELS[cat]}</div>`;
    for (const action of catActions) {
      const effectiveKey = getEffectiveKey(action.id);
      const isRecording = recordingActionId === action.id;
      const displayKey = effectiveKey ? formatKeyCombo(effectiveKey, isMac) : null;

      html += `
        <div class="kb-pref-row${isRecording ? ' recording' : ''}" data-action="${action.id}" style="
          display:flex;align-items:center;gap:10px;padding:9px 10px;
          border-radius:7px;border:1px solid transparent;margin-bottom:2px;
          ${isRecording ? 'background:var(--color-accent-bg);border-color:var(--color-accent-border);' : ''}
        ">
          <span style="flex:1;font-size:13px;color:var(--color-text-primary,#222)">
            ${escapeHtml(action.label)}
            ${action.context ? `<span style="font-size:11px;color:var(--color-text-muted,#aaa);margin-left:6px;font-weight:normal">(${escapeHtml(action.context)})</span>` : ''}
          </span>
          ${isRecording
            ? `<span class="kb-recording-badge" style="font-size:12px;color:var(--color-accent-text);background:var(--color-accent-bg);
                border-radius:5px;padding:3px 10px;animation:kb-pulse 1s ease-in-out infinite">按下按键…</span>`
            : displayKey
              ? `<span class="kb-key-display" style="display:inline-flex;gap:4px">${displayKey}</span>`
              : `<span style="font-size:12px;color:var(--color-text-muted,#bbb);font-style:italic">未设置</span>`
          }
          <button class="kb-edit-btn" data-action="${action.id}" style="
            width:26px;height:26px;border-radius:5px;border:1px solid var(--color-border,#ddd);
            background:${isRecording ? 'var(--color-accent)' : 'var(--color-surface)'};
            color:${isRecording ? 'var(--color-text-inverse)' : 'var(--color-text-muted,#888)'};
            cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;
          " title="编辑">✎</button>
          <button class="kb-reset-btn" data-action="${action.id}" style="
            width:26px;height:26px;border-radius:5px;border:1px solid var(--color-border,#ddd);
            background:var(--color-surface);color:var(--color-text-muted,#aaa);
            cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;
          " title="重置为默认">↺</button>
        </div>
      `;
    }
  }

  html += `
    <style>
      @keyframes kb-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    </style>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--color-border,#eee);">
      <button id="resetAllBindingsBtn" style="font-size:13px;color:var(--color-text-muted,#888);
        background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:6px;">
        ↺ 全部重置为默认
      </button>
    </div>
  `;

  return html;
}

function formatKeyCombo(combo: string, isMac: boolean): string {
  return combo
    .split('+')
    .map((part) => {
      if (isMac) {
        if (part === 'Ctrl') return '<kbd style="display:inline-block;padding:2px 6px;border:1px solid var(--color-border);border-bottom:2px solid var(--color-border);border-radius:4px;background:var(--color-bg-subtle);font-size:11px;font-family:monospace">⌃</kbd>';
        if (part === 'Cmd') return '<kbd style="display:inline-block;padding:2px 6px;border:1px solid var(--color-border);border-bottom:2px solid var(--color-border);border-radius:4px;background:var(--color-bg-subtle);font-size:11px;font-family:monospace">⌘</kbd>';
        if (part === 'Alt') return '<kbd style="display:inline-block;padding:2px 6px;border:1px solid var(--color-border);border-bottom:2px solid var(--color-border);border-radius:4px;background:var(--color-bg-subtle);font-size:11px;font-family:monospace">⌥</kbd>';
        if (part === 'Shift') return '<kbd style="display:inline-block;padding:2px 6px;border:1px solid var(--color-border);border-bottom:2px solid var(--color-border);border-radius:4px;background:var(--color-bg-subtle);font-size:11px;font-family:monospace">⇧</kbd>';
      }
      return `<kbd style="display:inline-block;padding:2px 6px;border:1px solid var(--color-border);border-bottom:2px solid var(--color-border);border-radius:4px;background:var(--color-bg-subtle);font-size:11px;font-family:monospace">${escapeHtml(part)}</kbd>`;
    })
    .join('');
}

async function renderCommentsTab(container: Element): Promise<void> {
  const items = await fetchQuickComments();
  editingComments = items.map((it) => it.text);

  const PRESETS = ['这是什么，解释一下', '有点抽象，举个例子', '单独写一篇文档介绍这个', '给一些数字，让我有个体感', '你确定吗？别猜，去代码里确认'];

  container.innerHTML = `
    <div class="settings-group-title">快捷评论</div>
    <div class="settings-section-desc">
      划词弹窗中显示的快捷评论，点击即直接保存，无需输入。顺序决定显示顺序。
    </div>
    <div class="qc-list" id="qcList"></div>
    <button class="quick-add-btn" id="qcAddBtn" style="width:100%;margin-top:4px">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" width="13" height="13"><path d="M8 3v10M3 8h10"/></svg>
      添加
    </button>
    <div class="settings-group-title" style="margin-top:16px">推荐预设</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
      ${PRESETS.map((p) => `<button class="qc-preset-chip" data-text="${p.replace(/"/g, '&quot;')}">${p}</button>`).join('')}
    </div>
  `;

  renderQcList(container);

  container.querySelector('#qcAddBtn')?.addEventListener('click', () => {
    editingComments.push('');
    renderQcList(container);
    const inputs = container.querySelectorAll<HTMLInputElement>('.qc-item-text');
    inputs[inputs.length - 1]?.focus();
  });

  container.querySelectorAll<HTMLElement>('.qc-preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.text ?? '';
      if (text && !editingComments.includes(text)) {
        editingComments.push(text);
        renderQcList(container);
      }
    });
  });
}

function renderQcList(container: Element): void {
  const list = container.querySelector('#qcList');
  if (!list) return;
  list.innerHTML = editingComments.map((text, i) => `
    <div class="qc-item" draggable="true" data-index="${i}">
      <span class="qc-item-drag" title="拖拽排序">⠿</span>
      <input class="qc-item-text" value="${text.replace(/"/g, '&quot;')}" data-index="${i}" />
      <button class="qc-item-del" data-index="${i}" title="删除">×</button>
    </div>
  `).join('');

  list.querySelectorAll<HTMLInputElement>('.qc-item-text').forEach((input) => {
    input.addEventListener('input', () => {
      editingComments[parseInt(input.dataset.index ?? '0', 10)] = input.value;
    });
  });

  list.querySelectorAll<HTMLButtonElement>('.qc-item-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingComments.splice(parseInt(btn.dataset.index ?? '0', 10), 1);
      renderQcList(container);
    });
  });

  let dragIdx: number | null = null;
  list.querySelectorAll<HTMLElement>('.qc-item').forEach((item) => {
    item.addEventListener('dragstart', () => { dragIdx = parseInt(item.dataset.index ?? '0', 10); item.style.opacity = '0.5'; });
    item.addEventListener('dragend', () => { item.style.opacity = ''; });
    item.addEventListener('dragover', (e) => { e.preventDefault(); });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      const dropIdx = parseInt(item.dataset.index ?? '0', 10);
      if (dragIdx !== null && dragIdx !== dropIdx) {
        const [moved] = editingComments.splice(dragIdx, 1);
        editingComments.splice(dropIdx, 0, moved);
        renderQcList(container);
      }
      dragIdx = null;
    });
  });
}

// ── Agent tab ────────────────────────────────────────────────────────────

async function renderAgentTab(container: Element): Promise<void> {
  const workspaces = state.config.workspaces.map((ws) => ws.path).filter(Boolean);
  if (!selectedAgentWorkspace || !workspaces.includes(selectedAgentWorkspace)) {
    selectedAgentWorkspace = workspaces[0] || '';
  }

  container.innerHTML = `
    <div class="settings-group">
      <div class="settings-group-title">Agent Backend</div>
      <div class="settings-section-desc">
        默认从 <code>~/.config/agent-backends.yaml</code> 读取 backend，并通过 shim 隔离 <code>ANTHROPIC_*</code> 等环境变量。下面的 workspace 命令是兼容旧配置的完整覆盖；留空则使用默认 backend。
      </div>
      <div id="agentBackendTable" class="settings-kv-grid"></div>
    </div>
    <div class="settings-group">
      <div class="settings-group-title">Workspace 命令覆盖</div>
      <div class="settings-section-desc">
        只有某个 workspace 需要特殊命令时才填写，比如 <code>mc --code --dangerously-skip-permissions</code>。留空则使用上面的默认 backend。
      </div>
      ${workspaces.length === 0
        ? `<div class="settings-section-desc">还没有注册任何 workspace。</div>`
        : `
      <div class="settings-row">
        <label class="settings-label">Workspace</label>
        <select id="agentWorkspaceSelect" class="settings-select">
          ${workspaces.map((p) => `<option value="${escapeHtml(p)}"${p === selectedAgentWorkspace ? ' selected' : ''}>${escapeHtml(p)}</option>`).join('')}
        </select>
      </div>
      <div class="settings-row">
        <label class="settings-label">命令</label>
        <input type="text" id="agentCommandInput" class="settings-select" style="flex:1" placeholder="claude --dangerously-skip-permissions" />
      </div>
      `}
    </div>
    <div class="settings-group">
      <div class="settings-group-title">用量统计（近 30 天）</div>
      <div class="settings-section-desc">按 workspace 汇总的运行次数、token 用量和花费，用于账单审计。</div>
      <div id="agentUsageTable" class="settings-kv-grid"></div>
    </div>
    <div class="settings-group">
      <div class="settings-group-title">最近运行明细</div>
      <div class="settings-section-desc">
        每次运行的 token 拆分（input / output / cache 创建 / cache 读取）和花费。cache 创建 token 通常是 <code>--resume</code> 续接旧会话时上下文变长导致的隐藏开销，明细里单独列出方便定位。
      </div>
      <div id="agentRunsTable" class="agent-runs-table"></div>
    </div>
  `;

  const backendEl = container.querySelector('#agentBackendTable');
  if (backendEl) {
    const backends = await fetchAgentBackends().catch(() => []);
    backendEl.innerHTML = backends.length === 0
      ? `<div class="settings-section-desc">没有发现可用 backend，将回退到 <code>claude</code>。</div>`
      : backends.map((backend) => {
        const desc = backend.description ? ` · ${escapeHtml(backend.description)}` : '';
        const ctx = backend.contextWindow ? ` · ${backend.contextWindow.toLocaleString()} ctx` : '';
        const status = backend.unavailableReason
          ? `<span class="settings-danger">不可用：${escapeHtml(backend.unavailableReason)}</span>`
          : `<span>可用</span>`;
        return `<div>${backend.default ? '默认' : 'Backend'}</div><div><strong>${escapeHtml(backend.name)}</strong>${desc}${ctx}<br>${status}</div>`;
      }).join('');
  }

  if (workspaces.length > 0) {
    const select = container.querySelector('#agentWorkspaceSelect') as HTMLSelectElement | null;
    const input = container.querySelector('#agentCommandInput') as HTMLInputElement | null;
    const loadCommand = async () => {
      const command = await fetchWorkspaceAgentCommand(selectedAgentWorkspace).catch(() => null);
      editingAgentCommand = command?.join(' ') ?? '';
      if (input) input.value = editingAgentCommand;
    };
    select?.addEventListener('change', () => {
      selectedAgentWorkspace = select.value;
      void loadCommand();
    });
    input?.addEventListener('input', () => {
      editingAgentCommand = input.value;
    });
    await loadCommand();
  }

  const usageEl = container.querySelector('#agentUsageTable');
  if (usageEl) {
    const summary = await fetchAgentUsage(30).catch(() => [] as AgentUsageSummary[]);
    usageEl.innerHTML = summary.length === 0
      ? `<div>暂无运行记录</div>`
      : summary.map((s) => `
        <div>${escapeHtml(s.workspacePath || '(未知 workspace)')}</div>
        <div>${s.runCount} 次 · ${(s.totalInputTokens + s.totalOutputTokens).toLocaleString()} tokens · $${s.totalCostUsd.toFixed(3)}</div>
      `).join('');
  }

  const runsEl = container.querySelector('#agentRunsTable');
  if (runsEl) {
    const runs = await fetchRecentAgentRuns(50).catch(() => [] as AgentRun[]);
    runsEl.innerHTML = runs.length === 0 ? `<div class="settings-section-desc">暂无运行记录</div>` : `
      <table class="agent-runs-table-inner">
        <thead>
          <tr>
            <th>时间</th><th>文档</th><th>状态</th>
            <th>input</th><th>output</th><th>cache 创建</th><th>cache 读取</th><th>花费</th>
          </tr>
        </thead>
        <tbody>
          ${runs.map((r) => {
            const name = r.docPath.split('/').pop() || r.docPath;
            const time = new Date(r.startedAt).toLocaleString();
            const statusCls = r.status === 'error' ? 'is-error' : r.status === 'running' ? 'is-running' : '';
            return `
              <tr class="${statusCls}" title="${escapeHtml(r.docPath)}">
                <td>${time}</td>
                <td>${escapeHtml(name)}</td>
                <td>${r.status}</td>
                <td>${r.usage.inputTokens?.toLocaleString() ?? '-'}</td>
                <td>${r.usage.outputTokens?.toLocaleString() ?? '-'}</td>
                <td>${r.usage.cacheCreationTokens?.toLocaleString() ?? '-'}</td>
                <td>${r.usage.cacheReadTokens?.toLocaleString() ?? '-'}</td>
                <td>${typeof r.usage.costUsd === 'number' ? '$' + r.usage.costUsd.toFixed(3) : '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }
}

function bindTabEvents(): void {
  // Appearance tab events
  const mdSelect = document.getElementById('markdownThemeSelect') as HTMLSelectElement | null;
  mdSelect?.addEventListener('change', () => {
    state.config.markdownTheme = mdSelect.value;
    import('../main').then((m) => m.applyTheme()).catch(() => {});
  });

  const codeSelect = document.getElementById('codeThemeSelect') as HTMLSelectElement | null;
  codeSelect?.addEventListener('change', () => {
    state.config.codeTheme = codeSelect.value;
    import('../main').then((m) => m.applyTheme()).catch(() => {});
  });

  const clearCommentsBtn = document.getElementById('clearAllCommentsBtn');
  clearCommentsBtn?.addEventListener('click', () => {
    // TODO: implement clearAllAnnotationState
  });

  const clearStateBtn = document.getElementById('clearClientStateBtn');
  clearStateBtn?.addEventListener('click', () => {
    getAllStorageKeys()
      .filter((k) => k.startsWith('md-viewer'))
      .forEach(storageRemove);
    location.reload();
  });

  // Keybinding tab events
  document.querySelectorAll('.kb-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const actionId = (btn as HTMLElement).dataset.action!;
      if (recordingActionId === actionId) {
        stopRecording();
      } else {
        startRecording(actionId);
      }
      renderTab();
    });
  });

  document.querySelectorAll('.kb-reset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const actionId = (btn as HTMLElement).dataset.action!;
      resetBinding(actionId);
      if (recordingActionId === actionId) stopRecording();
      renderTab();
    });
  });

  document.getElementById('resetAllBindingsBtn')?.addEventListener('click', () => {
    resetAllBindings();
    stopRecording();
    renderTab();
  });
}

function startRecording(actionId: string): void {
  stopRecording();
  recordingActionId = actionId;

  keydownHandler = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const combo = normalizeKeyComboForRecording(e);
    if (!combo) return;

    saveBinding(actionId, combo);
    stopRecording();
    renderTab();
  };

  document.addEventListener('keydown', keydownHandler, true);
}

function stopRecording(): void {
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler, true);
    keydownHandler = null;
  }
  recordingActionId = null;
}

function normalizeKeyComboForRecording(e: KeyboardEvent): string {
  if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return '';
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.metaKey) parts.push('Cmd');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  parts.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  return parts.join('+');
}
