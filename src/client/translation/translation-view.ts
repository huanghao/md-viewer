let _active = false;

export function isTranslationActive(): boolean {
  return _active;
}

export function enterTranslationMode(
  data: Record<string, string>,
  paragraphMap: Map<string, HTMLElement>
): void {
  const content = document.getElementById('content');
  if (!content) return;

  for (const [key, para] of paragraphMap.entries()) {
    const translation = data[key];
    if (!translation) continue;
    para.setAttribute('data-translation-source', '');
    const block = document.createElement('div');
    block.className = 'translation-block';
    block.setAttribute('data-translation-target', '');
    block.textContent = translation;
    para.insertAdjacentElement('afterend', block);
  }

  content.classList.add('translation-active');
  _active = true;
}

export function exitTranslationMode(): void {
  const content = document.getElementById('content');
  if (!content) return;

  for (const block of Array.from(content.querySelectorAll('.translation-block'))) {
    block.remove();
  }
  for (const el of Array.from(content.querySelectorAll('[data-translation-source]'))) {
    el.removeAttribute('data-translation-source');
  }
  content.classList.remove('translation-active');
  _active = false;
}
