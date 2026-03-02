# Harness Engineering 实施方案

## 什么是 Harness Engineering？

**Harness Engineering** 是一种软件开发方法论，通过构建"测试装具"（Test Harness）和自动化基础设施，使软件系统能够快速迭代、验证和演进。

**核心理念：**
- **10x-100x 倍速迭代** - 通过自动化减少人工介入
- **快速验证** - 立即验证变更的正确性
- **安全实验** - 在隔离环境中尝试多种方案
- **数据驱动决策** - 用数据而非直觉做决策

---

## MD Viewer 项目的 Harness 需求分析

### 当前痛点

1. **手动测试耗时**
   - 每次修改需要手动刷新浏览器
   - 需要手动测试多个功能（文件加载、SSE、同步等）

2. **回归风险高**
   - 修改一个功能可能破坏另一个功能
   - 缺少自动化测试保障

3. **设计验证慢**
   - 需要人工审查设计文档
   - 难以快速对比多个方案

4. **Agent 协作效率低**
   - Agent 完成任务后需要人工验证
   - 缺少自动化的质量检查

---

## Harness 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Harness Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Test Runner │  │ Validation   │  │   Metrics    │  │
│  │              │  │   Engine     │  │  Collector   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │          │
│         ▼                  ▼                  ▼          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Test Execution Layer                │  │
│  ├──────────────┬──────────────┬──────────────────┤  │
│  │ Unit Tests   │ E2E Tests    │ Visual Tests     │  │
│  └──────────────┴──────────────┴──────────────────┘  │
│         │                  │                  │          │
│         ▼                  ▼                  ▼          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Application Under Test              │  │
│  │         (MD Viewer - Server + Client)            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 实施方案

### 层次 1：基础测试 Harness

#### 1.1 单元测试框架

```typescript
// tests/unit/file-manager.test.ts
import { describe, it, expect } from 'bun:test';
import { FileManager } from '@/file-manager';

describe('FileManager', () => {
  it('should load markdown file', async () => {
    const fm = new FileManager();
    const content = await fm.loadFile('test.md');
    expect(content).toContain('# Test');
  });

  it('should detect file changes', async () => {
    const fm = new FileManager();
    const watcher = fm.watch('test.md');
    // ... 测试逻辑
  });
});
```

**覆盖范围：**
- 文件加载逻辑
- Markdown 渲染
- 同步功能
- 配置管理

---

#### 1.2 E2E 测试框架（Playwright）

```typescript
// tests/e2e/basic-workflow.test.ts
import { test, expect } from '@playwright/test';

test.describe('MD Viewer Basic Workflow', () => {
  test('should load and display markdown file', async ({ page }) => {
    // 启动服务器
    await page.goto('http://localhost:3456');

    // 添加文件
    await page.fill('#fileInput', '/path/to/test.md');
    await page.press('#fileInput', 'Enter');

    // 验证渲染
    await expect(page.locator('.markdown-body h1')).toHaveText('Test Document');
  });

  test('should handle file changes via SSE', async ({ page }) => {
    await page.goto('http://localhost:3456');
    // ... SSE 测试逻辑
  });

  test('should sync to xuecheng', async ({ page }) => {
    await page.goto('http://localhost:3456');
    // ... 同步测试逻辑
  });
});
```

---

#### 1.3 视觉回归测试

```typescript
// tests/visual/ui-components.test.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('toolbar should match snapshot', async ({ page }) => {
    await page.goto('http://localhost:3456');
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toHaveScreenshot('toolbar.png');
  });

  test('markdown rendering should match snapshot', async ({ page }) => {
    await page.goto('http://localhost:3456');
    // 加载测试文件
    await loadTestFile(page, 'fixtures/sample.md');
    await expect(page.locator('.markdown-body')).toHaveScreenshot('markdown.png');
  });
});
```

---

### 层次 2：自动化验证 Harness

#### 2.1 Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Running pre-commit checks..."

# 1. TypeScript 类型检查
echo "  ➤ TypeScript type check..."
bun tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript type check failed"
  exit 1
fi

# 2. Linter
echo "  ➤ Linting..."
bun run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# 3. 单元测试
echo "  ➤ Running unit tests..."
bun test tests/unit
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed"
  exit 1
fi

# 4. 构建检查
echo "  ➤ Building client..."
bun run build:client
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ All pre-commit checks passed"
```

---

#### 2.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Type check
        run: bun tsc --noEmit

      - name: Lint
        run: bun run lint

      - name: Unit tests
        run: bun test tests/unit

      - name: Build
        run: bun run build

      - name: E2E tests
        run: bun test tests/e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - uses: microsoft/playwright-github-action@v1

      - name: Install dependencies
        run: bun install

      - name: Run visual tests
        run: bun test tests/visual

      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: tests/visual/screenshots
```

---

### 层次 3：Agent 验证 Harness

#### 3.1 自动化任务验证

