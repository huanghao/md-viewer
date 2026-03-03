# iTerm2 集成问题修复报告

**日期**: 2026-03-04
**状态**: ✅ 已修复

---

## 问题描述

iTerm2 集成功能在实际使用中发现以下问题：

1. **硬编码路径** - dispatcher 脚本中硬编码了 `MDV=/Users/huanghao/.bun/bin/mdv`
2. **调试日志污染** - 脚本中包含大量 `echo` 输出到 `/tmp/my.log`
3. **文档不一致** - 文档说安装到 `~/bin/`，但实际通过 bun link 安装到 `~/.bun/bin/`
4. **退出码问题** - iTerm2 报告命令返回非零退出码

---

## 修复内容

### 1. 修复 dispatcher 脚本

**文件**: `scripts/mdv-iterm2-dispatcher.sh`

**修改**:
- ✅ 移除硬编码的 `MDV` 变量
- ✅ 使用 `command -v mdv` 动态查找命令
- ✅ 移除所有调试日志输出
- ✅ 添加可选的调试日志机制（注释形式）

**修改前**:
```bash
MDV=/Users/huanghao/.bun/bin/mdv
echo "#1" >>/tmp/my.log
if command -v $MDV >/dev/null 2>&1; then
  echo "#3: $MDV $input" >>/tmp/my.log
  $MDV "$input" 2>/dev/null || open "$input"
fi
```

**修改后**:
```bash
# 调试日志（可选，取消注释以启用）
# DEBUG_LOG="/tmp/mdv-iterm2-dispatcher.log"
# echo "[$(date '+%Y-%m-%d %H:%M:%S')] input='$input' working_dir='$working_dir'" >> "$DEBUG_LOG"

if command -v mdv >/dev/null 2>&1; then
  mdv "$input" 2>/dev/null || open "$input"
fi
```

### 2. 修复退出码问题

**问题**: iTerm2 报告 "returned a non-zero exit code"

**原因**:
- dispatcher 脚本使用 `mdv "$input" 2>/dev/null || open "$input"`
- 在 `set -euo pipefail` 模式下，退出码处理不明确
- mdv CLI 成功时没有显式调用 `process.exit(0)`

**修复**:

**文件 1**: `scripts/mdv-iterm2-dispatcher.sh`
```bash
# 修改前
mdv "$input" 2>/dev/null || open "$input"

# 修改后
if ! mdv "$input" 2>/dev/null; then
  open "$input"
fi
# 确保成功退出
exit 0
```

**文件 2**: `src/cli.ts`
```typescript
// 修改前
await openFile(options.host, options.port, targetPath, shouldFocus);

// 修改后
await openFile(options.host, options.port, targetPath, shouldFocus);
process.exit(0);
```

### 3. 更新文档

**文件**: `docs/design/20260301-iterm2-integration.md`

**修改**:
- ✅ 更新安装说明，说明使用 `bun link` 自动安装
- ✅ 更正安装路径为 `~/.bun/bin/`
- ✅ 更新实施状态，添加修复记录
- ✅ 移除对 `install-iterm2-dispatcher.sh` 的依赖说明

---

## 验证测试

### 测试 1: 命令安装验证

```bash
$ which mdv mdv-admin mdv-iterm2-dispatcher
/Users/huanghao/.bun/bin/mdv
/Users/huanghao/.bun/bin/mdv-admin
/Users/huanghao/.bun/bin/mdv-iterm2-dispatcher
```

✅ **结果**: 所有命令正确安装到 `~/.bun/bin/`

### 测试 2: 绝对路径测试

```bash
$ mdv-iterm2-dispatcher /Users/huanghao/workspace/md-viewer/README.md /Users/huanghao/workspace/md-viewer
✅ 已添加并切换: README.md
```

✅ **结果**: 正常工作

### 测试 3: Basename 测试

