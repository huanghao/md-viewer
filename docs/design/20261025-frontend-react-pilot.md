# 前端迁移到 React：目标与试点设计

状态：试点进行中（已按「一步一步、测试保持通过」推进，进度见第 10 节）。试点通过前不改 `AGENTS.md`。

## 1. 背景

前端约 1.6 万行手写 TypeScript，直接拼 `innerHTML` 并手动维护 DOM：

- 76 处 `innerHTML` 整块赋值、214 个 `addEventListener`、117 个模块级 `let` 状态。
- 没有「数据没变就不更新」的机制，重绘范围和数据变化范围需要人工对齐。

已出现的同类问题：

- 增删改评论会调用 `renderAnnotationList`，它在 Agent tab 激活时会顺带重载 Agent 对话（先显示「加载中…」再重绘），表现为面板抖动。已用「路径没变就不重载」临时修复，但结构问题还在。
- 重绘评论列表时要手动保存和恢复回复框草稿。
- 循环导入靠 `initXxx(deps)` 回调注入绕开，`AGENTS.md` 里专门有规则。

项目已长期维护（1000+ 提交），「手写 DOM 起步轻」不再是充分的理由。

## 2. 决定

**目标终态：整个前端由 React 承载**，渐进迁移，不长期维持「手写 DOM + React」两套并存。共存只是迁移过渡期，每迁一块就删掉对应的手写代码。

迁移策略：

- 先用 Agent 面板做试点，验证方案、桥接方式和收益。
- 试点通过后，**新增 UI 一律用 React 写**，不再新增手写 DOM 面板；既有手写部分按优先级逐块迁移。
- 不整体重写：每一步都能独立发布、独立回退。

选 React 而不是 Preact，理由：

- 本项目是 localhost 工具，前端打进本地可执行文件，几十 KB 的体积差异没有影响。
- 生态、文档、问答最全，代码由 agent 维护时出错率更低。
- 需要时可直接用成熟的第三方组件（拖拽排序、虚拟列表等）。

## 3. 迁移范围与顺序

| 阶段 | 区域 | 说明 |
|---|---|---|
| 试点 | Agent 面板 | 状态清晰，与文档内容区几乎无耦合 |
| 第二阶段 | 设置页、侧边栏（文件树、tab 条、最近视图）、工具栏、状态栏 | 典型状态驱动 UI，收益最大 |
| 第三阶段 | 评论列表与浮窗 | 依赖锚点位置计算，与文档内容区耦合，放在外围都迁完之后 |
| 最后 | 文档内容区、Diff 视图、PDF 查看器 | 见下 |

文档内容区、Diff 视图、PDF 查看器的特殊性：内容由 `marked` / pdfjs 命令式生成，批注高亮直接在这段 DOM 上打标记，框架不能接管其内部节点。终态是「**React 管外壳，命令式管内部**」：由一个 React 组件持有容器节点（`ref`），在 effect 里调用现有的渲染与批注代码，内部 DOM 不交给 React 渲染。这样 `main.ts`、`init.ts` 这类手写的装配代码最终可以删除，而内容渲染与批注逻辑保持原样。

不做的事：不引入路由、不引入 SSR、不整体重写、不做与迁移无关的重构。

## 4. 试点：Agent 面板

### 4.1 现状

`src/client/agent-runner.ts`（约 800 行）直接操作 `public/index.html` 里 `#annotationAgentTab` 下的固定节点：

- 模块级状态：`currentDocPath`、`currentSessionId`、`activeRunId`、`liveMessages`、`pastRuns`、`agentBackends` 等。
- `renderMessages`、`renderStats`、`renderSessionSelect`、`renderEngineSelect`、`renderChatChips`、`renderTray` 各自写 `innerHTML`。
- 外部入口只有三个：`onAgentTabActivated(path)`、`handleAgentProgressEvent`、`handleAgentRunStatusEvent`，后两个由 `sse-connection.ts` 调用。

### 4.2 目标结构

```
src/client/agent/
  store.ts          外部状态 + reducer（纯函数，可单测）
  AgentPanel.tsx    根组件，挂载到 #annotationAgentTab
  Messages.tsx      消息流
  Composer.tsx      输入框、chips、引擎/模型选择、发送
  SessionBar.tsx    会话菜单、统计条
  mount.ts          createRoot + 对外导出的三个入口
```

