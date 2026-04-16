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
| 内存 | +50-100MB（约 1-2 页 canvas） |

### 2. 卸载机制（内存回收）

离开视口超过 N 页后，销毁 canvas，换回占位符。

```
渲染窗口 = 当前页 ± keep_pages
超出窗口的页面 → 销毁 canvas → 换回占位符（保留高度）
```

权衡：
- `keep_pages` 越小 → 内存越低，回滚时白屏风险越高
- `keep_pages` 越大 → 内存越高，体验更流畅
- 推荐起点：`keep_pages = 5`（当前页上下各 5 页）

### 3. PDF.js Worker 的限制

PDF.js 的渲染在单个 Web Worker 里排队执行，`page.render()` 并发调用不会加速，只会增加内存压力。瓶颈在 Worker，不在 JS 主线程。

---

## 可观测指标

### 渲染延迟（最重要）

在 `renderPage` 里加计时：

```typescript
const t0 = performance.now();
await page.render({ canvasContext: ctx, viewport }).promise;
console.log(`[pdf] page ${pageNum} canvas: ${(performance.now() - t0).toFixed(0)}ms`);
await textLayerObj.render();
console.log(`[pdf] page ${pageNum} total: ${(performance.now() - t0).toFixed(0)}ms`);
```

目标：用户滚动到某页前 300ms 内完成渲染（即 rootMargin 提供的预渲染时间窗口）。

### 内存占用

**Canvas 内存估算（理论值）：**
```
每页 = width × height × 4 bytes × dpr²
A4 @ scale=1.5, dpr=2: 1122 × 1587 × 4 × 4 ≈ 27MB/页
50 页全渲染 ≈ 1.3GB
```

**实测（Chrome DevTools）：**
- Memory → Heap snapshot：对比渲染前后
- Console：`performance.memory.usedJSHeapSize / 1024 / 1024` MB

### IntersectionObserver 触发提前量

在 observer 回调里记录触发时间，在 `renderPage` 完成后记录完成时间，差值即为"预渲染时间窗口"。如果窗口 < 200ms，说明 rootMargin 不够大。

---

## 下一步

- [ ] 实测当前 rootMargin=1200px 下的渲染延迟和白屏频率
- [ ] 调整 rootMargin 到 2500px，对比效果
- [ ] 实现卸载机制，keep_pages=5，观测内存变化
