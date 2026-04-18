import { AutoTokenizer } from "@huggingface/transformers";

type HFTokenizer = Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>;

export class MarianTokenizer {
  private constructor(private inner: HFTokenizer) {}

  static async load(modelDir: string): Promise<MarianTokenizer> {
    const tok = await AutoTokenizer.from_pretrained(modelDir, {
      local_files_only: true,
    });
    return new MarianTokenizer(tok);
  }

  encode(text: string): bigint[] {
    const result = (this.inner as any)(text, { return_tensors: false });
    // input_ids is a Tensor with shape [1, seqLen]; tolist() returns [[...]]
    return result.input_ids.tolist()[0] as bigint[];
  }

  decode(ids: bigint[]): string {
    return (this.inner as any).decode(ids, { skip_special_tokens: true }) as string;
  }
}