- `store.ts` 持有现有模块级状态，提供 `getSnapshot` / `subscribe`，组件用 `useSyncExternalStore` 读取。
- 流式事件（`handleAgentProgressEvent` 等）改成 dispatch action，由 reducer 产生新状态；组件只订阅自己用到的切片。
- `mount.ts` 保持对外三个入口函数签名不变，`annotation.ts` 和 `sse-connection.ts` 无需改动。
- `public/index.html` 里 `#annotationAgentTab` 的内部节点改为由 React 渲染，外层容器和 tab 切换逻辑保持原样。

### 4.3 与手写部分的桥接

- 进入：沿用现有调用（`onAgentTabActivated`、SSE 回调）。
- 出去：通过现有 `CustomEvent`（如评论刷新）或 `initXxx(deps)` 注入的回调，不让组件直接 import 手写 UI 模块，避免循环依赖。
- 全局输入约定（Emacs 键、Cmd+Enter 提交）由 `utils/input-keys.ts` 在 `document` capture 阶段统一处理，对 React 渲染的 `textarea` 同样生效，不在组件里重复实现。提交判断使用 `isSubmitKey`。

### 4.4 构建

- esbuild 开启 JSX：`jsx: 'automatic'`，`tsconfig.json` 增加 `"jsx": "react-jsx"`。
- 新增依赖：`react`、`react-dom`、对应 `@types`。
- 输出仍是单个 `dist/client.js`，不改变产物结构。

### 4.5 副作用与清理

- SSE 订阅仍由 `sse-connection.ts` 持有，不进组件 effect，避免 StrictMode 开发期 effect 双跑造成重复订阅。
- 组件内的 effect（定时器、`ResizeObserver` 等）必须写清理函数。
- 运行中计时器（`runningTicker`）改为组件内 effect，由 `activeRunId` 驱动。

## 5. 成功标准

试点完成后逐条检查，全部满足才继续迁移其他面板：

1. 评论的增删改、解决、同步不再触发 Agent 对话重载（从结构上消失，不依赖「路径没变」这类判断）。
2. 流式输出时输入框内容、光标、选区、滚动位置不被打断。
3. `agent-runner` 相关逻辑的代码量明显减少，且 reducer 有单测。
4. 与手写部分的桥接点不超过现有的三个入口加少量事件，没有新增循环导入。
5. `bun test tests/unit` 与 `bun run build` 通过，产物体积增长在可接受范围。

## 6. 回退

试点期间只替换 Agent 面板的内部实现，外部入口签名不变。不满足成功标准时，回退为恢复 `agent-runner.ts` 与 `index.html` 中对应节点，删除 `src/client/agent/` 与依赖，不影响其他模块。

## 7. 风险

| 风险 | 对策 |
|---|---|
| 流式输出频繁更新导致重渲染过多 | reducer 追加消息时保持旧消息对象引用不变，消息项用 `React.memo` |
| 与手写部分共存时状态来源不一致 | 状态只放在 `store.ts`，手写代码通过三个入口读写，不直接改 DOM |
| 迁移期出现行为回归 | 先为现有消息渲染、会话恢复、运行中重连补测试，再迁移 |
| 开发期 StrictMode 双跑 effect | SSE 不进 effect；其余 effect 写清理 |

## 8. 若试点通过，`AGENTS.md` 需要同步的规则

- 「Frontend Rules」：新增 UI 用 React 组件、props、`useSyncExternalStore`；既有手写 DOM 部分在迁移完成前仍遵守 `data-action` 事件委托，迁完即删除这条规则。
- 「Import Boundaries」：组件不直接 import 手写 UI 模块，跨边界走事件或注入回调。
- 新增一条：不再新增手写 DOM 面板。
- 「Removed Feature Boundary」不变：Agent 面板仍限定为针对当前文档评论的批量运行器。

## 9. CSS 与设计 token

### 9.1 现状（2026-10-25 统计，token 归位之前）

- 没有使用 CSS 框架（无 Tailwind、Bootstrap、Sass、PostCSS）。
- 样式是一个手写的 `src/client/styles.css`（约 4500 行），外加 `vendor-github-markdown.css`、`vendor-highlight-github.css`；文档内容区在 Shadow DOM 里，使用 `src/client/themes/` 的 Markdown 主题和代码高亮主题，与应用样式隔离。
- 有一套**不完整**的 token，定义在 `:root`：
  - 颜色 12 个（`--color-text-primary`、`--color-border`、`--color-accent`、`--color-error` 等）。
  - 字号只有 `--text-xs`（11px）、`--text-sm`（13px）两档。
  - 圆角 3 档（`--radius-sm/md/lg`），z-index 一组。
  - **没有**间距、阴影、字重、行高、动效、深色模式的 token。
