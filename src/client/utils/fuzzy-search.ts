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

function buildHighlightFromRanges(text: string, ranges: Array<[number, number]>): string {
  // ranges: sorted, non-overlapping [start, end) pairs
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

export function fuzzyMatch(text: string, query: string): FuzzyMatchResult | null {
  const trimmed = query.trim();
  if (!trimmed) {
    return { score: 0, highlight: escapeHtml(text) };
  }

  const tokens = trimmed.split(/\s+/);
  const lower = text.toLowerCase();

  if (tokens.length === 1) {
    // Single token: use fuzzysort for scoring + substring for highlight position
    const r = fuzzysort.single(trimmed, text);
    if (!r) return null;

    // Find the best consecutive substring match for highlight
    const idx = lower.indexOf(trimmed.toLowerCase());
    if (idx !== -1) {
      // Token found as substring: highlight it
      const ranges: Array<[number, number]> = [[idx, idx + trimmed.length]];
      return { score: r.score, highlight: buildHighlightFromRanges(text, ranges) };
    }
    // Fallback to fuzzysort indexes for non-substring matches
    const indices = new Set(r.indexes);
    const chars = Array.from(text);
    const parts: string[] = [];
    let i = 0;
    while (i < chars.length) {
      if (indices.has(i)) {
        let run = '';
        while (i < chars.length && indices.has(i)) { run += escapeHtml(chars[i]); i++; }
        parts.push(`<mark class="search-highlight">${run}</mark>`);
      } else {
        parts.push(escapeHtml(chars[i])); i++;
      }
    }
    return { score: r.score, highlight: parts.join('') };
  }

  // Multi-token: each token must appear as a substring (AND logic)
  // Score = average of individual fuzzysort scores
  const ranges: Array<[number, number]> = [];
  let totalScore = 0;

  for (const token of tokens) {
    const idx = lower.indexOf(token.toLowerCase());
    if (idx === -1) return null; // All tokens must match

    // Use fuzzysort for scoring this token
    const r = fuzzysort.single(token, text);
    totalScore += r ? r.score : 0;
    ranges.push([idx, idx + token.length]);
  }

  const merged = mergeRanges(ranges);
  const score = totalScore / tokens.length;
  return { score, highlight: buildHighlightFromRanges(text, merged) };
}

export function fuzzyScore(text: string, query: string): number {
  const result = fuzzyMatch(text, query);
  return result ? result.score : 0;
}
