import { Translator } from "./translator.ts";
import { log } from "../utils.ts";

let instance: Translator | null = null;
export let translatorReady: boolean | null = null; // null=loading, true=ready, false=failed

export async function initTranslator(modelDir: string): Promise<void> {
  if (instance) return;
  try {
    log("[translate] 加载 ONNX 模型...");
    instance = await Translator.load(modelDir);
    translatorReady = true;
    log("[translate] 模型加载完成");
  } catch (e) {
    translatorReady = false;
    log(`[translate] 模型加载失败: ${e}`);
    throw e;
  }
}

export async function translate(text: string): Promise<string> {
  if (!instance) throw new Error("translator not initialized");
  return instance.translate(text);
}
