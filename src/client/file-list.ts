import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { FileList, type FileListDeps } from './file-list/FileList';

/** 文件列表（“打开”视图）对外入口：renderFiles 通过 fileListStore.setSnapshot 推送数据，这里只负责挂载 */
export function mountFileList(deps: FileListDeps): void {
  const el = document.getElementById('openFileList');
  if (!el) return;
  createRoot(el).render(createElement(FileList, { deps }));
}
