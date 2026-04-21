const MIN_PARAGRAPH_LENGTH = 20;

function extractSectionPath(headingText: string, fallbackIndex: number): string {
  const match = headingText.trim().match(/^([\d.]+)\s/);
  if (match) return match[1].replace(/\.$/, '');
  return String(fallbackIndex);
}

export function buildParagraphMap(contentEl: HTMLElement): Map<string, HTMLElement> {
  const map = new Map<string, HTMLElement>();
  const body = contentEl.querySelector('.markdown-body') ?? contentEl;

  let sectionPath = '0';
  let paragraphIndex = 0;
  let headingCount = 0;

  for (const child of Array.from(body.children)) {
    const tag = child.tagName;

    if (/^H[1-6]$/.test(tag)) {
      headingCount += 1;
      sectionPath = extractSectionPath(child.textContent ?? '', headingCount);
      paragraphIndex = 0;
      continue;
    }

    if (tag === 'BLOCKQUOTE' || tag === 'PRE' || tag === 'TABLE') continue;

    if (tag === 'P') {
      const text = child.textContent ?? '';
      if (text.trim().length < MIN_PARAGRAPH_LENGTH) continue;
      const key = `${sectionPath}-p${paragraphIndex}`;
      map.set(key, child as HTMLElement);
      paragraphIndex += 1;
    }
  }

  return map;
}
