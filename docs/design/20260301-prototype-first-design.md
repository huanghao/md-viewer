# 原型优先设计流程

## 问题分析

**当前流程：** Markdown 设计文档 → 用户审阅 → 实现

**提议流程：** 直接生成原型 → 用户选择 → 实现

**核心问题：**
- Agent 当前无法生成可交互的 HTML 原型（工具限制）
- 用户更希望"看到"而非"读到"设计方案
- 文字描述难以传达视觉效果和交互体验

---

## 可行性分析

### 方案 A：ASCII 原型（当前可用）

**优点：**
- ✅ Agent 可以直接生成
- ✅ 无需额外工具
- ✅ 可以在 Markdown 中展示

**缺点：**
- ❌ 视觉效果有限
- ❌ 无法展示交互
- ❌ 无法展示颜色、字体

**适用场景：**
- 布局设计
- 信息架构
- 简单的 UI 结构

**示例：**
```
┌────────────────────────────────────────────────────┐
│ [⚙ 设置] [↻ 刷新] [☁↑ 同步]  100%  2分钟前      │
├────────────────────────────────────────────────────┤
│                                                    │
│  # 标题                                           │
│                                                    │
│  这是一段文字内容...                              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### 方案 B：静态 HTML 原型（部分可用）

**实现方式：**
```typescript
// Agent 生成 HTML 文件
const prototype = `
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 样式 */
  </style>
</head>
<body>
  <!-- 原型内容 -->
</body>
</html>
`;

await writeFile('docs/prototypes/design-v1.html', prototype);
```

**优点：**
- ✅ 可以展示真实视觉效果
- ✅ 可以展示颜色、字体、布局
- ✅ 用户可以在浏览器中查看

**缺点：**
- ⚠️ Agent 生成的 HTML 可能有错误
- ⚠️ 无法展示复杂交互（需要 JavaScript）
- ⚠️ 需要手动打开浏览器查看

**适用场景：**
- 静态 UI 设计
- 颜色/字体方案对比
- 布局方案对比

---

### 方案 C：可交互原型（需要开发）

**实现方式：**
```typescript
// 1. Agent 生成原型定义（JSON/YAML）
const prototypeSpec = {
  name: 'Font Scale Control',
  variants: [
    {
      id: 'variant-a',
      name: 'Browser Style',
      components: [
        {
          type: 'button',
          text: '100%',
          onClick: 'showMenu',
        },
        {
          type: 'menu',
          items: ['75%', '100%', '125%', '150%', '200%'],
        },
      ],
    },
    {
      id: 'variant-b',
      name: 'Editor Style',
      components: [
        {
          type: 'button',
          text: '+',
          onClick: 'increase',
        },
        {
          type: 'button',
          text: '-',
          onClick: 'decrease',
        },
      ],
    },
  ],
};

// 2. 原型渲染引擎将定义转为可交互的 HTML
const renderer = new PrototypeRenderer();
const html = renderer.render(prototypeSpec);

// 3. 启动原型服务器
await startPrototypeServer(html, 3457);
```

**优点：**
- ✅ 可以展示真实交互
- ✅ 用户可以直接体验
- ✅ 多个方案并排对比

**缺点：**
- ❌ 需要开发原型渲染引擎
- ❌ 需要定义原型规范（DSL）
- ❌ 实施复杂度高

**适用场景：**
- 复杂交互设计
- 用户流程设计
- A/B 测试

---

### 方案 D：基于现有组件的原型（推荐）

**核心思想：** 复用项目中的现有组件，快速组装原型

**实现方式：**
```typescript
// 1. Agent 生成原型配置
const prototypeConfig = {
  name: 'Font Scale Control Variants',
  baseUrl: 'http://localhost:3456',
  variants: [
    {
      id: 'variant-a',
      name: 'Browser Style',
      modifications: [
        {
          file: 'src/client/html.ts',
          changes: [
            // 修改工具栏 HTML
          ],
        },
        {
          file: 'src/client/css.ts',
          changes: [
            // 修改样式
          ],
        },
      ],
    },
    {
      id: 'variant-b',
      name: 'Editor Style',
      modifications: [
        // ...
      ],
    },
  ],
};

// 2. 原型生成器应用修改
const generator = new PrototypeGenerator();
await generator.generate(prototypeConfig);

// 3. 启动多个服务器（不同端口）
// Variant A: http://localhost:3456
// Variant B: http://localhost:3457

