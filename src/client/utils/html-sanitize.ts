/**
 * 白名单式 HTML 净化：用于 Markdown 渲染结果（正文、Diff、agent 回复）插入 DOM 之前。
 *
 * 原始 Markdown 允许写 HTML，所以渲染结果里可能出现 <script>、事件属性、javascript: 链接等。
 * 这里使用浏览器内置的 <template>（内容惰性，不执行脚本、不加载资源）解析，再逐节点按白名单清理。
 * 不引入第三方依赖。
 */

// 整段丢弃（包括子节点）
const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
  'link', 'meta', 'base', 'form', 'textarea', 'select', 'button', 'noscript',
  'template', 'svg', 'math', 'xml', 'portal',
]);

// 允许的元素（不在此列表也不在 DROP_TAGS 中的元素：保留其文本，去掉标签）
const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup', 'dd', 'del', 'details',
  'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
  'img', 'input', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 's', 'samp', 'small', 'span',
  'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
  'section', 'article', 'header', 'footer', 'nav', 'aside', 'q', 'cite', 'var', 'time',
]);

// 所有元素都允许的属性
const GLOBAL_ATTRS = new Set(['class', 'id', 'title', 'lang', 'dir', 'align', 'style']);

// 按元素额外允许的属性
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  ol: new Set(['start', 'type', 'reversed']),
  li: new Set(['value']),
  input: new Set(['type', 'checked', 'disabled']),
  details: new Set(['open']),
  col: new Set(['span']),
  colgroup: new Set(['span']),
  time: new Set(['datetime']),
};

// 链接协议白名单；pdf: 是应用自己的内部协议
const LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'pdf:']);
// 图片协议白名单（不允许 svg 的 data: URL）
const IMG_SCHEMES = new Set(['http:', 'https:', 'data:']);
const SAFE_DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp);/i;

/** 把 URL 归一化后取协议（去掉浏览器会忽略的控制字符与空白，防止 "java\tscript:" 之类的绕过） */
function schemeOf(url: string): string | null {
  const normalized = url.replace(/[\u0000- \u007f-\u009f]/g, '');
  const match = /^([a-z][a-z0-9+.-]*:)/i.exec(normalized);
  return match ? match[1].toLowerCase() : null;
}

function isSafeUrl(url: string, tag: 'a' | 'img'): boolean {
  const scheme = schemeOf(url);
  if (scheme === null) return true; // 相对路径、#锚点
  if (tag === 'img') {
    if (scheme === 'data:') return SAFE_DATA_IMAGE.test(url.replace(/[\u0000- ]/g, ''));
    return IMG_SCHEMES.has(scheme);
  }
  return LINK_SCHEMES.has(scheme);
}

function isSafeStyle(value: string): boolean {
  const v = value.replace(/[\u0000- ]/g, '').toLowerCase();
  return !(v.includes('expression(') || v.includes('javascript:') || v.includes('url('));
}

function cleanAttributes(el: Element, tag: string): void {
  const allowed = TAG_ATTRS[tag];
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    // data-* 不保留：应用用 data-action 做事件委托，用户内容不能伪造应用动作
    const ok = GLOBAL_ATTRS.has(name) || (allowed?.has(name) ?? false);
    if (!ok) {
      el.removeAttribute(attr.name);
      continue;
    }
    if (name === 'href' && !isSafeUrl(attr.value, 'a')) el.removeAttribute(attr.name);
    else if (name === 'src' && !isSafeUrl(attr.value, 'img')) el.removeAttribute(attr.name);
    else if (name === 'style' && !isSafeStyle(attr.value)) el.removeAttribute(attr.name);
    else if (name === 'target' && attr.value !== '_blank') el.removeAttribute(attr.name);
  }
}

function cleanChildren(parent: Node): void {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === 3 /* TEXT */) continue;
    if (child.nodeType !== 1 /* ELEMENT */) {
      // 注释、CDATA、处理指令等一律删除
      child.parentNode?.removeChild(child);
      continue;
    }
    const el = child as Element;
    const tag = el.tagName.toLowerCase();
    if (DROP_TAGS.has(tag)) {
      el.remove();
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      // 未知标签：保留内容，去掉标签本身
      cleanChildren(el);
      el.replaceWith(...Array.from(el.childNodes));
      continue;
    }
    // 只允许任务列表复选框
    if (tag === 'input' && el.getAttribute('type')?.toLowerCase() !== 'checkbox') {
      el.remove();
      continue;
    }
    cleanAttributes(el, tag);
    cleanChildren(el);
  }
}

/** 净化一段 HTML 字符串，返回安全的 HTML 字符串 */
export function sanitizeHtml(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  cleanChildren(template.content);
  return template.innerHTML;
}
