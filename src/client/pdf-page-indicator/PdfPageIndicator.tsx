import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { clampPageInput, pdfPageIndicatorStore } from './store';

/** PDF 页码指示器：点击后切换为输入框，回车跳转，Esc 或失焦取消 */
export function PdfPageIndicator() {
  const s = useSyncExternalStore(pdfPageIndicatorStore.subscribe, pdfPageIndicatorStore.getState);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  console.log('DBG render editing=', s.editing, 'page=', s.page);

  useEffect(() => {
    if (s.editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [s.editing]);

  if (!s.visible) return null;

  const beginEdit = () => { console.log('DBG begin', s.page);
    setDraft(String(s.page));
    pdfPageIndicatorStore.startEdit();
  };

  return (
    <div
      id="pdfPageIndicator"
      className="pdf-page-indicator"
      style={{ display: 'block' }}
      onClick={(e) => {
        if (e.target === inputRef.current) return;
        if (!s.editing) beginEdit();
      }}
    >
      {s.editing ? (
        <input
          ref={inputRef}
          className="pdf-page-indicator-input"
          type="number"
          min={1}
          max={s.total}
          value={draft}
          onChange={(e) => { console.log('DBG change', JSON.stringify(e.target.value)); setDraft(e.target.value); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { console.log('DBG enter draft', JSON.stringify(draft), s.total, 'goto', typeof s.onGoto);
              s.onGoto?.(clampPageInput(draft, s.total));
              pdfPageIndicatorStore.stopEdit();
            } else if (e.key === 'Escape') {
              pdfPageIndicatorStore.stopEdit();
            }
          }}
          onBlur={() => pdfPageIndicatorStore.stopEdit()}
        />
      ) : (
        <span className="pdf-page-indicator-label">{`${s.page} / ${s.total}`}</span>
      )}
    </div>
  );
}
