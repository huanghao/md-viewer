# Agent 学习用户风格机制

## 问题定义

如何让 AI agent 从用户的对话和交互中学习"风格"，包括：
- **决策偏好** - 用户倾向选择哪种方案（简单 vs 复杂、性能 vs 可读性）
- **沟通风格** - 用户喜欢的交互方式（详细 vs 简洁、技术 vs 产品视角）
- **质量标准** - 用户对代码质量、设计质量的要求
- **问题模式** - 用户经常关注的问题类型

**目标：**
- Agent 能预测用户的选择
- Agent 能主动提出符合用户风格的建议
- 减少来回确认，提高效率

---

## 业界参考

### 1. **GitHub Copilot - 代码风格学习**
- 分析项目中的代码模式
- 生成符合项目风格的代码

### 2. **ChatGPT - 对话风格适应**
- Custom Instructions（自定义指令）
- Memory（记忆功能）

### 3. **Linear - 工作流学习**
- 分析团队的标签使用模式
- 自动建议标签和优先级

### 4. **Notion AI - 文档风格学习**
- 分析用户的写作风格
- 生成符合风格的内容

---

## 数据来源分析

### 1. 对话历史

**可学习的信息：**
```typescript
interface ConversationData {
  // 决策记录
  decisions: {
    question: string;
    options: string[];
    chosen: string;
    reasoning?: string;
  }[];

  // 反馈记录
  feedback: {
    agentAction: string;
    userResponse: string; // "好" / "不好" / "改成..."
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];

  // 问题模式
  userQuestions: {
    question: string;
    context: string;
    frequency: number;
  }[];
}
```

**示例：**
```json
{
  "decisions": [
    {
      "question": "字体缩放功能是否需要快捷键？",
      "options": ["需要", "不需要"],
      "chosen": "不需要",
      "reasoning": "省的和浏览器冲突"
    },
    {
      "question": "工具栏设计风格选择",
      "options": ["Linear 风格", "纯文本风格"],
      "chosen": "纯文本风格",
      "reasoning": "我甚至觉得你这个纯文本的视觉效果更好！"
    }
  ],
  "feedback": [
    {
      "agentAction": "设计了 Linear 风格的工具栏",
      "userResponse": "你现在设计的刷新按钮的风格好突兀",
      "sentiment": "negative"
    },
    {
      "agentAction": "改为纯文本风格",
      "userResponse": "我甚至觉得你这个纯文本的视觉效果更好！",
      "sentiment": "positive"
    }
  ]
}
```

---

### 2. 代码变更历史

**可学习的信息：**
```typescript
interface CodeStyleData {
  // 代码风格偏好
  codeStyle: {
    indentation: 'tabs' | 'spaces';
    quoteStyle: 'single' | 'double';
    lineLength: number;
    namingConvention: 'camelCase' | 'snake_case';
  };

  // 架构偏好
  architecturePatterns: {
    pattern: string; // "functional" | "OOP" | "reactive"
    frequency: number;
  }[];

  // 重构模式
  refactoringPatterns: {
    before: string;
    after: string;
    reason: string;
  }[];
}
```

**示例：**
- 用户总是将长函数拆分为小函数 → 偏好函数式编程
- 用户总是添加类型注解 → 偏好类型安全
- 用户总是使用 `const` 而非 `let` → 偏好不可变性

---

### 3. 任务选择与优先级

**可学习的信息：**
```typescript
interface TaskPreferenceData {
  // 任务优先级偏好
  priorityPreference: {
    category: string; // "performance" | "ux" | "testing"
    avgPriority: number;
  }[];

  // 任务完成模式
  completionPatterns: {
    taskType: string;
    avgTime: number;
    successRate: number;
  }[];
}
```

**示例：**
- 用户总是优先处理 UX 相关任务 → 重视用户体验
- 用户总是推迟性能优化任务 → 先功能后性能

---

### 4. 设计决策历史

