/** Protect math blocks from being mangled by marked's Markdown parser.
 * $$...$$, $...$, \[...\], \(...\) are replaced with unique placeholders
 * before parsing, then restored verbatim so KaTeX can process them. */
export function protectMath(src: string): { protected: string; restore: (html: string) => string } {
  const map = new Map<string, string>();
  let idx = 0;
  const placeholder = (content: string) => {
    const key = `\x02MATH${idx++}\x03`;
    // Escape < and > so they survive innerHTML assignment after restore.
    // KaTeX auto-render reads text nodes and handles &lt; correctly.
    map.set(key, content.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    return key;
  };
  // Order matters: match $$ before $ to avoid double-consuming
  const result = src.replace(
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+?\$)/g,
    (match) => placeholder(match)
  );
  return {
    protected: result,
    restore: (html: string) => {
      let out = html;
      for (const [key, value] of map) {
        out = out.split(key).join(value);
      }
      return out;
    },
  };
}
