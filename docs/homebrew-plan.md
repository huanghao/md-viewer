# Homebrew 分发实施方案

**核心目标**: 用户通过 `brew install md-viewer` 安装，获得 `mdv` 命令

---

## 最终产物

```
/usr/local/bin/
├── mdv                    ← 60MB 无依赖二进制（CLI + Server）
└── mdv-iterm2-dispatcher  ← 4KB Shell 脚本
```

---

## mdv 命令功能

```bash
# 服务管理
mdv server start           # 前台运行（默认，Ctrl+C 停止）
mdv server start --daemon  # 后台运行
mdv server stop/restart/status
mdv logs [--tail N]        # 查看日志

# 文件操作
mdv <file>                 # 打开文件（自动启动服务）

# 运维统计
mdv stats                  # 服务器状态 + 同步记录 + 日志大小

# 评论功能
mdv comments list/get/stats

# 配置管理
mdv config [get|set]

# 数据清理
mdv cleanup                # 清理过期同步记录
```

---

## 技术方案

### 1. 架构

```
mdv (60MB 二进制) =
  ├── CLI 模块（命令解析）
  ├── Server 模块（HTTP 服务）
  ├── 前端资源（完全嵌入）
  │   ├── client.js (100KB)
  │   ├── CSS (内联)
  │   └── favicon.svg (内联)
  └── 数据存储（SQLite）
```

### 2. 服务管理

**前台模式（默认）**:
```typescript
// mdv server start
// 直接运行 server，阻塞在前台
await import("./server.ts");
```

**后台模式**:
```typescript
// mdv server start --daemon
// spawn 子进程，PID 文件管理
spawn(process.execPath, ["--internal-server-mode"], {
  detached: true,
  stdio: ["ignore", logFd, logFd]
});
```

### 3. 前端资源嵌入

**构建流程**:
1. `bun run build:client` → `dist/client.js`
2. `bun run scripts/embed-client.ts` → `src/client/embedded-client.ts`
3. `bun build --compile src/cli.ts` → `mdv` (60MB)

**嵌入内容**:
- ✅ client.js (100KB) - 通过 `embedded-client.ts`
- ✅ CSS - 内联在 `html.ts`
- ✅ favicon.svg - 内联在 `server.ts`
- ⚠️ CDN 依赖 - 保留（marked, mermaid, highlight.js）

### 4. 数据持久化

**位置**: `~/.config/md-viewer/`
```
~/.config/md-viewer/
├── config.json           # 用户配置
├── server.pid            # 服务器 PID（后台模式）
├── server.log            # 服务器日志
├── annotations.db        # 评论数据（SQLite）
└── sync-records.json     # 同步记录
```

---

## 实施任务

### Phase 1: 核心重构 ✅

- [x] 合并 cli.ts + cli-admin.ts
- [x] 实现服务管理（start/stop/restart/status）
- [x] 实现日志系统（输出到文件 + logs 命令）
- [x] 实现文件打开（自动启动服务）
- [x] 实现配置管理（config get/set）
- [x] 实现运维统计（stats：服务器+同步+日志）
- [x] 实现评论功能（comments list/get/stats）
- [x] 实现数据清理（cleanup）
- [x] 本地测试
- [x] 更新 package.json
- [x] 更新构建脚本

### Phase 2: 前端资源嵌入 ✅

- [x] 修改 server.ts 嵌入 favicon.svg
- [x] 创建 `scripts/embed-client.ts` 嵌入 client.js
- [x] 修改 `html.ts` 使用嵌入的脚本
- [x] 修改 `cli.ts` 支持前台/后台模式
- [x] 修改 `server.ts` 支持被 import 启动
- [x] 测试单一二进制（无外部文件依赖）
- [x] 测试独立运行（完全隔离目录）

### Phase 3: Homebrew Formula ✅

- [x] 创建 `Formula/md-viewer.rb`
- [x] 创建 `Formula/md-viewer-local.rb`（本地测试）
- [x] 创建 `scripts/package.sh`（打包脚本）
- [x] 创建 `scripts/update-formula-sha.sh`（更新 SHA256）
- [x] 定义下载 URL（GitHub Release）
- [x] 定义安装步骤
- [x] 本地测试安装（成功）
- [x] 创建 Formula README

### Phase 4: CI/CD ✅

- [x] `.github/workflows/release.yml` - 自动构建多平台二进制
- [x] 自动上传到 GitHub Release
- [x] 自动计算 SHA256
- [ ] 自动更新 Homebrew Formula（手动脚本已创建）
- [ ] 测试发布流程

### Phase 5: 发布

- [ ] 更新文档
- [ ] 打 v1.0.0 tag
- [ ] 验证安装

---

## 关键决策

1. **语言**: TypeScript（保持一致性）
2. **架构**: 单一二进制（CLI + Server）
3. **资源**: 完全嵌入（client.js + CSS + favicon）
4. **大小**: 60MB（可接受）
5. **服务**: 前台运行为主（符合容器化习惯）
6. **命令**: 合并所有功能到 `mdv`
7. **分发**: GitHub Release 直接提供二进制

---

## 当前状态

**Phase 1 & 2 已完成** ✅

### 核心功能
- ✅ 统一 CLI 实现（src/cli.ts，700+ 行）
- ✅ 所有功能完整（server/config/stats/comments/cleanup）
- ✅ 前端资源完全嵌入（client.js + CSS + favicon）
- ✅ 二进制大小 60MB（包含完整 server）
- ✅ 完全独立运行（无外部文件依赖）

### 服务管理
- ✅ 前台模式：`mdv server start`（默认，阻塞运行）
- ⚠️ 后台模式：`mdv server start --daemon`（有问题，待优化）
- ✅ 停止/重启/状态：完全正常

### 测试验证
- ✅ 帮助信息正常
- ✅ 前台 server 启动成功
- ✅ HTTP 服务正常响应
- ✅ 独立目录运行成功（无依赖）
- ✅ 构建流程完整

**Phase 3 & 4 已完成** ✅

### Homebrew 安装测试
- ✅ Formula 创建完成
- ✅ 本地 tap 测试成功
- ✅ `brew install` 安装成功
- ✅ 二进制运行正常
- ✅ Server 启动成功

### CI/CD
- ✅ GitHub Actions workflow 创建完成
- ✅ 多平台构建配置（darwin-arm64/x64, linux-x64/arm64）
- ✅ 自动打包和上传
- ✅ SHA256 自动计算

### 脚本工具
- ✅ `scripts/build-all.sh` - 构建脚本
- ✅ `scripts/package.sh` - 打包脚本
- ✅ `scripts/update-formula-sha.sh` - 更新 Formula SHA256
- ✅ `scripts/embed-client.ts` - 嵌入前端资源

**下一步**: Phase 5 - 发布 v0.1.0（打 tag 触发 CI）

## 发布流程

```bash
# 1. 构建和打包
./scripts/build-all.sh 0.1.0
./scripts/package.sh 0.1.0

# 2. 打 tag 触发 CI
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# 3. 等待 CI 完成后，更新 Formula
./scripts/update-formula-sha.sh 0.1.0
git add Formula/md-viewer.rb
git commit -m "chore: update formula for v0.1.0"
git push

# 4. 测试安装
brew tap huanghao/md-viewer
brew install md-viewer
```
