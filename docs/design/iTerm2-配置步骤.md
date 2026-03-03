# iTerm2 配置步骤 - 快速指南

**目标**: 在 iTerm2 中 Cmd+点击 .md 文件路径，直接在 MD Viewer 中打开

---

## 前置条件

✅ 已完成 - 命令已安装：
```bash
$ which mdv-iterm2-dispatcher
/Users/huanghao/.bun/bin/mdv-iterm2-dispatcher
```

---

## 配置步骤

### 1. 打开 iTerm2 Preferences

快捷键：`⌘,` (Command + 逗号)

### 2. 进入 Profile 设置

1. 点击 **Profiles** 标签
2. 选择你常用的 Profile（通常是 **Default**）
3. 点击 **Advanced** 标签

### 3. 配置 Semantic History

在 **Smart Selection** 区域下方，找到 **Semantic History**：

1. 点击下拉菜单
2. 选择 **Run command...**
3. 在输入框中输入：
```
mdv-iterm2-dispatcher \1 \5
```

**重要**:
- `\1` 是匹配到的文件路径
- `\5` 是当前工作目录（用于解析相对路径）
- 两个参数都必须包含

### 4. 保存配置

点击窗口底部的 **Close** 或直接关闭 Preferences 窗口，配置会自动保存。

---

## 测试验证

### 测试 1: 绝对路径

在终端运行：
```bash
ls -la ~/workspace/md-viewer/README.md
```

**Cmd+点击** `README.md`，应该在浏览器中打开 MD Viewer。

### 测试 2: 相对路径

```bash
cd ~/workspace/md-viewer
ls -la docs/design/
```

**Cmd+点击** 任何 `.md` 文件，应该在 MD Viewer 中打开。

### 测试 3: Find 输出

```bash
find . -name "*.md" | head -5
```

**Cmd+点击** 任何路径，应该在 MD Viewer 中打开。

### 测试 4: Grep 输出

```bash
grep -r "iTerm2" docs/
```

**Cmd+点击** 文件路径，应该在 MD Viewer 中打开。

### 测试 5: 非 .md 文件

```bash
ls -la package.json
```

**Cmd+点击** `package.json`，应该用系统默认程序打开（VSCode 或其他编辑器）。

---

## 预期效果

### ✅ 正常工作的情况

- **Cmd+点击 .md 文件** → 浏览器打开 MD Viewer
- **Cmd+点击其他文件** → 系统默认程序打开
- **支持的路径格式**:
  - 绝对路径：`/Users/huanghao/workspace/md-viewer/README.md`
  - 相对路径：`docs/README.md`
  - Basename：`README.md`（在正确的工作目录下）

### ⚠️ 需要检查的情况

如果点击后没反应：

1. **检查 MD Viewer 是否运行**：
```bash
curl http://localhost:3000/api/health
```
如果失败，在项目目录运行：`bun run dev`

2. **检查命令是否存在**：
```bash
which mdv-iterm2-dispatcher
```
如果不存在，在项目目录运行：`bun link`

3. **检查配置是否正确**：
   - 重新打开 iTerm2 Preferences
   - 确认命令是：`mdv-iterm2-dispatcher \1 \5`
   - 注意 `\1` 和 `\5` 之间有空格

---

## 高级配置（可选）

### 只在特定 Profile 中启用

如果你不想全局启用，可以：

1. 创建新的 Profile（如 "Dev"）
2. 只在这个 Profile 中配置 Semantic History
3. 其他 Profile 保持默认行为

### 启用调试日志

如果遇到问题，可以启用调试日志：

1. 编辑文件：`~/workspace/md-viewer/scripts/mdv-iterm2-dispatcher.sh`
2. 找到这两行：
```bash
# DEBUG_LOG="/tmp/mdv-iterm2-dispatcher.log"
# echo "[$(date '+%Y-%m-%d %H:%M:%S')] input='$input' working_dir='$working_dir'" >> "$DEBUG_LOG"
```
3. 删除前面的 `#` 取消注释
4. 保存后立即生效（符号链接会自动更新）
5. 查看日志：
```bash
tail -f /tmp/mdv-iterm2-dispatcher.log
```

---

## 常见问题

### Q: 配置后需要重启 iTerm2 吗？

不需要，配置立即生效。但如果遇到问题，可以尝试重启 iTerm2。

### Q: 会影响其他文件类型吗？

不会。dispatcher 脚本只处理 `.md` 和 `.markdown` 文件，其他文件使用系统默认行为。

### Q: 可以同时使用多个 Profile 吗？

可以。每个 Profile 可以有不同的 Semantic History 配置。

### Q: 如何恢复默认行为？

在 Semantic History 下拉菜单中选择 **Open with default app** 即可。

---

## 相关文档

- **完整设计文档**: `docs/design/20260301-iterm2-integration.md`
- **修复报告**: `docs/design/20260304-iterm2-integration-fix.md`
- **手动测试指南**: `docs/testing/20260301-iterm2-manual-test.md`

---

**配置完成后，享受便捷的 Markdown 浏览体验！** 🎉
