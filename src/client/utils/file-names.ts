import type { FileInfo } from '../types';

// 为同名文件生成区分名称
export function generateDistinctNames(files: Map<string, FileInfo>): FileInfo[] {
  const fileArray = Array.from(files.values());

  // 统计同名文件数量
  const nameCounts: Record<string, number> = {};
  fileArray.forEach(file => {
    nameCounts[file.name] = (nameCounts[file.name] || 0) + 1;
  });

  return fileArray.map(file => {
    // 如果文件名唯一，直接返回
    if (nameCounts[file.name] === 1) {
      return { ...file, displayName: file.name };
    }

    // 找到区分性的父目录名
    const pathParts = file.path.split('/').filter(Boolean);
    const sameNameFiles = fileArray.filter(f => f.name === file.name && f.path !== file.path);

    let distinctPart = '';
    for (let i = pathParts.length - 2; i >= 0; i--) {
      const part = pathParts[i];
      // 检查这个部分是否能区分当前文件
      if (sameNameFiles.every(f => f.path.split('/').filter(Boolean)[i] !== part)) {
        distinctPart = part;
        break;
      }
    }

    // 如果没找到区分性部分，使用倒数第二个目录
    if (!distinctPart && pathParts.length >= 2) {
      distinctPart = pathParts[pathParts.length - 2];
    }

    return {
      ...file,
      displayName: distinctPart ? `${file.name} (${distinctPart})` : file.name
    };
  });
}