```bash
$ mdv-iterm2-dispatcher BUILD.md /Users/huanghao/workspace/md-viewer
✅ 已添加并切换: BUILD.md
```

✅ **结果**: 正常工作

### 测试 4: 非 .md 文件测试

```bash
$ mdv-iterm2-dispatcher package.json /Users/huanghao/workspace/md-viewer
(无输出，调用系统 open)
```

✅ **结果**: 正确回退到系统默认行为

### 测试 5: 调试日志检查

```bash
$ cat /tmp/my.log 2>/dev/null || echo "日志文件为空或不存在"
(空)
```

✅ **结果**: 不再输出调试日志

### 测试 6: 退出码测试

```bash
$ /bin/sh -c 'mdv-iterm2-dispatcher /Users/huanghao/workspace/md-viewer/README.md /Users/huanghao/workspace/md-viewer'; echo "Exit code: $?"
✅ 已添加并切换: README.md
Exit code: 0
```

✅ **结果**: 退出码正确返回 0

---

## iTerm2 配置指南

### 步骤 1: 确认安装

```bash
# 在项目目录运行
bun link

# 验证安装
which mdv-iterm2-dispatcher
# 应该输出: /Users/huanghao/.bun/bin/mdv-iterm2-dispatcher
```

### 步骤 2: 配置 iTerm2

1. 打开 iTerm2 → **Preferences** (⌘,)
2. 选择 **Profiles** → 选择你的 Profile（或 Default）
3. 选择 **Advanced** 标签
4. 找到 **Semantic History** 区域
5. 选择 **Run command...**
6. 输入命令：
```
mdv-iterm2-dispatcher \1 \5
```

### 步骤 3: 测试

在终端运行：
```bash
# 测试 1: 绝对路径
ls -la ~/workspace/md-viewer/README.md

# 测试 2: 相对路径（在项目目录下）
cd ~/workspace/md-viewer
ls -la docs/design/

# 测试 3: find 输出
find . -name "*.md" | head -5

# 测试 4: grep 输出
grep -r "iTerm2" docs/
```

**Cmd+点击** 任何 `.md` 文件路径，应该在浏览器中打开 MD Viewer。

---

## 调试技巧

如果遇到问题，可以启用调试日志：

1. 编辑 `scripts/mdv-iterm2-dispatcher.sh`
2. 取消注释以下行：
```bash
DEBUG_LOG="/tmp/mdv-iterm2-dispatcher.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] input='$input' working_dir='$working_dir'" >> "$DEBUG_LOG"
```
3. 保存后立即生效（因为是符号链接）
4. 查看日志：
```bash
tail -f /tmp/mdv-iterm2-dispatcher.log
```

---

## 常见问题

### Q: 点击后没反应？

**检查清单**:
1. ✅ 确认 mdv-iterm2-dispatcher 命令存在：`which mdv-iterm2-dispatcher`
2. ✅ 确认 MD Viewer 服务运行：`curl http://localhost:3000/api/health`
3. ✅ 确认 iTerm2 配置正确：Preferences → Profiles → Advanced → Semantic History
4. ✅ 启用调试日志查看详细信息

### Q: 相对路径不工作？

**解决方案**:
- 确保配置中包含 `\5` 参数：`mdv-iterm2-dispatcher \1 \5`
- `\5` 提供当前工作目录，用于解析相对路径

### Q: 非 .md 文件也被劫持？

**不会**，dispatcher 会检查文件扩展名：
- `.md` 或 `.markdown` → 调用 mdv
- 其他文件 → 调用系统 open

---

## 总结

✅ **所有问题已修复**
- dispatcher 脚本不再硬编码路径
- 调试日志已清理
- 文档已更新为实际安装方式
- 测试验证通过

🎯 **下一步**
- 在 iTerm2 中配置 Semantic History
- 实际使用中验证功能
- 收集反馈，必要时调整

---

**修复人员**: Claude Sonnet 4.6
**修复日期**: 2026-03-04
