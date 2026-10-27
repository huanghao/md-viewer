import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  clearTray,
  getTray,
  getTrayVersion,
  removeTrayItem,
  subscribeTray,
  updateTrayItemNote,
  updateTrayItemQuote,
} from '../agent-tray';
import { autoResizeComposerInput } from '../annotation/thread-manager';
import { useAgentState } from './useAgentState';

/**
 * 输入框：内容交给浏览器原生管理（撤销栈、Emacs 键、输入法），编辑只写回存储、不触发重渲染，
 * 否则每敲一个字都重绘会丢光标。
 */
function AutoTextarea(props: { className: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // 初始高度按已有内容展开一次（新建的一行足够，编辑过的长草稿需要撑开）
  useEffect(() => { if (ref.current) autoResizeComposerInput(ref.current); }, []);
  return (
    <textarea
      ref={ref}
      className={props.className}
      rows={1}
      placeholder={props.placeholder}
      defaultValue={props.value}
      onInput={(e) => {
        autoResizeComposerInput(e.currentTarget);
        props.onChange(e.currentTarget.value);
      }}
    />
  );
}

/** Agent 托盘：划词攒下的疑问/注释，下一轮对话时自动拼进 prompt，发送后清空 */
export function Tray() {
  const docPath = useAgentState((s) => s.docPath);
  const version = useSyncExternalStore(subscribeTray, getTrayVersion);
  const items = useMemo(() => (docPath ? getTray(docPath) : []), [docPath, version]);
  if (!docPath || items.length === 0) return null;
  return (
    <div className="agent-tray" id="agentTray">
      {items.map((item) => (
        <div className="agent-tray-chip" key={item.id}>
          <div className="agent-tray-chip-row">
            <AutoTextarea className="agent-tray-chip-quote" value={item.quote} onChange={(v) => updateTrayItemQuote(docPath, item.id, v)} />
            <button type="button" className="agent-tray-chip-remove" title="移除" onClick={() => removeTrayItem(docPath, item.id)}>×</button>
          </div>
          <AutoTextarea className="agent-tray-chip-note" value={item.note} placeholder="备注（可选）" onChange={(v) => updateTrayItemNote(docPath, item.id, v)} />
        </div>
      ))}
      <button type="button" className="agent-tray-clear-btn" onClick={() => clearTray(docPath)}>{`清空 (${items.length})`}</button>
    </div>
  );
}
