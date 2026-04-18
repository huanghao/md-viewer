# PDF 选中功能交互测试工具

独立运行，不依赖主项目。

## 启动

```bash
bun run scripts/pdf-select-lab/server.ts
# 打开 http://localhost:4321
```

## 使用方法

1. 在右侧输入 PDF 文件的绝对路径，点击「加载 PDF」
2. 在 PDF 上**拖拽选中**文字（不是单击）
3. 右侧面板会同时显示三种方法的结果：
   - **方法 A（蓝色）**：当前实现，用选区中心找最近 item
   - **方法 B（绿色）**：建议方案，mousedown 找起始 item，mouseup 找结束 item，中间全包含
   - **方法 C（红色）**：原生 `window.getSelection()` 反查 item 索引
4. 对每种方法点击 **✓ 符合 / ✗ 不符合** 记录反馈
5. 点击「导出会话数据」保存 JSON，用于后续分析

## 实验建议

按以下场景各做 3-5 次选中，覆盖不同内容类型：

| 场景 | 目的 |
|------|------|
| 正文中拖选一个词 | 基准，三种方法应一致 |
| 正文中拖选多个词（跨 item） | 检验方法 B vs A 的差异 |
| 标题行选中 | 检验 fontH fallback（标题字号大） |
| 公式中选中单个字符 | 检验单字符 item 的处理 |
| 行顶部边缘点击 | 检验包围盒上边界是否准确 |
| 行底部边缘点击 | 检验下延笔画区域 |
| 跨行拖选 | 检验多行覆盖 |

## 输出数据格式

```json
[
  {
    "id": 1713500000000,
    "pageNum": 1,
    "down": { "x": 72.5, "y": 320.1 },
    "up":   { "x": 140.2, "y": 320.1 },
    "nativeText": "novel method",
    "A": { "lo": 42, "hi": 42, "str": "novel", "fontHSources": ["height"] },
    "B": { "lo": 42, "hi": 43, "str": "novel method", "fontHSources": ["height", "height"] },
    "C": { "lo": 42, "hi": 43, "str": "novel method", "fontHSources": ["height", "height"], "nativeText": "novel method" },
    "feedback": { "center": false, "range": true, "native": true }
  }
]
```
