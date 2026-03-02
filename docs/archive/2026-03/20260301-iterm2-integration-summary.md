# iTerm2 集成总结

## 快速开始

### 1. 安装
```bash
cd /path/to/md-viewer
bun link       # 注册包，安装 mdv 和 mdv-admin
bun install    # 触发 postinstall，安装 dispatcher
```

这会安装：
- `mdv` - CLI 客户端
- `mdv-admin` - 管理工具
- `mdv-iterm2-dispatcher` - iTerm2 dispatcher（到 ~/bin/）

### 2. 配置 iTerm2

**iTerm2 → Preferences → Profiles → Advanced → Semantic History**

选择 "Run command..." 并输入：
```
mdv-iterm2-dispatcher \1 \5
```

### 3. 测试

在终端运行：
```bash
echo "README.md"
ls docs/guide.md
find . -name "*.md"
```

**Cmd+点击** 任何 .md 文件路径，应该在 MD Viewer 中打开。

---

## 工作原理

### iTerm2 参数详解

iTerm2 Semantic History 提供 5 个参数：
- `\1` - 匹配到的路径
- `\2` - 行号（如果识别到）
- `\3` - 点击位置之前的文本
- `\4` - 点击位置之后的文本
- `\5` - 当前工作目录

**我们只用 \1 和 \5**，原因：
- `\1` - iTerm2 已经识别出文件路径（完整/相对/basename）
- `\5` - 提供工作目录，用于解析相对路径
- `\3` 和 `\4` - 大多数场景不需要

### 具体示例

**场景 1：完整路径**
```bash
# 终端输出: Found file: /Users/huanghao/project/docs/README.md
# Cmd+点击 README.md 时：
\1 = /Users/huanghao/project/docs/README.md
\5 = /Users/huanghao/project
# → 直接使用 \1
```

**场景 2：相对路径**
```bash
# 终端输出: docs/README.md
# Cmd+点击 README.md 时：
\1 = README.md
\5 = /Users/huanghao/project
# → 拼接: \5/\1 = /Users/huanghao/project/README.md
```

**场景 3：只有 basename**
```bash
# 终端输出: README.md
# Cmd+点击 README.md 时：
\1 = README.md
\5 = /Users/huanghao/project
# → 拼接: \5/\1 = /Users/huanghao/project/README.md
```

更多示例详见：`docs/design/20260301-iterm2-integration.md`

### Dispatcher 流程
```
Cmd+点击路径
    ↓
iTerm2 识别并传递 \1 和 \5
    ↓
mdv-iterm2-dispatcher 处理：
    ├─ 路径解析（相对→绝对）
    ├─ 检查扩展名
    ├─ .md/.markdown → mdv
    └─ 其他文件 → open（系统默认）
```

### 支持的路径格式
- ✅ 绝对路径：`/Users/huanghao/project/README.md`
- ✅ 相对路径：`docs/README.md`, `./README.md`
- ✅ Basename：`README.md`
- ✅ Home 路径：`~/Documents/README.md`

---

## 设计权衡

### 侵入性
- ⚠️ 会拦截所有 Cmd+点击
- ✅ 但脚本会判断文件类型
- ✅ 非 .md 文件使用系统默认行为

### 为什么这样设计？
1. **路径兼容性** - Agent 输出的路径格式多样，需要 `\5` 解析
2. **用户体验** - Cmd+点击比右键菜单快
3. **自动化** - `bun link` 一键安装

### 备选方案
如果您担心侵入性，可以使用 **Smart Selection**（右键菜单，精确匹配）。
详见：`docs/design/20260301-iterm2-integration.md`

---

## 文件位置

- **Dispatcher 脚本**: `~/bin/mdv-iterm2-dispatcher`
- **源文件**: `scripts/mdv-iterm2-dispatcher.sh`
- **安装脚本**: `scripts/install-iterm2-dispatcher.sh`
- **测试脚本**: `scripts/test-dispatcher.sh`

---

## 常见问题

### Q: 点击后没反应？
检查：
1. `which mdv` - 命令是否可用
2. `bun run dev` - 服务是否运行
3. `mdv /path/to/file.md` - 手动测试

### Q: 非 .md 文件也被劫持？
不会，dispatcher 会检查扩展名：
- `.md/.markdown` → mdv
- 其他 → open（系统默认）

### Q: 相对路径不工作？
确保配置中包含 `\5` 参数：
```
mdv-iterm2-dispatcher \1 \5
```

### Q: 想要更低侵入性的方案？
使用 Smart Selection（右键菜单）：
详见 `docs/design/20260301-iterm2-integration.md` 方案 B

---

## 相关文档

- **完整文档**: `docs/design/20260301-iterm2-integration.md`（设计+配置+示例）
- **构建文档**: `BUILD.md`（安装说明）
- **iTerm2 官方**: https://iterm2.com/documentation-preferences-profiles-advanced.html
