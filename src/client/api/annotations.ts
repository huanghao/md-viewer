import type { Annotation } from '../annotation';

export async function fetchAnnotations(path: string): Promise<Annotation[]> {
  const response = await fetch(`/api/annotations?path=${encodeURIComponent(path)}`);
  const data = await response.json();
  return Array.isArray(data?.annotations) ? data.annotations : [];
}

export async function saveAnnotationsRemote(path: string, annotations: Annotation[]): Promise<void> {
  await fetch('/api/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, annotations }),
  });
}

export async function migrateAnnotationsRemote(byPath: Record<string, Annotation[]>): Promise<{
  success?: boolean;
  importedFiles?: number;
  importedAnnotations?: number;
  skippedFiles?: number;
}> {
  const response = await fetch('/api/annotations/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ byPath }),
  });
  return response.json();
}

