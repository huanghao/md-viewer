# Translation ONNX Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Bun + ONNX Runtime 替换 Python 翻译子进程，使翻译服务内嵌在 `mdv-server` 中，app bundle 和普通 HTTP 模式均可自包含运行。

**Architecture:** 新增 `src/translation/` 模块，包含 tokenizer（MarianMT SentencePiece）和 ONNX 推理两个文件。`server.ts` 删除子进程逻辑，`/api/translate` 直接调用模块内的 `translate()` 函数。模型文件放在 `models/opus-mt-en-zh/`，构建脚本将其复制到产物目录。

**Tech Stack:** Bun, onnxruntime-node ^1.24.3, @huggingface/transformers (tokenizer only), opus-mt-en-zh ONNX 模型

---

## 文件结构

| 操作 | 路径 | 说明 |
|------|------|------|
| 新建 | `src/translation/tokenizer.ts` | MarianMT tokenizer 封装（加载 tokenizer.json + source.spm） |
| 新建 | `src/translation/translator.ts` | ONNX 推理，暴露 `translate(text: string): Promise<string>` |
| 新建 | `src/translation/index.ts` | 重导出 + 模块级初始化状态 |
| 新建 | `scripts/download-model.ts` | 一次性脚本：下载并转换模型到 `models/opus-mt-en-zh/` |
| 修改 | `src/server.ts` | 删除子进程逻辑，`/api/translate` 改为调用模块 |
| 修改 | `scripts/build-server-for-xcode.sh` | 构建时复制 `models/` 到产物旁 |
| 删除 | `src/translate_server.py` | Python 服务不再需要 |
| 新建 | `tests/unit/translation.test.ts` | 翻译模块单元测试 |

---

## Task 1: 下载并转换 opus-mt-en-zh 模型到 ONNX 格式

**Files:**
- Create: `scripts/download-model.ts`
- Create: `models/opus-mt-en-zh/` (目录，含模型文件)

- [ ] **Step 1: 安装转换依赖**

```bash
bun add -d @huggingface/transformers
```

- [ ] **Step 2: 编写下载脚本**

创建 `scripts/download-model.ts`：

```typescript
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
  if (existsSync(`${OUT_DIR}/model.onnx`)) {
    console.log("模型已存在，跳过下载");
    return;
  }
  await mkdir(OUT_DIR, { recursive: true });
  console.log("下载并导出 ONNX 模型（约 300MB，首次需要几分钟）...");
  // @huggingface/transformers 会自动下载 ONNX 格式
  const translator = await pipeline(
    "translation",
    "Xenova/opus-mt-en-zh",  // Xenova 是 HF 上的 ONNX 镜像
    { cache_dir: OUT_DIR }
  );
  // 触发一次推理以确认模型可用
  const result = await translator("Hello world") as Array<{ translation_text: string }>;
  console.log("测试翻译:", result[0].translation_text);
  console.log(`✅ 模型已保存到 ${OUT_DIR}/`);
}

main().catch(console.error);
```

- [ ] **Step 3: 运行脚本下载模型**

```bash
bun scripts/download-model.ts
```

预期输出：
```
下载并导出 ONNX 模型（约 300MB，首次需要几分钟）...
测试翻译: 你好，世界
✅ 模型已保存到 models/opus-mt-en-zh/
```

- [ ] **Step 4: 确认模型文件存在**

```bash
ls -lh models/opus-mt-en-zh/
```

预期包含：`onnx/model.onnx`（或类似路径）、`tokenizer.json`、`vocab.json`、`source.spm`、`target.spm`

- [ ] **Step 5: 将模型目录加入 .gitignore（体积过大）**

在 `.gitignore` 末尾追加：
```
models/
```

- [ ] **Step 6: Commit 脚本**

```bash
git add scripts/download-model.ts .gitignore
git commit -m "feat: add model download script for opus-mt-en-zh ONNX"
```

---

## Task 2: 实现 tokenizer 封装

**Files:**
- Create: `src/translation/tokenizer.ts`
- Test: `tests/unit/translation.test.ts`（部分）

- [ ] **Step 1: 写 tokenizer 失败测试**

创建 `tests/unit/translation.test.ts`：

