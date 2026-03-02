# 统一输入交互设计（搜索 + 补全 + 添加）

日期：2026-03-01  
状态：待实现（本版用于收敛交互，不再零碎修补）  
版本：v3（替代 v2）

---

## 1. 背景问题

当前主要冲突：

1. `Enter` 语义冲突：补全列表第一项高亮，但回车执行了“添加”，不符合预期。
2. 视觉冲突：补全面板与确认条会同时出现，出现遮挡。
3. 心智冲突：用户无法判断“这次回车到底是补全还是提交”。

---

## 2. 业界基线（简要）

可对齐的通用模式（命令面板/组合框/终端补全）：

1. 当建议列表可交互时，`Enter` 优先作用于“当前建议项”。
2. `Tab` 用于“补全但不执行”是高频约定（终端/路径输入）。
3. “执行动作”通常使用明确二次动作（再次 `Enter` 或 `Cmd/Ctrl+Enter`）。
4. 同一锚点下拉区同一时刻只展示一个层（建议 or 确认），避免叠层冲突。

参考：
- WAI-ARIA Combobox Keyboard Interaction  
  https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- VS Code Intellisense / suggestion accept behavior  
  https://code.visualstudio.com/docs/editor/intellisense
- GitHub Command Palette（命令选择后执行）  
  https://docs.github.com/en/get-started/accessibility/github-command-palette
- Raycast Keyboard Shortcuts（Enter 触发 action）  
  https://manual.raycast.com/keyboard-shortcuts

---

## 3. 设计目标

1. 一个输入框同时承载“搜索 + 路径添加”，不引入模态框。
2. 任何时刻 `Enter` 只有一个明确语义。
3. 补全与确认互斥，彻底消除遮挡。
4. 键盘优先，鼠标可选。

---

## 4. 交互模型（推荐方案 S1）

将输入框分成三种状态：

1. `SearchMode`（普通搜索）
2. `PathAssistMode`（路径输入 + 补全）
3. `ConfirmMode`（类型检测后的行内确认）

状态由输入内容和面板可见性驱动，不需要用户手动切模式。

### 4.1 进入条件

- 命中“像路径”的输入（`/`, `~/`, `./`, `../`, 含路径分隔符或后缀）=> `PathAssistMode`
- 其他输入 => `SearchMode`

### 4.2 单一面板原则（关键）

输入框下方只允许出现一个 `input-panel`：

1. 补全时显示 `suggestion-panel`
2. 需要确认时替换为 `confirm-panel`
3. 两者绝不同时存在

---

## 5. 键盘语义（最终版）

### 5.1 `SearchMode`

- `Enter`: 仅做搜索上下文提交（当前实现可等同 no-op / 保持过滤）
- `Tab`: 焦点导航，不触发添加
- `Esc`:
  - 第一次：关闭任何面板
  - 第二次（900ms 内）：清空输入

### 5.2 `PathAssistMode`（补全可见）

- `ArrowUp/Down`: 移动高亮项
- `Tab`: 接受高亮补全（仅改输入值，不执行添加）
- `Enter`: 接受高亮补全（仅改输入值，不执行添加）
- `Cmd/Ctrl+Enter`: 跳过补全，直接进入提交检测流程
- `Esc`: 关闭补全

说明：补全可见时，`Enter` 不做添加，这一条用于消除歧义。

### 5.3 `PathAssistMode`（补全不可见）

- `Enter`: 执行类型检测并分流
  - `.md` 文件：直接添加
  - 其他后缀：进入 `ConfirmMode`
  - 目录：进入 `ConfirmMode`
  - 无效路径：错误提示

### 5.4 `ConfirmMode`

- `Enter`: 触发主动作（确认）
- `Esc`: 取消确认，回到 `PathAssistMode`
- 点击外部：关闭确认（保留输入值）

---

## 6. 视觉与原型（ASCII）

### 6.1 补全态（只显示建议）

```text
┌──────────────────────────────────────┐
│ 🔍 /Users/huanghao/workspace/mt-cli │
├──────────────────────────────────────┤
│ 📁 docs/                             │
│ 📁 man/                              │
│ 📁 tools/                            │
│ 📄 AGENTS.md                         │
└──────────────────────────────────────┘
hint: Tab/Enter 补全  ·  Cmd/Ctrl+Enter 提交
```

### 6.2 确认态（替换建议，不叠层）

```text
┌──────────────────────────────────────┐
│ 🔍 /Users/huanghao/workspace/mt-cli │
├──────────────────────────────────────┤
│ 检测到目录，作为工作区添加？         │
│ [添工作区] [取消]                    │
└──────────────────────────────────────┘
```

### 6.3 非 md 文件确认

```text
┌──────────────────────────────────────┐
│ 检测到非 Markdown 文件（.txt）       │
│ [继续添加] [取消]                    │
└──────────────────────────────────────┘
```

---

## 7. 状态机（实现用）

```text
Idle
  -> input(path-like) -> Suggesting
  -> input(non-path)  -> Searching

Suggesting
  -> Enter/Tab (has active item) -> apply suggestion -> Suggesting/Idle
  -> Cmd/Ctrl+Enter -> Detecting
  -> Enter (no panel) -> Detecting
  -> Esc -> Idle

Detecting
  -> md_file -> execute_add_file -> Idle
  -> other_file -> ConfirmingOther
  -> directory -> ConfirmingWorkspace
  -> invalid -> ErrorInline

ConfirmingOther / ConfirmingWorkspace
  -> Enter(confirm) -> execute -> Idle
  -> Esc/outside -> Idle

ErrorInline
  -> input change -> Idle or Suggesting
```

---

## 8. 关键实现约束

1. `suggestion-panel` 与 `confirm-panel` 使用同一挂载容器。
2. 进入 `ConfirmMode` 前，必须取消补全请求并销毁建议列表。
3. 补全第一项默认“可见但不预提交”，避免误导。
4. 必须暴露“强制提交”快捷键：`Cmd/Ctrl+Enter`。
5. 不使用任何模态框（保持你已确定的设计约束）。

---

## 9. 验收用例（必须全部通过）

1. 输入 `/.../mt-cli`，补全出现，按 `Enter` 仅补全，不触发添加。
2. 补全关闭后再按 `Enter`，出现“添加工作区”确认。
3. 任意时刻确认条出现时，不再看到补全列表。
4. 输入 `.md` 完整路径，`Enter` 一次直接添加。
5. 输入 `.txt`，`Enter` 出确认，`Enter` 再次确认添加。
6. 双击 `Esc` 清空输入，且不误触发删除/移除动作。

---

## 10. 决策

本方案（S1）建议直接落地，不再做 A/B 小步试错。  
后续如果要扩展，仅在该模型上增加“历史输入”与“最近路径”，不改键盘语义。
