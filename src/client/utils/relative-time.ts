const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = now - ts;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'just now';
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  const d = new Date(ts);
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return new Date(now).getFullYear() === d.getFullYear()
    ? base
    : `${base}, ${d.getFullYear()}`;
}
