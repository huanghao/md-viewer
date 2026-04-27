// src/client/translation.ts

const TRANSLATE_URL_KEY = 'md-viewer:translate-url';
const DEFAULT_TRANSLATE_URL = 'http://localhost:5050';

export function getTranslateUrl(): string {
  return localStorage.getItem(TRANSLATE_URL_KEY) ?? DEFAULT_TRANSLATE_URL;
}

export function setTranslateUrl(url: string): void {
  localStorage.setItem(TRANSLATE_URL_KEY, url || DEFAULT_TRANSLATE_URL);
}

async function sha256Prefix(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text.slice(0, 64));
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function injectParaIds(): Promise<void> {
  const reader = document.getElementById('reader');
  if (!reader) return;
  const els = reader.querySelectorAll<HTMLElement>('p, blockquote, li');
  for (const el of els) {
    if (el.dataset.paraId) continue;
    const text = el.textContent?.trim() ?? '';
    if (!text) continue;
    el.dataset.paraId = await sha256Prefix(text);
  }
}
