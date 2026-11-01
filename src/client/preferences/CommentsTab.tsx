import { useEffect, useRef, useState } from 'react';
import { fetchQuickComments, saveQuickComments } from '../api/annotations';
import { loadQuickComments } from '../annotation';
import { registerPreferencesSaver } from './controller';

const PRESETS = ['这是什么，解释一下', '有点抽象，举个例子', '单独写一篇文档介绍这个', '给一些数字，让我有个体感', '你确定吗？别猜，去代码里确认'];

/** 快捷评论：划词弹窗中的一键评论文案，顺序即显示顺序；保存时整体替换 */
export function CommentsTab() {
  const [items, setItems] = useState<string[] | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const focusNewRow = useRef(false);

  useEffect(() => {
    void fetchQuickComments().then((list) => setItems(list.map((it) => it.text)));
  }, []);

  useEffect(() => {
    if (!items) return;
    registerPreferencesSaver(async () => {
      const texts = items.filter((t) => t.trim().length > 0);
      await saveQuickComments(texts);
      await loadQuickComments();
    });
    return () => registerPreferencesSaver(null);
  }, [items]);

  useEffect(() => {
    if (!focusNewRow.current) return;
    focusNewRow.current = false;
    const inputs = listRef.current?.querySelectorAll<HTMLInputElement>('.qc-item-text');
    inputs?.[inputs.length - 1]?.focus();
  }, [items]);

  if (!items) return null;

  const update = (next: string[]) => setItems(next);

  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update(next);
  };

  return (
    <>
      <div className="settings-group-title">快捷评论</div>
      <div className="settings-section-desc">
        划词弹窗中显示的快捷评论，点击即直接保存，无需输入。顺序决定显示顺序。
      </div>
      <div className="qc-list" id="qcList" ref={listRef}>
        {items.map((text, i) => (
          <div
            key={i}
            className="qc-item"
            draggable
            style={{ opacity: dragFrom === i ? 0.5 : undefined }}
            onDragStart={() => setDragFrom(i)}
            onDragEnd={() => setDragFrom(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom !== null && dragFrom !== i) move(dragFrom, i);
              setDragFrom(null);
            }}
          >
            <span className="qc-item-drag" title="拖拽排序">⠿</span>
            <input
              className="qc-item-text"
              value={text}
              onChange={(e) => update(items.map((t, j) => (j === i ? e.target.value : t)))}
            />
            <button className="qc-item-del" title="删除" onClick={() => update(items.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>
      <button
        className="quick-add-btn"
        id="qcAddBtn"
        style={{ width: '100%', marginTop: 4 }}
        onClick={() => {
          focusNewRow.current = true;
          update([...items, '']);
        }}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" width="13" height="13"><path d="M8 3v10M3 8h10" /></svg>
        添加
      </button>
      <div className="settings-group-title" style={{ marginTop: 16 }}>推荐预设</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {PRESETS.map((p) => (
          <button
            key={p}
            className="qc-preset-chip"
            onClick={() => {
              if (!items.includes(p)) update([...items, p]);
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </>
  );
}
