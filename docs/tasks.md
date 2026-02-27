# 任务进展

## 小红点 - 新文件未读标识 [已完成]

**开始时间：** 2026-02-28
**完成时间：** 2026-02-28

**任务描述：**
为文件列表中的新文件添加未读标识（蓝色圆点），用户点击查看后标识消失。

**设计文档：** [red-dot-notification.md](./design/red-dot-notification.md)

**最终方案：** 左侧蓝点
- 位置：文件图标左侧
- 颜色：蓝色 (#007AFF)
- 大小：6px 圆点
- 无数字角标，保持简洁

**实现内容：**

1. **类型定义** (src/client/types.ts)
   - 在 `FileInfo` 接口中添加 `isNew?: boolean` 字段

2. **状态管理** (src/client/state.ts)
   - `saveState()`: 保存 isNew 状态到 localStorage
   - `restoreState()`: 从 localStorage 恢复 isNew 状态
   - `addOrUpdateFile()`: 新添加的文件自动标记为 isNew（除非立即切换）
   - `switchToFile()`: 切换到文件时自动标记为已读（isNew = false）

3. **UI 渲染** (src/client/ui/sidebar.ts)
   - `renderFiles()`: 在文件列表中显示蓝色圆点

4. **样式** (src/client/css.ts)
   - 添加 `.new-dot` 样式：6px 蓝色圆点
   - 为 `.file-item` 添加 `gap: 6px` 保持间距

**功能特性：**
- ✓ 新添加的文件自动显示蓝点
- ✓ 点击文件切换后蓝点自动消失
- ✓ 通过 CLI 打开文件（focus=true）时立即标记为已读
- ✓ 通过 CLI 打开文件（focus=false）时保持未读状态
- ✓ 刷新页面后未读状态保持
- ✓ 搜索时蓝点正常显示
- ✓ 与现有蓝色主题色保持一致

**测试场景：**
- [x] 通过输入框添加文件 → 显示蓝点
- [x] 点击文件切换 → 蓝点消失
- [x] 页面刷新 → 未读状态保持
- [x] 搜索过滤 → 蓝点正常显示
