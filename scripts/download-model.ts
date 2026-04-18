#!/usr/bin/env bun
/**
 * 下载 Helsinki-NLP/opus-mt-en-zh 并导出为 ONNX 格式
 * 运行一次即可，产物提交到 git 或放 CI 缓存
 */
import { pipeline } from "@huggingface/transformers";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

const OUT_DIR = "models/opus-mt-en-zh";

async function main() {
  if (existsSync(`${OUT_DIR}/onnx/model.onnx`)) {
    console.log("模型已存在，跳过下载");
    return;
  }
  await mkdir(OUT_DIR, { recursive: true });
  console.log("下载并导出 ONNX 模型（约 300MB，首次需要几分钟）...");
  const translator = await pipeline(
    "translation",
    "Xenova/opus-mt-en-zh",
    { cache_dir: OUT_DIR }
  );
  const result = await translator("Hello world") as Array<{ translation_text: string }>;
  console.log("测试翻译:", result[0].translation_text);
  console.log(`✅ 模型已保存到 ${OUT_DIR}/`);
}

main().catch(console.error);
