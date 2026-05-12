# 待完成任务

## 一堆小问题
- 设计一个在相关代码里写评论的流程

## 页面列表一致在定时刷新，还有哪些地方，要怎么处理

## 搜索路径现在很慢是为什么

## PDF TOC 跳转精度
当前 PDF TOC 点击只能跳到对应页顶（scrollToPage），无法跳到章节在页内的具体位置。
根本原因：PDF outline 条目包含 dest（destination）对象，其中有页内 y 坐标，但目前 resolvePdfOutlinePageNums 只提取了 pageNum，没有提取 y 偏移。
修复方向：在 resolvePdfOutlinePageNums 里同时提取 dest 的 y 坐标，存入 TocItem，然后 pdfJump 改用 scrollToBlockY(pageNum, y)。


