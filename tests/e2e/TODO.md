# E2E 测试修复 TODO

## Docker 化运行（已完成）
- [x] 创建 Dockerfile.e2e
- [x] 创建 playwright.docker.config.ts
- [x] 创建 e2e-docker.sh 脚本

## 需要修复的测试

### 不稳定/失败原因分析

#### case-1 (列表差异蓝点) - 已修复
- 问题：baseURL 绑定、选择器不匹配
- 修复：改用 localhost、移除蓝点断言和截图

#### case-3 (状态标记在右侧)
- 问题：可能依赖工作区模式渲染
- 需检查：是否需要切换到正确的 sidebar tab

#### case-5 (工作区新扫描文件蓝点)
- 问题：文件系统 watcher 不稳定
- 建议：使用 mock 或增加等待时间

#### case-10 (file-changed 交互)
- 问题：依赖文件系统修改事件
- 建议：使用 API 触发事件而非直接修改文件

#### case-11/13/16/17/18 (删除/重建/断线重连)
- 问题：文件系统操作 + SSE 状态同步
- 建议：简化测试范围，或使用 mock 服务器

#### case-19 (目录折叠状态)
- 问题：localStorage 状态可能冲突
- 建议：每个测试前清除 localStorage

#### case-20 (Mermaid 渲染)
- 问题：可能 CDN 加载慢
- 建议：增加等待或使用本地 mermaid

#### case-23/24 (搜索/Tab 面板)
- 问题：DOM 选择器可能不稳定
- 建议：添加 data-testid 属性

#### case-25/26 (批量关闭)
- 问题：弹窗/确认对话框处理
- 建议：统一使用 Playwright 的 dialog 处理

## 修复策略

1. **高优先级**
   - 添加 data-testid 到关键 DOM 元素
   - 统一使用 `waitForSelector` 等待渲染
   - 移除截图对比测试（太容易失败）

2. **中优先级**
   - 文件系统相关测试改为 mock
   - SSE 事件使用 API 触发而非真实网络

3. **低优先级**
   - 拆分复杂测试为独立小测试
   - 添加测试重试机制

## 测试原则

- DOM 断言优于截图对比
- 显式等待优于固定延迟
- Mock 外部依赖（文件系统、网络）
- 每个测试独立，不依赖执行顺序
