import { describe, expect, it } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { getGitCreatedAt } from "../../src/handlers/file-utils";

describe("getGitCreatedAt", () => {
  it("仓库内已提交文件返回首次提交时间（毫秒）", async () => {
    const ts = await getGitCreatedAt(resolve("src/cli.ts"));
    expect(typeof ts).toBe("number");
    expect(ts!).toBeGreaterThan(0);
  });

  it("非仓库文件返回 undefined，且不抛异常", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mdv-gitcreated-"));
    try {
      const file = join(dir, "x.md");
      writeFileSync(file, "# x\n");
      expect(await getGitCreatedAt(file)).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("同一路径的结果被缓存（第二次调用不再依赖磁盘）", async () => {
    const path = resolve("src/client/annotation.ts");
    const first = await getGitCreatedAt(path);
    const started = performance.now();
    const second = await getGitCreatedAt(path);
    expect(second).toBe(first);
    expect(performance.now() - started).toBeLessThan(20);
  });
});
