import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

type SyncStorageModule = typeof import("../../src/sync-storage.ts");

let mod: SyncStorageModule;
let tempConfigHome = "";
let oldConfigHome: string | undefined;
let configDir = "";

beforeAll(async () => {
  oldConfigHome = process.env.XDG_CONFIG_HOME;
  tempConfigHome = mkdtempSync(join(tmpdir(), "mdv-sync-db-"));
  process.env.XDG_CONFIG_HOME = tempConfigHome;
  configDir = join(tempConfigHome, "md-viewer");
  mkdirSync(configDir, { recursive: true });

  const now = Date.now();
  writeFileSync(
    join(configDir, "sync-records.json"),
    JSON.stringify(
      {
        recentParents: [
          {
            id: "legacy-parent",
            title: "Legacy Parent",
            url: "https://km.example/legacy-parent",
            lastUsed: now - 1000,
            useCount: 3,
          },
        ],
        syncedFiles: {
          "/tmp/legacy.md": {
            kmDocId: "doc-legacy",
            kmUrl: "https://km.example/doc-legacy",
            kmTitle: "Legacy Title-v3",
            baseTitle: "Legacy Title",
            version: 3,
            parentId: "legacy-parent",
            lastSyncTime: now - 2000,
            command: "km-cli create ...",
          },
        },
        syncedHistory: {
          "/tmp/legacy.md": [
            {
              version: 3,
              kmDocId: "doc-legacy",
              kmUrl: "https://km.example/doc-legacy",
              kmTitle: "Legacy Title-v3",
              parentId: "legacy-parent",
              status: "success",
              syncedAt: now - 2000,
              command: "km-cli create ...",
            },
          ],
        },
        defaultParentId: "legacy-parent",
        preferences: {
          openAfterSync: true,
        },
      },
      null,
      2
    ),
    "utf-8"
  );

  mod = await import(`../../src/sync-storage.ts?t=${Date.now()}`);
});

afterAll(() => {
  if (oldConfigHome === undefined) {
    delete process.env.XDG_CONFIG_HOME;
  } else {
    process.env.XDG_CONFIG_HOME = oldConfigHome;
  }
  if (tempConfigHome) {
    rmSync(tempConfigHome, { recursive: true, force: true });
  }
});

describe("sync-storage", () => {
  it("migrates legacy sync-records.json to sqlite and keeps data readable", () => {
    const parents = mod.getRecentParents();
    expect(parents.length).toBe(1);
    expect(parents[0].id).toBe("legacy-parent");

    const info = mod.getSyncedFile("/tmp/legacy.md");
    expect(info).not.toBeNull();
    expect(info?.kmDocId).toBe("doc-legacy");
    expect(info?.version).toBe(3);

    const history = mod.getSyncHistory("/tmp/legacy.md");
    expect(history.length).toBe(1);
    expect(history[0].version).toBe(3);

    expect(mod.getDefaultParentId()).toBe("legacy-parent");
    expect(mod.getSyncPreferences().openAfterSync).toBe(true);
    expect(existsSync(join(configDir, "sync-records.migrated.json"))).toBe(true);
  });

  it("keeps only the latest N history entries", () => {
    for (let i = 1; i <= 25; i++) {
      mod.appendSyncHistory("/tmp/trim.md", {
        version: i,
        kmDocId: `doc-${i}`,
        kmUrl: `https://km.example/doc-${i}`,
        kmTitle: `Trim-v${i}`,
        parentId: "legacy-parent",
        status: "success",
        syncedAt: i,
      });
    }

    const history = mod.getSyncHistory("/tmp/trim.md");
    expect(history.length).toBe(20);
    expect(history[0].version).toBe(25);
    expect(history[history.length - 1].version).toBe(6);
  });

  it("cleans up expired sync files and related history", () => {
    const now = Date.now();
    const oldTs = now - 190 * 24 * 60 * 60 * 1000;

    mod.saveSyncedFile("/tmp/fresh.md", {
      kmDocId: "doc-fresh",
      kmUrl: "https://km.example/fresh",
      kmTitle: "Fresh",
      baseTitle: "Fresh",
      version: 1,
      parentId: "legacy-parent",
      lastSyncTime: now,
    });
    mod.saveSyncedFile("/tmp/expired.md", {
      kmDocId: "doc-expired",
      kmUrl: "https://km.example/expired",
      kmTitle: "Expired",
      baseTitle: "Expired",
      version: 1,
      parentId: "legacy-parent",
      lastSyncTime: oldTs,
    });
    mod.appendSyncHistory("/tmp/expired.md", {
      version: 1,
      kmDocId: "doc-expired",
      kmUrl: "https://km.example/expired",
      kmTitle: "Expired",
      parentId: "legacy-parent",
      status: "success",
      syncedAt: oldTs,
    });

    const cleaned = mod.cleanupAllExpiredRecords();
    expect(cleaned).toBe(1);
    expect(mod.getSyncedFile("/tmp/expired.md")).toBeNull();
    expect(mod.getSyncHistory("/tmp/expired.md").length).toBe(0);
    expect(mod.getSyncedFile("/tmp/fresh.md")).not.toBeNull();
  });
});
