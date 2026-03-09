import type { Annotation } from '../annotation';

async function readJsonOrThrow(response: Response): Promise<any> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}`);
  }
  return data;
}

export async function fetchAnnotations(path: string): Promise<Annotation[]> {
  const response = await fetch(`/api/annotations?path=${encodeURIComponent(path)}`);
  const data = await readJsonOrThrow(response);
  return Array.isArray(data?.annotations) ? data.annotations : [];
}

export async function upsertAnnotationRemote(path: string, annotation: Annotation): Promise<Annotation> {
  const response = await fetch('/api/annotations/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, annotation }),
  });
  const data = await readJsonOrThrow(response);
  if (data?.success !== true || !data?.annotation) {
    throw new Error(data?.error || '保存评论失败');
  }
  return data.annotation as Annotation;
}

export async function replyAnnotationRemote(
  path: string,
  ref: { id?: string; serial?: number },
  text: string,
  author: string,
): Promise<Annotation> {
  const response = await fetch('/api/annotations/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, ...ref, text, author }),
  });
  const data = await readJsonOrThrow(response);
  if (data?.success !== true || !data?.annotation) {
    throw new Error(data?.error || '回复评论失败');
  }
  return data.annotation as Annotation;
}

export async function deleteAnnotationRemote(path: string, ref: { id?: string; serial?: number }): Promise<void> {
  const response = await fetch('/api/annotations/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, ...ref }),
  });
  const data = await readJsonOrThrow(response);
  if (data?.success !== true) {
    throw new Error(data?.error || '删除评论失败');
  }
}

export async function updateAnnotationStatusRemote(
  path: string,
  ref: { id?: string; serial?: number },
  status: NonNullable<Annotation['status']>,
): Promise<Annotation> {
  const response = await fetch('/api/annotations/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, ...ref, status }),
  });
  const data = await readJsonOrThrow(response);
  if (data?.success !== true || !data?.annotation) {
    throw new Error(data?.error || '更新评论状态失败');
  }
  return data.annotation as Annotation;
}
