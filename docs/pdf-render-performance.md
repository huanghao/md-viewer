# PDF 渲染性能策略

## 当前实现

`IntersectionObserver + rootMargin` 懒加载。

**初始化流程：**
1. 取第一页尺寸，给所有页面创建白色占位 div（高度正确，滚动条立即可用）
2. `IntersectionObserver` 监听所有占位 div，`rootMargin: 1200px`
3. 页面进入扩展区域时触发 `renderPage`：`getPage` → canvas render → text layer render → 绑事件

**已知问题：**
- `rootMargin: 1200px` 对 A4（约 1100px/页）只预渲染约 1 页，快速滚动会白屏
- 没有卸载机制，翻完整本 PDF 后内存不释放

---

## 优化方向

### 1. 调大 rootMargin（最简单）

将 `rootMargin` 从 `1200px` 改为 `2500px`，预渲染约 2 页。

| 影响 | 说明 |
|------|------|
| 白屏概率 | 明显降低 |
| 首屏时间 | 轻微增加（后台多渲染 1 页） |
| 内存 | 每增加 1 页预渲染，约 +27MB（见下方内存估算） |

### 2. 卸载机制（内存回收）

**不采用基于滚动位置的激进回收**——用户来回翻页是正常行为，频繁销毁/重建 canvas 会造成白屏闪烁，体验差。

**采用基于"文件空闲时间"的回收策略：**

```
活跃 PDF（当前打开 tab）→ 不回收，保留所有已渲染页面
空闲 PDF（打开列表中但长时间未点击）→ 回收全部 canvas，保留占位符
```

具体触发条件（待定）：
- 用户切换到其他文件超过 N 分钟（如 10 分钟）
- 或打开列表里有多个 PDF，总内存超过阈值时，优先回收最久未访问的

这样用户在当前 PDF 来回翻页完全不受影响，只有真正"冷"的文件才会被回收。

### 3. 内存监控 UI

在设置或状态栏里增加一个内存使用面板，类似 Activity Monitor：

- 当前已渲染页数 / 总页数
- 估算内存占用（已渲染页数 × 27MB）
- 各打开 PDF 的内存占用列表

这个面板可以帮助判断何时需要手动触发回收，也方便调试。

**生命周期设计：按需采样，不持久化。**

- 打开监控面板时才开始采样（挂上轮询定时器、监听渲染事件）
- 关闭面板时立即清除定时器和监听器，不保留历史数据
- 不做跨 session 的状态持久化

理由：内存是实时状态，历史数据意义不大；后台持续采样有 CPU 开销；这是调试工具，不是监控系统。类比 Activity Monitor——打开才看数据，关掉就没了。

### 4. PDF.js Worker 的限制

PDF.js 的渲染在单个 Web Worker 里排队执行，`page.render()` 并发调用不会加速，只会增加内存压力。瓶颈在 Worker，不在 JS 主线程。

---

## 可观测指标

### 渲染延迟

在 `renderPage` 里加计时：

```typescript
const t0 = performance.now();
await page.render({ canvasContext: ctx, viewport }).promise;
await textLayerObj.render();
const elapsed = performance.now() - t0;
// 只在 debug 模式下打印，避免 console.log 本身的 overhead
if ((window as any).__pdfDebug) {
  console.log(`[pdf] page ${pageNum}: ${elapsed.toFixed(0)}ms`);
}
```

`performance.now()` 本身几乎零开销（纳秒级），不影响渲染性能。`console.log` 有序列化开销，正式版不应常驻，通过 `window.__pdfDebug = true` 按需开启即可。

目标：用户滚动到某页前 300ms 内完成渲染（即 rootMargin 提供的预渲染时间窗口）。

### 内存占用

**Canvas 内存估算（理论值）：**
```
每页 = width × height × 4 bytes × dpr²
A4 @ scale=1.5, dpr=2: 1122 × 1587 × 4 × 4 ≈ 27MB/页

10 页已渲染 ≈ 270MB
50 页全渲染 ≈ 1.3GB
```

注意：这是**每个已渲染页面**的占用，不是每个 PDF 文件。一个 50 页的 PDF 如果只渲染了 3 页，内存约 80MB。

**实测（Chrome DevTools）：**
- Memory → Heap snapshot：对比渲染前后
- Console：`performance.memory.usedJSHeapSize / 1024 / 1024` MB

两种指标可以集成到内存监控 UI 里（见上方优化方向 3），不需要每次手动打开 DevTools。

### IntersectionObserver 触发提前量

在 observer 回调里记录触发时间，在 `renderPage` 完成后记录完成时间，差值即为"预渲染时间窗口"。如果窗口 < 200ms，说明 rootMargin 不够大。

---

## 下一步

- [ ] 实测当前 rootMargin=1200px 下的渲染延迟和白屏频率
- [ ] 调整 rootMargin 到 2500px，对比效果
- [ ] 实现基于文件空闲时间的卸载机制
- [ ] 实现内存监控 UI（已渲染页数、估算内存、各 PDF 占用列表）
