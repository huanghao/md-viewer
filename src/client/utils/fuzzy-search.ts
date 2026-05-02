import fuzzysort from 'fuzzysort';

export interface FuzzyMatchResult {
  score: number;
  highlight: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHighlight(text: string, indices: Set<number>): string {
  const chars = Array.from(text);
  const parts: string[] = [];
  let i = 0;
  while (i < chars.length) {
    if (indices.has(i)) {
      let run = '';
      while (i < chars.length && indices.has(i)) {
        run += escapeHtml(chars[i]);
        i++;
      }
      parts.push(`<mark class="search-highlight">${run}</mark>`);
    } else {
      parts.push(escapeHtml(chars[i]));
      i++;
    }
  }
  return parts.join('');
}

export function fuzzyMatch(text: string, query: string): FuzzyMatchResult | null {
  const trimmed = query.trim();
  if (!trimmed) {
    return { score: 0, highlight: escapeHtml(text) };
  }

  const tokens = trimmed.split(/\s+/);
  const results: NonNullable<ReturnType<typeof fuzzysort.single>>[] = [];

  for (const token of tokens) {
    const r = fuzzysort.single(token, text);
    if (!r) return null;
    results.push(r);
  }

  const indices = new Set<number>();
  for (const r of results) {
    for (const idx of (r as any)._indexes ?? []) {
      indices.add(idx);
    }
  }

  const score = Math.min(...results.map((r) => r.score));
  return { score, highlight: buildHighlight(text, indices) };
}

export function fuzzyScore(text: string, query: string): number {
  const result = fuzzyMatch(text, query);
  return result ? result.score : 0;
}
