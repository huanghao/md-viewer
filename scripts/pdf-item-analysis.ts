#!/usr/bin/env bun
/**
 * PDF TextItem 结构分析脚本
 *
 * 用法：
 *   bun run scripts/pdf-item-analysis.ts
 *
 * 输出到 docs/research/pdf-textitem-results/
 *   all-items.csv       每个 item 一行，pandas 可直接读取
 *   summary.json        所有文件的汇总统计
 *   {name}-stats.json   每个 PDF 的详细统计
 */

import { resolve, basename } from "path";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";

// ── 语料路径 ──────────────────────────────────────────────
const INBOX = "/Users/huanghao/workspace/walle/bots-tmp/0408-llm-wiki/raw/inbox";
const PDF_PATHS = [
  `${INBOX}/deepseek-r1-2501.12948.pdf`,
  `${INBOX}/deepseek-v2-2405.04434.pdf`,
  `${INBOX}/deepseek-v3-2412.19437.pdf`,
  `${INBOX}/gemini-1.5-2403.05530.pdf`,
  `${INBOX}/humanitys-last-exam-2501.14249.pdf`,
  `${INBOX}/limo-less-is-more-for-reasoning-2502.03387.pdf`,
  `${INBOX}/llama-3-herd-2407.21783.pdf`,
  `${INBOX}/osworld-2404.07972.pdf`,
  `${INBOX}/quiet-star-2403.09629.pdf`,
  `${INBOX}/rm-r1-2505.02387.pdf`,
  `${INBOX}/ruler-2404.06654.pdf`,
  `${INBOX}/s1-simple-test-time-scaling-2501.19393.pdf`,
  `${INBOX}/self-rewarding-language-models-2401.10020.pdf`,
  `${INBOX}/swe-lancer-2502.12115.pdf`,
  `${INBOX}/tulu-3-2411.15124.pdf`,
];

const PAGES_PER_PDF = 5;  // 每个 PDF 分析前 N 页
const OUT_DIR = resolve("docs/research/pdf-textitem-results");

// ── 类型 ─────────────────────────────────────────────────
interface RawItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  dir?: string;
  fontName?: string;
}

interface ItemRow {
  file: string;
  page: number;
  item_idx: number;
  str: string;
  str_len: number;
  has_space: 0 | 1;
  is_empty: 0 | 1;
  height: number;
  transform_3: number;   // Math.abs(transform[3])
  font_h: number;        // 三级 fallback 后的值
  font_h_source: string; // 'height' | 'transform3' | 'fallback12'
  width: number;
  x: number;             // transform[4]，PDF 坐标
  y: number;             // transform[5]，PDF 坐标
  screen_y: number;      // pageHeight - y，屏幕坐标
  delta_y_norm: number;  // 与前一个 item 的 deltaY / lineHeight，-1 表示第一个
}

interface PageStats {
  pageNum: number;
  totalItems: number;
  // A 组：fontH fallback
  heightZeroCount: number;
  transform3ZeroCount: number;
  fallback12Count: number;
  fontHDistribution: Record<string, number>;
  // B 组：str 粒度
  emptyStrCount: number;
  singleCharCount: number;
  spaceInStrCount: number;
  strLenBuckets: { "1": number; "2-5": number; "6-15": number; "16+": number };
  // C 组：deltaY 分布
  deltaNormBuckets: {
    sameRow: number;      // < 0.05
    interLine: number;    // 0.05 ~ 1.5
    interBlock: number;   // 1.5 ~ 3.0
    crossRegion: number;  // > 3.0
  };
  // D 组：字号层次
  uniqueHeights: number[];
  dominantHeight: number;
}

interface FileStats {
  file: string;
  path: string;
  sizeBytes: number;
  totalPages: number;
  analyzedPages: number;
  runAt: string;
  pages: PageStats[];
  aggregate: {
    totalItems: number;
    avgItemsPerPage: number;
    heightZeroRatio: number;
    transform3ZeroRatio: number;
    fallback12Ratio: number;
    singleCharRatio: number;
    emptyStrRatio: number;
    spaceInStrRatio: number;
    deltaNormBuckets: PageStats["deltaNormBuckets"];
    uniqueHeightCount: number;
    dominantHeight: number;
  };
}

// ── fontH 计算 ────────────────────────────────────────────
function calcFontH(item: RawItem): { fontH: number; source: string } {
  if (item.height) return { fontH: item.height, source: "height" };
  const t3 = Math.abs(item.transform[3]);
  if (t3) return { fontH: t3, source: "transform3" };
  return { fontH: 12, source: "fallback12" };
}

