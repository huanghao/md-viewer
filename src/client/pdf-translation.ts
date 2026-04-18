import type { PdfTextBlock } from "./pdf-viewer.js";
import type { PdfViewerInstance } from "./pdf-viewer.js";

export interface TranslationProvider {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
}

export class LocalTranslationProvider implements TranslationProvider {
  async translate(text: string, _sourceLang: string, _targetLang: string): Promise<string> {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err.error || `translate error: ${res.status}`);
    }
    const data = await res.json() as { translatedText: string };
    return data.translatedText;
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
  if (translationStats.recentCalls.length > 10) {
    translationStats.recentCalls.shift();
  }
}

// ==================== 翻译数据管理 ====================

export interface StoredTranslation {
  originalText: string;
  translatedText: string | null; // null = loading/pending
  error?: string;                // 失败时的错误信息
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

export function clearAllTranslations(filePath: string): void {
  const prefix = `md-viewer:translation:${filePath}:`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  currentTranslations = [];
}

export async function retryTranslation(
  entry: StoredTranslation,
  filePath: string,
  provider: TranslationProvider,
  onUpdate: () => void
): Promise<void> {
  // 清除内存中的 error 条目，恢复 loading 状态
  const idx = currentTranslations.findIndex(
    (t) => t.pageNum === entry.pageNum && t.startItemIdx === entry.startItemIdx
  );
  if (idx >= 0) {
    currentTranslations[idx] = { ...currentTranslations[idx], translatedText: null, error: undefined };
  }
  onUpdate();
  await _doTranslate(entry.originalText, filePath, entry.pageNum, entry.startItemIdx, entry.endItemIdx, provider, onUpdate);
}

async function _doTranslate(
  text: string,
  filePath: string,
  pageNum: number,
  startItemIdx: number,
  endItemIdx: number,
  provider: TranslationProvider,
  onUpdate: () => void
): Promise<void> {
  const key = translationKey(filePath, pageNum, startItemIdx);
  const TIMEOUT_MS = 5000;
  const t0 = performance.now();
  const charsSent = text.length;
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("翻译超时，请重试")), TIMEOUT_MS)
    );
    const translated = await Promise.race([provider.translate(text, "en", "zh"), timeoutPromise]);
    const durationMs = Math.round(performance.now() - t0);
    recordCall({ time: Date.now(), durationMs, charsSent, charsReceived: translated.length, ok: true });

    const entry: StoredTranslation = {
      originalText: text,
      translatedText: translated,
      pageNum,
      startItemIdx,
      endItemIdx,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
    // 超出 10 条时删除最旧的
    const allKeys: string[] = [];
    const filePrefix = `md-viewer:translation:${filePath}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(filePrefix)) allKeys.push(k);
    }
    const entries: Array<{ key: string; ts: number }> = allKeys.map((k) => {
      try {
        const v = localStorage.getItem(k);
        const parsed = v ? (JSON.parse(v) as { timestamp?: number }) : null;
        return { key: k, ts: parsed?.timestamp ?? 0 };
      } catch {
        return { key: k, ts: 0 };
      }
    });
    entries.sort((a, b) => a.ts - b.ts);
    const toDeleteCount = Math.max(0, allKeys.length - 10);
    entries.slice(0, toDeleteCount).forEach(({ key: k }) => {
      localStorage.removeItem(k);
      currentTranslations = currentTranslations.filter(
        (t) => translationKey(filePath, t.pageNum, t.startItemIdx) !== k
      );
    });
    const idx = currentTranslations.findIndex(
      (t) => t.pageNum === pageNum && t.startItemIdx === startItemIdx
    );
    if (idx >= 0) currentTranslations[idx] = entry;
    onUpdate();
  } catch (e) {
    const durationMs = Math.round(performance.now() - t0);
    const errMsg = String((e as any)?.message || e).slice(0, 60);
    recordCall({ time: Date.now(), durationMs, charsSent, charsReceived: 0, ok: false, error: errMsg });
    const errorEntry: StoredTranslation = {
      originalText: text,
      translatedText: null,
      error: errMsg,
      pageNum,
      startItemIdx,
      endItemIdx,
      timestamp: Date.now(),
    };
    const idx = currentTranslations.findIndex(
      (t) => t.pageNum === pageNum && t.startItemIdx === startItemIdx
    );
    if (idx >= 0) currentTranslations[idx] = errorEntry;
    onUpdate();
  }
}

export async function translateBlock(
  block: PdfTextBlock,
  filePath: string,
  provider: TranslationProvider,
  onUpdate: () => void
): Promise<void> {
  const startItemIdx = Math.round(block.y * 10);
  const endItemIdx = startItemIdx;

  // 检查缓存
  const key = translationKey(filePath, block.pageNum, startItemIdx);
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const entry = JSON.parse(cached) as StoredTranslation;
      if (entry.translatedText) {
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

  await _doTranslate(block.text, filePath, block.pageNum, startItemIdx, endItemIdx, provider, onUpdate);
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