```typescript
// scripts/verify-task.ts
/**
 * Agent 完成任务后自动验证
 */

interface TaskVerification {
  taskId: string;
  checks: VerificationCheck[];
}

interface VerificationCheck {
  name: string;
  type: 'test' | 'build' | 'lint' | 'visual';
  command: string;
  required: boolean;
}

async function verifyTask(taskId: string): Promise<VerificationResult> {
  const task = await getTask(taskId);
  const checks = getVerificationChecks(task);

  const results: CheckResult[] = [];

  for (const check of checks) {
    console.log(`Running check: ${check.name}...`);
    const result = await runCheck(check);
    results.push(result);

    if (check.required && !result.passed) {
      return {
        passed: false,
        failedCheck: check.name,
        results,
      };
    }
  }

  return {
    passed: true,
    results,
  };
}

// Agent 完成任务后调用
async function onTaskCompleted(taskId: string) {
  const verification = await verifyTask(taskId);

  if (verification.passed) {
    console.log('✅ Task verification passed');
    await updateTaskStatus(taskId, 'completed');
  } else {
    console.log(`❌ Task verification failed: ${verification.failedCheck}`);
    await updateTaskStatus(taskId, 'failed');
    await createFixTask(taskId, verification.failedCheck);
  }
}
```

---

#### 3.2 设计方案验证

```typescript
// scripts/validate-design.ts
/**
 * 自动验证设计文档的完整性和质量
 */

interface DesignValidation {
  hasTitle: boolean;
  hasProblemStatement: boolean;
  hasApproachComparison: boolean;
  hasRecommendation: boolean;
  hasImplementationPlan: boolean;
  hasExamples: boolean;
}

async function validateDesignDoc(filePath: string): Promise<DesignValidation> {
  const content = await readFile(filePath, 'utf-8');

  return {
    hasTitle: /^#\s+.+/m.test(content),
    hasProblemStatement: /##\s+(问题|Problem)/i.test(content),
    hasApproachComparison: /##\s+(方案|Approach|Solution)/i.test(content),
    hasRecommendation: /推荐|Recommend/i.test(content),
    hasImplementationPlan: /实施|Implementation|阶段|Phase/i.test(content),
    hasExamples: /```|示例|Example/i.test(content),
  };
}

// Agent 完成设计文档后调用
async function onDesignDocCreated(filePath: string) {
  const validation = await validateDesignDoc(filePath);
  const score = Object.values(validation).filter(Boolean).length / 6;

  if (score < 0.8) {
    console.log(`⚠️  Design doc quality: ${(score * 100).toFixed(0)}%`);
    console.log('Missing sections:', Object.entries(validation)
      .filter(([_, v]) => !v)
      .map(([k]) => k)
    );
  } else {
    console.log('✅ Design doc quality check passed');
  }
}
```

---

### 层次 4：实验 Harness（A/B 测试）

#### 4.1 多方案并行实现

```typescript
// scripts/ab-test.ts
/**
 * 自动实现多个方案，让用户选择
 */

interface Experiment {
  name: string;
  variants: Variant[];
}

interface Variant {
  id: string;
  name: string;
  branch: string;
  description: string;
}

