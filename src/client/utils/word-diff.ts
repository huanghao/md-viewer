// 段落内的词级 diff：找出新文本相对旧文本“新增/修改”的字符区间。
// 中文按字切、英文数字按词切、标点和空白各自成 token；删除的内容不在新文本里，不返回。

const TOKEN_RE = /[A-Za-z0-9_]+|[㐀-鿿]|\s+|[^\sA-Za-z0-9_㐀-鿿]/g;
/** 太不相似就放弃，退回整段标记（避免整段都被拆成零碎高亮） */
const MIN_SIMILARITY = 0.45;
/** 变化片段之间夹着的“相同”内容不足这么多个有效 token 时并入变化，避免高亮过碎 */
const MIN_EQUAL_RUN = 3;
const MAX_CELLS = 4_000_000;

interface Token { text: string; start: number; end: number; space: boolean }

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    out.push({ text: m[0], start: m.index!, end: m.index! + m[0].length, space: /^\s+$/.test(m[0]) });
  }
  return out;
}

/** 新文本里每个 token 是否出现在 LCS 中（即未变）；返回 null 表示规模过大。 */
function lcsMatched(a: Token[], b: Token[]): { matched: boolean[]; length: number } | null {
  const n = a.length, m = b.length;
  if (n * m > MAX_CELLS) return null;
  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] = a[i].text === b[j].text
        ? dp[(i + 1) * w + j + 1] + 1
        : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    }
  }
  const matched = new Array<boolean>(m).fill(false);
  let i = 0, j = 0, length = 0;
  while (i < n && j < m) {
    if (a[i].text === b[j].text) { matched[j] = true; length++; i++; j++; }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++;
    else j++;
  }
  return { matched, length };
}

/** 从候选旧文本里挑出和 newText 最像的（按 token 多重集重合度粗筛）。 */
export function pickBestOld(newText: string, olds: string[]): string | null {
  const newToks = tokenize(newText).filter(t => !t.space).map(t => t.text);
  if (newToks.length === 0) return null;
  let best: string | null = null;
  let bestScore = 0;
  for (const old of olds) {
    const pool = new Map<string, number>();
    const oldToks = tokenize(old).filter(t => !t.space);
    for (const t of oldToks) pool.set(t.text, (pool.get(t.text) ?? 0) + 1);
    let hit = 0;
    for (const t of newToks) {
      const c = pool.get(t) ?? 0;
      if (c > 0) { pool.set(t, c - 1); hit++; }
    }
    const score = hit / Math.max(newToks.length, oldToks.length);
    if (score > bestScore) { bestScore = score; best = old; }
  }
  return bestScore >= MIN_SIMILARITY ? best : null;
}

/** newText 相对 oldText 的变化字符区间 [start, end)；太不相似或规模过大返回 null，无变化返回 []。 */
export function wordDiffRanges(oldText: string, newText: string): Array<[number, number]> | null {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const real = (ts: Token[]) => ts.filter(t => !t.space).length;
  if (real(b) === 0) return null;
  const r = lcsMatched(a, b);
  if (!r) return null;
  const matchedReal = b.reduce((n, t, k) => n + (r.matched[k] && !t.space ? 1 : 0), 0);
  if (matchedReal / Math.max(real(a), real(b)) < MIN_SIMILARITY) return null;

  // 先把相同的短片段并入变化（夹在两个变化之间、有效 token 少于阈值）
  const changed = b.map((_, k) => !r.matched[k]);
  let k = 0;
  while (k < b.length) {
    if (changed[k]) { k++; continue; }
    let e = k, realCount = 0;
    while (e < b.length && !changed[e]) { if (!b[e].space) realCount++; e++; }
    if (k > 0 && e < b.length && realCount < MIN_EQUAL_RUN) {
      for (let x = k; x < e; x++) changed[x] = true;
    }
    k = e;
  }

  const ranges: Array<[number, number]> = [];
  for (let x = 0; x < b.length; x++) {
    if (!changed[x]) continue;
    let y = x;
    while (y + 1 < b.length && changed[y + 1]) y++;
    // 区间两端的空白不高亮
    let s = x, e = y;
    while (s <= e && b[s].space) s++;
    while (e >= s && b[e].space) e--;
    if (s <= e) ranges.push([b[s].start, b[e].end]);
    x = y;
  }
  return ranges;
}
