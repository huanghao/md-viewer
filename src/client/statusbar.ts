function fmt(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function updateStatusbarFile(charCount: number, createdAt?: number, gitCreatedAt?: number): void {
  const charEl = document.getElementById('sbCharCount');
  const createdEl = document.getElementById('sbCreatedAt');
  if (charEl) charEl.textContent = charCount > 0 ? `${charCount.toLocaleString()} 字` : '';
  const ts = createdAt && gitCreatedAt ? Math.min(createdAt, gitCreatedAt)
    : createdAt ?? gitCreatedAt;
  if (createdEl) createdEl.textContent = ts ? `创建于 ${fmt(ts)}` : '';
}

export function updateStatusbarConnection(status: 'connecting' | 'connected' | 'disconnected' | 'failed'): void {
  const dot = document.getElementById('sbDot');
  const text = document.getElementById('sbConnectionText');
  if (!dot || !text) return;

  dot.className = 'sb-dot';
  if (status === 'connected') {
    dot.classList.add('connected');
    text.textContent = '已连接';
  } else if (status === 'connecting') {
    dot.classList.add('connecting');
    text.textContent = '连接中';
  } else {
    dot.classList.add('disconnected');
    text.textContent = '未连接';
  }
}