// 4. 生成对比页面
// http://localhost:3455/compare
```

**对比页面示例：**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Design Comparison</title>
  <style>
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .variant {
      border: 2px solid #ccc;
      border-radius: 8px;
      overflow: hidden;
    }
    .variant-header {
      background: #f5f5f5;
      padding: 10px;
      font-weight: bold;
    }
    iframe {
      width: 100%;
      height: 600px;
      border: none;
    }
  </style>
</head>
<body>
  <h1>Font Scale Control - Design Comparison</h1>
  <div class="comparison">
    <div class="variant">
      <div class="variant-header">Variant A: Browser Style</div>
      <iframe src="http://localhost:3456"></iframe>
    </div>
    <div class="variant">
      <div class="variant-header">Variant B: Editor Style</div>
      <iframe src="http://localhost:3457"></iframe>
    </div>
  </div>
</body>
</html>
```

**优点：**
- ✅ 复用现有代码，快速实现
- ✅ 真实的交互体验
- ✅ 并排对比，易于选择
- ✅ 可以直接使用选中的方案

**缺点：**
- ⚠️ 需要 Git Worktree 隔离
- ⚠️ 需要管理多个服务器进程

**适用场景：**
- UI 设计方案对比
- 交互流程对比
- 性能对比

---

## 推荐流程

### 流程 1：简单设计（ASCII 原型）

**适用：** 布局、信息架构

```
1. Agent 生成 ASCII 原型（2-3 个方案）
2. 用户在 Markdown 中查看
3. 用户选择方案
4. Agent 实现
```

**示例任务：**
- 侧边栏布局调整
- 面包屑导航设计
- 设置页面布局

---

### 流程 2：中等设计（静态 HTML 原型）

**适用：** 视觉设计、颜色方案

```
1. Agent 生成静态 HTML 原型（2-3 个方案）
2. 保存到 docs/prototypes/
3. 用户在浏览器中查看
4. 用户选择方案
5. Agent 实现
```

**示例任务：**
- 主题颜色方案
- 字体组合
- 图标风格

---

### 流程 3：复杂设计（可交互原型）

**适用：** 交互设计、用户流程

```
1. Agent 创建 Git Worktree（每个方案一个）
2. Agent 在每个 Worktree 中实现方案
3. Agent 启动多个服务器（不同端口）
4. Agent 生成对比页面
5. 用户在浏览器中对比
6. 用户选择方案
7. Agent 合并选中的 Worktree
```

**示例任务：**
- 文件搜索交互
- 同步对话框流程
- 工具栏交互

---

## 实施方案

### 阶段 1：工具脚本（1 周）

**目标：** 自动化原型生成和对比

```bash
# scripts/prototype.sh

# 创建原型
mdv prototype create <name> --variants=2

# 启动原型服务器
mdv prototype serve <name>

# 选择方案
mdv prototype select <name> --variant=a

# 清理原型
mdv prototype cleanup <name>
```

**实现：**
```typescript
// scripts/prototype-manager.ts

class PrototypeManager {
  // 创建原型
  async create(name: string, variantCount: number) {
    const variants = [];
    for (let i = 0; i < variantCount; i++) {
      const variantId = `variant-${String.fromCharCode(97 + i)}`;
      const branch = `prototype-${name}-${variantId}`;

      // 创建 worktree
      await exec(`git worktree add .prototypes/${variantId} -b ${branch}`);

      variants.push({
        id: variantId,
        branch,
        path: `.prototypes/${variantId}`,
        port: 3456 + i,
      });
    }

    // 保存配置
    await this.saveConfig(name, variants);
  }

  // 启动原型服务器
  async serve(name: string) {
    const config = await this.loadConfig(name);

    // 启动每个变体的服务器
    const servers = await Promise.all(
      config.variants.map(v => this.startServer(v))
    );

    // 生成对比页面
    await this.generateComparisonPage(name, config.variants);

    console.log(`
🎨 Prototype ready: ${name}

Variants:
${config.variants.map(v => `  - ${v.id}: http://localhost:${v.port}`).join('\n')}

Comparison: http://localhost:3455/compare/${name}
    `);
  }

  // 选择方案
  async select(name: string, variantId: string) {
    const config = await this.loadConfig(name);
    const variant = config.variants.find(v => v.id === variantId);

    // 合并选中的变体到 main
    await exec(`git checkout main`);
    await exec(`git merge ${variant.branch} --no-ff -m "Merge prototype: ${name} (${variantId})"`);

    // 清理其他变体
    await this.cleanup(name);
  }

  // 清理原型
  async cleanup(name: string) {
    const config = await this.loadConfig(name);

    // 停止服务器
    for (const variant of config.variants) {
      await this.stopServer(variant.port);
    }

    // 删除 worktrees
    for (const variant of config.variants) {
      await exec(`git worktree remove ${variant.path}`);
      await exec(`git branch -D ${variant.branch}`);
    }

    // 删除配置
    await unlink(`.prototypes/${name}.json`);
  }
}
```

