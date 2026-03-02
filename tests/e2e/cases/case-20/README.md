# Case 20：支持 ```flowchart``` 代码块渲染

## 目标
验证 Markdown 中使用 `flowchart` fenced code block（而不是 `mermaid` fenced）时，也能正确渲染 Mermaid 流程图。

## 前置条件
- 简单模式。
- 打开本地 Markdown 文件。
- 文件包含如下结构：
  - ```flowchart
  - A --> B
  - ```

## 步骤
1. 创建临时 Markdown 文件，写入 `flowchart` fenced 代码块。
2. 在 md-viewer 中打开该文件。
3. 等待内容区渲染完成。

## 验收
- 内容区出现 `.mermaid-block .mermaid svg`。
- 不出现 Mermaid 语法回退提示（`.mermaid-fallback-notice`）。

## 失败信号
- 代码块保持原文，未渲染为图。
- 出现“Mermaid 语法错误，已回退为原文显示”。
