# iTerm2 集成设计

## 目标
在终端输出中点击 Markdown 文件路径时，快速在 MD Viewer 中打开，并且不破坏其他文件类型的默认打开行为。

## 先说结论（设计约束）
必须满足以下约束，否则不进入实施：

1. 非侵入：不能全局劫持所有点击行为。
2. 最小作用域：只处理 `.md`（可扩展到 `.markdown`）。
3. 可回退：命中失败或非 markdown 时，回退到系统默认打开。
4. 可隔离：建议只在专用 iTerm2 Profile 生效，避免影响日常终端。
5. 可观测：至少能看到失败原因（命令不存在、服务未启动、路径无效）。

---

## 统一工作链路
无论选哪种交互入口，核心链路一致：

1. 终端生成“可点击对象”
2. iTerm2 把目标参数传给执行命令
3. `mdv` CLI 调用本地 md-viewer HTTP 服务
4. 浏览器通过 SSE 收到文件变更并切换显示

差异只在第 1、2 步：谁来识别目标，何时触发命令。

---

## 核心概念（理解后两种方案必备）

### Semantic History
iTerm2 的内建能力：识别终端文本中的路径/URL，并在点击时执行配置命令（带参数）。

### URI Scheme
URI 的协议头，如 `file://`、`https://`。`file://` 表示本地文件 URI，通常需要转换为普通路径传给 CLI。

### OSC 8 Hyperlink
终端标准转义序列。你可以在输出中嵌入“显示文本”和“真实跳转目标”的映射，点击时按目标跳转。

### Smart Selection
iTerm2 规则匹配能力。通过正则命中文本，右键菜单触发动作。

---

## 方案 A（推荐）：Semantic History + `mdv-smart`

### 核心原理
iTerm2 负责“识别并传参”，`mdv-smart` 负责“做边界判断和回退”。

- 命中 `.md/.markdown` -> 调 `mdv`
- 其他文件或异常 -> 回退 `open`

### 为什么这是当前最稳妥方案
1. 交互快：Cmd+点击即可。
2. 改动小：不要求改现有命令输出。
3. 风险可控：通过 `mdv-smart` 把“劫持范围”限制到 markdown。

### 参考脚本（建议）

```bash
#!/bin/bash
# ~/.local/bin/mdv-smart
set -euo pipefail

input="${1:-}"
if [[ -z "$input" ]]; then
  exit 0
fi

# file:// -> 本地路径
if [[ "$input" == file://* ]]; then
  input="${input#file://}"
fi

# 相对路径 -> 绝对路径（按当前 shell cwd）
if [[ "$input" != /* ]]; then
  input="$(pwd)/$input"
fi

# 仅 markdown 走 mdv，其余回退系统默认
if [[ "$input" =~ \.md$|\.markdown$ ]]; then
  if command -v mdv >/dev/null 2>&1; then
    mdv "$input" || open "$input"
  else
    open "$input"
  fi
else
  open "$input"
fi
```

### iTerm2 建议配置
1. 新建专用 Profile（例如 `MD-Work`）
2. 仅在该 Profile 设置：
- Semantic History -> Run command
- Command: `mdv-smart "\1"`

---

## 方案 B：OSC 8 超链接

### 核心原理
不是让 iTerm2猜路径，而是输出端主动写入链接目标。点击时直达你写入的 URI。

### 与方案 A 的本质区别
- A：终端“识别文本”
- B：输出“声明目标”

### 适用场景
1. 你控制输出程序（脚本、工具、CI 日志格式）
2. 你需要跨终端（不仅 iTerm2）的一致点击行为

### 代价
1. 需要改输出层
2. 团队需要理解终端转义序列

---

## 方案 C：Smart Selection

### 核心原理
iTerm2 用规则命中目标文本，用户通过右键菜单执行命令。

### 适用场景
1. 只想对特殊格式文本生效
2. 不希望改 Semantic History

### 局限
1. 交互慢于 Cmd+点击
2. 规则维护成本高（输出变了规则就可能失效）

---

## 方案对比（含风险）

| 方案 | 触发方式 | 识别方式 | 侵入性 | 可控性 | 推荐级别 |
|------|---------|---------|--------|--------|---------|
| A. Semantic + mdv-smart | Cmd+点击 | iTerm2 识别 | 低（可限 .md） | 高 | 高 |
| B. OSC 8 | 点击链接 | 输出端声明目标 | 中 | 高 | 中 |
| C. Smart Selection | 右键菜单 | 正则规则 | 低 | 中 | 低 |

---

## 验收标准（完成后才能写入配置手册）

1. `.md` 文件点击后能稳定打开 MD Viewer。
2. 非 `.md` 点击行为保持系统默认，不被劫持。
3. 在“专用 Profile”和“默认 Profile”间行为隔离。
4. `mdv` 不可用或服务未启动时，行为可预期（回退或可诊断）。
5. 完成一次端到端录像或截图验证（点击 -> 打开 -> 前端切换）。

## 当前决策
先落地方案 A（`mdv-smart` + 专用 Profile + fallback），通过验收后再考虑是否补充方案 B。