- 使用情况：约 666 处 `var(--…)` 引用，但仍有约 447 处硬编码颜色、约 84 处直接写 px 的字号（10/11/12/14px 混用）、多种圆角取值（1/2/3/4/5/999px），以及 42 处内联 `style`。
- `docs/design/visual-design-standard.md` 是 2026-04 的视觉审计，列出了按钮高度、圆角混用等不一致，尚未落实为统一规范。

### 9.2 方向：React + Tailwind，token 先行

CSS 方案定为 **Tailwind CSS v4**，与 React 迁移配合。顺序上 token 必须先稳住，否则迁一块就复制一次硬编码。

1. **token 是唯一真相源**：所有设计值定义为 `src/client/tokens.css` 里 `:root` 的 CSS 变量。Tailwind v4 的 `@theme` 直接引用这些变量，utilities（`bg-surface`、`text-sm`、`rounded-md`）生成时读取同一份值，不在 Tailwind 配置里另写一套数值。
2. **不启用 Tailwind 的 preflight**：只引入 theme 与 utilities，不引入全局 reset。现有 `styles.css` 里有 `* { margin:0; padding:0 }`、按钮、表单等基础样式，preflight 会与之冲突并改变存量页面外观。
3. **新增和被迁移的组件用 Tailwind 类名**，不再往 `styles.css` 添加规则；迁完的区域同步删除对应的全局规则，`styles.css` 随迁移变小。
4. **文档内容区的主题**（`themes/`，在 Shadow DOM 内）保持独立，不并入应用 token，也不应用 Tailwind；边界处只约定少量共享变量。
5. **间距**：存量 CSS 里的 padding/margin/gap 不做批量替换（`padding: 4px 8px` 这类简写替换价值低、风险高）；Tailwind 的 `--spacing` 基准取 4px，新组件用 `p-2` 这类工具类。
6. **深色模式**：token 为每个语义色预留同名变量，通过 `:root[data-theme="dark"]` 覆盖，组件只用语义色，不写具体颜色。该工作单独立项，不阻塞迁移。

### 9.3 token 阶段进展

**已完成：第 1 步，零视觉变化的 token 归位**

- 新增 `src/client/tokens.css`，把原先 `styles.css` 里的 `:root` 搬入，并追加只含「代码里已有字面量」的 token：`--color-surface`、`--color-text-inverse`、`--color-accent-a8/a10/a12`、`--text-2xs/md/lg`、`--radius-xs/pill`。
- 按语义做精确替换：文字色 token 只替换 `color` 属性，边框 token 只替换 `border*`/`outline*`，背景 token 只替换 `background*`，避免「值相同但语义不对」。共替换 168 处。
- 校验：把新旧 CSS 中的 `var()` 全部展开成字面量并规范化后逐字比较，完全一致，视觉零变化。
- `main.ts` 在 `styles.css` 之前引入 `tokens.css`。

**待做：第 2 步，需要视觉评审的合并**（会改变外观，不能机械完成，需要逐项确认）

- 灰色：存量有 161 种不同的 hex，其中灰阶就有 `#999 #aaa #bbb #8b949e #6a737d #e5e7eb #d1d5db #f0f0f0 #eee` 等十几种近似值，需要收敛到一个灰阶。
- 字号：`12px` 出现 16 次，位于现有 `--text-xs`（11px）与 `--text-sm`（13px）之间，需要决定并入哪一档或新增一档。另有 9/15/18/20px 少量用法。
- 圆角：3/5/1px 等零散取值收敛到现有档位。
- 阴影与动效：补 `--shadow-*`、`--duration-*`、`--ease-*` 并替换重复写法。
- 硬编码颜色：剩余约 280 处 hex 字面量，随组件迁移时就地换成语义色。

**配色（2026-10-27）**：最终采用 english-coach 的配色（暖灰中性色 + 单一蓝色强调色，深色为偏绿的深灰），颜色 token 精简到 33 个（强调色透明度、success 两档、accent-strong、mark 副色等合并）。下面是深色模式的实现记录。

