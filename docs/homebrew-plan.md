# Homebrew 分发实施方案

**核心目标**: 用户通过 `brew install md-viewer` 安装，获得 `mdv` 命令

---

## 最终产物

```
/usr/local/bin/
├── mdv              ← 60MB TypeScript 编译的二进制（统一 CLI）
└── mdv-iterm2-dispatcher  ← 2KB Shell 脚本
```

---

## mdv 命令功能

```bash
# 服务管理
mdv server start/stop/restart/status

# 文件操作（自动启动服务）
mdv open README.md
mdv README.md          # 简写

# 配置和统计
mdv config get/set
mdv stats
```

---

## 技术方案

### 1. 架构

```
mdv (60MB 二进制) =
  ├── CLI 模块（解析命令）
  ├── Server 模块（HTTP 服务）
  └── 前端资源（嵌入）
```

### 2. 实现方式

**src/cli-unified.ts** - 新的统一入口:

```typescript
#!/usr/bin/env bun

const command = process.argv[2];

switch (command) {
  case "server":
    handleServer(process.argv[3]); // start/stop/status
    break;
  case "open":
    ensureServerRunning();
    openFile(process.argv[3]);
    break;
  case "config":
    handleConfig(process.argv.slice(3));
    break;
  case "stats":
    ensureServerRunning();
    showStats();
    break;
  default:
    // 默认打开文件
    if (existsSync(command)) {
      ensureServerRunning();
      openFile(command);
    }
}
```

**服务管理**:

```typescript
// PID 文件: ~/.config/md-viewer/server.pid

function startServer() {
  // 启动后台服务
  const child = spawn(process.execPath, ["server"], {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
  writeFileSync(PID_FILE, String(child.pid));
}

function stopServer() {
  const pid = readFileSync(PID_FILE);
  process.kill(Number(pid));
}
```

**前端资源嵌入**:

```typescript
// src/server.ts
import clientHTML from "../dist-client/index.html" with { type: "text" };

app.get("/", (c) => c.html(clientHTML));
```

### 3. 编译

```bash
# 构建前端
bun run build:client

# 编译统一二进制
bun build --compile src/cli-unified.ts --outfile=mdv
```

---

## 实施任务

### Phase 1: 核心重构

- [ ] 创建 `src/cli-unified.ts`
- [ ] 实现服务管理（start/stop/status）
- [ ] 实现文件打开（自动启动服务）
- [ ] 前端资源嵌入到 server.ts
- [ ] 本地测试

### Phase 2: 构建系统

- [ ] `scripts/build-all.sh` - 多平台编译
- [ ] `scripts/package.sh` - 打包 tarball
- [ ] 本地安装测试

### Phase 3: Homebrew

- [ ] 创建 `Formula/md-viewer.rb`
- [ ] 创建 Tap 仓库
- [ ] 本地测试安装

### Phase 4: CI/CD

- [ ] `.github/workflows/release.yml` - 自动构建
- [ ] `.github/workflows/update-formula.yml` - 自动更新
- [ ] 测试发布流程

### Phase 5: 发布

- [ ] 更新文档
- [ ] 打 v1.0.0 tag
- [ ] 验证安装

---

## 关键决策

1. **语言**: TypeScript（保持一致性）
2. **架构**: 单一二进制（CLI + Server）
3. **资源**: 嵌入前端（无外部依赖）
4. **大小**: 60MB（可接受）
5. **服务**: 后台运行，PID 文件管理

---

## 下一步

开始 Phase 1，创建 `src/cli-unified.ts`？
