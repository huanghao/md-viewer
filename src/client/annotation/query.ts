import { isOpen, isResolved, isUnanchored, type AnnotationStatus } from '../../annotation-status';
import type { Annotation } from '../annotation';

export type AnnotationFilter = 'all' | 'open' | 'resolved' | 'unanchored';

export function isResolvedAnn(ann: Annotation): boolean {
  return isResolved(ann.status as AnnotationStatus);
}

export function getAnchorTrack(ann: Annotation): 'exact' | 'reanchored' | 'unanchored' {
  if (isUnanchored(ann.status as AnnotationStatus)) return 'unanchored';
  if ((ann.confidence || 0) >= 0.95) return 'exact';
  return 'reanchored';
}

export function matchesFilter(
  ann: Annotation,
  filter: AnnotationFilter,
  includeUnanchored = false,
): boolean {
  const unanchored = isUnanchored(ann.status as AnnotationStatus) || getAnchorTrack(ann) === 'unanchored';
  if (filter === 'all') return true;
  if (filter === 'open') {
    if (includeUnanchored) return isOpen(ann.status as AnnotationStatus) || unanchored;
    return isOpen(ann.status as AnnotationStatus);
  }
  if (filter === 'resolved') return isResolved(ann.status as AnnotationStatus) && !unanchored;
  if (filter === 'unanchored') return unanchored;
  return true;
}

export function getVisibleAnnotations(
  annotations: Annotation[],
  filter: AnnotationFilter,
  includeUnanchored = false,
): Annotation[] {
  return [...annotations]
    .filter((ann) => matchesFilter(ann, filter, includeUnanchored))
    .sort((a, b) => a.start - b.start);
}