**深色模式（跟随系统，2026-10-27）**：`tokens.css` 加了 `color-scheme: light dark` 与 `@media (prefers-color-scheme: dark)` 覆盖块；`styles.css` 里约 240 处颜色字面量按语义（文字/背景/边框的灰阶、accent/error/success/warning 色系、批注「纸色」`--mark-*`、diff 强调色、滚动条）并入变量，灰阶因此有轻微合并（浅色外观可能有极小色差）；正文换用 github-markdown-css 5.9.0 官方 auto 版（变量 + 深浅两套）；代码主题「GitHub」改为跟随系统；Notion / Bear 主题各加深色块。保留不变的是与模式无关的遮罩、深色提示条和 PDF 画布。

### 9.4 验收

- token 覆盖颜色、字号、圆角、阴影、动效，并有深色模式的变量位。
- 新增和被迁移的组件样式里没有颜色、字号的字面量。
- `styles.css` 随迁移同步变小。

## 10. 实施顺序

1. ~~token 归位（零视觉变化）~~ 已完成，见 9.3。
2. ~~补 `agent-runner` 现有行为的测试~~ 已完成：`tests/unit/agent-runner.test.ts`（只看 DOM 输出与发出的请求）。
3. ~~加依赖与构建配置~~ 已完成：react 19、tailwind v4（`src/client/tailwind.css`：无 preflight、无默认主题、颜色/字号/圆角用 `@theme inline reference` 映射到 tokens.css、只扫描 `*.tsx`）；`build.ts` 用 esbuild 的 `jsx: 'automatic'`，Tailwind 产物追加到 `client.css`，页面仍只引一个样式文件。冒烟测试 `react-smoke.test.tsx`。
4. ~~抽出 `store.ts` 和 reducer~~ 已完成：`src/client/agent/store.ts`（纯 reducer，`agent-store.test.ts`），`agent-runner.ts` 的模块级状态全部改为读写 store。
5. 逐块替换为组件（Messages → SessionBar → Composer）。
   - ~~Messages、Stats~~ 已完成：沿用原 class 名与 DOM 结构，视觉不变；容器节点保留，React 只接管内部。
   - ~~SessionBar~~ 已完成：菜单开合是组件内部状态，点外部关闭，新建/切换成功后关闭。
   - ~~Composer、StatusLine~~ 已完成：输入框保持非受控（撤销栈、Emacs 键、输入法依赖浏览器原生行为）；chips、引擎/模型/思考强度（`useEngine`）、发送（`actions.ts`）、拖拽调高、运行计时全部是组件逻辑。托盘（`Tray.tsx`）：存储仍在 `agent-tray.ts`（加了订阅通知，编辑草稿不通知以免丢光标），视图是组件；空托盘不渲染。划词弹出的「加入托盘」小浮窗（`#agentTrayComposer`）属于评论浮窗，随第三阶段迁移。
   - 后台重载（评论增删、同文档再激活）时，已有内容不再闪「加载中…」，数据到了直接替换。
   - 注意：工具类位于 `@layer utilities`，存量无层样式优先级更高，新组件要用新的类名组合，不能指望工具类覆盖旧 `.agent-*` 规则。
6. ~~删除旧的 `render*` 函数和 `index.html` 中对应静态节点~~ 已完成：`agent-runner.ts` 从约 800 行缩到约 130 行，只剩会话加载与 SSE 入口，不再碰 DOM；`annotation-layout.ts` 中已无用的 Agent 元素引用也已删除。
7. 按第 5 节检查，决定是否进入第二阶段；同时处理 9.3 第 2 步的视觉合并。

**第二阶段进度**
- ~~状态栏~~ 已完成（2026-10-29）：`src/client/statusbar/`（`store.ts` 外部状态、`StatusBar.tsx` 组件），`statusbar.ts` 对外两个入口函数签名不变，`init.ts` 里 `mountStatusbar()` 挂载；`index.html` 里 `#statusbar` 改为空容器。测试 `statusbar.test.tsx`。
- ~~设置/偏好~~ 已完成（2026-10-31）：`src/client/preferences/`。`controller.ts` 管开合、标签页、保存与取消（无 React 依赖）；`PreferencesDialog.tsx` 管外壳与导航；四个标签页各自组件，保存逻辑由标签页通过 `registerPreferencesSaver` 注册。`ui/preferences.ts` 只负责首次挂载，对外入口不变（`init.ts` 的 Escape 改用 `isPreferencesOpen()`，不再查 DOM）。测试 `preferences.test.tsx`。
  - 保留的既有行为：取消会还原主题预览；点击遮罩或 × 关闭不还原；快捷键改动即时写入，与保存无关。
  - 「清空评论状态」按钮（空实现）已删除，连同 `POST /api/annotations/clear`，用户确认从未使用。
  - 有意的小改动：评论标签页保存失败时弹出错误提示并保持对话框打开（原来是未捕获的异常）。
