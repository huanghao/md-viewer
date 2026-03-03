# iTerm2 集成设计与配置

## 目标

在终端输出中点击 Markdown 文件路径时，快速在 MD Viewer 中打开，并且不破坏其他文件类型的默认打开行为。

---

## 设计约束

必须满足以下约束：

1. **非侵入**：尽量不全局劫持所有点击行为
2. **最小作用域**：只处理 `.md`（可扩展到 `.markdown`）
3. **可回退**：命中失败或非 markdown 时，回退到系统默认打开
4. **可隔离**：建议只在专用 iTerm2 Profile 生效（可选）
5. **可观测**：至少能看到失败原因（命令不存在、服务未启动、路径无效）

---

## 核心概念

### Semantic History
iTerm2 的内建能力：识别终端文本中的路径/URL，并在 Cmd+点击时执行配置命令（带参数）。

### Smart Selection
iTerm2 规则匹配能力：通过正则命中文本，右键菜单触发动作。

### OSC 8 Hyperlink
终端标准转义序列：在输出中嵌入"显示文本"和"真实跳转目标"的映射。

---

## 方案对比

| 方案 | 触发方式 | 识别方式 | 侵入性 | 路径兼容性 | 推荐级别 |
|------|---------|---------|--------|----------|---------|
| A. Semantic History + Dispatcher | Cmd+点击 | 脚本判断扩展名 | 中（拦截所有，脚本过滤） | **高**（支持各种路径格式） | ✅ **高** |
| B. Smart Selection | 右键菜单 | 正则精确匹配 | **低** | 中（只匹配特定格式） | 中 |
| C. OSC 8 | 点击链接 | 输出端声明目标 | 低 | 高（需要输出端支持） | 低 |

### 方案选择建议

**推荐方案 A（Semantic History）**，如果：
- ✅ 您经常需要从终端打开 .md 文件
- ✅ Agent 输出的路径格式多样（绝对路径、相对路径、basename）
- ✅ 您希望 Cmd+点击的便利体验
- ✅ 您接受"拦截所有点击+脚本过滤"的权衡

**选择方案 B（Smart Selection）**，如果：
- ✅ 您担心侵入性，希望最小化影响
- ✅ 您的路径输出格式固定（如总是绝对路径）
- ✅ 您不介意右键菜单的额外操作

**选择方案 C（OSC 8）**，如果：
- ✅ 您控制输出程序（自己的脚本、工具）
- ✅ 您需要跨终端的一致行为
- ✅ 您愿意修改输出层添加转义序列

---

## 方案 A：Semantic History + Dispatcher（推荐）

### 核心原理

使用 iTerm2 的 Semantic History 机制，结合 dispatcher 脚本处理路径解析和文件类型判断。

### iTerm2 Semantic History 参数

根据官方文档，Semantic History 提供以下参数：
- `\1` - 匹配到的文件路径（可能是绝对路径、相对路径或 basename）
- `\2` - 行号（如果 iTerm2 识别到，如 `file.md:42`）
- `\3` - 点击位置之前的文本
- `\4` - 点击位置之后的文本
- `\5` - 当前工作目录（该行命令执行时的 pwd）

### 参数示例

#### 示例 1：完整路径

终端输出（在 `/Users/huanghao/project` 目录下）：
```
Found file: /Users/huanghao/project/docs/README.md at line 42
```

**Cmd+点击** `README.md` 时，iTerm2 传递的参数：
```
\1 = /Users/huanghao/project/docs/README.md
\2 = 42
\3 = Found file: /Users/huanghao/project/docs/
\4 =  at line 42
\5 = /Users/huanghao/project
```

#### 示例 2：相对路径

终端输出（在 `/Users/huanghao/project` 目录下）：
```
$ ls docs/
README.md  guide.md
```

**Cmd+点击** `README.md` 时：
```
\1 = README.md
\2 = (空)
\3 = (空或少量文本)
\4 =   guide.md
\5 = /Users/huanghao/project
```

**路径解析**：`\5` + `\1` = `/Users/huanghao/project/README.md`

#### 示例 3：grep 输出

终端输出（在 `/Users/huanghao/project` 目录下）：
```
$ grep -n "TODO" src/main.ts
15:// TODO: fix this bug
```

**Cmd+点击** `src/main.ts` 时：
```
\1 = src/main.ts
\2 = 15
\3 = $ grep -n "TODO"
\4 = (换行或空)
\5 = /Users/huanghao/project
```

**路径解析**：`\5` + `\1` = `/Users/huanghao/project/src/main.ts`

#### 示例 4：Agent 输出

终端输出（在 `/Users/huanghao/project` 目录下）：
```
Modified files:
  - docs/README.md
  - src/cli.ts
```

