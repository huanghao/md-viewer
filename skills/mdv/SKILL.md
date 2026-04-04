---
name: mdv
description: 查看本地 Markdown 文件上的批注，并根据批注修改文档
---

`mdv` 是本地命令行工具，用于管理本地 Markdown 文件上的批注（人工标注的修改意见）。

批注绑定在**本地文件路径**上，与学城、Confluence 等线上系统无关。

## 工作流程

**查看当前文件的批注并修改：**

```bash
# 1. 获取某个本地文件的批注
mdv comments get --file /path/to/file.md

# 2. 如果不知道哪些文件有批注，先列出（只展示有 open 评论的文档）
mdv comments list
```

批注格式：序号 `#N`、引用原文 `> ...`、批注内容。

## 数据维护

```bash
# 清理 7 天前的已解决/失锚评论（默认）
mdv comments tidy

# 清理 30 天前的已解决/失锚评论
mdv comments tidy --days 30

# 同时清理已删除文件的孤儿评论
mdv comments tidy --missing

# 两种清理一起跑
mdv comments tidy --days 30 --missing
```

## 处理批注的判断逻辑

- 获取批注后，**直接处理**，不要只展示给用户等待确认。逐条判断批注类型，立即行动
- 用户说"继续下一轮"时，意思是对话上下文中的当前文档又有了新批注，继续用同样的流程处理即可，不需要去找其他文件
