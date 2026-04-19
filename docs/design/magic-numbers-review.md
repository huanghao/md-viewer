# Magic Numbers & 配置项 Review

> 目标：梳理代码中所有硬编码数值，建立清晰的配置分层模型。

---

## 配置分层模型

### 层一：启动配置（Launch Config）

写在 `~/.config/md-viewer/config.json`，服务启动时读取一次，**修改后需重启服务**。适合服务端行为、网络参数、系统级选项。

用点分 ID 标识，例如 `server.port`、`files.watchDebounce`。

### 层二：偏好设置（Preferences）

存在客户端 localStorage，**修改后立即生效，无需重启**。适合 UI 行为、显示选项、个人习惯。通过设置页面（Settings UI）操作。

同样用点分 ID 标识，例如 `ui.sidebarWidth`、`pdf.defaultScale`。

> **注意：** 目前 `config.json` 里的 `editor.fontSize/lineHeight` 属于偏好设置，但写在了启动配置里，且客户端并未读取——是死配置，需要清理或迁移。

---

## 启动配置（Launch Config）

`~/.config/md-viewer/config.json` 当前已有项：

| ID | 当前值 | 含义 | 状态 |
|----|--------|------|------|
| `server.port` | `3000` | HTTP 服务端口 | ✅ 已实现，支持 `PORT` 环境变量覆盖 |
| `server.host` | `127.0.0.1` | 监听地址 | ✅ 已实现，支持 `HOST` 环境变量覆盖 |
| `client.defaultFocus` | `true` | 打开文件时是否自动聚焦 | ✅ 已实现 |
| `client.theme` | `light` | 主题（light/dark/auto） | ✅ 已实现 |
| `editor.fontSize` | `14` | 字体大小 | ⚠️ 死配置，客户端未读取，需迁移到偏好设置 |
| `editor.lineHeight` | `1.6` | 行高 | ⚠️ 死配置，客户端未读取，需迁移到偏好设置 |
| `files.autoRefresh` | `true` | 文件变更时自动刷新 | ✅ 已实现 |
| `files.rememberOpenFiles` | `true` | 记住上次打开的文件 | ✅ 已实现 |

**可以新增的项：**

| ID | 建议值 | 含义 | 优先级 |
|----|--------|------|--------|
| `files.watchDebounce` | `300` ms | 文件变更聚合窗口 | 低（默认值已合理） |

**不需要配置的内部参数（保持硬编码）：**

| 位置 | 值 | 原因 |
|------|----|------|
| `src/server.ts` `idleTimeout` | `255` 秒 | Bun 框架参数，不是业务配置 |
| `src/file-watcher.ts` 轮询间隔 | `50` ms | 性能实现细节 |
| `src/utils.ts` `FILE_LIST_CACHE_TTL` | `30000` ms | 内部缓存策略 |
| `src/cli.ts` 启动轮询 | `500ms × 10` | CLI 实现细节 |

---

## 偏好设置（Preferences）

存于 localStorage，通过设置页面操作，改后立即生效。

### 当前已有（但设置页面 UI 不完整）

| ID | 位置 | 当前值 | 含义 |
|----|------|--------|------|
| `ui.sidebarWidth` | `SIDEBAR_DEFAULT_WIDTH` | `260` px | 左侧边栏默认宽度 |
| `ui.annotationSidebarWidth` | `ANNOTATION_WIDTH_DEFAULT` | `320` px | 右侧评论栏默认宽度 |
| `ui.density` | `annotation-density` | `default` | 评论列表密度 |
| `ui.fontScale` | `font-scale` | `1.0` | 正文字体缩放 |
| `workspace.pollInterval` | `workspacePollInterval` | `5000` ms | 工作区轮询间隔 |

### 建议新增

| ID | 建议值 | 含义 | 优先级 |
|----|--------|------|--------|
| `pdf.defaultScale` | `1.5` | PDF 默认缩放倍数 | 中（高分屏用户常需要调整） |
| `pdf.idleTimeoutMin` | `10` 分钟 | PDF viewer 闲置销毁时间 | 中（内存敏感场景） |
| `pdf.translationTimeout` | `5000` ms | 翻译 API 超时 | 低 |

### 不需要暴露为偏好设置的（保持硬编码）

