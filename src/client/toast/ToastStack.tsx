import { useEffect, useState, useSyncExternalStore } from 'react';
import { toastStore, type ToastItem } from './store';

const ICONS: Record<ToastItem['type'], string> = {
  success: '✓',
  error: '!',
  warning: '⚠',
  info: 'ℹ',
};

function ToastView({ toast }: { toast: ToastItem }) {
  const [shown, setShown] = useState(false);
  const [barStarted, setBarStarted] = useState(false);
  const sticky = toast.duration === 0;
  const timed = toast.duration > 0;

  // 入场：下一帧加上 toast-show；进度条在再下一帧开始收缩
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    if (!timed) return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setBarStarted(true)));
    return () => cancelAnimationFrame(raf);
  }, [timed]);

  const className = [
    'toast',
    `toast-${toast.type}`,
    sticky ? 'toast-sticky' : '',
    shown ? 'toast-show' : '',
    toast.hiding ? 'toast-hide' : '',
  ].filter(Boolean).join(' ');

  const { action } = toast;
  return (
    // 普通 toast 点击任意位置关闭；常驻 toast 只能用 × 关闭，便于选中复制文字
    <div className={className} onClick={sticky ? undefined : () => toastStore.hide(toast.id)}>
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      {action && (
        <button
          className="toast-action"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
            toastStore.hide(toast.id);
          }}
        >
          {action.label}
        </button>
      )}
      {sticky && (
        <button
          className="toast-close"
          title="关闭"
          onClick={(e) => {
            e.stopPropagation();
            toastStore.hide(toast.id);
          }}
        >
          ×
        </button>
      )}
      {timed && (
        <div className="toast-progress">
          <div
            className="toast-progress-bar"
            style={{
              transitionDuration: `${toast.duration}ms`,
              ...(barStarted ? { width: '0%' } : {}),
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastStack() {
  const { toasts } = useSyncExternalStore(toastStore.subscribe, toastStore.getState);
  return (
    <>
      {toasts.map((t) => (
        <ToastView key={t.id} toast={t} />
      ))}
    </>
  );
}