**可学习的信息：**
```typescript
interface DesignPreferenceData {
  // 设计原则
  designPrinciples: {
    principle: string; // "simplicity" | "consistency" | "flexibility"
    weight: number; // 权重
  }[];

  // 方案选择模式
  solutionPatterns: {
    problem: string;
    chosenApproach: string;
    rejectedApproaches: string[];
  }[];
}
```

**示例：**
- 用户总是选择简单方案 → 偏好简单性
- 用户总是选择已有工具而非自己实现 → 偏好实用主义

---

## 方案设计

### 方案 A：规则提取 + 模式匹配

**核心思想：** 从历史数据中提取规则，未来匹配应用。

#### 规则提取

```typescript
// 规则提取器
class StyleRuleExtractor {
  // 从决策历史中提取规则
  extractDecisionRules(decisions: Decision[]): Rule[] {
    const rules: Rule[] = [];

    // 示例：提取"避免快捷键"规则
    const keyboardShortcutDecisions = decisions.filter(d =>
      d.question.includes('快捷键') || d.question.includes('shortcut')
    );

    if (keyboardShortcutDecisions.length >= 2) {
      const avoidShortcuts = keyboardShortcutDecisions.filter(d =>
        d.chosen.includes('不需要') || d.chosen.includes('no')
      ).length;

      if (avoidShortcuts / keyboardShortcutDecisions.length > 0.7) {
        rules.push({
          type: 'preference',
          pattern: 'keyboard shortcuts',
          action: 'avoid',
          confidence: avoidShortcuts / keyboardShortcutDecisions.length,
          reasoning: '用户倾向于避免快捷键，理由：可能与浏览器冲突',
        });
      }
    }

    return rules;
  }

  // 从反馈中提取规则
  extractFeedbackRules(feedback: Feedback[]): Rule[] {
    const rules: Rule[] = [];

    // 分析负面反馈
    const negativeFeedback = feedback.filter(f => f.sentiment === 'negative');

    // 提取模式
    const patterns = this.clusterFeedback(negativeFeedback);

    for (const pattern of patterns) {
      rules.push({
        type: 'anti-pattern',
        pattern: pattern.description,
        action: 'avoid',
        examples: pattern.examples,
      });
    }

    return rules;
  }
}
```

#### 规则应用

```typescript
// 规则应用器
class StyleRuleApplier {
  private rules: Rule[] = [];

  async applyRules(context: Context): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    for (const rule of this.rules) {
      if (this.matchesContext(rule, context)) {
        suggestions.push({
          rule: rule.pattern,
          suggestion: rule.action,
          confidence: rule.confidence,
          reasoning: rule.reasoning,
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private matchesContext(rule: Rule, context: Context): boolean {
    // 检查规则是否适用于当前上下文
    // 例如：如果当前任务涉及快捷键，应用"避免快捷键"规则
  }
}
```

#### 示例：提取的规则

```json
{
  "rules": [
    {
      "type": "preference",
      "pattern": "keyboard shortcuts",
      "action": "avoid",
      "confidence": 0.8,
      "reasoning": "用户倾向于避免快捷键，理由：可能与浏览器冲突"
    },
    {
      "type": "preference",
      "pattern": "design style",
      "action": "prefer simplicity",
      "confidence": 0.9,
      "reasoning": "用户多次选择简单方案（纯文本 > 图形化）"
    },
    {
      "type": "anti-pattern",
      "pattern": "elaborate UI designs",
      "action": "avoid",
      "confidence": 0.7,
      "examples": ["Linear 风格工具栏被拒绝"]
    },
    {
      "type": "preference",
      "pattern": "documentation",
      "action": "prefer design docs over prototypes",
      "confidence": 0.85,
      "reasoning": "用户倾向于先看设计文档，而非直接原型"
    }
  ]
}
```

---

### 方案 B：向量嵌入 + 相似度检索

**核心思想：** 将历史对话转为向量，检索相似场景。

#### 工作流