这些是布局约束、动效参数或安全边界，暴露出去要么无意义要么有害：

| 位置 | 值 | 原因 |
|------|----|------|
| `SIDEBAR_MIN/MAX_WIDTH` | `220/680` px | 布局安全边界，不是偏好 |
| `ANNOTATION_WIDTH_MIN/MAX` | `260/540` px | 同上 |
| 响应式断点 | `900` px | 布局约束 |
| 主内容最小宽度 | `360` px | 布局约束 |
| Popover 尺寸、留白偏移 | 各种 px | 改了会破坏视觉对齐 |
| 动效时长（闪烁、提示） | `700/900/2000` ms | 用户不会调，徒增复杂度 |
| SSE 重连策略 | `10次/3s/30s` | 网络层实现细节 |
| 搜索结果上限 | `50` 条 | 性能保护边界 |
| 翻译缓存条数 | `10` 条 | 内存保护 |
| 单页内存估算 | `27` MB | 估算常量 |

---

## Z-Index 分层

### 当前状态（混乱）

数值跨度 50 到 10000，无语义命名，新增组件容易踩坑：

| z-index | 用途 |
|---------|------|
| `10000` | Find Bar |
| `9999` | Composer / Popover 浮窗 |
| `9998` | Quick Add 按钮 |
| `9000` | Settings Dialog overlay |
| `2601` | Quick Action Confirm |
| `2500` | Path Autocomplete |
| `2100` | Tab Manager Panel |
| `1000` | Monitor Panel / Font Scale Menu |
| `100` | Sidebar Floating Open Button |
| `90` | Annotation Floating Open Button |
| `81` | Annotation Sidebar Resizer |
| `80` | Annotation Sidebar |
| `50` | Doc Scrollbar |

### 问题说明

z-index 的作用是定义页面上各层 UI 的**堆叠顺序**——数字大的显示在数字小的上面。当多个浮层同时出现时（比如下拉菜单 + 评论弹窗），必须明确谁盖谁。

当前的问题：数值是随手写的，没有语义，新加一个组件时不知道该用多少，容易出现"被意外遮住"或"意外盖住别人"的 bug。

### 建议：统一为命名常量

在 `src/client/css.ts` 顶部定义一套 CSS 变量，语义清晰，后续新增组件直接用名字而不是猜数字：

```css
:root {
  --z-scrollbar: 50;
  --z-sidebar: 80;
  --z-sidebar-resizer: 81;
  --z-floating-btn: 90;       /* 侧边栏浮动展开按钮 */
  --z-dropdown: 1000;         /* 下拉菜单、浮窗 */
  --z-tab-manager: 2100;
  --z-autocomplete: 2500;
  --z-quick-action: 2601;
  --z-overlay: 9000;          /* 模态遮罩 */
  --z-popover: 9998;          /* 评论浮窗、Quick Add */
  --z-find-bar: 10000;
}
```

---

## 设置页面现状与问题

`src/client/ui/settings.ts` 目前有一个设置弹窗，但比较混乱：

- 内容堆砌，没有分组
- 部分偏好设置（字体缩放、侧边栏宽度）散落在工具栏和 localStorage 里，没有统一入口
- `config.json` 的 `editor.fontSize/lineHeight` 是死配置，与实际 UI 脱节

**建议下一步：先整理设置页面结构，再做 UI 设计。** 可以按上面的分层模型组织：

```
设置
├── 外观
│   ├── 主题（light/dark/auto）
│   ├── 字体大小（偏好设置，热生效）
│   └── 正文行高（偏好设置，热生效）
├── 布局
│   ├── 左侧边栏默认宽度（重置按钮）
│   └── 右侧评论栏默认宽度（重置按钮）
├── PDF
│   ├── 默认缩放倍数
│   └── 闲置销毁时间
├── 工作区
│   └── 轮询间隔
└── 服务（需重启）
    ├── 端口
    └── 监听地址
```

---

## 待办

- [ ] 清理 `config.json` 中的死配置 `editor.fontSize/lineHeight`，或通过 `/api/config` 注入到客户端
- [ ] 整理设置页面结构（先梳理再做 UI 设计）
- [ ] Z-Index 统一为 CSS 变量命名常量
- [ ] `pdf.defaultScale` 加到偏好设置（有 UI 入口）
