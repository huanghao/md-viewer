# 待完成任务

## 一堆小问题
- 设计一个在相关代码里写评论的流程
- 在diff模式下，不点「采用」而点「刷新」时，滚动条还是minimap模式而不是正常模式
- statusbar上的创建时间不对
- 评论有个bug，在回复的时候(是回复一个评论，而不是第一次评论)写了一些文字没有提交，点击其他地方，popup消失，再点回来，里面的文字丢失了
- 搜索查到的结果不太行，搜allview找不到pnc的feature文档
- 右键评论菜单出来，点击完以后，生成了对应的评论，然后这个popup的菜单需要消失

## 页面列表一致在定时刷新，还有哪些地方，要怎么处理

## 搜索路径现在很慢是为什么

## PDF TOC 跳转精度
当前 PDF TOC 点击只能跳到对应页顶（scrollToPage），无法跳到章节在页内的具体位置。
根本原因：PDF outline 条目包含 dest（destination）对象，其中有页内 y 坐标，但目前 resolvePdfOutlinePageNums 只提取了 pageNum，没有提取 y 偏移。
修复方向：在 resolvePdfOutlinePageNums 里同时提取 dest 的 y 坐标，存入 TocItem，然后 pdfJump 改用 scrollToBlockY(pageNum, y)。