- ~~工具栏~~ 已完成（2026-11-01）：`src/client/toolbar/`（`store.ts` 状态与 setter，`Toolbar.tsx` 组件）；`toolbar.ts` 的 `mountToolbar(deps)` 注入动作。面包屑、复制按钮、缩放输入框（聚焦时草稿、Enter 提交、Esc 放弃）、Diff/刷新、PDF 模式按钮全部由 React 渲染。各模块改为调用 store setter，不再写 DOM。`main-actions.ts` 中工具栏的 data-action 分支已删除。测试 `toolbar.test.tsx`，`zoom-controller.test.ts` 改为断言 store。
- ~~文档标签栏~~ 已完成（2026-11-01）：`src/client/tabs/`（`store.ts` 快照，`TabStrip.tsx` 组件，`drag.ts` 拖拽）；`tabs.ts` 的 `mountTabStrip(deps)` 注入动作，并负责 `#tabs` 容器的显隐。`renderTabs()` 只计算快照并推送。拖拽保持原有指针事件逻辑（幽灵元素与让位动画仍是命令式 DOM），管理面板的开合状态在组件内，点击外部关闭。测试 `tab-strip.test.tsx`（拖拽未做自动化测试，需人工在浏览器确认）。
- ~~侧边栏头部（搜索框、视图切换）~~ 已完成（2026-11-02）：`src/client/sidebar/`（`store.ts` 保存当前 tab 与搜索词，`SidebarHeader.tsx` 含 `SearchBox` 与 `ViewTabs`）；`sidebar-header.ts` 的 `mountSidebarHeader(deps)` 注入动作。`renderSidebar` 只推送 store。搜索词写入统一经过 `setSidebarSearchQuery`，JSON 文件的内容高亮在清空时也会刷新（原来只在输入时刷新）。路径补全仍用 `attachPathAutocomplete`，挂一次。死掉的 `#currentPath` 与 `renderCurrentPath` 已删除；`sidebar:set-tab` 事件无人派发，一并删除。`looksLikePathInput` 收敛到 `utils/path-input.ts`。测试 `sidebar-header.test.tsx`；键盘与输入的整体行为在真实浏览器里用 CDP 验证（happy-dom 下 input 的键盘事件派发不到 React，所以按键判断抽成了纯函数）。
- ~~侧边栏“打开”视图（文件列表）~~ 已完成（2026-11-02）：`src/client/file-list/`（`store.ts` 快照，`model.ts` 行数据，`drag.ts` 纵向拖拽，`FileList.tsx` 组件）；`file-list.ts` 的 `mountFileList(deps)` 挂到 `#openFileList`。`renderFiles` 只计算快照。行的 class、`data-action` 与原 `renderFileRow` 输出一致，点击与关闭仍由 `ui/sidebar` 的委托处理。行状态抽到 `utils/file-row-status.ts`，与仍在用的 `renderFileRow` 共用。`#fileList` 保留为滚动容器，里面分两个子容器：`#openFileList`（React）与 `#workspaceList`（工作区仍是 HTML 字符串），按视图切换显隐。测试 `file-list.test.tsx`；拖拽、关闭、固定、视图切换用 CDP 真实鼠标事件验证。
- ~~侧边栏工作区视图（工作区树）~~ 已完成（2026-11-06）：`src/client/workspace-tree/`（`store.ts` 只是重绘信号，`WorkspaceTree.tsx` 渲染）；`workspace-tree.ts` 的 `mountWorkspaceTree(deps)` 挂到 `#workspaceList`。`ui/sidebar-workspace.ts` 的字符串渲染换成 `buildWorkspaceViewModels(query)`，搜索、缺失文件、树状态的判断逻辑原样保留。DOM 与 `data-action` 不变，点击、展开、删除确认仍走原委托。文件行复用 `file-list/FileRow.tsx`。测试 `workspace-tree.test.tsx`；添加、展开、目录折叠、点文件、搜索、删除经 CDP 验证。
- ~~focus 视图~~ 已完成（2026-11-06）：`src/client/focus-view/`（`store.ts` 重绘信号，`FocusView.tsx` 渲染筛选栏、弹层、分组与行）；`focus-view.ts` 的 `mountFocusView(deps)` 挂到 `#focusList`。`ui/workspace-focus.ts` 只保留数据与事件：`buildFocusView()` 返回视图模型，扫描调度移到 `prepareFocusView()`（渲染前调用）。行组件复用 `file-list/FileRow.tsx`（新增可选 `timeText`）。`ui/file-row.ts` 已删除（无调用方）。两处重绘信号共用 `utils/render-signal.ts`。测试：`workspace-focus-logic.test.ts` 改为断言视图模型。筛选、弹层、折叠、点击文件经 CDP 验证。
- ~~文件添加确认条~~ 已完成（2026-11-06）：`src/client/add-confirm/`（`store.ts` 显示状态与回调，`AddConfirmBar.tsx` 渲染）；`add-confirm.ts` 的 `mountAddConfirmBar()` 挂到 `#quickActionConfirmHost`。`file-switcher.ts` 的 `showAddConfirm` / `clearAddConfirm` / `isAddConfirmVisible` 签名不变，内部改为调用 store。保留 `#quickActionConfirm` id 与 body 上的 `quick-action-confirm-visible`，它们被点击检测和路径补全依赖。测试 `add-confirm.test.tsx`；错误、目录、普通文件、取消、Escape 经 CDP 验证。
- ~~“添加工作区”对话框~~：删除。`showAddWorkspaceDialog` 没有任何调用方，对话框无法打开；添加工作区实际走确认条（`kind: 'add-workspace'`）。同时删除了它专用的 CSS 与 Escape 分支。
- 阶段 2（设置、状态栏、工具栏、标签栏、侧边栏）到此完成。

