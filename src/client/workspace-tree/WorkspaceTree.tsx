import { useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import type { FileTreeNode } from '../types';
import {
  buildWorkspaceViewModels,
  getPendingRemoveWorkspaceId,
  type MissingRowModel,
  type WorkspaceTreeStatus,
  type WorkspaceViewModel,
} from '../ui/sidebar-workspace';
import { state } from '../state';
import { FileRow } from '../file-list/FileRow';
import { buildFileListRow } from '../file-list/model';
import { getFileTypeIcon } from '../utils/file-type';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { workspaceTreeStore } from './store';

export interface WorkspaceTreeDeps {
  /** 每次渲染后调用（用于把当前文件滚动到可见位置） */
  onRendered: (container: HTMLElement) => void;
}

const TREE_INDENT_BASE = 4;
const TREE_INDENT_STEP = 8;

const EMPTY_WORKSPACE_HINT: CSSProperties = { fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 };

function EmptyWorkspace() {
  return (
    <div className="empty-workspace">
      <p>暂无工作区</p>
      <p style={EMPTY_WORKSPACE_HINT}>在上方输入目录路径后回车添加</p>
    </div>
  );
}

function WorkspaceActions({ vm, pendingRemove }: { vm: WorkspaceViewModel; pendingRemove: boolean }) {
  const id = vm.workspace.id;
  return (
    <div className="workspace-remove-actions" data-stop-propagation="true">
      {vm.canMoveUp && (
        <button className="workspace-order-btn" title="上移" data-action="workspace-move-up" data-workspace-id={id}>↑</button>
      )}
      {vm.canMoveDown && (
        <button className="workspace-order-btn" title="下移" data-action="workspace-move-down" data-workspace-id={id}>↓</button>
      )}
      <button
        className="workspace-order-btn"
        title="在 VS Code 中打开目录"
        data-action="workspace-open-in-editor"
        data-workspace-id={id}
        data-path={vm.workspace.path}
      >
        ↗
      </button>
      {pendingRemove ? (
        <button className="workspace-remove-confirm" title="确认移除" data-action="workspace-confirm-remove" data-workspace-id={id}>删</button>
      ) : (
        <button className="workspace-remove" title="移除工作区" data-action="workspace-ask-remove" data-workspace-id={id}>×</button>
      )}
    </div>
  );
}

function FileTreeStatus({ workspaceId, status }: { workspaceId: string; status: Exclude<WorkspaceTreeStatus, { kind: 'ready' }> }) {
  switch (status.kind) {
    case 'searching':
      return <div className="file-tree loading"><div className="tree-loading">搜索中...</div></div>;
    case 'loading':
      return <div className="file-tree loading"><div className="tree-loading">加载中...</div></div>;
    case 'failed':
      return (
        <div className="file-tree empty">
          <div className="tree-empty" data-action="retry-workspace-scan" data-workspace-id={workspaceId} style={{ cursor: 'pointer' }}>加载失败，点击重试</div>
        </div>
      );
    case 'unavailable':
      return <div className="file-tree empty"><div className="tree-empty">{status.query ? '未找到匹配文件' : '目录暂不可用'}</div></div>;
    case 'empty':
      return <div className="file-tree empty"><div className="tree-empty">{status.query ? '未找到匹配文件' : '此目录下没有 Markdown/HTML 文件'}</div></div>;
  }
}

function TreeNode({ workspaceId, node, depth, query }: { workspaceId: string; node: FileTreeNode; depth: number; query: string }) {
  const indentPx = TREE_INDENT_BASE + depth * TREE_INDENT_STEP;

  if (node.type === 'file') {
    const row = buildFileListRow({ path: node.path, name: node.name }, query);
    return (
      <div className="tree-node">
        <FileRow row={row} containerClass="tree-item file-node" clickAction="file-click" indentPx={indentPx} showClose={false} />
      </div>
    );
  }

  // 目录
  const isExpanded = node.isExpanded !== false; // 默认展开
  const hasChildren = !!node.children && node.children.length > 0;
  const nodeAction = hasChildren
    ? { 'data-action': 'node-click', 'data-workspace-id': workspaceId, 'data-node-path': node.path }
    : {};

  return (
    <div className="tree-node">
      <div className="tree-item directory-node">
        <span className="tree-indent" style={{ width: indentPx }} />
        <span className={`tree-toggle${hasChildren && isExpanded ? ' open' : ''}`} {...nodeAction}>{hasChildren ? '▶' : ''}</span>
        <span className="tree-name" {...nodeAction}>{node.name}</span>
        {node.fileCount ? <span className="tree-count">{node.fileCount}</span> : null}
      </div>
      {isExpanded && hasChildren && (
        <div className="file-tree">
          {node.children!.map((child) => (
            <TreeNode key={child.path} workspaceId={workspaceId} node={child} depth={depth + 1} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}

function MissingRow({ row }: { row: MissingRowModel }) {
  const typeIcon = getFileTypeIcon(row.path);
  const displayName = stripWorkspaceTreeDisplayExtension(row.name) || row.name;
  return (
    <div className={`tree-item file-node missing${row.isCurrent ? ' current' : ''}`} data-action="file-click" data-path={row.path}>
      <span className="tree-indent" style={{ width: 12 }} />
      <span className="tree-toggle" />
      <span className={`file-type-icon ${typeIcon.cls}`}>{typeIcon.label}</span>
      <span className="tree-status-inline"><span className="status-badge status-deleted">D</span></span>
      <span className="tree-name" title={row.name}>
        <span className="tree-name-full">
          {displayName}
          {row.nameHint && <span className="name-hint">{row.nameHint}</span>}
        </span>
      </span>
      {row.hasRetry && (
        <button className="tree-inline-action" title="重试加载" data-action="retry-missing-file" data-path={row.path}>↻</button>
      )}
      {row.hasClose && (
        <button className="tree-inline-action danger" title="关闭文件" data-action="close-file" data-path={row.path}>×</button>
      )}
    </div>
  );
}

/** 文件已从磁盘删除后，不会出现在扫描树里；这里保留一个特殊区块给重试/关闭操作 */
function MissingSection({ rows }: { rows: MissingRowModel[] }) {
  return (
    <div className="tree-missing-section">
      <div className="tree-missing-title">已删除</div>
      {rows.map((row) => <MissingRow key={row.path} row={row} />)}
    </div>
  );
}

function WorkspaceItem({ vm, query, pendingRemoveId }: { vm: WorkspaceViewModel; query: string; pendingRemoveId: string | null }) {
  const { workspace, expanded, isCurrent, isFailed } = vm;
  return (
    <div className="workspace-item">
      <div
        className={`workspace-header ${isCurrent ? 'active' : ''}`}
        data-action="workspace-toggle"
        data-workspace-id={workspace.id}
      >
        <span className={`workspace-toggle${expanded ? ' open' : ''}`}>▶</span>
        <span className="workspace-icon">{isFailed ? '⚠️' : '📁'}</span>
        <span className={`workspace-name${isFailed ? ' workspace-name--failed' : ''}`}>{workspace.name}</span>
        <WorkspaceActions vm={vm} pendingRemove={pendingRemoveId === workspace.id} />
      </div>
      {expanded && vm.treeStatus && vm.treeStatus.kind === 'ready' && (
        <div className="file-tree">
          {vm.treeStatus.tree.children?.map((node) => (
            <TreeNode key={node.path} workspaceId={workspace.id} node={node} depth={1} query={query} />
          ))}
        </div>
      )}
      {expanded && vm.treeStatus && vm.treeStatus.kind !== 'ready' && (
        <FileTreeStatus workspaceId={workspace.id} status={vm.treeStatus} />
      )}
      {vm.missingRows.length > 0 && <MissingSection rows={vm.missingRows} />}
    </div>
  );
}

export function WorkspaceTree({ deps }: { deps: WorkspaceTreeDeps }) {
  // 订阅重绘信号；数据在渲染时从 state 读取（与原字符串渲染一致）
  useSyncExternalStore(workspaceTreeStore.subscribe, workspaceTreeStore.getState);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (rootRef.current) deps.onRendered(rootRef.current);
  });

  const query = state.searchQuery.trim().toLowerCase();
  const workspaces = state.config.workspaces;
  const views = buildWorkspaceViewModels(query);
  const pendingRemoveId = getPendingRemoveWorkspaceId();

  return (
    <div className="workspace-section" ref={rootRef}>
      {workspaces.length === 0 && <EmptyWorkspace />}
      {workspaces.length > 0 && views.length === 0 && (
        <div className="empty-workspace"><p>未找到匹配内容</p></div>
      )}
      {views.map((vm) => (
        <WorkspaceItem key={vm.workspace.id} vm={vm} query={query} pendingRemoveId={pendingRemoveId} />
      ))}
    </div>
  );
}
