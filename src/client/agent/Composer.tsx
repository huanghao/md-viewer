import { useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { state as appState } from '../state';
import { storageGetNumber, storageSet } from '../utils/storage';
import { isSubmitKey } from '../utils/input-keys';
import { submitRun } from './actions';
import { useAgentState } from './useAgentState';
import { useEngine } from './useEngine';

const INPUT_DEFAULT_MIN_HEIGHT = 60;
const INPUT_MAX_RATIO = 0.7; // 手动拖拽和打字自动撑高共用同一个上限，两者不打架
const INPUT_HEIGHT_KEY = 'md-viewer:agent-chat-input-height';

/** 相对 workspace 根（agent 的 cwd 就是它）；不在任何 workspace 里时 cwd 是文档所在目录，只剩文件名 */
function docRelPath(path: string): string {
  const ws = appState.config.workspaces
    .map((w) => w.path)
    .filter((p): p is string => !!p && (path === p || path.startsWith(p.endsWith('/') ? p : p + '/')))
    .sort((a, b) => b.length - a.length)[0];
  if (ws) return path.slice(ws.endsWith('/') ? ws.length : ws.length + 1);
  return path.split('/').pop() || path;
}

function Chip({ kind, label, command }: { kind: string; label: string; command?: boolean }) {
  return (
    <span className={`agent-chat-chip${command ? ' is-command' : ''}`}>
      <span className="agent-chat-chip-label" title={label}>{label}</span>
      <button className="agent-chat-chip-remove" type="button" data-chip={kind} aria-label="移除">×</button>
    </span>
  );
}

export function Composer() {
  const docPath = useAgentState((s) => s.docPath);
  const running = useAgentState((s) => s.running);
  const engine = useEngine();
  const input = useRef<HTMLTextAreaElement>(null);
  // 输入框内容交给浏览器原生管理（撤销栈、Emacs 键、输入法都依赖它），不做受控组件
  const minHeight = useRef(INPUT_DEFAULT_MIN_HEIGHT);

  // /mdv 命令 chip：点 /mdv 按钮后出现 [/mdv] [文档相对路径]，发送时拼成 `/mdv <path> <更多文本>`。
  // 路径 chip 可以单独删掉，命令 chip 删掉则退回普通消息。
  const [mdvOn, setMdvOn] = useState(false);
  const [mdvPathOn, setMdvPathOn] = useState(false);

  const autoResize = () => {
    const el = input.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = window.innerHeight * INPUT_MAX_RATIO;
    el.style.height = `${Math.min(max, Math.max(el.scrollHeight, minHeight.current))}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  };

  // 刷新页面后恢复上次手动拖出来的高度（不记打字自动撑高的高度——那是跟内容走的）
  useLayoutEffect(() => {
    const saved = storageGetNumber(INPUT_HEIGHT_KEY, 0);
    if (saved >= INPUT_DEFAULT_MIN_HEIGHT && input.current) {
      minHeight.current = saved;
      input.current.style.height = `${saved}px`;
    }
  }, []);

  const submit = async () => {
    const el = input.current;
    await submitRun(
      {
        path: appState.currentFile,
        typed: el?.value ?? '',
        mdvOn,
        mdvPath: mdvOn && mdvPathOn && appState.currentFile ? docRelPath(appState.currentFile) : null,
        engine: engine.runParams(),
      },
      () => {
        setMdvOn(false);
        setMdvPathOn(false);
        if (el) { el.value = ''; autoResize(); }
      },
    );
  };

  const removeLastChip = (): boolean => {
    if (mdvPathOn) setMdvPathOn(false);
    else if (mdvOn) setMdvOn(false);
    else return false;
    return true;
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    // 输入框为空时 Backspace 像 omnibox 一样先删掉最后一个 chip
    if (e.key === 'Backspace' && !e.currentTarget.value && removeLastChip()) {
      e.preventDefault();
      return;
    }
    // Enter / Ctrl+Enter 换行，Cmd+Enter 才发送
    if (isSubmitKey(e.nativeEvent)) {
      e.preventDefault();
      void submit();
    }
  };

  // 输入框上沿放一条细把手：往上拖增高，往下拖收窄；高度作为用户偏好保存
  const onResizeStart = (event: React.MouseEvent) => {
    const el = input.current;
    if (!el) return;
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = el.getBoundingClientRect().height;
    document.body.classList.add('is-resizing-ns');
    el.style.height = `${startHeight}px`;
    const onMove = (e: MouseEvent) => {
      const max = window.innerHeight * INPUT_MAX_RATIO;
      const next = Math.min(max, Math.max(INPUT_DEFAULT_MIN_HEIGHT, startHeight + (startY - e.clientY)));
      el.style.height = `${next}px`;
      el.style.overflowY = next >= max ? 'auto' : 'hidden';
      minHeight.current = next;
    };
    const onUp = () => {
      document.body.classList.remove('is-resizing-ns');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      storageSet(INPUT_HEIGHT_KEY, Math.round(el.getBoundingClientRect().height));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // docPath 来自 store，换文档时订阅它让 chip 里的路径跟着重渲染
  const pathLabel = docPath ?? appState.currentFile;

  return (
    <>
      <div className="agent-chat-input-resizer" id="agentChatInputResizer" title="拖拽调整输入框高度" onMouseDown={onResizeStart} />
      <div
        className={`agent-chat-chips${mdvOn ? '' : ' hidden'}`}
        id="agentChatChips"
        onClick={(e) => {
          const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-chip]');
          if (!btn) return;
          if (btn.dataset.chip === 'path') setMdvPathOn(false);
          else { setMdvOn(false); setMdvPathOn(false); }
          input.current?.focus();
        }}
      >
        {mdvOn && <Chip kind="mdv" label="/mdv" command />}
        {mdvOn && mdvPathOn && pathLabel && <Chip kind="path" label={docRelPath(pathLabel)} />}
      </div>
      <textarea
        ref={input}
        className="agent-chat-input"
        id="agentChatInput"
        rows={4}
        placeholder="给 Agent 发消息（Enter / Ctrl+Enter 换行，⌘+Enter 发送）"
        onInput={autoResize}
        onKeyDown={onKeyDown}
      />
      <div className="agent-chat-compose-actions">
        <button
          className={`agent-mdv-btn${mdvOn ? ' is-active' : ''}`}
          id="agentMdvBtn"
          type="button"
          title="插入 /mdv 命令，并带上当前文档"
          onClick={() => { setMdvOn(true); setMdvPathOn(true); input.current?.focus(); }}
        >/mdv</button>
        <div className="agent-model-controls">
          <select className="agent-chat-select agent-engine-select" id="agentEngineSelect" title="Engine" value={engine.engineId} onChange={(e) => engine.setEngine(e.target.value)}>
            {engine.engines.map((e) => (
              <option key={e.id} value={e.id} disabled={!e.available}>{e.label}{e.available ? '' : '（不可用）'}</option>
            ))}
          </select>
          <select className="agent-chat-select agent-model-select" id="agentModelInput" title="Model" value={engine.model} onChange={(e) => engine.setModel(e.target.value)}>
            {engine.modelOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className={`agent-thinking-control${engine.isPi ? '' : ' hidden'}`} id="agentThinkingSection">
            <select className="agent-chat-select agent-thinking-select" id="agentThinkingLevel" title="Thinking" value={engine.thinking} onChange={(e) => engine.setThinking(e.target.value)}>
              <option value="">默认</option>
              {engine.thinkingLevels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </span>
        </div>
        <button
          className={`agent-chat-send-btn${running ? ' is-running' : ''}`}
          id="agentChatSendBtn"
          title="发送"
          aria-label="发送"
          disabled={running}
          onClick={() => void submit()}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor"><path d="M1.8 2.2a.6.6 0 01.7-.1l11.5 5.4a.6.6 0 010 1l-11.5 5.4a.6.6 0 01-.85-.7l1.7-4.7a.3.3 0 01.28-.2h5.2a.3.3 0 000-.6h-5.2a.3.3 0 01-.28-.2l-1.7-4.7a.6.6 0 01.15-.6z" /></svg>
        </button>
      </div>
    </>
  );
}
