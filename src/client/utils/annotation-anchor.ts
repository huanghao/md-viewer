import type { Annotation } from '../annotation';

export interface AnchorResult {
  start: number;
  length: number;
  confidence: number;
  status: 'anchored' | 'unanchored';
}

function collectMatches(text: string, needle: string): number[] {
  if (!needle) return [];
  const result: number[] = [];
  let index = text.indexOf(needle);
  while (index >= 0) {
    result.push(index);
    index = text.indexOf(needle, index + 1);
  }
  return result;
}

function scoreCandidate(text: string, quote: string, at: number, ann: Annotation): number {
  let score = 0;
  const expectedStart = Math.max(0, ann.start || 0);
  const distance = Math.abs(at - expectedStart);
  score += Math.max(0, 1000 - Math.min(1000, distance));

  if (ann.quotePrefix) {
    const gotPrefix = text.slice(Math.max(0, at - ann.quotePrefix.length), at);
    if (gotPrefix === ann.quotePrefix) score += 500;
  }
  if (ann.quoteSuffix) {
    const end = at + quote.length;
    const gotSuffix = text.slice(end, end + ann.quoteSuffix.length);
    if (gotSuffix === ann.quoteSuffix) score += 500;
  }
  return score;
}

export function resolveAnnotationAnchor(text: string, ann: Annotation): AnchorResult {
  if (!text || !ann.quote || ann.length <= 0) {
    return { start: ann.start || 0, length: Math.max(1, ann.length || ann.quote?.length || 1), confidence: 0, status: 'unanchored' };
  }

  const expectedStart = Math.max(0, ann.start || 0);
  const expectedEnd = expectedStart + Math.max(1, ann.length || ann.quote.length);
  if (expectedEnd <= text.length && text.slice(expectedStart, expectedEnd) === ann.quote) {
    return { start: expectedStart, length: ann.length, confidence: 1, status: 'anchored' };
  }

  const matches = collectMatches(text, ann.quote);
  if (matches.length === 0) {
    return { start: expectedStart, length: Math.max(1, ann.length || ann.quote.length), confidence: 0, status: 'unanchored' };
  }
  if (matches.length === 1) {
    return { start: matches[0], length: ann.quote.length, confidence: 0.8, status: 'anchored' };
  }

  let bestPos = matches[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const pos of matches) {
    const score = scoreCandidate(text, ann.quote, pos, ann);
    if (score > bestScore) {
      bestScore = score;
      bestPos = pos;
    }
  }

  return { start: bestPos, length: ann.quote.length, confidence: 0.6, status: 'anchored' };
}

