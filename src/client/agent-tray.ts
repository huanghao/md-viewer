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
import { autoResizeComposerInput } from './annotation/thread-manager';

export interface TrayItem {
  id: string;
  quote: string;
  note: string;
  createdAt: number;
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
  renderTray(filePath);
}

export function removeTrayItem(filePath: string, id: string): void {
  setTray(filePath, getTray(filePath).filter((item) => item.id !== id));
  renderTray(filePath);
}

function updateTrayItemNote(filePath: string, id: string, note: string): void {
  const items = getTray(filePath);
  const item = items.find((it) => it.id === id);
  if (!item) return;
  item.note = note;
  setTray(filePath, items);
}

function updateTrayItemQuote(filePath: string, id: string, quote: string): void {
  const items = getTray(filePath);
  const item = items.find((it) => it.id === id);
  if (!item) return;
  item.quote = quote;
  setTray(filePath, items);
}

export function clearTray(filePath: string): void {
  setTray(filePath, []);
  renderTray(filePath);
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

export function renderTray(filePath: string | null): void {
  const container = document.getElementById('agentTray');
  if (!container) return;
  container.replaceChildren();

  const items = filePath ? getTray(filePath) : [];
  if (!filePath || items.length === 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');

  items.forEach((item) => {
    const chip = document.createElement('div');
    chip.className = 'agent-tray-chip';

    const quoteRow = document.createElement('div');
    quoteRow.className = 'agent-tray-chip-row';

    const quoteInput = document.createElement('textarea');
    quoteInput.className = 'agent-tray-chip-quote';
    quoteInput.rows = 1;
    quoteInput.value = item.quote;
    quoteInput.addEventListener('input', () => {
      autoResizeComposerInput(quoteInput);
      updateTrayItemQuote(filePath, item.id, quoteInput.value);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'agent-tray-chip-remove';
    removeBtn.textContent = '×';
    removeBtn.title = '移除';
    removeBtn.addEventListener('click', () => removeTrayItem(filePath, item.id));

    quoteRow.append(quoteInput, removeBtn);

    const noteInput = document.createElement('textarea');
    noteInput.className = 'agent-tray-chip-note';
    noteInput.rows = 1;
    noteInput.placeholder = '备注（可选）';
    noteInput.value = item.note;
    noteInput.addEventListener('input', () => {
      autoResizeComposerInput(noteInput);
      updateTrayItemNote(filePath, item.id, noteInput.value);
    });

    chip.append(quoteRow, noteInput);
    container.appendChild(chip);

    // 初始高度按已有内容展开一次（新建的一行足够，编辑过的长草稿需要撑开）
    autoResizeComposerInput(quoteInput);
    autoResizeComposerInput(noteInput);
  });

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'agent-tray-clear-btn';
  clearBtn.textContent = `清空 (${items.length})`;
  clearBtn.addEventListener('click', () => clearTray(filePath));
  container.appendChild(clearBtn);
}
