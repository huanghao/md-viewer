import type { PdfTextBlock } from "./pdf-viewer.js";
import type { PdfViewerInstance } from "./pdf-viewer.js";

export interface TranslationProvider {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
}

export class MyMemoryProvider implements TranslationProvider {
  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const langPair = `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MyMemory error: ${res.status}`);
    const data = await res.json();
    if (data.responseStatus !== 200) throw new Error(data.responseDetails || "Translation failed");
    return data.responseData.translatedText as string;
  }
}

// ==================== 翻译统计 ====================

export interface TranslationCallRecord {
  time: number;
  durationMs: number;
  charsSent: number;
  charsReceived: number;
  ok: boolean;
  error?: string;
}

interface TranslationStats {
  totalCalls: number;
  successCalls: number;
  failCalls: number;
  totalDurationMs: number;
  maxDurationMs: number;
  totalCharsSent: number;
  totalCharsReceived: number;
  recentCalls: TranslationCallRecord[];
}

const translationStats: TranslationStats = {
  totalCalls: 0,
  successCalls: 0,
  failCalls: 0,
  totalDurationMs: 0,
  maxDurationMs: 0,
  totalCharsSent: 0,
  totalCharsReceived: 0,
  recentCalls: [],
};

export function getTranslationStats(): Readonly<TranslationStats> {
  return translationStats;
}

export function clearTranslationStats(): void {
  translationStats.totalCalls = 0;
  translationStats.successCalls = 0;
  translationStats.failCalls = 0;
  translationStats.totalDurationMs = 0;
  translationStats.maxDurationMs = 0;
  translationStats.totalCharsSent = 0;
  translationStats.totalCharsReceived = 0;
  translationStats.recentCalls = [];
}

function recordCall(record: TranslationCallRecord): void {
  translationStats.totalCalls++;
  translationStats.totalDurationMs += record.durationMs;
  translationStats.totalCharsSent += record.charsSent;
  if (record.durationMs > translationStats.maxDurationMs) {
    translationStats.maxDurationMs = record.durationMs;
  }
  if (record.ok) {
    translationStats.successCalls++;
    translationStats.totalCharsReceived += record.charsReceived;
  } else {
    translationStats.failCalls++;
  }
  translationStats.recentCalls.push(record);
  if (translationStats.recentCalls.length > 20) {
    translationStats.recentCalls.shift();
  }
}

// ==================== 翻译数据管理 ====================

export interface StoredTranslation {
  originalText: string;
  translatedText: string | null; // null = loading/pending
  pageNum: number;
  startItemIdx: number;
  endItemIdx: number;
  timestamp: number;
}

// 内存中当前文件的翻译列表
let currentTranslations: StoredTranslation[] = [];
let currentFilePath: string | null = null;

function translationKey(filePath: string, pageNum: number, startItemIdx: number): string {
  return `md-viewer:translation:${filePath}:${pageNum}:${startItemIdx}`;
}

export function loadTranslations(filePath: string): void {
  currentFilePath = filePath;
  currentTranslations = [];
  // 扫描 localStorage 找该文件的所有翻译
  const prefix = `md-viewer:translation:${filePath}:`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    try {
      const val = localStorage.getItem(key);
      if (!val) continue;
      const entry = JSON.parse(val) as StoredTranslation;
      if (entry && entry.originalText && entry.translatedText !== undefined) {
        currentTranslations.push(entry);
      }
    } catch {
      // ignore corrupt entries
    }
  }
  // 按页码+item 排序
  currentTranslations.sort((a, b) => a.pageNum - b.pageNum || a.startItemIdx - b.startItemIdx);
}

export function getTranslations(): StoredTranslation[] {
  return currentTranslations;
}

export function removeTranslation(filePath: string, pageNum: number, startItemIdx: number): void {
  const key = translationKey(filePath, pageNum, startItemIdx);
  localStorage.removeItem(key);
  currentTranslations = currentTranslations.filter(
    (t) => !(t.pageNum === pageNum && t.startItemIdx === startItemIdx)
  );
}

export async function translateBlock(
  block: PdfTextBlock,
  filePath: string,
  provider: TranslationProvider,
  onUpdate: () => void
): Promise<void> {
  // PdfTextBlock 里 items[0] 的 index 就是 startItemIdx（由 buildTextBlocks 传入）
  // 但 block 本身没有存 startItemIdx，用 block 在 page 里的位置近似：
  // 用 block.y 和 block.pageNum 作为唯一 key 的 fallback
  // 实际上 buildTextBlocks 没有存 itemIdx，用 y 坐标的整数近似
  const startItemIdx = Math.round(block.y * 10); // 稳定近似 key
  const endItemIdx = startItemIdx;

  // 检查缓存
  const key = translationKey(filePath, block.pageNum, startItemIdx);
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const entry = JSON.parse(cached) as StoredTranslation;
      if (entry.translatedText) {
        // 已有缓存，确保在内存列表里
        const exists = currentTranslations.some(
          (t) => t.pageNum === block.pageNum && t.startItemIdx === startItemIdx
        );
        if (!exists) {
          currentTranslations.push(entry);
          currentTranslations.sort((a, b) => a.pageNum - b.pageNum || a.startItemIdx - b.startItemIdx);
        }
        onUpdate();
        return;
      }
    } catch {
      // fall through to translate
    }
  }

  // 插入 loading 占位
  const loadingEntry: StoredTranslation = {
    originalText: block.text,
    translatedText: null,
    pageNum: block.pageNum,
    startItemIdx,
    endItemIdx,
    timestamp: Date.now(),
  };
  const existingIdx = currentTranslations.findIndex(
    (t) => t.pageNum === block.pageNum && t.startItemIdx === startItemIdx
  );
  if (existingIdx >= 0) {
    currentTranslations[existingIdx] = loadingEntry;
  } else {
    currentTranslations.push(loadingEntry);
    currentTranslations.sort((a, b) => a.pageNum - b.pageNum || a.startItemIdx - b.startItemIdx);
  }
  onUpdate();

  const t0 = performance.now();
  const charsSent = block.text.length;
  try {
    const translated = await provider.translate(block.text, "en", "zh");
    const durationMs = Math.round(performance.now() - t0);
    recordCall({ time: Date.now(), durationMs, charsSent, charsReceived: translated.length, ok: true });

    const entry: StoredTranslation = {
      originalText: block.text,
      translatedText: translated,
      pageNum: block.pageNum,
      startItemIdx,
      endItemIdx,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
    const idx = currentTranslations.findIndex(
      (t) => t.pageNum === block.pageNum && t.startItemIdx === startItemIdx
    );
    if (idx >= 0) currentTranslations[idx] = entry;
    onUpdate();
  } catch (e) {
    const durationMs = Math.round(performance.now() - t0);
    const errMsg = String((e as any)?.message || e).slice(0, 60);
    recordCall({ time: Date.now(), durationMs, charsSent, charsReceived: 0, ok: false, error: errMsg });
    // 移除 loading 占位
    currentTranslations = currentTranslations.filter(
      (t) => !(t.pageNum === block.pageNum && t.startItemIdx === startItemIdx)
    );
    onUpdate();
  }
}

export function highlightTranslationBlock(
  viewer: PdfViewerInstance,
  pageNum: number,
  startItemIdx: number,
  endItemIdx: number
): void {
  viewer.highlightByItemRange(pageNum, startItemIdx, endItemIdx);
  setTimeout(() => {
    viewer.clearHighlights();
  }, 2000);
}