**第三阶段进度**（评论、浮窗、Agent 托盘）
- ~~评论列表（侧边栏 comments 标签的卡片）~~ 已完成（2026-11-07）：`src/client/annotation-list/`（`store.ts` 保存视图、正在编辑的条目与回复草稿；`model.ts` 把排序后的评论转成行数据；`layout.ts` 为 default 密度的重叠消解；`AnnotationList.tsx` 渲染）；`annotation-list.ts` 的 `mountAnnotationList()` 挂到 `#annotationList`，`annotation.ts` 的 `renderAnnotationList` 只计算视图并推送 store。
  - 标记结构与 class 不变，行内操作、点击激活、上下条跳转仍由容器上的委托处理。
  - 回复输入框改为组件内状态，草稿放在 store 里，列表重建后保留；提交（Cmd+Enter）在组件内完成，不再经委托。
  - 评论条目的编辑从原地改写 DOM 改为 store 驱动（`startThreadItemEdit` / `commitThreadItemEdit` / `stopThreadItemEdit`）。Esc 取消、Cmd+Enter 保存、焦点移到同一卡片内不取消，行为不变。
  - 浮窗（popover）里的评论仍是字符串渲染，它的编辑仍走 `editThreadItem`（原地改写），待浮窗迁移时一并删除。
  - 有意的小改动：筛选后为空或无评论时，容器的 `default-mode` 类会被移除（原来保留）。
  - 测试 `annotation-list.test.tsx`；简洁/默认两种密度、编辑保存与取消、回复提交、草稿保留、深色模式经 CDP 真实浏览器验证。
- ~~评论浮窗正文~~ 已完成（2026-11-07）：`src/client/annotation-popover/`（`store.ts` 保存当前评论、正在编辑的条目与回复草稿，`PopoverNote.tsx` 渲染）；`annotation-popover.ts` 的 `mountPopoverNote()` 挂到 `#popoverNote`。标题、按钮、拖拽、定位仍在 `annotation.ts`，`showPopover` 只调用 `popoverNoteStore.show`。
  - 线程与回复输入与列表共用 `annotation-list/thread-view.tsx`（`ThreadLines`、`ReplyEntry`），列表与浮窗的结构、class、`data-*` 保持一致。
  - 浮窗每次渲染从 `state.annotations` 取最新评论，后台保存替换对象后不会显示旧数据。
  - 旧的字符串渲染 `renderThreadListHTML` 与原地编辑 `editThreadItem` 已删除，浮窗与列表都走 store 驱动的编辑。
  - 测试 `annotation-popover.test.tsx`；打开、编辑保存、回复提交、草稿在切换后保留、Escape 取消经 CDP 真实浏览器验证。
