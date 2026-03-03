# 长文件名显示策略调研与方案（VS Code / 编辑器 / 浏览器）

文档定位（设计调研）：
- 负责回答“长文件名在窄宽度列表中的可读性”问题，以及 md-viewer 的落地策略。
- 不负责完整 tab 管理器功能范围（见 `20260302-tab-management.md`）。

## 背景问题

在工作区树中，文件名过长时被右侧裁切，且当前 `M` 状态在右侧，进一步压缩了文件名可视空间。  
而实际业务中，文件名后半段（版本、主题、后缀）往往更有区分度。

## 主流产品做法（摘要）

## 1) VS Code

- 通过 `tabSizing`、`wrapTabs` 等控制拥挤时展示密度，不追求在主视图完整显示所有标题。
- 通过装饰（dirty/pinned）和 tab 管理动作降低误操作。
- 核心思路是“压缩展示 + 快速找回（搜索/固定/操作）”。

## 2) JetBrains（Rider/IntelliJ）

- 提供完整的 tab 管理动作（close others、close all 等）与预览 tab，避免 tab 无限制增长。
- 长标题场景下同样依赖管理能力，而不是单纯扩宽或完整展示。

## 3) 浏览器（Chrome / Safari）

- Chrome 强化 `@tabs` 搜索。
- Safari 通过 Tab Group / Pin / 排序组织 tab。
- 核心是“可快速定位 + 可批量整理”。

## 结论

统一模式：  
1. 展示层允许压缩；  
2. 状态装饰要占位少；  
3. 必须有快速找回能力（搜索/排序/分组）。

对 md-viewer 的具体含义：  
- 文件名展示策略必须优先保留后缀信息。  
- `M/D` 不应占用最右侧关键阅读位。  
- 与现有 Tabs 管理器联动，保证“看不全也找得到”。

## md-viewer 落地方案（建议）

## Phase A（低风险，先做）

1. 文件名“中间省略”，保留尾部：  
   - 形态：`前缀…后缀`，始终保留扩展名。  
2. 状态位前置：  
   - 由“右侧 status”改为“icon 后紧跟 status（M/D/•）”。  
3. hover tooltip 显示完整文件名。  

收益：不改业务逻辑，仅改渲染布局，可快速验证。

## Phase B（增强，可选）

1. 支持“按住 Alt 临时展开完整名”。  
2. 支持按路径段压缩显示（如 `.../design/xxx.md`）。  

## DOM/CSS 改造要点（实现导向）

1. 结构顺序建议：
   - `file-type-icon` → `status-badge` → `tree-name`
2. `tree-name` 内拆分：
   - `.name-head`（可收缩、省略）
   - `.name-tail`（不收缩，保留后缀）
3. 移除右侧固定 `file-item-status` 宽度占位，避免遮挡。

## 验收标准

1. 长文件名下，后缀可见度明显提升。  
2. `M/D` 依然一眼可见，且不挤压后缀信息。  
3. hover 可查看完整文件名。  
4. 与 Tabs 管理器搜索结果一致，不引入名称歧义。

## 参考链接

- VS Code release notes / tabs 配置：  
  - https://code.visualstudio.com/updates/v1_53  
  - https://code.visualstudio.com/updates/v1_79  
  - https://code.visualstudio.com/docs/configure/custom-layout
- JetBrains Rider tabs：  
  - https://www.jetbrains.com/help/rider/Managing_Editor_Tabs.html
- Chrome `@tabs` 搜索：  
  - https://blog.google/products-and-platforms/products/chrome/search-your-tabs-bookmarks-and-history-in-the-chrome-address-bar/
- Safari tabs 组织：  
  - https://support.apple.com/en-nz/guide/iphone/iph3028ebf68/ios
