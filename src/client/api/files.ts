import type { FileData, FilesResponse, NearbyResponse, PathSuggestionsResponse, PathDetectResponse } from '../types';
import { showError } from '../ui/toast';

// 加载单个文件
export async function loadFile(path: string, silent: boolean = false): Promise<FileData | null> {
  try {
    const response = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
    const data = await response.json();
    if (data.error) {
      if (!silent) showError(data.error);
      return null;
    }
    return data;
  } catch (e: any) {
    if (!silent) showError(`加载失败: ${e.message}`);
    return null;
  }
}

// 搜索文件
export async function searchFiles(query: string): Promise<FilesResponse> {
  const response = await fetch(`/api/files?query=${encodeURIComponent(query)}`);
  return response.json();
}

// 获取附近文件
export async function getNearbyFiles(path: string): Promise<NearbyResponse> {
  const response = await fetch(`/api/nearby?path=${encodeURIComponent(path)}`);
  return response.json();
}

// 获取路径补全建议
export async function getPathSuggestions(
  input: string,
  options: { kind?: 'file' | 'directory'; markdownOnly?: boolean } = {}
): Promise<PathSuggestionsResponse> {
  const kind = options.kind || 'file';
  const markdownOnly = options.markdownOnly !== false;
  const params = new URLSearchParams({
    input,
    kind,
    markdownOnly: markdownOnly ? 'true' : 'false',
  });

  const response = await fetch(`/api/path-suggestions?${params.toString()}`);
  return response.json();
}

// 检测输入路径类型（md 文件 / 其他文件 / 目录）
export async function detectPathType(path: string): Promise<PathDetectResponse> {
  const response = await fetch('/api/detect-path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  return response.json();
}

// 打开文件（通知服务端）
export async function openFile(path: string, focus: boolean = true): Promise<void> {
  await fetch('/api/open', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, focus })
  });
}
