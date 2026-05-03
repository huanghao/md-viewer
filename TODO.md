# 待完成任务

## Swift App 集成改造（打包时）
当前开发模式已改为标准静态文件架构（public/index.html + dist/），但 Swift App 打包时
仍使用旧的内联 HTML 方案（embedded-client.ts + html.ts 动态生成）。
后续改造方向：
- 把 dist/ 静态文件放入 Swift App Bundle Resources
- Swift WebView 改为 loadFileURL 加载本地文件（或让 Bun 服务静态文件）
- 删除 embedded-client.ts、html.ts、css.ts、vendor-css.ts

## 一堆小问题
- 评论还有bug，测试一下看看
- 失锚的评论稍微样本区分一下

## 页面列表一致在定时刷新，还有哪些地方，要怎么处理

## toc在文件切换的时候不及时，现在是怎么触发的，有的时候没切换toc，但刷新一下就好了。
- 是修这个bug的成本高，还是增加一个手动刷新的小按钮更好？

## 搜索路径现在很慢是为什么

## PDF TOC 跳转精度
当前 PDF TOC 点击只能跳到对应页顶（scrollToPage），无法跳到章节在页内的具体位置。
根本原因：PDF outline 条目包含 dest（destination）对象，其中有页内 y 坐标，但目前 resolvePdfOutlinePageNums 只提取了 pageNum，没有提取 y 偏移。
修复方向：在 resolvePdfOutlinePageNums 里同时提取 dest 的 y 坐标，存入 TocItem，然后 pdfJump 改用 scrollToBlockY(pageNum, y)。