```typescript
import { describe, it, expect } from "bun:test";
import { MarianTokenizer } from "../../src/translation/tokenizer.ts";

describe("MarianTokenizer", () => {
  it("encodes and decodes round-trip", async () => {
    const tok = await MarianTokenizer.load("models/opus-mt-en-zh");
    const ids = tok.encode("Hello world");
    expect(ids.length).toBeGreaterThan(0);
    const decoded = tok.decode(ids);
    expect(typeof decoded).toBe("string");
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
bun test tests/unit/translation.test.ts
```

预期：FAIL — `Cannot find module '../../src/translation/tokenizer.ts'`

- [ ] **Step 3: 实现 tokenizer**

创建 `src/translation/tokenizer.ts`：

```typescript
import { AutoTokenizer } from "@huggingface/transformers";

export class MarianTokenizer {
  private constructor(private inner: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>) {}

  static async load(modelDir: string): Promise<MarianTokenizer> {
    const tok = await AutoTokenizer.from_pretrained(modelDir, {
      local_files_only: true,
    });
    return new MarianTokenizer(tok);
  }

  encode(text: string): number[] {
    const result = this.inner(text, { return_tensors: false });
    return Array.from(result.input_ids as number[]);
  }

  decode(ids: number[]): string {
    return this.inner.decode(ids, { skip_special_tokens: true });
  }
}
```

- [ ] **Step 4: 运行确认通过**

```bash
bun test tests/unit/translation.test.ts
```

预期：PASS

- [ ] **Step 5: Commit**

```bash
git add src/translation/tokenizer.ts tests/unit/translation.test.ts
git commit -m "feat: add MarianTokenizer wrapper for opus-mt-en-zh"
```

---

## Task 3: 实现 ONNX 推理核心

**Files:**
- Create: `src/translation/translator.ts`
- Create: `src/translation/index.ts`
- Test: `tests/unit/translation.test.ts`（追加）

- [ ] **Step 1: 追加推理失败测试**

在 `tests/unit/translation.test.ts` 末尾追加：

```typescript
import { translate, initTranslator } from "../../src/translation/index.ts";

describe("translate()", () => {
  it("translates English to Chinese", async () => {
    await initTranslator("models/opus-mt-en-zh");
    const result = await translate("Hello world");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles empty string gracefully", async () => {
    await initTranslator("models/opus-mt-en-zh");
    await expect(translate("")).rejects.toThrow("empty text");
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
bun test tests/unit/translation.test.ts
```

预期：FAIL — `Cannot find module '../../src/translation/index.ts'`

- [ ] **Step 3: 实现 translator.ts**

创建 `src/translation/translator.ts`：

```typescript
import * as ort from "onnxruntime-node";
import { AutoTokenizer } from "@huggingface/transformers";
import { join } from "path";

export class Translator {
  private constructor(
    private session: ort.InferenceSession,
    private tokenizer: Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>
  ) {}

  static async load(modelDir: string): Promise<Translator> {
    const modelPath = join(modelDir, "onnx", "model.onnx");
    const [session, tokenizer] = await Promise.all([
      ort.InferenceSession.create(modelPath),
      AutoTokenizer.from_pretrained(modelDir, { local_files_only: true }),
    ]);
    return new Translator(session, tokenizer);
  }

  async translate(text: string): Promise<string> {
    if (!text.trim()) throw new Error("empty text");

    const encoded = await this.tokenizer(text, {
      return_tensors: "pt",
      padding: true,
      truncation: true,
      max_length: 512,
    });

    const inputIds = new ort.Tensor(
      "int64",
      BigInt64Array.from(Array.from(encoded.input_ids.data as number[]).map(BigInt)),
      encoded.input_ids.dims
    );
    const attentionMask = new ort.Tensor(
      "int64",
      BigInt64Array.from(Array.from(encoded.attention_mask.data as number[]).map(BigInt)),
      encoded.attention_mask.dims
    );

    // encoder pass
    const encoderOut = await this.session.run({ input_ids: inputIds, attention_mask: attentionMask });

    // greedy decode (最多 256 tokens)
    const decoderStartTokenId = this.tokenizer.model.config.decoder_start_token_id as number ?? 0;
    const eosTokenId = this.tokenizer.model.config.eos_token_id as number ?? 0;
    const outputIds: number[] = [decoderStartTokenId];

    for (let i = 0; i < 256; i++) {
      const decoderInputIds = new ort.Tensor(
        "int64",
        BigInt64Array.from(outputIds.map(BigInt)),
        [1, outputIds.length]
      );
      const decoderOut = await this.session.run({
        input_ids: inputIds,
        attention_mask: attentionMask,
        decoder_input_ids: decoderInputIds,
        encoder_hidden_states: encoderOut.encoder_hidden_states ?? encoderOut.last_hidden_state,
      });

      const logits = decoderOut.logits.data as Float32Array;
      const vocabSize = decoderOut.logits.dims[2];
      const lastLogits = logits.slice((outputIds.length - 1) * vocabSize, outputIds.length * vocabSize);
      const nextToken = Array.from(lastLogits).indexOf(Math.max(...Array.from(lastLogits)));

      if (nextToken === eosTokenId) break;
      outputIds.push(nextToken);
    }

    return this.tokenizer.decode(outputIds.slice(1), { skip_special_tokens: true });
  }
}
```

