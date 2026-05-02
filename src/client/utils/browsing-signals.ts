// Browsing signals: dwell + scroll tracking
import { state } from '../state';
import { recordSignal } from './focus-signals';

const DWELL_THRESHOLD_MS = 30_000; // 30s 算作一次 dwell
const SCROLL_DEBOUNCE_MS = 10_000; // 每 10s 最多发一次 scroll 信号
const SCROLL_MIN_PX = 200;         // 至少滚动 200px 才算

let dwellStart: number | null = null;
let dwellFile: string | null = null;
let dwellTimer: ReturnType<typeof setTimeout> | null = null;
let scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastScrollTop = 0;
let scrollAccum = 0;

function startDwell(): void {
  if (document.hidden) return;
  const file = state.currentFile;
  if (!file) return;
  dwellFile = file;
  dwellStart = Date.now();
  if (dwellTimer) clearTimeout(dwellTimer);
  dwellTimer = setTimeout(() => {
    if (dwellFile && !document.hidden) {
      recordSignal(dwellFile, 'dwell');
    }
    dwellTimer = null;
  }, DWELL_THRESHOLD_MS);
}

function pauseDwell(): void {
  if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
  dwellStart = null;
}

// Called from file-switcher on file switch
export function resetDwellOnFileSwitch(): void {
  pauseDwell();
  scrollAccum = 0;
  lastScrollTop = 0;
  startDwell();
}

export function initBrowsingSignals(): void {
  // Pause/resume on visibility change (window minimized, tab switched, etc.)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseDwell();
    } else {
      startDwell();
    }
  });

  // Pause on window blur (switched to another app)
  window.addEventListener('blur', pauseDwell);
  window.addEventListener('focus', () => { if (!document.hidden) startDwell(); });

  // Scroll signal on content area
  document.getElementById('content')?.addEventListener('scroll', (e) => {
    const el = e.target as HTMLElement;
    const delta = Math.abs(el.scrollTop - lastScrollTop);
    lastScrollTop = el.scrollTop;
    scrollAccum += delta;

    if (scrollAccum >= SCROLL_MIN_PX) {
      scrollAccum = 0;
      const file = state.currentFile;
      if (!file) return;
      if (scrollDebounceTimer) return; // already queued
      scrollDebounceTimer = setTimeout(() => {
        scrollDebounceTimer = null;
        if (state.currentFile === file) recordSignal(file, 'scroll');
      }, SCROLL_DEBOUNCE_MS);
    }
  }, { passive: true });

  // Start dwell for the initial file
  startDwell();
}
