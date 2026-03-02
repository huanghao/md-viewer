# 侧栏模式切换内联化设计

日期：2026-03-01  
状态：提案（待你确认）

## 1. 问题

当前“设置”页面几乎只用于切换 `simple/workspace` 两个模式，交互过重：

1. 入口深（工具栏点设置 -> 弹窗 -> 选项 -> 保存）
2. 页面大但信息少
3. 与“工作区相关操作”分离，心智不连续

## 2. 目标

1. 模式切换入口放到侧栏（工作区相关区域）
2. 用一个按钮完成切换（不弹设置页）
3. 保留非模态、低打断
4. 不影响后续扩展“真正设置项”

## 3. 方案（推荐 S1）

### 3.1 入口位置

放在侧栏搜索框下方、列表区域上方的“模式行”左侧：

- 先显示图标按钮（可点）
- 图标后显示 `工作区` 或 `文件` 文案

### 3.2 图标样式（低干扰）

采用“现代线框风格”的微型切换图标（双向箭头），视觉与复制按钮一致方向：

- 16x16 线性 SVG
- 无填充背景，默认低对比
- hover 仅轻微提亮
- tooltip 提示全称：`切换到简单模式` / `切换到工作区模式`

### 3.3 点击行为

1. 立即切换模式
2. 立即保存配置（无“保存”步骤）
3. 侧栏即时重渲染
4. 保持当前 `searchQuery` 不丢失

### 3.4 反馈

- 切换后顶部行左侧标签同步变化（`工作区`/`文件`）
- 不增加 toast（视觉已变化，避免额外干扰）

## 4. 交互原型（ASCII）

### 4.1 工作区模式

```text
┌──────────────────────────────────┐
│ 🔍 搜索或输入路径...              │
│ 工作区  [⇄]                       │
├──────────────────────────────────┤
│ ▼ 📁 md-viewer                    │
│   📄 README.md                    │
└──────────────────────────────────┘
```

### 4.2 简单模式

```text
┌──────────────────────────────────┐
│ 🔍 搜索或输入路径...              │
│ 文件    [⇄]                       │
├──────────────────────────────────┤
│ 📄 TODO.md                        │
│ 📄 AGENTS.md                      │
└──────────────────────────────────┘
```

## 5. 与现有“设置”关系

建议分两步：

1. 第一步（本次）：
- 工具栏保留“设置”按钮（仅暂不承载模式切换）
- 模式切换迁到侧栏图标按钮

2. 第二步（未来真有设置项时）：
- 设置入口继续承载字体、主题、快捷键等高级项
- 不再包含模式切换

## 6. 实现要点

1. 在侧栏渲染函数中新增 `mode-switch-row`（两种模式都显示）
2. 暴露 `window.toggleSidebarMode()`：
- `state.config.sidebarMode = next`
- `saveConfig(state.config)`
- `renderSidebar()`
3. 工具栏 `showSettingsDialog()` 入口保留
4. `ui/settings.ts` 移除“侧边栏模式”这一项（或置灰说明“请在侧栏切换”）

## 7. 风险与规避

1. 风险：未来设置入口消失后难找
- 规避：暂不删代码，后续有更多设置项再恢复入口

2. 风险：用户误触切换
- 规避：按钮尺寸小、弱视觉、hover 才强化

3. 风险：状态切换后工作区树加载成本
- 规避：沿用现有缓存，不额外触发全量扫描

## 8. 验收标准

1. 不打开设置弹窗也能完成模式切换
2. 单击一次即切换并持久化
3. 切换后搜索内容保留
4. 侧栏布局无明显跳动，移动端也可点击

---

## 9. 业界图标候选（文档内预览）

下面是可直接使用的现成风格，已内嵌可视预览。

### 9.1 Tabler `switch-horizontal`（推荐）

<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;width:max-content;">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 3l4 4l-4 4" />
    <path d="M10 7l10 0" />
    <path d="M8 13l-4 4l4 4" />
    <path d="M4 17l9 0" />
  </svg>
  <span style="font-size:12px;color:#475569;">线性、轻量、方向语义清晰</span>
</div>

- 风格：现代线框、干净、低干扰
- 适配：和当前复制按钮的“轻交互”气质最接近
- 源：  
  https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/outline/switch-horizontal.svg

### 9.2 Lucide `arrow-left-right`

<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;width:max-content;">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 3 4 7l4 4" />
    <path d="M4 7h16" />
    <path d="m16 21 4-4-4-4" />
    <path d="M20 17H4" />
  </svg>
  <span style="font-size:12px;color:#475569;">更中性，工程感强</span>
</div>

- 风格：中性线框，视觉存在感略强于 Tabler
- 适配：可用，但略“工具化”
- 源：  
  https://unpkg.com/lucide-static@latest/icons/arrow-left-right.svg

### 9.3 Heroicons `arrows-right-left`

<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;width:max-content;">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7.5 21L3 16.5M3 16.5L7.5 12M3 16.5H16.5M16.5 3L21 7.5M21 7.5L16.5 12M21 7.5L7.5 7.5"/>
  </svg>
  <span style="font-size:12px;color:#475569;">品牌感更强，略活跃</span>
</div>

- 风格：产品感明显，线条更有“动作感”
- 适配：在侧栏里会稍微抢眼
- 源：  
  https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/outline/arrows-right-left.svg

### 9.4 Bootstrap Icons `arrow-left-right`

<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;width:max-content;">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#64748b" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5m14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5"/>
  </svg>
  <span style="font-size:12px;color:#475569;">实心、信息密度高</span>
</div>

- 风格：实心风格，视觉权重较大
- 适配：不符合“低干扰”目标（不建议）
- 源：  
  https://raw.githubusercontent.com/twbs/icons/main/icons/arrow-left-right.svg

### 9.5 本项目建议

选 `Tabler switch-horizontal`：

1. 线性风格最轻
2. 方向语义清楚（适合“模式互切”）
3. 在 14-16px 下仍可读，不抢视线