---

### 阶段 2：Agent 集成（2 周）

**目标：** Agent 自动生成和管理原型

```typescript
// Agent 工作流

async function handleDesignTask(task: Task) {
  // 1. 分析任务，确定方案数量
  const variantCount = await determineVariantCount(task);

  // 2. 创建原型
  await prototypeManager.create(task.id, variantCount);

  // 3. 在每个变体中实现方案
  for (const variant of variants) {
    await implementVariant(variant, task);
  }

  // 4. 启动原型服务器
  await prototypeManager.serve(task.id);

  // 5. 通知用户
  await notifyUser(`
原型已准备好，请在浏览器中查看：
http://localhost:3455/compare/${task.id}

选择方案后，运行：
mdv prototype select ${task.id} --variant=<a|b|c>
  `);

  // 6. 等待用户选择
  await waitForUserSelection(task.id);
}
```

---

### 阶段 3：自动化对比（1 月）

**目标：** 自动收集用户行为，推荐最佳方案

```typescript
// 用户行为收集
class PrototypeAnalytics {
  track(variant: string, action: string) {
    // 记录用户操作
  }

  getReport(prototypeName: string): Report {
    // 生成报告
    return {
      variants: {
        'variant-a': {
          clicks: 10,
          timeSpent: 120, // 秒
          errors: 0,
        },
        'variant-b': {
          clicks: 15,
          timeSpent: 90,
          errors: 2,
        },
      },
      recommendation: 'variant-a', // 基于数据推荐
    };
  }
}
```

---

## 用户体验流程

### 示例：字体缩放功能设计

#### 传统流程（当前）

```
1. Agent: 创建设计文档 docs/design/20260301-font-size-control.md
2. User: 阅读文档（5-10 分钟）
3. User: 选择方案 A
4. Agent: 实现方案 A
5. User: 刷新浏览器查看效果
6. User: 反馈调整
7. Agent: 修改实现
```

**时间：** 30-60 分钟

---

#### 原型优先流程（提议）

```
1. Agent: 创建原型（2 个方案）
2. Agent: 启动原型服务器
3. Agent: 发送链接给用户
4. User: 在浏览器中对比（1-2 分钟）
5. User: 选择方案 A
6. Agent: 合并方案 A 到 main
```

**时间：** 5-10 分钟

**优势：**
- ⏱️ 节省 80% 时间
- 👁️ 直观对比，易于决策
- ✅ 无需反复调整

---

## 成本分析

### 开发成本

**阶段 1：工具脚本**
- 时间：3-5 天
- 复杂度：中等
- 价值：高（可重复使用）

**阶段 2：Agent 集成**
- 时间：1-2 周
- 复杂度：中等
- 价值：高（自动化）

**阶段 3：自动化对比**
- 时间：2-4 周
- 复杂度：高
- 价值：中（锦上添花）

---

### 维护成本

- **Git Worktree 管理：** 需要定期清理
- **多服务器进程：** 需要监控和自动重启
- **端口冲突：** 需要动态分配端口

---

## 限制和注意事项

### 技术限制

1. **Agent 生成 HTML 的能力有限**
   - 可能有语法错误
   - 可能缺少 CSS/JS
   - 需要人工检查

2. **Git Worktree 的限制**
   - 磁盘空间占用
   - 需要手动清理
   - 可能有未提交的更改

3. **多服务器的限制**
   - 端口占用
   - 资源消耗
   - 进程管理复杂

---

### 适用场景

**适合原型优先：**
- ✅ UI 设计（视觉效果重要）
- ✅ 交互设计（用户流程复杂）
- ✅ 多方案对比（难以用文字描述）

**不适合原型优先：**
- ❌ 架构设计（需要详细说明）
- ❌ API 设计（需要规范定义）
- ❌ 算法设计（需要逻辑分析）

---

## 总结

### 推荐方案：混合流程

**简单设计：** ASCII 原型（Markdown）
**中等设计：** 静态 HTML 原型（docs/prototypes/）
**复杂设计：** 可交互原型（Git Worktree + 多服务器）

### 实施优先级

1. **P0（立即）：** 继续使用 ASCII 原型 + Markdown 设计文档
2. **P1（本周）：** 实现静态 HTML 原型生成
3. **P2（本月）：** 实现可交互原型工具脚本
4. **P3（未来）：** Agent 自动生成原型 + 自动化对比

### 核心原则

- **渐进式实施** - 从简单开始，逐步优化
- **按需选择** - 根据任务类型选择合适的流程
- **用户控制** - 用户可以选择使用哪种流程
- **自动化优先** - 减少人工操作

---

**下一步：** 实现静态 HTML 原型生成脚本，验证可行性