// ── 分析单页 ─────────────────────────────────────────────
function analyzePage(
  pageNum: number,
  items: RawItem[],
  pageHeight: number,
  rows: ItemRow[],
  fileName: string
): PageStats {
  const stats: PageStats = {
    pageNum,
    totalItems: items.length,
    heightZeroCount: 0,
    transform3ZeroCount: 0,
    fallback12Count: 0,
    fontHDistribution: {},
    emptyStrCount: 0,
    singleCharCount: 0,
    spaceInStrCount: 0,
    strLenBuckets: { "1": 0, "2-5": 0, "6-15": 0, "16+": 0 },
    deltaNormBuckets: { sameRow: 0, interLine: 0, interBlock: 0, crossRegion: 0 },
    uniqueHeights: [],
    dominantHeight: 0,
  };

  // 按 Y 排序（屏幕坐标，Y 越小越靠上）
  const sorted = [...items].map((it, i) => ({ it, origIdx: i })).sort((a, b) => {
    const ay = pageHeight - a.it.transform[5];
    const by = pageHeight - b.it.transform[5];
    return ay - by || a.it.transform[4] - b.it.transform[4];
  });

  const heightFreq: Record<number, number> = {};
  let prevScreenY = -1;
  let prevFontH = 12;

  for (let si = 0; si < sorted.length; si++) {
    const { it, origIdx } = sorted[si];
    const { fontH, source } = calcFontH(it);
    const screenY = pageHeight - it.transform[5];

    // A 组
    if (!it.height) {
      stats.heightZeroCount++;
      if (!Math.abs(it.transform[3])) stats.transform3ZeroCount++;
    }
    if (source === "fallback12") stats.fallback12Count++;
    const fhKey = String(Math.round(fontH));
    stats.fontHDistribution[fhKey] = (stats.fontHDistribution[fhKey] || 0) + 1;
    heightFreq[Math.round(fontH)] = (heightFreq[Math.round(fontH)] || 0) + 1;

    // B 组
    const trimmed = it.str.trim();
    if (!trimmed) stats.emptyStrCount++;
    if (it.str.length === 1) stats.singleCharCount++;
    if (it.str.includes(" ")) stats.spaceInStrCount++;
    const len = it.str.length;
    if (len <= 1) stats.strLenBuckets["1"]++;
    else if (len <= 5) stats.strLenBuckets["2-5"]++;
    else if (len <= 15) stats.strLenBuckets["6-15"]++;
    else stats.strLenBuckets["16+"]++;

    // C 组：deltaY 归一化
    let deltaNorm = -1;
    if (prevScreenY >= 0) {
      const deltaY = Math.abs(screenY - prevScreenY);
      const lh = prevFontH || 12;
      deltaNorm = deltaY / lh;
      if (deltaNorm < 0.05) stats.deltaNormBuckets.sameRow++;
      else if (deltaNorm < 1.5) stats.deltaNormBuckets.interLine++;
      else if (deltaNorm < 3.0) stats.deltaNormBuckets.interBlock++;
      else stats.deltaNormBuckets.crossRegion++;
    }

    prevScreenY = screenY;
    prevFontH = fontH;

    // CSV 行
    rows.push({
      file: fileName,
      page: pageNum,
      item_idx: origIdx,
      str: it.str,
      str_len: it.str.length,
      has_space: it.str.includes(" ") ? 1 : 0,
      is_empty: trimmed ? 0 : 1,
      height: it.height,
      transform_3: Math.abs(it.transform[3]),
      font_h: fontH,
      font_h_source: source,
      width: it.width,
      x: it.transform[4],
      y: it.transform[5],
      screen_y: screenY,
      delta_y_norm: deltaNorm,
    });
  }

  // D 组：字号层次
  const heights = Object.keys(heightFreq).map(Number).sort((a, b) => a - b);
  stats.uniqueHeights = heights;
  stats.dominantHeight = heights.reduce((best, h) =>
    (heightFreq[h] > (heightFreq[best] || 0) ? h : best), heights[0] ?? 0);

  return stats;
}

