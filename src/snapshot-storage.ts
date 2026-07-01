/**
 * Snapshot Storage – 文件 base 快照持久化
 *
 * 每个文件最多保存一个 base snapshot：agent 首次修改时自动存入，
 * 用户接受后删除。刷新页面后可从快照还原 diff 状态。
 *
 * 存储位置：{getDataDir()}/snapshots/<sha256(path)>
 */

import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import { getDataDir } from "./config.ts";

function getSnapshotDir(): string {
  return join(getDataDir(), "snapshots");
}

function pathToFilename(docPath: string): string {
  return createHash("sha256").update(docPath).digest("hex");
}

function ensureDir(): string {
  const dir = getSnapshotDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export interface Snapshot {
  content: string;
  savedAt: number;
  docPath: string;
}

/** 读取快照。不存在返回 null。 */
export function getSnapshot(docPath: string): Snapshot | null {
  const dir = getSnapshotDir();
  const file = join(dir, pathToFilename(docPath));
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf-8")) as Snapshot;
  } catch {
    return null;
  }
}

/**
 * 保存快照（仅当该文件没有现存快照时才写入）。
 * 返回 true 表示实际写入，false 表示快照已存在，跳过。
 */
export function saveSnapshot(docPath: string, content: string): boolean {
  const dir = ensureDir();
  const file = join(dir, pathToFilename(docPath));
  if (existsSync(file)) return false;           // 已存在，不覆盖
  const snap: Snapshot = { content, savedAt: Date.now(), docPath };
  writeFileSync(file, JSON.stringify(snap), "utf-8");
  return true;
}

/** 删除快照（接受/回滚后调用）。快照不存在时静默返回。 */
export function deleteSnapshot(docPath: string): void {
  const dir = getSnapshotDir();
  const file = join(dir, pathToFilename(docPath));
  if (existsSync(file)) unlinkSync(file);
}

/** 检查快照是否存在。 */
export function snapshotExists(docPath: string): boolean {
  return existsSync(join(getSnapshotDir(), pathToFilename(docPath)));
}
