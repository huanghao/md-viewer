import { resolveMarkdownLinkPath } from './utils/md-link';

/** 解析 pdf://路径#page=N&quote=... 形式的链接；非 pdf:// 链接返回 null */
export function parsePdfLink(href: string): { filePath: string; page: number; quote: string } | null {
  if (!href.startsWith('pdf://')) return null;
  const withoutProto = href.slice('pdf://'.length);
  const hashIdx = withoutProto.indexOf('#');
  const filePath = hashIdx >= 0 ? withoutProto.slice(0, hashIdx) : withoutProto;
  const paramStr = hashIdx >= 0 ? withoutProto.slice(hashIdx + 1) : '';
  const params = new URLSearchParams(paramStr);
  return {
    filePath,
    page: parseInt(params.get('page') || '1', 10),
    quote: params.get('quote') || '',
  };
}

export interface ContentLinkDeps {
  addFileByPath: (path: string, focus?: boolean) => Promise<unknown>;
  getCurrentFile: () => string | null;
  getCurrentPdfViewer: () => { scrollToPage(page: number): void; highlightQuote(page: number, quote: string): void } | null;
}

/** 拦截文档中的 pdf:// 链接与 Markdown 内部链接，在 mdv 内打开 */
export function setupContentLinks(deps: ContentLinkDeps): void {
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
    if (!target) return;
    const link = parsePdfLink(target.getAttribute('href') || '');
    if (!link) return;
    e.preventDefault();

    deps.addFileByPath(link.filePath).then(() => {
      setTimeout(() => {
        const viewer = deps.getCurrentPdfViewer();
        if (viewer) {
          viewer.scrollToPage(link.page);
          if (link.quote) viewer.highlightQuote(link.page, decodeURIComponent(link.quote));
        }
      }, 500);
    });
  });

  document.getElementById('content')?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute('href') || '';
    const absPath = resolveMarkdownLinkPath(href, deps.getCurrentFile());
    if (!absPath) return;
    e.preventDefault();
    deps.addFileByPath(absPath, true);
  });
}
