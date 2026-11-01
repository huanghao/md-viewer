import { useEffect, useReducer, useState, type CSSProperties } from 'react';
import {
  getRegisteredActions,
  getEffectiveKey,
  saveBinding,
  resetBinding,
  resetAllBindings,
  type Action,
  type ActionCategory,
} from '../keybindings';

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  navigation: '导航',
  file: '文件',
  view: '视图',
  diff: 'Diff',
};

const KBD_STYLE: CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  border: '1px solid var(--color-border)',
  borderBottom: '2px solid var(--color-border)',
  borderRadius: 4,
  background: 'var(--color-bg-subtle)',
  fontSize: 11,
  fontFamily: 'monospace',
};

const MAC_SYMBOL: Record<string, string> = { Ctrl: '⌃', Cmd: '⌘', Alt: '⌥', Shift: '⇧' };

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

function KeyCombo({ combo }: { combo: string }) {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  return (
    <>
      {combo.split('+').map((part, i) => (
        <kbd key={i} style={KBD_STYLE}>{isMac ? (MAC_SYMBOL[part] ?? part) : part}</kbd>
      ))}
    </>
  );
}

/** 快捷键标签页：点 ✎ 后按下新按键即录制；改动即时写入（saveBinding），无需保存 */
export function KeybindingsTab() {
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!recordingId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const combo = normalizeKeyComboForRecording(e);
      if (!combo) return;
      saveBinding(recordingId, combo);
      setRecordingId(null);
      bump();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [recordingId]);

  const actions = getRegisteredActions().filter((a) => a.id !== 'escape');
  const byCategory = new Map<ActionCategory, Action[]>();
  for (const a of actions) {
    if (!byCategory.has(a.category)) byCategory.set(a.category, []);
    byCategory.get(a.category)!.push(a);
  }

  const iconBtn = (active: boolean): CSSProperties => ({
    width: 26,
    height: 26,
    borderRadius: 5,
    border: '1px solid var(--color-border, #ddd)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? 'var(--color-accent)' : 'var(--color-surface)',
    color: active ? 'var(--color-text-inverse)' : 'var(--color-text-muted, #888)',
    fontSize: 12,
  });

  return (
    <>
      <div
        style={{
          fontSize: 12,
          color: 'var(--color-text-muted, #aaa)',
          background: 'var(--color-bg-subtle, #fafafa)',
          border: '1px solid var(--color-border, #eee)',
          borderRadius: 'var(--radius-md, 6px)',
          padding: '8px 12px',
          marginBottom: 20,
        }}
      >
        点击 ✎ 后按下新按键即可录制。与浏览器冲突的按键会在 mdv 页面内优先捕获，不影响其他标签页。
      </div>

      {[...byCategory].map(([cat, catActions]) => (
        <div key={cat}>
          <div className="settings-group-title" style={{ marginBottom: 8 }}>{CATEGORY_LABELS[cat]}</div>
          {catActions.map((action) => {
            const isRecording = recordingId === action.id;
            const effectiveKey = getEffectiveKey(action.id);
            return (
              <div
                key={action.id}
                className={`kb-pref-row${isRecording ? ' recording' : ''}`}
                data-action={action.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 7,
                  border: `1px solid ${isRecording ? 'var(--color-accent-border)' : 'transparent'}`,
                  marginBottom: 2,
                  background: isRecording ? 'var(--color-accent-bg)' : undefined,
                }}
              >
                <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary, #222)' }}>
                  {action.label}
                  {action.context && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted, #aaa)', marginLeft: 6, fontWeight: 'normal' }}>
                      ({action.context})
                    </span>
                  )}
                </span>
                {isRecording ? (
                  <span
                    className="kb-recording-badge"
                    style={{
                      fontSize: 12,
                      color: 'var(--color-accent-text)',
                      background: 'var(--color-accent-bg)',
                      borderRadius: 5,
                      padding: '3px 10px',
                      animation: 'kb-pulse 1s ease-in-out infinite',
                    }}
                  >
                    按下按键…
                  </span>
                ) : effectiveKey ? (
                  <span className="kb-key-display" style={{ display: 'inline-flex', gap: 4 }}>
                    <KeyCombo combo={effectiveKey} />
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted, #bbb)', fontStyle: 'italic' }}>未设置</span>
                )}
                <button
                  className="kb-edit-btn"
                  data-action={action.id}
                  style={iconBtn(isRecording)}
                  title="编辑"
                  onClick={() => setRecordingId(isRecording ? null : action.id)}
                >
                  ✎
                </button>
                <button
                  className="kb-reset-btn"
                  data-action={action.id}
                  style={{ ...iconBtn(false), background: 'var(--color-surface)', color: 'var(--color-text-muted, #aaa)', fontSize: 13 }}
                  title="重置为默认"
                  onClick={() => {
                    resetBinding(action.id);
                    if (isRecording) setRecordingId(null);
                    bump();
                  }}
                >
                  ↺
                </button>
              </div>
            );
          })}
        </div>
      ))}

      <style>{'@keyframes kb-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }'}</style>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border, #eee)' }}>
        <button
          id="resetAllBindingsBtn"
          style={{
            fontSize: 13,
            color: 'var(--color-text-muted, #888)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: 6,
          }}
          onClick={() => {
            resetAllBindings();
            setRecordingId(null);
            bump();
          }}
        >
          ↺ 全部重置为默认
        </button>
      </div>
    </>
  );
}
