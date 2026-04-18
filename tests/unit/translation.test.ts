import { describe, it, expect } from "bun:test";
import { MarianTokenizer } from "../../src/translation/tokenizer.ts";
import { translate, initTranslator } from "../../src/translation/index.ts";

const MODEL_DIR = "models/opus-mt-en-zh/Xenova/opus-mt-en-zh";

describe("MarianTokenizer", () => {
  it("encodes and decodes round-trip", async () => {
    const tok = await MarianTokenizer.load(MODEL_DIR);
    const ids = tok.encode("Hello world");
    expect(ids.length).toBeGreaterThan(0);
    const decoded = tok.decode(ids);
    expect(typeof decoded).toBe("string");
    expect(decoded.length).toBeGreaterThan(0);
  });
});

describe("translate()", () => {
  it("translates English to Chinese", async () => {
    await initTranslator(MODEL_DIR);
    const result = await translate("Hello world");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles empty string gracefully", async () => {
    await initTranslator(MODEL_DIR);
    await expect(translate("")).rejects.toThrow("empty text");
  });
});
