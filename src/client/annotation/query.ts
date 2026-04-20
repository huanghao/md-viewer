import { isOpen, isResolved, isOrphan, type AnnotationStatus } from '../../annotation-status';
import type { Annotation } from '../annotation';

export type AnnotationFilter = 'all' | 'open' | 'resolved' | 'orphan';

export function isResolvedAnn(ann: Annotation): boolean {
  return isResolved(ann.status as AnnotationStatus);
}

export function getAnchorTrack(ann: Annotation): 'exact' | 'reanchored' | 'orphan' {
  if (isOrphan(ann.status as AnnotationStatus)) return 'orphan';
  if ((ann.confidence || 0) >= 0.95) return 'exact';
  return 'reanchored';
}

export function matchesFilter(ann: Annotation, filter: AnnotationFilter): boolean {
  const orphan = isOrphan(ann.status as AnnotationStatus) || getAnchorTrack(ann) === 'orphan';
  if (filter === 'all') return true;
  if (filter === 'open') return isOpen(ann.status as AnnotationStatus);
  if (filter === 'resolved') return isResolved(ann.status as AnnotationStatus) && !orphan;
  if (filter === 'orphan') return orphan;
  return true;
}

export function getVisibleAnnotations(annotations: Annotation[], filter: AnnotationFilter): Annotation[] {
  return [...annotations]
    .filter((ann) => matchesFilter(ann, filter))
    .sort((a, b) => a.start - b.start);
}