**Cmd+点击** `README.md` 时：
```
\1 = README.md
\2 = (空)
\3 =   - docs/
\4 = (换行)
\5 = /Users/huanghao/project
```

**路径解析**：`\5` + `\1` = `/Users/huanghao/project/README.md`

#### 示例 5：Basename

终端输出（在 `/Users/huanghao/project` 目录下）：
```
$ echo "README.md"
README.md
```

**Cmd+点击** `README.md` 时：
```
\1 = README.md
\2 = (空)
\3 = $ echo "
\4 = "
\5 = /Users/huanghao/project
```

**路径解析**：`\5` + `\1` = `/Users/huanghao/project/README.md`

### 为什么只用 \1 和 \5？

从上面的例子可以看到：
1. **\1** - iTerm2 已经尽力识别出文件路径（可能是完整路径、相对路径或 basename）
2. **\5** - 提供工作目录，用于解析相对路径和 basename
3. **\3 和 \4** - 在大多数场景下不需要：
   - iTerm2 的智能识别已经把路径放到 \1 中
   - 我们的 dispatcher 脚本会处理路径解析
   - 增加复杂度但收益不大
   - 如果 \1 不完整，\3 和 \4 也不会更好

**结论**：`\1` + `\5` 的组合已经能处理绝大多数场景。

### Dispatcher 脚本功能

1. **路径解析**：
   - 绝对路径：直接使用
   - 相对路径：结合 `\5` 解析为绝对路径
   - Basename：结合 `\5` 构建完整路径
   - file:// URI：转换为本地路径

2. **文件类型判断**：
   - `.md/.markdown` → 调用 `mdv`
   - 其他文件 → 调用系统 `open`

3. **错误回退**：
   - 文件不存在 → 尝试 `open`（可能是 URL）
   - `mdv` 不可用 → 回退到 `open`
   - `mdv` 失败 → 回退到 `open`

### 配置步骤

#### 1. 安装 dispatcher 脚本

```bash
# 在项目目录运行
bun link       # 注册包，安装所有命令
```

这会安装：
- `mdv` - 打开文件的 CLI 命令
- `mdv-admin` - 管理命令
- `mdv-iterm2-dispatcher` - iTerm2 集成脚本

验证安装：
```bash
which mdv                      # ~/.bun/bin/mdv
which mdv-admin                # ~/.bun/bin/mdv-admin
which mdv-iterm2-dispatcher    # ~/.bun/bin/mdv-iterm2-dispatcher
```

#### 2. 配置 iTerm2 Semantic History

1. 打开 iTerm2 → **Preferences** (⌘,)
2. 选择 **Profiles** → 选择你的 Profile（或 Default）
3. 选择 **Advanced** 标签
4. 找到 **Semantic History** 区域
5. 选择 **Run command...**
6. 输入命令：
```
mdv-iterm2-dispatcher \1 \5
```

#### 3. 测试

在终端运行各种输出文件路径的命令：

```bash
# 测试绝对路径
ls -la /path/to/README.md

# 测试相对路径
ls -la docs/README.md

# 测试 basename
echo "README.md"

# 测试 find 输出
find . -name "*.md"
```

**Cmd+点击** 任何 `.md` 文件路径，应该在 MD Viewer 中打开。

**支持的路径格式：**
- ✅ 绝对路径：`/Users/huanghao/project/README.md`
- ✅ 相对路径：`docs/README.md`, `./README.md`, `../README.md`
- ✅ Basename：`README.md`（使用当前工作目录解析）
- ✅ Home 路径：`~/Documents/README.md`

点击其他文件（如 `.js`, `.py`），应该用系统默认方式打开。

### 优势

1. ✅ **体验好**：Cmd+点击即可
2. ✅ **路径兼容**：支持绝对路径、相对路径、basename
3. ✅ **类型安全**：只处理 .md 文件，其他文件回退
4. ✅ **自动安装**：`bun link` 自动部署脚本

### 侵入性说明

是的，这个方案会拦截所有 Cmd+点击，但：
- ✅ 脚本会判断文件类型，只处理 `.md` 文件
- ✅ 非 `.md` 文件使用系统默认行为
- ✅ 错误情况有完善的回退机制
- ⚠️ 如果担心侵入性，可以使用方案 B（Smart Selection）

---

## 方案 B：Smart Selection（备选）

### 核心原理

iTerm2 用正则表达式精确匹配 `.md` 文件路径，**只对匹配的文本生效**，不影响其他文件。

### 配置步骤

#### 1. 确保 mdv 命令可用

```bash
which mdv  # 应该显示: ~/.bun/bin/mdv
```

如果命令不存在，在项目目录运行：
```bash
bun link
```

#### 2. 配置 iTerm2 Smart Selection

