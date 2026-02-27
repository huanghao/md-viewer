# Logo 设计方案

## 设计理念

为 MD Viewer 设计了一个简洁现代的 logo，突出 Markdown 文档查看器的核心功能。

## 新旧对比

### 旧设计
- **页面 logo**: 📚 emoji（在不同系统显示效果不一致）
- **浏览器标签页**: 无 favicon（显示默认图标）
- **问题**:
  - emoji 在小尺寸下不清晰
  - 缺乏品牌识别度
  - 浏览器标签页显示效果差

### 新设计
- **页面 logo**: SVG 文档图标 + "MD Viewer" 文字
- **浏览器标签页**: 蓝色背景的文档图标 favicon
- **优势**:
  - ✅ 清晰的矢量图形，任何尺寸都完美
  - ✅ 统一的视觉识别
  - ✅ 专业现代的设计风格
  - ✅ 蓝色主题色 (#2563eb) 传递专业可靠的感觉

## 设计元素

### 图标含义
- **文档形状**: 代表 Markdown 文件
- **折角**: 经典的文档视觉符号
- **横线**: 代表文本内容/段落

### 颜色方案
- **主色**: `#2563eb` (蓝色) - 专业、可靠、科技感
- **辅助色**: 白色 - 简洁、清晰

## 技术实现

### 文件结构
```
public/
├── favicon.svg    # 浏览器标签页图标（32x32，蓝色背景）
└── logo.svg       # 页面内嵌 logo（透明背景）
```

### 特性
- SVG 格式，完美缩放
- 内联在 HTML 中，无需额外请求
- 使用 `currentColor` 继承文字颜色
- 响应式设计

## 参考资源

推荐的免费图标资源网站：
1. **[Lucide Icons](https://lucide.dev/)** - 简洁现代 ⭐ 本项目使用
2. **[Heroicons](https://heroicons.com/)** - Tailwind 官方
3. **[Tabler Icons](https://tabler.io/icons)** - 5000+ 图标
4. **[Phosphor Icons](https://phosphoricons.com/)** - 灵活多变
5. **[Iconoir](https://iconoir.com/)** - 优雅开源

## 使用说明

重新启动服务器即可看到新的 logo：

```bash
bun run dev
```

访问 http://localhost:3000 查看效果。