```typescript
// 1. 构建知识库
class StyleKnowledgeBase {
  private vectorDB: VectorDatabase;

  async indexConversation(conversation: Conversation) {
    // 提取关键片段
    const snippets = this.extractKeySnippets(conversation);

    for (const snippet of snippets) {
      // 生成向量嵌入
      const embedding = await this.embed(snippet.text);

      // 存储
      await this.vectorDB.insert({
        id: snippet.id,
        embedding,
        metadata: {
          type: snippet.type, // "decision" | "feedback" | "preference"
          context: snippet.context,
          outcome: snippet.outcome,
        },
      });
    }
  }

  // 2. 检索相似场景
  async findSimilarScenarios(query: string, k: number = 5): Promise<Scenario[]> {
    const queryEmbedding = await this.embed(query);
    const results = await this.vectorDB.search(queryEmbedding, k);

    return results.map(r => ({
      text: r.metadata.context,
      outcome: r.metadata.outcome,
      similarity: r.score,
    }));
  }
}

// 3. 应用到决策
async function makeDecision(question: string): Promise<Suggestion> {
  // 检索相似历史决策
  const similar = await knowledgeBase.findSimilarScenarios(question);

  if (similar.length > 0 && similar[0].similarity > 0.8) {
    return {
      suggestion: similar[0].outcome,
      confidence: similar[0].similarity,
      reasoning: `基于相似场景：${similar[0].text}`,
    };
  }

  return null; // 无法预测，需要询问用户
}
```

#### 示例

```typescript
// 当前场景
const question = "是否为搜索功能添加快捷键？";

// 检索相似场景
const similar = await knowledgeBase.findSimilarScenarios(question);

// 结果
[
  {
    text: "字体缩放功能是否需要快捷键？",
    outcome: "不需要，避免与浏览器冲突",
    similarity: 0.92
  }
]

// Agent 决策
"基于之前的决策，建议不添加快捷键，理由：避免与浏览器冲突"
```

---

### 方案 C：LLM 上下文学习（推荐）

**核心思想：** 将历史对话整理为结构化的"风格指南"，注入 LLM 上下文。

#### 风格指南生成

```typescript
// 定期生成风格指南
class StyleGuideGenerator {
  async generateStyleGuide(conversations: Conversation[]): Promise<StyleGuide> {
    // 调用 LLM 分析历史对话
    const prompt = `
分析以下用户与 AI agent 的对话历史，提取用户的风格偏好：

${conversations.map(c => c.summary).join('\n\n')}

请生成一份风格指南，包括：
1. 决策偏好（用户倾向选择哪种方案）
2. 沟通风格（用户喜欢的交互方式）
3. 质量标准（用户对代码/设计的要求）
4. 反模式（用户不喜欢的做法）

格式：
## 决策偏好
- [偏好描述]：[理由] (置信度: X%)

## 沟通风格
- [风格描述]：[示例]

## 质量标准
- [标准描述]：[示例]

## 反模式
- [反模式描述]：[示例]
    `.trim();

    const response = await callLLM(prompt);
    return this.parseStyleGuide(response);
  }
}
```

#### 示例：生成的风格指南

