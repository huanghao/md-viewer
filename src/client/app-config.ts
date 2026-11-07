import { setPdfDefaultScale } from './pdf-state';

/** 从服务端 /api/config 读取的客户端配置子集 */
export interface ClientConfigSubset {
  pdf?: { defaultScale?: number };
}

/** 从配置中取出 PDF 默认缩放；缺失时返回 null */
export function pickPdfDefaultScale(cfg: ClientConfigSubset | null | undefined): number | null {
  const scale = cfg?.pdf?.defaultScale;
  return typeof scale === 'number' && scale > 0 ? scale : null;
}

/** 启动时拉取服务端客户端配置。失败时静默保持默认值，不阻塞启动。 */
export async function loadClientConfig(): Promise<void> {
  try {
    console.time('[init] /api/config');
    const res = await fetch('/api/config');
    if (res.ok) {
      const scale = pickPdfDefaultScale(await res.json());
      if (scale !== null) setPdfDefaultScale(scale);
    }
  } catch {}
  console.timeEnd('[init] /api/config');
}
