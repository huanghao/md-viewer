#!/usr/bin/env bun
/**
 * PDF 段落质量分析 — 命令行版
 *   bun run scripts/pdf-para-lab/analyze.ts [pdf路径或目录]
 */

import { readdir } from "fs/promises";
import { resolve, basename } from "path";

const DEFAULT_DIR = "/Users/huanghao/workspace/walle/bots-tmp/0408-llm-wiki/raw/inbox";
const SCALE = 1.5;
const LH_MULT = 1.5;

// ── PDF.js (bun 环境用 node 兼容包) ──────────────────────────────────────
const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs").catch(() => null)
  || await import("pdfjs-dist").catch(() => null);

if (!pdfjsLib) {
  console.error("需要安装 pdfjs-dist: bun add pdfjs-dist");
  process.exit(1);
}

// ── 段落拆分（与前端 index.html 完全一致）────────────────────────────────

function buildBlocks(pageNum: number, items: any[], viewport: any) {
  const pageH = viewport.height / SCALE;
  const pageW = viewport.width / SCALE;

  const pts = items
    .filter((it: any) => it.str.trim())
    .map((it: any) => ({
      ...it,
      sx: it.transform[4],
      sy: pageH - it.transform[5],
      fontH: it.height || Math.abs(it.transform[3]) || 12,
    }));

  if (!pts.length) return [];

  // 双栏检测
  const margin = pageW * 0.08;
  const mid = pageW / 2;
  const left  = pts.filter((p: any) => p.sx > margin && p.sx < mid - margin * 0.3).length;
  const right = pts.filter((p: any) => p.sx > mid + margin * 0.3 && p.sx < pageW - margin).length;
  const ratio = Math.min(left, right) / Math.max(left, right || 1);
  const isDual = left > 4 && right > 4 && ratio > 0.25;
  const colSplit = isDual ? mid : null;

  if (colSplit !== null) {
    const L = pts.filter((p: any) => p.sx < colSplit).sort(byYX);
    const R = pts.filter((p: any) => p.sx >= colSplit).sort(byYX);
    return [
      ...splitGroup(pageNum, L, 'left', pageH),
      ...splitGroup(pageNum, R, 'right', pageH),
    ].sort((a: any, b: any) => a.y - b.y);
  }
  return splitGroup(pageNum, pts.sort(byYX), null, pageH);
}

function byYX(a: any, b: any) { return a.sy - b.sy || a.sx - b.sx; }

function splitGroup(pageNum: number, pts: any[], col: string | null, pageH: number) {
  if (!pts.length) return [];
  const blocks: any[] = [];
  let cur = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const gap = Math.abs(pts[i].sy - pts[i-1].sy);
    const lineH = pts[i-1].fontH || 12;
    if (gap < lineH * LH_MULT) cur.push(pts[i]);
    else { blocks.push(makeBlock(pageNum, cur, col, pageH)); cur = [pts[i]]; }
  }
  blocks.push(makeBlock(pageNum, cur, col, pageH));
  return blocks;
}

function makeBlock(pageNum: number, pts: any[], col: string | null, pageH: number) {
  const x  = Math.min(...pts.map((p: any) => p.sx));
  const y  = Math.min(...pts.map((p: any) => p.sy));
  const x2 = Math.max(...pts.map((p: any) => p.sx + Math.abs(p.width)));
  const y2 = Math.max(...pts.map((p: any) => p.sy + p.fontH));
  const maxFontH = Math.max(...pts.map((p: any) => p.fontH));
  const text = pts.map((p: any) => p.str).join(' ').replace(/\s+/g, ' ').trim();
  // 是否在页面顶部或底部边距区域（前/后 6%）
  const inMargin = y < pageH * 0.06 || y2 > pageH * 0.94;
  return { pageNum, text, x, y, w: x2-x, h: y2-y, maxFontH, col, nItems: pts.length, pageH, inMargin };
}

function classify(blocks: any[]) {
  if (!blocks.length) return blocks;
  const hs = blocks.map((b: any) => b.maxFontH).filter((h: number) => h > 0).sort((a: number, b: number) => a - b);
  const median = hs[Math.floor(hs.length / 2)] || 12;
  return blocks.map((b: any) => {
    const r = b.maxFontH / median;
    let type = 'body';
    if (r < 0.88) type = 'caption';
    else if (r > 1.1 && b.text.length < 150) type = 'heading';
    let warn = '', warnReason = '';
    // 文字过少：单个 item 且文字 < 8 字符，或多个 item 但总文字 < 4
    const tooShort = (b.nItems === 1 && b.text.length < 8) || b.text.length < 4;
    // 页码：在页边距区域 + 文字是纯数字/极短
    const isPageNum = b.inMargin && /^[\d\s\.\-–]+$/.test(b.text) && b.text.length < 10;
    if (isPageNum)           { warn = '⚠'; warnReason = '页码/页眉'; }
    else if (tooShort)       { warn = '⚠'; warnReason = `文字过少(${b.text.length})`; }
    else if (b.nItems > 60)  { warn = '⚠'; warnReason = `表格/item过多(${b.nItems})`; }
    return { ...b, type, warn, warnReason, fontRatio: r };
  });
}