async function runExperiment(experiment: Experiment) {
  // 1. 为每个方案创建 worktree
  for (const variant of experiment.variants) {
    await createWorktree(variant.id, variant.branch);
    await implementVariant(variant);
  }

  // 2. 启动多个服务器（不同端口）
  const servers = await Promise.all(
    experiment.variants.map((v, i) => startServer(v.id, 3456 + i))
  );

  // 3. 生成对比页面
  await generateComparisonPage(experiment, servers);

  console.log(`
🧪 Experiment ready: ${experiment.name}

Variants:
${experiment.variants.map((v, i) => `  - ${v.name}: http://localhost:${3456 + i}`).join('\n')}

Comparison: http://localhost:3455/compare
  `);
}

// 示例：字体缩放方案 A/B 测试
await runExperiment({
  name: 'Font Scaling UI',
  variants: [
    {
      id: 'variant-a',
      name: 'Browser Style',
      branch: 'font-scale-browser-style',
      description: '浏览器风格的百分比下拉菜单',
    },
    {
      id: 'variant-b',
      name: 'Editor Style',
      branch: 'font-scale-editor-style',
      description: '编辑器风格的 +/- 按钮',
    },
  ],
});
```

---

#### 4.2 用户行为收集

```typescript
// src/client/analytics.ts
/**
 * 收集用户行为数据（本地存储）
 */

interface UserAction {
  timestamp: number;
  action: string;
  variant?: string;
  metadata?: Record<string, any>;
}

class LocalAnalytics {
  private actions: UserAction[] = [];

  track(action: string, metadata?: Record<string, any>) {
    this.actions.push({
      timestamp: Date.now(),
      action,
      variant: this.getCurrentVariant(),
      metadata,
    });

    // 定期保存到 localStorage
    if (this.actions.length % 10 === 0) {
      this.save();
    }
  }

  save() {
    localStorage.setItem('analytics', JSON.stringify(this.actions));
  }

  getReport(): AnalyticsReport {
    // 生成报告
    return {
      totalActions: this.actions.length,
      actionsByType: this.groupByAction(),
      timeline: this.getTimeline(),
    };
  }
}

// 使用
analytics.track('font-scale-changed', { from: 1.0, to: 1.25 });
analytics.track('file-opened', { path: 'test.md' });
```

---

### 层次 5：性能 Harness

#### 5.1 性能基准测试

```typescript
// tests/benchmarks/rendering.bench.ts
import { bench, describe } from 'bun:test';

describe('Markdown Rendering Performance', () => {
  bench('render small file (1KB)', async () => {
    await renderMarkdown(smallFile);
  });

  bench('render medium file (100KB)', async () => {
    await renderMarkdown(mediumFile);
  });

  bench('render large file (1MB)', async () => {
    await renderMarkdown(largeFile);
  });
});

// 运行：bun test --bench
```

---

#### 5.2 性能回归检测

```typescript
// scripts/perf-regression.ts
/**
 * 检测性能回归
 */

interface PerfBaseline {
  renderSmall: number;
  renderMedium: number;
  renderLarge: number;
  sse: number;
}

async function checkPerfRegression(): Promise<boolean> {
  const baseline = await loadBaseline();
  const current = await runBenchmarks();

  const regressions: string[] = [];

  for (const [key, value] of Object.entries(current)) {
    const baselineValue = baseline[key];
    const regression = (value - baselineValue) / baselineValue;

    if (regression > 0.1) { // 10% 性能下降
      regressions.push(`${key}: ${(regression * 100).toFixed(1)}% slower`);
    }
  }

  if (regressions.length > 0) {
    console.log('⚠️  Performance regressions detected:');
    regressions.forEach(r => console.log(`  - ${r}`));
    return false;
  }

  return true;
}
```

---

## 实施路线图

### 阶段 1：基础 Harness（1 周）

**目标：** 建立基本的测试和验证能力

```bash
# 任务清单
1. ✅ 配置 Bun Test
2. ✅ 编写 5-10 个单元测试（核心功能）
3. ✅ 配置 Playwright
4. ✅ 编写 3-5 个 E2E 测试（关键用户流程）
5. ✅ 添加 pre-commit hooks
```

**验收标准：**
- 测试覆盖率 > 50%
- 所有测试通过
- Pre-commit hooks 生效

---

### 阶段 2：自动化 Harness（2 周）

**目标：** CI/CD 和自动化验证

```bash
# 任务清单
1. ✅ 配置 GitHub Actions CI
2. ✅ 添加视觉回归测试
3. ✅ 实现任务自动验证脚本
4. ✅ 添加设计文档验证
```

**验收标准：**
- CI 在每次提交时运行
- 任务完成后自动验证
- 设计文档质量检查

---

### 阶段 3：实验 Harness（1 月）

**目标：** 支持 A/B 测试和多方案对比

```bash
# 任务清单
1. ⏳ 实现 worktree 管理脚本
2. ⏳ 实现多服务器并行启动
3. ⏳ 实现对比页面生成
4. ⏳ 实现用户行为收集
```

**验收标准：**
- 可以同时运行 2-3 个方案
- 用户可以在浏览器中对比
- 收集用户行为数据

---

### 阶段 4：智能 Harness（3 月）

**目标：** AI 驱动的测试生成和优化

```bash
# 任务清单
1. ⏸️ 实现 AI 测试生成器
2. ⏸️ 实现性能回归检测
3. ⏸️ 实现自动化问题诊断
4. ⏸️ 实现自动化修复建议
```

---

## 监控指标

```typescript
interface HarnessMetrics {
  // 测试覆盖率
  testCoverage: number;

  // CI 通过率
  ciPassRate: number;

  // 平均 CI 时间
  avgCiTime: number;

  // 任务验证通过率
  taskVerificationPassRate: number;

  // 性能回归检测
  perfRegressionCount: number;

  // 实验数量
  experimentsRun: number;
}
```

**目标：**
- 测试覆盖率 > 80%
- CI 通过率 > 95%
- 平均 CI 时间 < 5 分钟
- 任务验证通过率 > 90%

---

## 总结

### 核心价值

1. **10x 倍速迭代** - 自动化验证减少人工介入
2. **质量保障** - 自动化测试防止回归
3. **快速实验** - A/B 测试快速验证方案
4. **数据驱动** - 用数据而非直觉做决策

### 实施优先级

1. **P0（立即）：** 基础测试 Harness（单元测试 + E2E 测试）
2. **P1（本周）：** 自动化验证 Harness（CI/CD + Pre-commit）
3. **P2（本月）：** 实验 Harness（A/B 测试）
4. **P3（未来）：** 智能 Harness（AI 驱动）

---

**下一步：** 配置 Bun Test 和 Playwright，编写第一批测试
