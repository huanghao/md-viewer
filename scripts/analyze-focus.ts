#!/usr/bin/env bun
/**
 * 焦点列表 Frecency 策略分析脚本
 *
 * 用法：bun scripts/analyze-focus.ts [--days 7] [--threshold 2.0] [--window 8h|1d|2d]
 *
 * 读取 logs/focus-signals.jsonl，计算 frecency 分数，
 * 与当前 mtime 时间窗口列表对比，输出结论和调参建议。
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

// ==================== 参数解析 ====================

const args = process.argv.slice(2);
const getArg = (flag: string, fallback: string) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const DAYS = Number(getArg("--days", "7"));
const THRESHOLD = Number(getArg("--threshold", "2.0"));
const WINDOW_KEY = getArg("--window", "8h");

const WINDOW_MS: Record<string, number> = {
  "8h": 8 * 3600 * 1000,
  "1d": 86400 * 1000,
  "2d": 2 * 86400 * 1000,
};
const windowMs = WINDOW_MS[WINDOW_KEY] ?? WINDOW_MS["8h"];

// ==================== Frecency 参数 ====================

const WEIGHTS = { open: 10, annotate: 15, mtime: 1 } as const;
const HALF_LIFE_HOURS = { open: 48, annotate: 48, mtime: 8 } as const;
type SignalType = keyof typeof WEIGHTS;

interface Signal {
  ts: number;
  type: SignalType;
  file: string;
}

// ==================== 读取信号日志 ====================

const SIGNALS_PATH = join(import.meta.dir, "../logs/focus-signals.jsonl");

if (!existsSync(SIGNALS_PATH)) {
  console.error(`❌ 找不到信号日志：${SIGNALS_PATH}`);
  console.error("   请先运行 mdv，等待信号积累后再分析。");
  process.exit(1);
}

const cutoffTs = Date.now() - DAYS * 86400 * 1000;
const allSignals: Signal[] = readFileSync(SIGNALS_PATH, "utf-8")
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    try { return JSON.parse(line) as Signal; } catch { return null; }
  })
  .filter((s): s is Signal => !!s && s.ts >= cutoffTs && !!s.file && !!s.type);

console.log(`\n📊 焦点列表 Frecency 分析`);
console.log(`   信号范围：最近 ${DAYS} 天 | 共 ${allSignals.length} 条信号`);
console.log(`   Frecency 阈值：${THRESHOLD} | mtime 窗口：${WINDOW_KEY}`);
console.log(`   信号文件：${SIGNALS_PATH}\n`);

if (allSignals.length === 0) {
  console.log("⚠️  该时间范围内无信号，请等待更多数据积累。");
  process.exit(0);
}

// ==================== 计算 Frecency 分数 ====================

const signalsByFile = new Map<string, Signal[]>();
for (const s of allSignals) {
  const arr = signalsByFile.get(s.file) ?? [];
  arr.push(s);
  signalsByFile.set(s.file, arr);
}

function computeScore(signals: Signal[]): number {
  const now = Date.now();
  return signals.reduce((sum, s) => {
    const type = s.type in WEIGHTS ? s.type : "mtime" as SignalType;
    const ageHours = (now - s.ts) / 3_600_000;
    const lambda = Math.LN2 / HALF_LIFE_HOURS[type];
    return sum + WEIGHTS[type] * Math.exp(-lambda * ageHours);
  }, 0);
}

interface FileScore {
  file: string;
  score: number;
  openCount: number;
  annotateCount: number;
  mtimeCount: number;
  lastSignalTs: number;
}

const frecencyList: FileScore[] = [];
for (const [file, signals] of signalsByFile) {
  frecencyList.push({
    file,
    score: computeScore(signals),
    openCount: signals.filter((s) => s.type === "open").length,
    annotateCount: signals.filter((s) => s.type === "annotate").length,
    mtimeCount: signals.filter((s) => s.type === "mtime").length,
    lastSignalTs: Math.max(...signals.map((s) => s.ts)),
  });
}
frecencyList.sort((a, b) => b.score - a.score);

const frecencyVisible = frecencyList.filter((f) => f.score >= THRESHOLD);
const frecencyHidden = frecencyList.filter((f) => f.score < THRESHOLD);

// ==================== 构建 mtime 列表 ====================

// mtime 列表：信号里出现过 mtime 信号且最近一次在窗口期内的文件
// 这是对「当前焦点列表」的近似（真实 mtime 来自文件系统，这里用信号里的 mtime 事件时间戳代替）
const mtimeCutoff = Date.now() - windowMs;

const mtimeFiles = new Set<string>();
for (const [file, signals] of signalsByFile) {
  // 文件有任何信号（mtime 或用户交互）且最近信号在窗口期内
  const latestTs = Math.max(...signals.map((s) => s.ts));
  if (latestTs >= mtimeCutoff) mtimeFiles.add(file);
}

// ==================== 对比分析 ====================

const frecencyFileSet = new Set(frecencyVisible.map((f) => f.file));

const onlyInFrecency = frecencyVisible.filter((f) => !mtimeFiles.has(f.file));
const onlyInMtime = [...mtimeFiles].filter((f) => !frecencyFileSet.has(f));
const inBoth = frecencyVisible.filter((f) => mtimeFiles.has(f.file));

// ==================== 输出报告 ====================

function relTime(ts: number): string {
  const h = (Date.now() - ts) / 3_600_000;
  if (h < 1) return `${Math.round(h * 60)}min ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function shortPath(p: string): string {
  return p.replace(/^\/Users\/[^/]+\//, "~/");
}

console.log("─".repeat(70));
console.log(`✅ 两者共有（${inBoth.length} 个文件）`);
for (const f of inBoth.slice(0, 10)) {
  console.log(`   score=${f.score.toFixed(1).padStart(5)}  ${shortPath(f.file)}`);
  console.log(`            打开 ${f.openCount}次  评论 ${f.annotateCount}次  mtime ${f.mtimeCount}次  最近 ${relTime(f.lastSignalTs)}`);
}
if (inBoth.length > 10) console.log(`   ... 还有 ${inBoth.length - 10} 个`);

console.log();
console.log(`🔵 仅 frecency 有（${onlyInFrecency.length} 个）— mtime 窗口漏掉，但用户有关注`);
for (const f of onlyInFrecency) {
  console.log(`   score=${f.score.toFixed(1).padStart(5)}  ${shortPath(f.file)}`);
  console.log(`            打开 ${f.openCount}次  评论 ${f.annotateCount}次  mtime ${f.mtimeCount}次  最近 ${relTime(f.lastSignalTs)}`);
}
if (onlyInFrecency.length === 0) console.log("   （无）");

console.log();
console.log(`⚪ 仅 mtime 有（${onlyInMtime.length} 个）— 疑似噪音，frecency 已过滤`);
for (const p of onlyInMtime.slice(0, 15)) {
  const signals = signalsByFile.get(p) ?? [];
  const userCount = signals.filter((s) => s.type !== "mtime").length;
  const mtimeCount = signals.filter((s) => s.type === "mtime").length;
  console.log(`   ${shortPath(p)}`);
  console.log(`            用户交互 ${userCount}次  仅 mtime ${mtimeCount}次`);
}
if (onlyInMtime.length > 15) console.log(`   ... 还有 ${onlyInMtime.length - 15} 个`);

console.log();
console.log(`🌫️  frecency 低于阈值已衰减（${frecencyHidden.length} 个文件）`);
for (const f of frecencyHidden.slice(0, 5)) {
  console.log(`   score=${f.score.toFixed(2).padStart(5)}  ${shortPath(f.file)}  最近 ${relTime(f.lastSignalTs)}`);
}
if (frecencyHidden.length > 5) console.log(`   ... 还有 ${frecencyHidden.length - 5} 个`);

// ==================== 结论与调参建议 ====================

const noiseFilterRate = mtimeFiles.size > 0
  ? ((onlyInMtime.length / mtimeFiles.size) * 100).toFixed(1)
  : "N/A";
const recallRate = frecencyFileSet.size > 0
  ? ((inBoth.length / frecencyFileSet.size) * 100).toFixed(1)
  : "N/A";

console.log("\n" + "─".repeat(70));
console.log("📈 指标");
console.log(`   mtime 列表大小：${mtimeFiles.size} 个文件`);
console.log(`   frecency 列表大小：${frecencyVisible.length} 个文件（阈值 ${THRESHOLD}）`);
console.log(`   噪音过滤率：${noiseFilterRate}%（mtime 有但 frecency 过滤掉的比例）`);
console.log(`   召回率：${recallRate}%（frecency 中 mtime 也有的比例）`);

// 调参建议
console.log("\n💡 调参建议");

if (onlyInFrecency.length > 0) {
  console.log(`   ⚠️  有 ${onlyInFrecency.length} 个用户关注的文件被 mtime 窗口漏掉`);
  console.log(`      → 建议：这正是 frecency 的价值，可以考虑替换`);
}

if (onlyInMtime.length === 0) {
  console.log(`   ✅ mtime 列表无明显噪音（当前时间窗口较小）`);
} else {
  const agentOnlyCount = onlyInMtime.filter((p) => {
    const signals = signalsByFile.get(p) ?? [];
    return signals.every((s) => s.type === "mtime");
  }).length;
  console.log(`   ⚠️  mtime 列表有 ${onlyInMtime.length} 个疑似噪音文件`);
  console.log(`      其中 ${agentOnlyCount} 个完全没有用户交互（纯 agent 修改）`);
  console.log(`      → 建议：frecency 可有效过滤这些噪音`);
}

// 尝试不同阈值
console.log("\n📐 不同阈值下的列表大小：");
for (const t of [0.5, 1.0, 2.0, 5.0, 10.0]) {
  const count = frecencyList.filter((f) => f.score >= t).length;
  const marker = t === THRESHOLD ? " ← 当前" : "";
  console.log(`   threshold=${t.toFixed(1)}  →  ${count} 个文件${marker}`);
}

const overallOk = onlyInFrecency.length === 0 && onlyInMtime.length <= 2;
console.log("\n" + "─".repeat(70));
if (overallOk) {
  console.log("🟢 结论：当前策略参数合理，列表质量良好");
} else if (onlyInMtime.length > 5) {
  console.log("🟡 结论：mtime 列表噪音较多，frecency 过滤效果明显，建议替换");
} else {
  console.log("🟡 结论：策略基本合理，继续积累数据后再评估");
}
console.log();
