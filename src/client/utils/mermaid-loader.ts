// Mermaid 体积约 3.5MB（压缩后 ~900KB），只在文档里真的有 mermaid 代码块时才加载。
// 脚本失败后允许重试（下次渲染再次请求）。

export const MERMAID_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js';

let pending: Promise<any> | null = null;

export function loadMermaid(): Promise<any> {
  const existing = (window as any).mermaid;
  if (existing) return Promise.resolve(existing);
  if (!pending) {
    pending = new Promise<any>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = MERMAID_SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        const mermaid = (window as any).mermaid;
        if (mermaid) resolve(mermaid);
        else reject(new Error('mermaid 脚本已加载但未提供全局对象'));
      };
      script.onerror = () => {
        script.remove();
        reject(new Error(`加载 mermaid 失败: ${MERMAID_SCRIPT_SRC}`));
      };
      document.head.appendChild(script);
    }).catch((err) => {
      pending = null;
      throw err;
    });
  }
  return pending;
}
