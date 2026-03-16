# 🚀 MD Viewer - SwiftUI Native App

## 一键构建和安装

```bash
./scripts/build-and-install.sh
```

**就这么简单！**

完成后：
```bash
open -a 'MD Viewer'
```

---

## 这会做什么？

1. ✅ 构建 Server 二进制（包含 Web UI）
2. ✅ 编译 Swift 代码
3. ✅ 创建 .app bundle
4. ✅ 安装到 /Applications

**总耗时：** 约 2-3 分钟

---

## 系统要求

- macOS 13.0+
- Xcode Command Line Tools
- Bun

**安装依赖：**
```bash
xcode-select --install
curl -fsSL https://bun.sh/install | bash
```

---

## 详细文档

- [README_APP.md](README_APP.md) - 完整的 App 说明
- [BUILD_SWIFTUI.md](BUILD_SWIFTUI.md) - 详细的构建指南

---

## 需要帮助？

查看日志：
```bash
tail -f ~/.config/md-viewer/server.log
```

提交 Issue：
https://github.com/huanghao/md-viewer/issues
