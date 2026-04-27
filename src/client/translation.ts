const TRANSLATE_URL_KEY = 'md-viewer:translate-url';
const DEFAULT_TRANSLATE_URL = 'http://localhost:5050';
const TRANSLATE_STATE_PREFIX = 'md-viewer:translate:';

export function getTranslateUrl(): string {
  return localStorage.getItem(TRANSLATE_URL_KEY) ?? DEFAULT_TRANSLATE_URL;
}

export function setTranslateUrl(url: string): void {
  localStorage.setItem(TRANSLATE_URL_KEY, url || DEFAULT_TRANSLATE_URL);
}

function paraId(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (((h << 5) + h) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

export function injectParaIds(): void {
  const reader = document.getElementById('reader');
  if (!reader) return;
  const els = reader.querySelectorAll<HTMLElement>('p, blockquote, li');
  for (const el of els) {
    if (el.dataset.paraId) continue;
    const text = el.textContent?.trim() ?? '';
    if (!text) continue;
    el.dataset.paraId = paraId(text);
  }
}

export function isTranslateEnabled(filePath: string): boolean {
  return localStorage.getItem(TRANSLATE_STATE_PREFIX + filePath) === '1';
}

function setTranslateEnabled(filePath: string, enabled: boolean): void {
  if (enabled) {
    localStorage.setItem(TRANSLATE_STATE_PREFIX + filePath, '1');
  } else {
    localStorage.removeItem(TRANSLATE_STATE_PREFIX + filePath);
  }
}

let _observer: IntersectionObserver | null = null;
let _pendingQueue: HTMLElement[] = [];
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
let _abortController: AbortController | null = null;
let _flushing = false;

async function flushQueue(): Promise<void> {
  if (_flushing || _pendingQueue.length === 0) return;
  _flushing = true;
  const batch = _pendingQueue.splice(0, 10);
  const segments = batch.map(el => ({
    id: el.dataset.paraId!,
    text: el.textContent?.trim() ?? '',
  })).filter(s => s.text);

  if (segments.length === 0) { _flushing = false; return; }

  const controller = new AbortController();
  _abortController = controller;
  try {
    const res = await fetch(`${getTranslateUrl()}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segments }),
      signal: controller.signal,
    });
    if (!res.ok) return;
    const data = await res.json() as { results: Array<{ id: string; translation: string }> };
    for (const result of data.results) {
      const el = batch.find(e => e.dataset.paraId === result.id);
      if (!el) continue;
      el.dataset.translationDone = '1';
      const p = document.createElement('p');
      p.className = 'para-translation';
      p.dataset.for = result.id;
      p.textContent = result.translation;
      el.insertAdjacentElement('afterend', p);
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') console.warn('[translate] fetch failed', e);
  } finally {
    _abortController = null;
    _flushing = false;
  }

  if (_pendingQueue.length > 0) {
    _debounceTimer = setTimeout(flushQueue, 0);
  }
}

function scheduleFlush(): void {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(flushQueue, 200);
}

export function enableTranslation(): void {
  const reader = document.getElementById('reader');
  if (!reader) return;

  _observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      if (el.dataset.translationDone) continue;
      if (!el.dataset.paraId) continue;
      if (_pendingQueue.includes(el)) continue;
      _pendingQueue.push(el);
      scheduleFlush();
    }
  }, { rootMargin: '200px' });

  reader.querySelectorAll<HTMLElement>('[data-para-id]').forEach(el => {
    _observer!.observe(el);
  });
}

export function disableTranslation(): void {
  _observer?.disconnect();
  _observer = null;
  _abortController?.abort();
  _abortController = null;
  if (_debounceTimer) { clearTimeout(_debounceTimer); _debounceTimer = null; }
  _pendingQueue = [];
  _flushing = false;

  document.querySelectorAll('.para-translation').forEach(el => el.remove());
  document.querySelectorAll<HTMLElement>('[data-translation-done]').forEach(el => {
    delete el.dataset.translationDone;
  });
}

export function updateTranslateButton(filePath: string): void {
  const btn = document.getElementById('translateButton');
  if (!btn) return;
  const enabled = isTranslateEnabled(filePath);
  btn.classList.toggle('active', enabled);
  const span = document.getElementById('translateButtonText');
  if (span) span.textContent = enabled ? '[译 ✓]' : '[译]';
}

export function handleTranslateButtonClick(filePath: string | null): void {
  if (!filePath) return;
  const nowEnabled = !isTranslateEnabled(filePath);
  setTranslateEnabled(filePath, nowEnabled);
  updateTranslateButton(filePath);
  if (nowEnabled) {
    enableTranslation();
  } else {
    disableTranslation();
  }
}

export function initTranslation(filePath: string): void {
  disableTranslation();
  updateTranslateButton(filePath);
  if (isTranslateEnabled(filePath)) {
    enableTranslation();
  }
}