- ~~划词浮层（快捷入口、评论输入、Agent 托盘输入）~~ 已完成（2026-11-07）：`src/client/annotation-composer/`（`store.ts` 保存快捷入口模式、两个草稿与聚焦请求，`QuickAdd.tsx`、`Composer.tsx` 渲染）；`annotation-composer.ts` 的 `mountAnnotationComposer(deps)` 挂到三个静态容器。显隐、定位（`placeFloating`）仍在 `annotation.ts`。
  - 三个容器（`#annotationQuickAddWrap`、`#annotationComposer`、`#agentTrayComposer`）在 HTML 中为空，内容全部由 React 渲染；原来的 id 保留。
  - 草稿放在 store 中：快捷评论点击、保存、取消、Escape 都经 store 读写，不再读写 DOM 的 textarea。
  - 拖拽改为绑定在面板上、按标题栏选择器匹配（标题栏由 React 渲染，挂载时可能还不存在）；评论浮窗同样改用这一方式。
  - 测试 `annotation-composer.test.tsx`；划词→写评论→Cmd+Enter 保存、Agent 标签页下的托盘输入、两个浮层的拖拽，经 CDP 真实浏览器验证。
- 尚未迁移：选区标记（`applyTempSelectionMark` 等会包裹正文文字的节点）。它直接改写正文 DOM，留到第四阶段处理。

**第四阶段进度**（外壳 + 命令式内部）
- ~~文档内容区外壳~~ 已完成（2026-11-07）：`src/client/content-shell/ContentShell.tsx` 持有 `#content`，不渲染任何子节点；`content-shell.ts` 的 `mountContentShell()` 用 `flushSync` 同步挂载，并在 `renderContent` 之前调用。内容仍由 `content-renderer.ts` 命令式维护。测试 `content-shell.test.tsx`；Markdown 渲染与占位清空经 CDP 验证。
- ~~Diff 横幅~~ 已完成（2026-11-07）：`src/client/diff-banner/`（`store.ts` 保存可见性、模式、导航计数与按钮可用性，`DiffBanner.tsx` 渲染）；`diff-banner.ts` 的 `mountDiffBanner(callbacks)` 挂到静态 `#diffBannerHost`（`display: contents`，位置与原来一致）。`diff-view.ts` 与 `app-actions.ts` 改为调用 store，不再查询或插入 `#diffBanner`。删除 `ui/diff-banner.ts`（字符串模板与事件委托）与 `refreshDiffBannerLabel`（改为 store 的标题覆盖）。Diff 内容本身（段落/行级视图）仍由 `diff-view.ts` 命令式写入 `#content`。
  - 测试 `diff-banner.test.tsx`；`diff-refresh.test.ts` 只保留 `shouldRefreshDiff`。
  - 经 CDP 验证：修改磁盘文件 → 出现 Diff 按钮 → 打开横幅 → 切换行级/段落视图 → 关闭横幅。
- ~~PDF 页码指示器~~ 已完成（2026-11-07）：`src/client/pdf-page-indicator/`（`store.ts` 保存可见性、当前页、总页数、输入态与跳转回调，`PdfPageIndicator.tsx` 渲染标签/输入框）；`pdf-page-indicator.ts` 挂到静态 `#pdfPageIndicatorHost`。`content-renderer.ts` 的滚动监听只更新 store，回车跳转直接滚动当前挂载的 `.pdf-page-wrapper`。测试 `pdf-page-indicator.test.tsx`；经 CDP 验证：滚动同步页码、点击进入输入、回车跳到第 3 页、Esc 取消。
  - 发现的既有问题（未在本步修复）：快速连续调用 `renderContent` 时，较早创建的 PDF viewer 可能在较晚之后 resolve，其 `pageWrappers` 脱离 DOM。原来的 `viewer.scrollToPage` 会因此滚到顶部；指示器已改为滚动挂载中的节点，不再受影响，但 `renderContent` 的重复创建本身仍需单独处理。
- 尚未完成：PDF 查看器（`pdf-viewer.ts` / `pdf-registry.ts` / `pdf-annotation.ts`）的外壳（指示器之外的部分）；选区标记；以及最后一步——删除 `main.ts`/`init.ts` 中的手写装配。

每一步都必须保持 `bun test tests/unit`、`go test -race ./cmd/workspace-scanner`、`bun run build` 通过。
