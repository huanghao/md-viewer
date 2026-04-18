import { pipeline, type TranslationPipeline } from "@huggingface/transformers";

export class Translator {
  private constructor(private pipe: TranslationPipeline) {}

  static async load(modelDir: string): Promise<Translator> {
    const pipe = await pipeline("translation", modelDir, {
      local_files_only: true,
    }) as TranslationPipeline;
    return new Translator(pipe);
  }

  async translate(text: string): Promise<string> {
    if (!text.trim()) throw new Error("empty text");
    const result = await this.pipe(text) as Array<{ translation_text: string }>;
    return result[0].translation_text;
  }
}
