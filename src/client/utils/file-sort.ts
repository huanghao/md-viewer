type SegKind = 0 | 1 | 2; // 0=number, 1=ascii, 2=other(CJK etc.)

function segKind(s: string): SegKind {
  if (/^\d+$/.test(s)) return 0;
  if (/^[\x00-\x7F]+$/.test(s)) return 1;
  return 2;
}

const EXT_GROUP: Record<string, number> = {
  md: 0, mdx: 0, markdown: 0,
  pdf: 1,
  html: 2, htm: 2,
  json: 3, jsonl: 3,
};

function extGroup(name: string): number {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return 4;
  const ext = name.slice(dot + 1).toLowerCase();
  return EXT_GROUP[ext] ?? 4;
}

/** Natural sort for file names: group by extension first, then numbers numerically, ASCII before CJK, case-insensitive. */
export function compareFileNames(a: string, b: string): number {
  const ga = extGroup(a), gb = extGroup(b);
  if (ga !== gb) return ga - gb;
  if (ga === 4) {
    const dotA = a.lastIndexOf('.');
    const dotB = b.lastIndexOf('.');
    const extA = dotA < 0 ? '' : a.slice(dotA + 1).toLowerCase();
    const extB = dotB < 0 ? '' : b.slice(dotB + 1).toLowerCase();
    if (extA !== extB) return extA.localeCompare(extB);
  }
  const re = /(\d+)|(\D+)/g;
  const segsA = a.match(re) ?? [];
  const segsB = b.match(re) ?? [];
  const len = Math.max(segsA.length, segsB.length);
  for (let i = 0; i < len; i++) {
    if (i >= segsA.length) return -1;
    if (i >= segsB.length) return 1;
    const sa = segsA[i], sb = segsB[i];
    const ka = segKind(sa), kb = segKind(sb);
    if (ka !== kb) return ka - kb;
    if (ka === 0) {
      const diff = Number(sa) - Number(sb);
      if (diff !== 0) return diff;
      continue;
    }
    const cmp = sa.toLowerCase().localeCompare(sb.toLowerCase(), 'zh-CN', { sensitivity: 'base' });
    if (cmp !== 0) return cmp;
  }
  return 0;
}
