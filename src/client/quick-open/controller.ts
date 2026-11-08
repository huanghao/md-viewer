import { searchWorkspaceFiles } from '../api/files';
import { quickOpenStore } from './store';
import { buildQuickOpenResults, type FileHit } from './logic';

export interface QuickOpenDeps {
  getOpenFilePaths: () => string[];
  openFile: (path: string) => Promise<void>;
  switchToOpen: (path: string) => void;
}

let deps: QuickOpenDeps | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
/** 搜索序号：只接受最新一次搜索的结果，避免慢响应覆盖较新的输入 */
let searchSeq = 0;

export function initQuickOpenDeps(d: QuickOpenDeps): void {
  deps = d;
}

export function openQuickOpen(): void {
  quickOpenStore.open();
  void refresh('');
}

export function closeQuickOpen(): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = null;
  searchSeq++;
  quickOpenStore.close();
}

export function changeQuickOpenQuery(query: string): void {
  quickOpenStore.setQuery(query);
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => void refresh(query), 80);
}

async function refresh(query: string): Promise<void> {
  if (!deps) return;
  const seq = ++searchSeq;
  const openPaths = deps.getOpenFilePaths();

  let hits: FileHit[] = [];
  if (query.trim()) {
    try {
      hits = await searchWorkspaceFiles(query);
    } catch {
      hits = []; // 搜索失败时只保留已打开文件
    }
  }
  if (seq !== searchSeq) return; // 已有更新的搜索或已关闭
  quickOpenStore.setResults(buildQuickOpenResults(openPaths, hits, query));
}

export function moveQuickOpenActive(delta: number): void {
  const { activeIndex } = quickOpenStore.getState();
  quickOpenStore.setActive(activeIndex + delta);
}

export function selectQuickOpenItem(index: number): void {
  const { results } = quickOpenStore.getState();
  const item = results[index];
  if (!item || !deps) return;
  closeQuickOpen();
  if (item.isOpen) deps.switchToOpen(item.path);
  else void deps.openFile(item.path);
}
