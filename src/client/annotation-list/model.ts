import type { Annotation } from '../annotation-state';
import { getAnchorTrack, isResolvedAnn } from '../annotation/query';
import { getCommentThread } from '../annotation/thread-manager';
import type { AnnotationDensity } from '../annotation-state';
import type { AnnotationListView, AnnotationRowModel } from './store';

const QUOTE_MAX = 28;

function displayQuoteOf(ann: Annotation): string {
  return ann.displayQuote ?? ann.quote;
}

export function buildAnnotationRowTitle(ann: Annotation, index: number): string {
  const quote = displayQuoteOf(ann);
  const cut = quote.substring(0, QUOTE_MAX);
  return `#${ann.serial || index + 1} | ${cut}${quote.length > QUOTE_MAX ? '...' : ''}`;
}

/** simple 密度下展示的首条评论内容 */
function simpleNoteOf(ann: Annotation): string {
  const thread = getCommentThread(ann);
  return thread[0]?.note || ann.note || '（无评论内容）';
}

export interface BuildListViewInput {
  filePath: string | null;
  annotations: Annotation[];
  visible: Annotation[];
  density: AnnotationDensity;
  activeId: string | null;
  /** default 密度：每条评论锚点在内容区中的 top；null 表示未找到锚点 */
  anchorTopOf: (id: string) => number | null;
  contentScrollHeight: number;
}

export function buildAnnotationListView(input: BuildListViewInput): AnnotationListView {
  if (!input.filePath || input.annotations.length === 0) {
    return { kind: 'empty', text: '无评论（选中文本即可添加）' };
  }
  if (input.visible.length === 0) {
    return { kind: 'empty', text: '当前筛选下无评论' };
  }

  const positioned = input.density === 'default';
  let maxTop = 0;
  const rows: AnnotationRowModel[] = input.visible.map((ann, index) => {
    const thread = getCommentThread(ann);
    let anchorTop: number | null = null;
    if (positioned) {
      const top = input.anchorTopOf(ann.id) ?? index * 88;
      anchorTop = Math.max(0, Math.round(top));
      maxTop = Math.max(maxTop, top);
    }
    return {
      id: ann.id,
      title: buildAnnotationRowTitle(ann, index),
      active: input.activeId === ann.id,
      track: getAnchorTrack(ann),
      resolved: isResolvedAnn(ann),
      anchorTop,
      simpleNote: simpleNoteOf(ann),
      replyCount: Math.max(0, thread.length - 1),
      thread: input.density === 'simple' ? [] : thread,
    };
  });

  return {
    kind: 'rows',
    filePath: input.filePath,
    density: input.density,
    canvasHeight: Math.max(input.contentScrollHeight, maxTop + 180),
    contentScrollHeight: input.contentScrollHeight,
    rows,
  };
}
