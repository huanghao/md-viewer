# iTerm2 集成手动测试指南

## 前提条件

1. ✅ 已安装命令：
```bash
which mdv                      # ~/.bun/bin/mdv
which mdv-iterm2-dispatcher    # ~/bin/mdv-iterm2-dispatcher
```

2. ✅ MD Viewer 服务正在运行：
```bash
# 在项目目录运行
bun run dev
```

3. ✅ 已配置 iTerm2 Semantic History：
   - iTerm2 → Preferences → Profiles → Advanced → Semantic History
   - 选择 "Run command..."
   - 命令：`mdv-iterm2-dispatcher \1 \5`

---

## 测试场景

### 场景 1：测试绝对路径

在终端运行：
```bash
echo "/Users/huanghao/workspace/md-viewer/README.md"
```

**操作**：Cmd+点击 `README.md`

**预期结果**：
- ✅ 浏览器打开 MD Viewer
- ✅ README.md 显示在文件列表中
- ✅ 内容正确显示

---

### 场景 2：测试相对路径

在项目目录运行：
```bash
cd /Users/huanghao/workspace/md-viewer
ls docs/design/
```

**操作**：Cmd+点击任何 `.md` 文件（如 `20260301-iterm2-integration.md`）

**预期结果**：
- ✅ 文件在 MD Viewer 中打开
- ✅ 路径正确解析

---

### 场景 3：测试 basename

在项目目录运行：
```bash
cd /Users/huanghao/workspace/md-viewer
echo "README.md"
```

**操作**：Cmd+点击 `README.md`

**预期结果**：
- ✅ 使用当前工作目录解析路径
- ✅ 文件正确打开

---

### 场景 4：测试 find 输出

在项目目录运行：
```bash
cd /Users/huanghao/workspace/md-viewer
find . -name "*.md" | head -5
```

**操作**：Cmd+点击任何路径（如 `./README.md` 或 `./docs/design/20260301-iterm2-integration.md`）

**预期结果**：
- ✅ 相对路径正确解析
- ✅ 文件在 MD Viewer 中打开

---

### 场景 5：测试 grep 输出

在项目目录运行：
```bash
cd /Users/huanghao/workspace/md-viewer
grep -n "iTerm2" docs/design/20260301-iterm2-integration.md | head -3
```

**操作**：Cmd+点击文件路径

**预期结果**：
- ✅ 文件打开
- ✅ 行号被识别（如果 iTerm2 支持）

---

### 场景 6：测试非 .md 文件

在项目目录运行：
```bash
cd /Users/huanghao/workspace/md-viewer
ls src/cli.ts
```

**操作**：Cmd+点击 `cli.ts`

**预期结果**：
- ✅ 使用系统默认应用打开（如 VSCode）
- ✅ 不会在 MD Viewer 中打开

---

### 场景 7：测试不存在的文件

在终端运行：
```bash
echo "/tmp/notfound.md"
```

**操作**：Cmd+点击 `notfound.md`

**预期结果**：
- ✅ 尝试用系统默认方式打开
- ✅ 不会报错或崩溃

---

## 验收标准

- [x] 绝对路径 .md 文件能正确打开
- [x] 相对路径 .md 文件能正确打开
- [x] Basename 能结合工作目录正确解析
- [x] 非 .md 文件使用系统默认打开
- [x] 不存在的文件有合理的错误处理
- [x] 多次点击不会重复添加文件（应该切换到已有文件）

---

## 故障排查

### 问题：点击后没反应

检查：
```bash
# 1. 检查命令是否存在
which mdv-iterm2-dispatcher

# 2. 检查服务是否运行
curl http://localhost:3000/api/health

# 3. 手动测试 dispatcher
~/bin/mdv-iterm2-dispatcher "/Users/huanghao/workspace/md-viewer/README.md" "/Users/huanghao/workspace/md-viewer"

# 4. 手动测试 mdv
mdv README.md
```

### 问题：非 .md 文件也被 MD Viewer 打开

检查 dispatcher 脚本：
```bash
cat ~/bin/mdv-iterm2-dispatcher | grep -A5 "检查文件扩展名"
```

应该看到：
```bash
if [[ "$input" =~ \.(md|markdown)$ ]]; then
```

### 问题：相对路径不工作

检查 iTerm2 配置：
- 确保命令是：`mdv-iterm2-dispatcher \1 \5`
- 注意：必须包含 `\5` 参数

---

## 成功标准

如果所有 7 个场景都通过，则 iTerm2 集成配置成功！✅
