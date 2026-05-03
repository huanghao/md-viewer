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

function buildHighlightFromRanges(text: string, ranges: Array<[number, number]>): string {
  const parts: string[] = [];
  let pos = 0;
  for (const [start, end] of ranges) {
    if (pos < start) parts.push(escapeHtml(text.slice(pos, start)));
    parts.push(`<mark class="search-highlight">${escapeHtml(text.slice(start, end))}</mark>`);
    pos = end;
  }
  if (pos < text.length) parts.push(escapeHtml(text.slice(pos)));
  return parts.join('');
}

function mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
  if (ranges.length === 0) return [];
  ranges.sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = out[out.length - 1];
    if (ranges[i][0] <= last[1]) {
      last[1] = Math.max(last[1], ranges[i][1]);
    } else {
      out.push(ranges[i]);
    }
  }
  return out;
}

// Scores a single token match against text. Returns 0 if not found.
function scoreToken(text: string, token: string): number {
  const lower = text.toLowerCase();
  const t = token.toLowerCase();
  const idx = lower.indexOf(t);
  if (idx === -1) return 0;
  if (lower === t) return 400;
  if (idx === 0) return 320;
  const prev = lower[idx - 1];
  if (prev === '-' || prev === '_' || prev === '/' || prev === ' ' || prev === '.') return 280;
  return 240;
}

export function fuzzyMatch(text: string, query: string): FuzzyMatchResult | null {
  const trimmed = query.trim();
  if (!trimmed) {
    return { score: 0, highlight: escapeHtml(text) };
  }

  const tokens = trimmed.split(/\s+/);
  const lower = text.toLowerCase();
  const ranges: Array<[number, number]> = [];
  let totalScore = 0;

  for (const token of tokens) {
    const t = token.toLowerCase();
    const idx = lower.indexOf(t);
    if (idx === -1) return null;
    const s = scoreToken(text, token);
    totalScore += s;
    ranges.push([idx, idx + token.length]);
  }

  const merged = mergeRanges(ranges);
  return { score: totalScore / tokens.length, highlight: buildHighlightFromRanges(text, merged) };
}

export function fuzzyScore(text: string, query: string): number {
  const result = fuzzyMatch(text, query);
  return result ? result.score : 0;
}
