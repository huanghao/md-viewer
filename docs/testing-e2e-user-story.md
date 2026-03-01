# User Story：MD Viewer 自动化 E2E 测试落地（含录屏演示）

日期：2026-03-01  
作者：GPT-5（与产品同屏协作记录）

## 1. 背景与目标

我们在迭代侧边栏状态模型时，出现了多个高频回归风险：
- 蓝点（列表差异提示）语义变化频繁。
- 工作区刷新、展开态、排序持久化容易被 UI 改动影响。
- 视觉细节（标记位置、高亮）难靠人工稳定验证。

目标：
- 建立可重复执行的 E2E 回归集。
- 用“可读的 case 文档 + 可执行测试 + 可视化录屏/快照”形成团队可复用流程。

---

## 2. 自动测试的逻辑与原理

### 2.1 为什么用 E2E
E2E 直接从用户视角验证：
- 页面行为（点击、刷新、切换模式）
- 状态投影（蓝点/M/D）
- 关键视觉位置（标记在右侧）

这类问题用单元测试很难覆盖完整链路（本地存储、工作区扫描、DOM 渲染、刷新恢复）。

### 2.2 技术原理（Playwright）
- 启动真实浏览器（Chromium）执行用户动作。
- 对 DOM 做行为断言（可见性、文本、数量、位置）。
- 对关键区域做视觉断言（截图与基线比对）。
- 支持 trace/video 产物用于失败排查与演示。

### 2.3 本项目中的关键约定
- 每个 case 自包含目录：
  - `README.md`：业务场景与验收
  - `case-*.spec.ts`：实现代码
  - `case-*.spec.ts-snapshots/`：该 case 的视觉基线（可选）
- Case 文档优先于代码：先改说明，再改测试实现。

---

## 3. 当前测试资产结构

```text
tests/e2e/
  helpers.ts
  cases/
    case-1/
      README.md
      case-1.spec.ts
      case-1.spec.ts-snapshots/
    case-2/
      README.md
      case-2.spec.ts
    case-3/
      README.md
      case-3.spec.ts
    case-4/
      README.md
      case-4.spec.ts
    case-5/
      README.md
      case-5.spec.ts
```

相关规范文档：
- `docs/testing-spec.md`

---

## 4. 本次实操流程（已走通）

### 4.1 跑全量 case
命令：
```bash
bun run test:e2e -- tests/e2e/cases
```
结果：
- 5/5 通过。

### 4.2 只跑单个 case
命令：
```bash
bun run test:e2e -- tests/e2e/cases/case-1/case-1.spec.ts
```
结果：
- case-1 通过。

### 4.3 强制录屏（用于演示）
为了让“成功用例”也保留视频，新增临时配置：
- `playwright.video.config.ts`（`video: 'on'`）

命令：
```bash
bunx playwright test --config playwright.video.config.ts tests/e2e/cases/case-1/case-1.spec.ts
```
结果：
- 用例通过并产出录屏。

录屏路径（本次运行）：
- `test-results/cases-case-1-case-1-case-1-列表差异蓝点刷新后消失（行为-视觉）-chromium/video.webm`

---

## 5. 这次验证了什么（业务价值）

### 覆盖的关键行为
- Case 1：蓝点点击后消失，刷新后仍保持消失。
- Case 2：工作区展开态刷新保持。
- Case 3：简单/工作区两种模式中，状态标记都在右侧。
- Case 4：工作区上移下移排序可持久化。
- Case 5：工作区新扫描文件（未打开）也会显示蓝点。

### 避免的回归
- 状态语义回退（蓝点再次跨刷新保留）。
- UI 布局回退（标记位置飘到左侧）。
- 工作区交互回退（排序/展开态丢失）。

---

## 6. 团队推广建议

1. 每个新交互需求至少补 1 个 E2E case（含 README）。
2. 视觉断言仅用于“用户感知强”的区域，避免快照泛滥。
3. PR 模板增加一项：
   - 关联 case 路径（`tests/e2e/cases/case-x/`）
   - 测试命令与结果（pass/fail）
4. 需求评审阶段先写 case README，再进实现。

---

## 7. User Story（可直接发团队）

> 作为产品与研发协作团队，我们需要一套可复用、可解释、可演示的自动化 UI 回归机制，
> 使得“状态语义变化 + 交互改动 + 视觉细节”在每次迭代后都能被快速验证，
> 并能用录屏和 case 文档向团队清晰说明“测了什么、为什么测、结果如何”。

验收标准：
- 每个 case 在自己的目录内自包含（README/spec/snapshots）。
- 能跑全量与单 case。
- 能在需要时生成录屏用于评审演示。
- 关键状态语义（蓝点/M/D）有稳定回归覆盖。