// ── 分析单个 PDF ──────────────────────────────────────────────────────────

async function analyzePdf(pdfPath: string) {
  const name = basename(pdfPath);
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📄 ${name}`);
  console.log('─'.repeat(60));

  const data = await Bun.file(pdfPath).arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const numPages = pdf.numPages;

  let totalBlocks = 0, totalWarn = 0, totalItems = 0, dualPages = 0;
  const typeCount: Record<string, number> = { body: 0, heading: 0, caption: 0 };
  const badcases: any[] = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: SCALE });
    const tc = await page.getTextContent();
    const raw = buildBlocks(p, tc.items as any[], vp);
    const blocks = classify(raw);

    const isDual = blocks.some((b: any) => b.col === 'left') && blocks.some((b: any) => b.col === 'right');
    if (isDual) dualPages++;

    blocks.forEach((b: any) => {
      typeCount[b.type] = (typeCount[b.type] || 0) + 1;
      if (b.warn) {
        totalWarn++;
        if (badcases.length < 10) badcases.push({ page: p, ...b });
      }
    });

    totalBlocks += blocks.length;
    totalItems  += (tc.items as any[]).length;
  }

  const warnPct = totalBlocks ? (totalWarn / totalBlocks * 100).toFixed(1) : '0';

  console.log(`页数: ${numPages}  |  TextItem: ${totalItems}  |  段落: ${totalBlocks}  |  平均段落/页: ${Math.round(totalBlocks/numPages)}`);
  console.log(`双栏页面: ${dualPages}/${numPages}  |  可疑段落: ${totalWarn} (${warnPct}%)`);
  console.log(`类型分布 — 正文: ${typeCount.body}  标题: ${typeCount.heading}  图注/小字: ${typeCount.caption}`);

  if (badcases.length) {
    console.log(`\nBadcase 样本（最多10条）:`);
    badcases.forEach(b => {
      console.log(`  p${b.page} #${b.warnReason}  "${b.text.slice(0, 60).replace(/\n/g,' ')}"`);
    });
  }

  return { name, numPages, totalBlocks, totalItems, totalWarn, warnPct: Number(warnPct), dualPages, typeCount };
}

// ── 主入口 ────────────────────────────────────────────────────────────────

const arg = process.argv[2];
let pdfPaths: string[] = [];

if (arg) {
  const stat = await Bun.file(arg).exists();
  if (stat && arg.endsWith('.pdf')) {
    pdfPaths = [resolve(arg)];
  } else {
    const files = await readdir(arg);
    pdfPaths = files.filter(f => f.toLowerCase().endsWith('.pdf')).map(f => resolve(arg, f));
  }
} else {
  const files = await readdir(DEFAULT_DIR);
  pdfPaths = files.filter(f => f.toLowerCase().endsWith('.pdf')).map(f => resolve(DEFAULT_DIR, f));
}

console.log(`分析 ${pdfPaths.length} 个 PDF 文件...`);

const results = [];
for (const p of pdfPaths) {
  try {
    results.push(await analyzePdf(p));
  } catch (e) {
    console.error(`  ❌ ${basename(p)}: ${e}`);
  }
}

// 汇总
console.log(`\n${'═'.repeat(60)}`);
console.log('汇总');
console.log('═'.repeat(60));
const allBlocks = results.reduce((s, r) => s + r.totalBlocks, 0);
const allWarn   = results.reduce((s, r) => s + r.totalWarn, 0);
const allDual   = results.reduce((s, r) => s + r.dualPages, 0);
const allPages  = results.reduce((s, r) => s + r.numPages, 0);
console.log(`总页数: ${allPages}  总段落: ${allBlocks}  可疑: ${allWarn} (${(allWarn/allBlocks*100).toFixed(1)}%)`);
console.log(`双栏页面: ${allDual}/${allPages} (${(allDual/allPages*100).toFixed(0)}%)`);
console.log(`\n按可疑率排序:`);
results.sort((a, b) => b.warnPct - a.warnPct).forEach(r => {
  console.log(`  ${r.warnPct.toFixed(1).padStart(5)}%  ${r.name}`);
});
