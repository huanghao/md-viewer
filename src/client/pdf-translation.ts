import type { PdfTextBlock } from "./pdf-viewer.js";

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

// Active translation overlays keyed by a stable block key
const activeTranslations = new Map<string, HTMLElement>();

function blockKey(block: PdfTextBlock): string {
  return `${block.pageNum}:${block.y.toFixed(0)}`;
}

export function createTranslationUI(
  pageContainer: HTMLElement,
  block: PdfTextBlock,
  translatedText: string,
  scale: number
): void {
  const key = blockKey(block);
  // Remove existing translation for this block if toggling
  const existing = activeTranslations.get(key);
  if (existing) {
    existing.remove();
    activeTranslations.delete(key);
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "pdf-translation-overlay";
  overlay.style.cssText = `
    position: absolute;
    left: ${block.x * scale}px;
    top: ${(block.y + block.height) * scale + 4}px;
    width: ${Math.max(block.width * scale, 200)}px;
    background: rgba(255, 253, 230, 0.97);
    border: 1px solid #e0d080;
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 13px;
    line-height: 1.5;
    color: #444;
    z-index: 100;
    pointer-events: auto;
    cursor: pointer;
  `;
  overlay.title = "Click to dismiss";
  overlay.textContent = translatedText;
  overlay.addEventListener("click", () => {
    overlay.remove();
    activeTranslations.delete(key);
  });

  pageContainer.appendChild(overlay);
  activeTranslations.set(key, overlay);
}

export async function handleParagraphTranslation(
  pageWrapper: HTMLElement,
  block: PdfTextBlock,
  provider: TranslationProvider,
  scale: number
): Promise<void> {
  const key = blockKey(block);
  // Toggle off if already shown
  const existing = activeTranslations.get(key);
  if (existing) {
    existing.remove();
    activeTranslations.delete(key);
    return;
  }

  // Show loading indicator
  const loading = document.createElement("div");
  loading.className = "pdf-translation-overlay pdf-translation-loading";
  loading.style.cssText = `
    position: absolute;
    left: ${block.x * scale}px;
    top: ${(block.y + block.height) * scale + 4}px;
    background: rgba(240,240,240,0.9);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    color: #888;
    z-index: 100;
  `;
  loading.textContent = "翻译中…";
  pageWrapper.appendChild(loading);

  try {
    const translated = await provider.translate(block.text, "en", "zh");
    loading.remove();
    createTranslationUI(pageWrapper, block, translated, scale);
  } catch (e) {
    loading.remove();
    const errDiv = document.createElement("div");
    errDiv.className = "pdf-translation-overlay";
    errDiv.style.cssText = loading.style.cssText;
    errDiv.style.color = "#c00";
    errDiv.textContent = "翻译失败";
    pageWrapper.appendChild(errDiv);
    setTimeout(() => errDiv.remove(), 2000);
  }
}
