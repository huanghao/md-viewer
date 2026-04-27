// src/client/translation.ts

const TRANSLATE_URL_KEY = 'md-viewer:translate-url';
const DEFAULT_TRANSLATE_URL = 'http://localhost:5050';

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
