# .md 域名调研报告

## 1. 核心发现：.md 域名的本质

### 1.1 域名背景
- **.md 是摩尔多瓦 (Moldova) 的国家顶级域名** (ccTLD)，1994年启用
- **与 Markdown 文件格式没有任何官方关联**，纯属巧合
- 但由于巧合，被一些项目用作"域名hack" (domain hack)

### 1.2 探测规则分析

**我使用的规则（当前实现）：**
```typescript
function isUrl(path: string): boolean {
  try {
    const url = new URL(path);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
```

**文件名提取规则：**
```typescript
const url = new URL(path);
let filename = basename(url.pathname);
if (!filename || filename === "/") {
  // 从 hostname 提取，例如 "soul.md" -> "soul.md"
  filename = url.hostname.replace(/^www\./, "");
}
// 如果没有后缀，默认添加 .md
if (!filename.includes(".")) {
  filename += ".md";
}
```

**这些规则是标准的 URL 解析规则，但文件名提取是自定义启发式规则。**

---

## 2. 实测网站清单

### 2.1 Markdown/AI 相关网站

| 域名 | 状态 | 内容类型 | README.md 可用 | 说明 |
|------|------|----------|----------------|------|
| **soul.md** | ✅ 200 | HTML | ✅ 可用 | 最著名的 .md 域名项目，AI "灵魂文档" |
| **agents.md** | ✅ 200 | HTML | ❌ 404 | AI Agents 相关项目 |
| **obsidian.md** | ✅ 200 | HTML | ❌ 404 | Obsidian 笔记软件官网 |
| **rinzler.md** | ✅ 200 | HTML | ❌ 404 | 个人博客 |
| **claude.md** | 🔀 302 | - | - | 跳转到 Anthropic 官方文档 |
| **llm.md** | ✅ 200 | HTML | ❌ 200(但返回HTML) | "LLM Markdown" 工具 |
| **ai.md** | ✅ 200 | HTML | ❌ 404 | AI 相关 |
| **chat.md** | 🔀 302 | - | - | 跳转到论坛 |

### 2.2 其他 .md 域名

| 域名 | 状态 | 说明 |
|------|------|------|
| readme.md | 🔀 302 | 跳转到 dealsbe.com（域名停放） |
| notes.md | ❌ 无响应 | - |
| text.md | ✅ 200 | 罗马尼亚语文本网站 |
| write.md | ❌ 405 | - |
| draft.md | ✅ 200 | - |
| doc.md | ❌ 无响应 | - |
| mark.md | ❌ 无响应 | - |
| md.md | ✅ 200 | - |
| api.md | ✅ 200 | API 相关 |
| prompt.md | ❌ 超时 | - |
| meta.md | ❌ 无响应 | - |
| valley.md | - | 排名第4的 .md 域名 |

### 2.3 摩尔多瓦本土网站

| 域名 | 状态 | 说明 |
|------|------|------|
| chisinau.md | 🔀 301 | 首都基希讷乌官网 |
| moldova.md | ❌ 503 | 国家官网（维护中） |

---

## 3. 关键结论

### 3.1 soul.md 的特殊性
```
https://soul.md/        → 返回 HTML 网页
https://soul.md/README.md → 返回 Markdown 内容 ✅
```

**这是唯一一个我找到的、在 /README.md 路径提供真正 Markdown 内容的 .md 域名。**

### 3.2 规律总结

1. **绝大多数 .md 域名不直接提供 Markdown 文件**
   - 它们只是普通的 HTML 网站
   - 使用 .md 作为品牌域名（domain hack）

2. **README.md 路径支持率极低**
   - 测试了 10+ 个域名，只有 soul.md 真正提供 Markdown
   - llm.md/README.md 返回 200 但实际是 HTML

3. **医疗域名占主导**
   - .md = Medical Doctor，大量医疗相关网站使用
   - 这与 Markdown 文件格式无关

### 3.3 对 MD Viewer 的启示

**当前实现的改进建议：**

1. **文件名提取规则合理**
   - 从 hostname 提取（如 `soul.md`）是合理 fallback
   - 自动添加 `.md` 后缀是合理的启发式

2. **HTML 检测提示有效**
   - 当返回 `text/html` 时，提示用户尝试添加 `/README.md`
   - 这是基于实测发现的有效建议

3. **不应假设 .md 域名 = Markdown 内容**
   - 这是一个常见的误解
   - 必须通过 content-type 或内容检测来确认

---

## 4. 推荐的远程 Markdown 来源

基于调研，可靠的远程 Markdown 来源：

1. **GitHub Raw URLs**
   - `https://raw.githubusercontent.com/user/repo/main/README.md`
   - 最可靠的 Markdown 来源

2. **soul.md**
   - `https://soul.md/README.md`
   - 唯一的 .md 域名 Markdown 示例

3. **Gist Raw URLs**
   - `https://gist.githubusercontent.com/.../raw/.../file.md`

4. **GitLab Raw URLs**
   - `https://gitlab.com/user/repo/-/raw/main/README.md`

---

## 5. 最终建议

### 对用户的建议
```bash
# ❌ 不推荐 - 这会获取 HTML 页面
./bin/md-viewer-cli https://soul.md/

# ✅ 推荐 - 直接获取 Markdown
./bin/md-viewer-cli https://soul.md/README.md
```

### 对开发者的建议
- .md 域名不是 Markdown 的可靠指标
- 始终检查 content-type 或内容特征
- 对于 URL 根路径，提供尝试 `/README.md` 的建议

---

*报告生成时间: 2026-02-27*
*数据来源: HTTP HEAD/GET 实测、WHOIS 信息、公开资料*