```markdown
# 用户风格指南 (User Style Guide)

## 决策偏好

### 简单性 > 复杂性 (置信度: 95%)
- 用户多次选择简单方案，拒绝复杂方案
- 示例：纯文本工具栏 > Linear 风格工具栏
- 理由：用户认为简单方案"视觉效果更好"

### 避免快捷键冲突 (置信度: 80%)
- 用户倾向于避免添加快捷键
- 理由："省的和浏览器冲突"
- 例外：如果是独特的快捷键（不与浏览器冲突），可以考虑

### 先设计后实现 (置信度: 90%)
- 用户要求设计类任务先出设计文档
- 格式：Markdown 文档 + ASCII 原型
- 不要直接出 HTML 原型（工具限制）

### 实用主义 > 完美主义 (置信度: 85%)
- 用户接受"足够好"的方案，不追求完美
- 示例：字体缩放功能无快捷键（虽然不完美，但够用）

---

## 沟通风格

### 简洁直接 (置信度: 90%)
- 用户喜欢简洁的回复，不喜欢冗长的解释
- 反例：过度解释技术细节
- 正例：直接给出方案和理由

### 视觉化 (置信度: 85%)
- 用户喜欢 ASCII 原型和示例
- 示例：工具栏设计的 ASCII 原型
- 不要只有文字描述

### 产品视角 > 技术视角 (置信度: 80%)
- 用户更关注用户体验，而非技术实现
- 示例：关注"按钮是否突兀"，而非"CSS 实现细节"

---

## 质量标准

### 代码质量
- 偏好函数式编程（纯函数、不可变性）
- 偏好 TypeScript 类型安全
- 偏好简单的代码结构（不过度抽象）

### 设计质量
- 偏好一致性（统一的视觉风格）
- 偏好简洁（不要花哨的动画）
- 偏好实用（功能 > 美观）

### 文档质量
- 需要设计文档（设计类任务）
- 格式：Markdown + ASCII 原型
- 内容：方案对比 + 推荐 + 理由

---

## 反模式（避免）

### 过度设计 (置信度: 95%)
- 不要设计复杂的 UI（如 Linear 风格）
- 不要添加不必要的功能（如快捷键）
- 示例：用户拒绝了 Linear 风格工具栏

### 生成原型工具 (置信度: 100%)
- 不要尝试生成 HTML 原型（工具不支持）
- 使用 ASCII 原型代替
- 示例：用户多次提醒"你需要换一个办法"

### 冗长的解释 (置信度: 80%)
- 不要过度解释技术细节
- 直接给出方案和理由
- 保持回复简洁

### 未经确认的重大变更 (置信度: 90%)
- 不要在未经用户确认的情况下做重大变更
- 设计类任务必须先出设计文档
- 示例：工具栏重设计需要用户确认

---

## 更新日期
2026-03-01

## 数据来源
- 对话历史：50+ 轮对话
- 决策记录：10+ 次设计决策
- 反馈记录：20+ 次用户反馈
```

#### 应用风格指南

```typescript
// 在 Agent 的 system prompt 中注入风格指南
const systemPrompt = `
你是一个 AI agent，负责帮助用户开发 MD Viewer 项目。

# 用户风格指南
${styleGuide}

# 指令
- 在做决策时，参考用户风格指南
- 如果风格指南中有明确偏好，直接应用（无需询问）
- 如果风格指南中没有覆盖，再询问用户
- 定期更新风格指南（每 10 次对话）
`;
```

---

### 方案 D：混合方案（推荐）

**核心思想：** 结合规则提取和 LLM 上下文学习。

```typescript
class HybridStyleLearning {
  private ruleExtractor = new StyleRuleExtractor();
  private guideGenerator = new StyleGuideGenerator();
  private knowledgeBase = new StyleKnowledgeBase();

  async learn(conversations: Conversation[]) {
    // 1. 提取规则（快速、确定性）
    const rules = this.ruleExtractor.extractRules(conversations);

    // 2. 生成风格指南（灵活、全面）
    const guide = await this.guideGenerator.generateStyleGuide(conversations);

    // 3. 索引到向量数据库（检索相似场景）
    await this.knowledgeBase.indexConversations(conversations);

    return { rules, guide };
  }

  async makeDecision(question: string, context: Context): Promise<Decision> {
    // 1. 检查规则（快速路径）
    const ruleMatch = this.rules.find(r => r.matches(question));
    if (ruleMatch && ruleMatch.confidence > 0.8) {
      return {
        decision: ruleMatch.action,
        reasoning: ruleMatch.reasoning,
        confidence: ruleMatch.confidence,
        needsConfirmation: false,
      };
    }

    // 2. 检索相似场景
    const similar = await this.knowledgeBase.findSimilarScenarios(question);
    if (similar.length > 0 && similar[0].similarity > 0.85) {
      return {
        decision: similar[0].outcome,
        reasoning: `基于相似场景：${similar[0].text}`,
        confidence: similar[0].similarity,
        needsConfirmation: false,
      };
    }

    // 3. 使用风格指南（LLM 推理）
    const prompt = `