- [ ] **Step 4: 实现 index.ts**

创建 `src/translation/index.ts`：

```typescript
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
```

- [ ] **Step 5: 运行测试确认通过**

```bash
bun test tests/unit/translation.test.ts
```

预期：PASS（所有测试）

- [ ] **Step 6: Commit**

```bash
git add src/translation/translator.ts src/translation/index.ts tests/unit/translation.test.ts
git commit -m "feat: ONNX translator core with greedy decode"
```

---

## Task 4: 改造 server.ts，删除 Python 子进程

**Files:**
- Modify: `src/server.ts`

- [ ] **Step 1: 确定模型路径解析逻辑**

`mdv-server` 编译后是单一二进制，模型目录需要放在二进制旁边。路径逻辑：

```typescript
import { dirname, join } from "path";

function resolveModelDir(): string {
  // 编译后二进制：process.execPath 指向 mdv-server 本身
  // 开发模式：import.meta.dir 指向 src/
  const base = Bun.main.endsWith(".ts")
    ? join(import.meta.dir, "..")   // 开发：src/../ = 项目根
    : dirname(process.execPath);    // 生产：二进制旁
  return join(base, "models", "opus-mt-en-zh");
}
```

- [ ] **Step 2: 修改 server.ts**

替换 `src/server.ts` 中第 123-237 行（翻译代理 + 子进程部分）为：

```typescript
// ==================== 翻译（内嵌 ONNX）====================

import { dirname, join } from "path";
import { initTranslator, translate, translatorReady } from "./translation/index.ts";

function resolveModelDir(): string {
  const base = Bun.main.endsWith(".ts")
    ? join(import.meta.dir, "..")
    : dirname(process.execPath);
  return join(base, "models", "opus-mt-en-zh");
}

app.post("/api/translate", async (c) => {
  const { text } = await c.req.json<{ text: string }>();
  if (!text || typeof text !== "string") {
    return c.json({ error: "missing text" }, 400);
  }
  if (translatorReady === false) {
    return c.json({ error: "翻译模型加载失败，请检查 models/ 目录" }, 503);
  }
  if (translatorReady === null) {
    return c.json({ error: "翻译模型正在加载，请稍后重试" }, 503);
  }
  try {
    const translatedText = await translate(text);
    return c.json({ translatedText });
  } catch (e: any) {
    return c.json({ error: e.message ?? "translate failed" }, 500);
  }
});

// ==================== 启动服务 ====================

const PORT = getServerPort(config);
const HOST = getServerHost(config);

if (import.meta.main) {
  Bun.serve({
    port: PORT,
    hostname: HOST,
    fetch: app.fetch,
    idleTimeout: 255,
  });

  log(`🚀 MD Viewer Server 启动于 http://${HOST}:${PORT}/`);
  log(`📖 使用方法: 在浏览器中打开，然后添加 Markdown/HTML 文件路径`);

  const modelDir = resolveModelDir();
  initTranslator(modelDir)
    .then(() => broadcastEvent({ type: "translate-status", up: true }))
    .catch(() => broadcastEvent({ type: "translate-status", up: false }));

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
}
```

- [ ] **Step 3: 删除 translate_server.py**

```bash
rm src/translate_server.py
```

- [ ] **Step 4: 启动开发服务器验证**

```bash
bun run dev
```

预期日志：
```
🚀 MD Viewer Server 启动于 http://127.0.0.1:...
[translate] 加载 ONNX 模型...
[translate] 模型加载完成
```

- [ ] **Step 5: 手动测试翻译 API**

```bash
curl -X POST http://127.0.0.1:<PORT>/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}'
```

预期：`{"translatedText":"你好，世界"}`

- [ ] **Step 6: Commit**

```bash
git add src/server.ts
git rm src/translate_server.py
git commit -m "feat: replace Python translate subprocess with inline ONNX translator"
```

---

## Task 5: 更新构建脚本，将模型复制到产物

**Files:**
- Modify: `scripts/build-server-for-xcode.sh`
- Modify: `package.json`（新增 build:server 脚本）

- [ ] **Step 1: 修改 build-server-for-xcode.sh**

在 `scripts/build-server-for-xcode.sh` 的"复制到 Xcode 项目"步骤（Step 7）之后，追加模型复制步骤：

```bash
# 8b. 复制模型到 Xcode 项目
echo "8b️⃣  复制模型文件..."
MODEL_SRC="models/opus-mt-en-zh"
MODEL_DST="MDViewer/Resources/models/opus-mt-en-zh"
if [ -d "$MODEL_SRC" ]; then
    rm -rf "$MODEL_DST"
    mkdir -p "$(dirname "$MODEL_DST")"
    cp -R "$MODEL_SRC" "$MODEL_DST"
    echo "  ✓ 模型已复制到 $MODEL_DST"
