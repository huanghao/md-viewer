/**
 * Agent Tray - 划词写一句疑问/注释，攒进托盘；下一轮跟 Agent 对话时自动拼进
 * prompt 当上下文，发送后清空。不走批注的锚定/回复/持久化那一整套（那是给
 * "审阅"用的，这里是给"读的时候随手记一笔、留给 Agent 下一轮看"用的，
 * 两者场景不同，所以是独立的轻量存储）。
 *
 * 存储：localStorage，按文档路径分 key（跟 pdf-zoom/pdf-scroll 一个套路），
 * 只在本地留存到"下次发送 Agent 消息"为止，不进服务端、不需要持久化。
 */

import { storageGet, storageSet } from './utils/storage';

export interface TrayItem {
  id: string;
  quote: string;
  note: string;
  createdAt: number;
}

// 托盘内容变化通知：视图（agent/Tray.tsx）据此重渲染；编辑草稿不通知，避免打断输入
let trayVersion = 0;
const trayListeners = new Set<() => void>();
function notifyTray(): void {
  trayVersion++;
  trayListeners.forEach((l) => l());
}
export function subscribeTray(l: () => void): () => void {
  trayListeners.add(l);
  return () => { trayListeners.delete(l); };
}
export function getTrayVersion(): number {
  return trayVersion;
}

function trayKey(filePath: string): string {
  return `md-viewer:agent-tray:${filePath}`;
}

export function getTray(filePath: string): TrayItem[] {
  return storageGet<TrayItem[]>(trayKey(filePath), []);
}

function setTray(filePath: string, items: TrayItem[]): void {
  storageSet(trayKey(filePath), items);
}

export function addTrayItem(filePath: string, quote: string, note = ''): void {
  const trimmed = quote.trim();
  if (!trimmed) return;
  const items = getTray(filePath);
  items.push({
    id: `tray-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    quote: trimmed,
    note: note.trim(),
    createdAt: Date.now(),
  });
  setTray(filePath, items);
  notifyTray();
}

export function removeTrayItem(filePath: string, id: string): void {
  setTray(filePath, getTray(filePath).filter((item) => item.id !== id));
  notifyTray();
}

export function updateTrayItemNote(filePath: string, id: string, note: string): void {
  const items = getTray(filePath);
  const item = items.find((it) => it.id === id);
  if (!item) return;
  item.note = note;
  setTray(filePath, items);
}

export function updateTrayItemQuote(filePath: string, id: string, quote: string): void {
  const items = getTray(filePath);
  const item = items.find((it) => it.id === id);
  if (!item) return;
  item.quote = quote;
  setTray(filePath, items);
}

export function clearTray(filePath: string): void {
  setTray(filePath, []);
  notifyTray();
}

/** 把托盘里的标注拼成一段 prompt 前缀；托盘为空时返回 null，调用方据此决定要不要拼接 */
export function buildTrayPromptPrefix(filePath: string): string | null {
  const items = getTray(filePath);
  if (items.length === 0) return null;
  const lines = items.map((item, i) => {
    const notePart = item.note.trim() ? ` — ${item.note.trim()}` : '';
    return `${i + 1}. "${item.quote}"${notePart}`;
  });
  return `[划词标注]\n${lines.join('\n')}`;
}