// ── 汇总统计 ─────────────────────────────────────────────
function aggregate(pages: PageStats[], totalItems: number): FileStats["aggregate"] {
  const sum = (fn: (p: PageStats) => number) => pages.reduce((s, p) => s + fn(p), 0);
  const buckets = { sameRow: 0, interLine: 0, interBlock: 0, crossRegion: 0 };
  for (const p of pages) {
    buckets.sameRow += p.deltaNormBuckets.sameRow;
    buckets.interLine += p.deltaNormBuckets.interLine;
    buckets.interBlock += p.deltaNormBuckets.interBlock;
    buckets.crossRegion += p.deltaNormBuckets.crossRegion;
  }
  const allHeights = new Set(pages.flatMap(p => p.uniqueHeights));
  const dominantCounts: Record<number, number> = {};
  for (const p of pages) dominantCounts[p.dominantHeight] = (dominantCounts[p.dominantHeight] || 0) + 1;
  const dominantHeight = Object.entries(dominantCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ?? 0;

  return {
    totalItems,
    avgItemsPerPage: totalItems / pages.length,
    heightZeroRatio: sum(p => p.heightZeroCount) / totalItems,
    transform3ZeroRatio: sum(p => p.transform3ZeroCount) / totalItems,
    fallback12Ratio: sum(p => p.fallback12Count) / totalItems,
    singleCharRatio: sum(p => p.singleCharCount) / totalItems,
    emptyStrRatio: sum(p => p.emptyStrCount) / totalItems,
    spaceInStrRatio: sum(p => p.spaceInStrCount) / totalItems,
    deltaNormBuckets: buckets,
    uniqueHeightCount: allHeights.size,
    dominantHeight: Number(dominantHeight),
  };
}

// ── 主流程 ────────────────────────────────────────────────
async function main() {
  // 加载 pdfjs
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs" as any);
  const workerPath = resolve("node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

  await mkdir(OUT_DIR, { recursive: true });

  const allRows: ItemRow[] = [];
  const allFileStats: FileStats[] = [];

  for (const pdfPath of PDF_PATHS) {
    if (!existsSync(pdfPath)) {
      console.log(`  跳过（不存在）: ${pdfPath}`);
      continue;
    }

    const fileName = basename(pdfPath, ".pdf");
    const sizeBytes = (await Bun.file(pdfPath).size);
    console.log(`\n▶ ${fileName} (${(sizeBytes / 1024 / 1024).toFixed(1)} MB)`);

    let pdfDoc: any;
    try {
      pdfDoc = await pdfjsLib.getDocument({ url: pdfPath, verbosity: 0 }).promise;
    } catch (e) {
      console.log(`  加载失败: ${e}`);
      continue;
    }

    const totalPages = pdfDoc.numPages;
    const analyzedPages = Math.min(PAGES_PER_PDF, totalPages);
    const pageStats: PageStats[] = [];
    const fileRows: ItemRow[] = [];

    for (let p = 1; p <= analyzedPages; p++) {
      const page = await pdfDoc.getPage(p);
      const vp = page.getViewport({ scale: 1.5 });
      const pageHeight = vp.height / 1.5;  // PDF 坐标系高度
      const tc = await page.getTextContent();
      const items = tc.items as RawItem[];

      const ps = analyzePage(p, items, pageHeight, fileRows, fileName);
      pageStats.push(ps);
      console.log(`  页 ${p}: ${items.length} items，fontH=0: ${ps.heightZeroCount}，单字符: ${ps.singleCharCount}`);
    }

    const totalItems = fileRows.length;
    const fileStats: FileStats = {
      file: fileName,
      path: pdfPath,
      sizeBytes,
      totalPages,
      analyzedPages,
      runAt: new Date().toISOString(),
      pages: pageStats,
      aggregate: aggregate(pageStats, totalItems),
    };

    allFileStats.push(fileStats);
    allRows.push(...fileRows);

    // 写单文件统计
    await writeFile(
      `${OUT_DIR}/${fileName}-stats.json`,
      JSON.stringify(fileStats, null, 2)
    );
  }

  // 写 CSV
  const csvHeader = [
    "file", "page", "item_idx", "str", "str_len", "has_space", "is_empty",
    "height", "transform_3", "font_h", "font_h_source", "width",
    "x", "y", "screen_y", "delta_y_norm",
  ].join(",");

  const csvRows = allRows.map(r => [
    JSON.stringify(r.file),
    r.page,
    r.item_idx,
    JSON.stringify(r.str),
    r.str_len,
    r.has_space,
    r.is_empty,
    r.height,
    r.transform_3.toFixed(3),
    r.font_h.toFixed(3),
    r.font_h_source,
    r.width.toFixed(3),
    r.x.toFixed(3),
    r.y.toFixed(3),
    r.screen_y.toFixed(3),
    r.delta_y_norm.toFixed(4),
  ].join(","));

  await writeFile(`${OUT_DIR}/all-items.csv`, [csvHeader, ...csvRows].join("\n"));

  // 写汇总
  await writeFile(
    `${OUT_DIR}/summary.json`,
    JSON.stringify(allFileStats.map(f => ({ file: f.file, aggregate: f.aggregate })), null, 2)
  );

  console.log(`\n✅ 完成`);
  console.log(`   ${allRows.length} 个 item`);
  console.log(`   输出目录: ${OUT_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