else
    echo "  ❌ 模型目录不存在: $MODEL_SRC"
    echo "  请先运行: bun scripts/download-model.ts"
    exit 1
fi
```

将原来的"清理临时文件"步骤编号从 8 改为 9。

- [ ] **Step 2: 更新 Swift ServerManager 的环境变量，让 mdv-server 能找到模型**

查看 `MDViewer/App/ServerManager.swift` 中 `process.environment` 设置部分，在其中追加模型路径（模型放在 `Resources/models/` 下，与 `mdv-server` 同级）：

```swift
// 在 process.environment 字典中追加：
"MODELS_DIR": serverDir + "/models",
```

其中 `serverDir` 是 `mdv-server` 所在目录（`Bundle.main.resourcePath`）。

- [ ] **Step 3: 修改 resolveModelDir() 支持环境变量覆盖**

在 `src/server.ts` 的 `resolveModelDir()` 函数中，优先使用环境变量：

```typescript
function resolveModelDir(): string {
  if (process.env.MODELS_DIR) return join(process.env.MODELS_DIR, "opus-mt-en-zh");
  const base = Bun.main.endsWith(".ts")
    ? join(import.meta.dir, "..")
    : dirname(process.execPath);
  return join(base, "models", "opus-mt-en-zh");
}
```

- [ ] **Step 4: 重新构建 mdv-server 并测试**

```bash
./scripts/build-server-for-xcode.sh
```

预期：
```
✓ mdv-server found
✓ 模型已复制到 MDViewer/Resources/models/opus-mt-en-zh
```

- [ ] **Step 5: Commit**

```bash
git add scripts/build-server-for-xcode.sh src/server.ts MDViewer/App/ServerManager.swift
git commit -m "feat: copy ONNX model to app bundle in build script"
```

---

## Task 6: 端到端验证

**Files:**（无新文件）

- [ ] **Step 1: 运行全量单元测试**

```bash
bun test tests/unit/
```

预期：所有测试 PASS，无 Python 相关测试失败

- [ ] **Step 2: 构建完整 app bundle 并安装**

```bash
./scripts/build-server-for-xcode.sh
./scripts/build/build_app_bundle.sh --install --skip-dmg
```

- [ ] **Step 3: 启动 app，打开一个 PDF，测试翻译功能**

1. `open -a "MD Viewer"`
2. 打开任意 PDF 文件
3. 鼠标悬停文本块，点击「译」按钮
4. 确认右侧面板出现中文翻译结果

- [ ] **Step 4: 验证普通 HTTP 模式也可用**

```bash
bun run dev
# 浏览器打开 http://127.0.0.1:<PORT>
# 打开 PDF，测试翻译
```

- [ ] **Step 5: 确认 Python 依赖完全消除**

```bash
grep -r "translate_server\|python3\|conda" src/ scripts/
```

预期：无匹配结果

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: verify ONNX translation works in both app and HTTP mode"
```