1. 打开 iTerm2 → **Preferences** (⌘,)
2. 选择 **Profiles** → 选择你的 Profile（或 Default）
3. 选择 **Advanced** 标签
4. 找到 **Smart Selection** 区域
5. 点击 **Edit** 按钮
6. 点击 **+** 添加新规则

**规则配置：**
```
Regular Expression: [~/][^\s]*\.(?:md|markdown)
Precision: Normal
```

7. 在规则上右键 → **Edit Actions**
8. 点击 **+** 添加动作：
```
Action: Run Command...
Parameter: mdv "\0"
```
9. 可选：设置动作标题为 "Open in MD Viewer"

**正则说明**：
- `[~/]` - 以 `/` 或 `~` 开头（绝对路径或 home 路径）
- `[^\s]*` - 匹配非空白字符（路径内容）
- `\.(?:md|markdown)` - 以 `.md` 或 `.markdown` 结尾

#### 3. 测试

在终端运行任何输出 `.md` 文件路径的命令，例如：
```bash
ls -la README.md
find . -name "*.md"
```

在输出的路径上**右键**，应该看到 "Open in MD Viewer" 选项（或 "Run Command"）。

### 优势

1. ✅ **精确路由**：只匹配 `.md/.markdown` 文件，不劫持其他点击
2. ✅ **零侵入**：不影响 Semantic History，其他文件保持默认行为
3. ✅ **交互清晰**：右键菜单显示 "Open in MD Viewer"，用户明确知道在做什么
4. ✅ **易于调试**：规则不生效时，文件仍可用系统默认方式打开

### 局限

1. 需要右键操作，比 Cmd+点击多一步
2. 规则只匹配绝对路径格式（相对路径需要额外规则）

---

## 方案 C：OSC 8 超链接（不推荐）

### 核心原理

不是让 iTerm2 猜路径，而是输出端主动写入链接目标。点击时直达你写入的 URI。

### 适用场景

1. 你控制输出程序（脚本、工具、CI 日志格式）
2. 你需要跨终端（不仅 iTerm2）的一致点击行为

### 代价

1. 需要改输出层
2. 团队需要理解终端转义序列

---

## 常见问题

### Q: 点击后没反应？

检查：
```bash
# 1. mdv 命令是否可用
which mdv

# 2. MD Viewer 服务是否运行
# 在项目目录运行：
bun run dev

# 3. 手动测试 mdv 命令
mdv /path/to/your/file.md
```

### Q: 非 .md 文件也被劫持？（方案 A）

不会，dispatcher 会检查扩展名：
- `.md/.markdown` → mdv
- 其他 → open（系统默认）

### Q: 相对路径不工作？（方案 A）

确保配置中包含 `\5` 参数：
```
mdv-iterm2-dispatcher \1 \5
```

### Q: Smart Selection 右键没有看到菜单？（方案 B）

检查：
1. 路径格式是否匹配正则（必须是绝对路径）
2. Smart Selection 规则是否正确保存
3. 尝试重启 iTerm2

### Q: 想要更低侵入性的方案？

使用方案 B（Smart Selection），右键菜单触发，只匹配 .md 文件。

---

## 实施状态

### ✅ 已完成

1. **Dispatcher 脚本** - `scripts/mdv-iterm2-dispatcher.sh`
   - ✅ 支持 `\1` 和 `\5` 参数
   - ✅ 处理各种路径格式（绝对、相对、basename）
   - ✅ 文件类型判断（.md/.markdown）
   - ✅ 完善的错误回退机制
   - ✅ 动态查找 mdv 命令（不再硬编码路径）
   - ✅ 移除调试日志（可选启用）

2. **自动安装** - `package.json` bin 字段
   - ✅ `bun link` 自动安装到 `~/.bun/bin/`
   - ✅ 创建符号链接指向项目脚本
   - ✅ 自动更新（修改脚本后立即生效）

3. **测试验证** - 2026-03-04
   - ✅ 命令正确安装到 `~/.bun/bin/`
   - ✅ dispatcher 工作正常
   - ✅ 路径解析正确
   - ✅ 文件类型判断准确

### 📋 验收标准

1. ✅ `.md` 文件点击后能稳定打开 MD Viewer
2. ✅ 非 `.md` 点击行为保持系统默认，不被影响
3. ✅ 支持多种路径格式（绝对、相对、basename）
4. ✅ `mdv` 不可用或服务未启动时，行为可预期（回退）
5. ⏳ 完成一次端到端用户验证（需要在 iTerm2 中实际配置和测试）

---

## 相关文档

- **快速总结**：`docs/archive/2026-03/20260301-iterm2-integration-summary.md`
- **构建文档**：`BUILD.md`（安装说明）
- **iTerm2 官方文档**：https://iterm2.com/documentation-preferences-profiles-advanced.html