用户风格指南：
${this.guide}

当前问题：
${question}

上下文：
${context}

基于用户风格指南，你会如何决策？请给出：
1. 决策
2. 理由
3. 置信度（0-1）
    `.trim();

    const response = await callLLM(prompt);
    return this.parseDecision(response);
  }
}
```

---

## 实施路线图

### 阶段 1：手动风格指南（1 天）

**目标：** 验证可行性

```markdown
# 创建 USER_STYLE.md

手动总结用户风格：
1. 阅读对话历史
2. 提取关键决策和反馈
3. 总结为风格指南

格式：
- 决策偏好
- 沟通风格
- 质量标准
- 反模式
```

**成本：** 1-2 小时
**效果：** Agent 参考风格指南，减少确认次数

---

### 阶段 2：半自动生成（1 周）

**目标：** 自动化风格指南生成

```typescript
// 实现风格指南生成器
const generator = new StyleGuideGenerator();
const guide = await generator.generateStyleGuide(conversations);

// 保存到 USER_STYLE.md
await writeFile('USER_STYLE.md', guide);
```

**触发时机：**
- 每 10 次对话后更新
- 用户手动触发：`mdv update-style-guide`

**成本：** 2-3 天开发
**效果：** 自动保持最新，减少人工维护

---

### 阶段 3：智能决策（2 周）

**目标：** Agent 主动应用风格指南

```typescript
// 在 Agent 决策时应用
const decision = await styleEngine.makeDecision(question, context);

if (decision.confidence > 0.8) {
  // 直接应用，无需确认
  await applyDecision(decision);
} else {
  // 置信度低，询问用户
  await askUser(question, decision.suggestion);
}
```

**成本：** 1-2 周开发
**效果：** 减少 50%+ 的确认次数

---

## 监控指标

```typescript
interface StyleLearningMetrics {
  // 学习效果
  rulesExtracted: number;      // 提取的规则数量
  guideUpdateFrequency: number; // 风格指南更新频率

  // 应用效果
  decisionAccuracy: number;    // 决策准确率（用户是否同意）
  confirmationReduction: number; // 确认次数减少比例

  // 用户满意度
  userSatisfaction: number;    // 用户满意度（1-5）
}
```

**目标：**
- 决策准确率 > 80%
- 确认次数减少 > 50%
- 用户满意度 > 4.0

---

## 隐私与安全

### 数据收集原则

```markdown
# 隐私政策

## 收集的数据
- 对话历史（用户与 Agent 的交互）
- 决策记录（用户的选择）
- 反馈记录（用户的评价）

## 不收集的数据
- 个人身份信息（PII）
- 敏感代码（加密、密钥等）
- 外部 API 密钥

## 数据存储
- 本地存储（不上传到云端）
- 加密存储（可选）
- 用户可随时删除

## 数据使用
- 仅用于改进 Agent 决策
- 不用于训练外部模型
- 不分享给第三方
```

### 用户控制

```bash
# 查看风格指南
mdv style show

# 编辑风格指南
mdv style edit

# 重新生成风格指南
mdv style regenerate

# 删除风格指南（重置）
mdv style reset

# 禁用风格学习
mdv config set style-learning false
```

---

## 总结

### 推荐方案：LLM 上下文学习 + 定期更新

**短期（1 天）：**
- ✅ 手动创建 USER_STYLE.md
- ✅ Agent 参考风格指南

**中期（1-2 周）：**
- ✅ 自动生成风格指南
- ✅ 每 10 次对话更新

**长期（1-2 月）：**
- ✅ 智能决策引擎
- ✅ 向量检索相似场景
- ✅ 规则提取自动化

### 核心原则

1. **渐进学习** - 从简单开始，逐步优化
2. **用户控制** - 用户可查看、编辑、删除
3. **隐私优先** - 本地存储，不上传云端
4. **可解释性** - 每个决策都有理由
5. **持续改进** - 定期更新，反馈循环

---

**下一步：** 手动创建 USER_STYLE.md，总结当前对话中的用户风格
