export const styles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      height: 100vh;
      overflow: hidden;
    }
    .app {
      display: flex;
      height: 100vh;
    }

    /* 左侧边栏 */
    .sidebar {
      width: 260px;
      background: #fff;
      border-right: 1px solid #e1e4e8;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #e1e4e8;
    }
    .sidebar-header h1 {
      font-size: 16px;
      color: #24292e;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-icon {
      color: #2563eb;
      flex-shrink: 0;
    }

    /* 搜索框 */
    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      font-size: 14px;
      color: #57606a;
      pointer-events: none;
    }
    .search-input {
      flex: 1;
      padding: 8px 32px 8px 32px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
    }
    .search-input::placeholder {
      color: #57606a;
    }
    .search-input:focus {
      outline: none;
      border-color: #0969da;
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
    }
    .search-clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      font-size: 20px;
      color: #57606a;
      cursor: pointer;
      padding: 0 4px;
      border-radius: 4px;
    }
    .search-clear:hover {
      background: #f6f8fa;
      color: #24292e;
    }

    /* 当前文件路径 */
    .current-path-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f6f8fa;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .current-path-text {
      flex: 1;
      color: #57606a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .current-path-copy {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 4px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #586069;
      transition: all 0.2s;
    }
    .current-path-copy:hover {
      background: rgba(0,0,0,0.05);
      color: #24292e;
    }
    .current-path-copy:active {
      transform: scale(0.95);
    }
    .current-path-copy.success {
      color: #1a7f37;
    }

    /* Notion 风格复制图标 */
    .current-path-copy .copy-icon {
      width: 16px;
      height: 16px;
      position: relative;
      display: block;
    }
    .current-path-copy .copy-icon::before,
    .current-path-copy .copy-icon::after {
      content: '';
      position: absolute;
      border: 1.5px solid currentColor;
      border-radius: 3px;
      background: white;
    }
    .current-path-copy .copy-icon::before {
      width: 11px;
      height: 13px;
      top: 0;
      left: 3px;
      border-bottom-left-radius: 0;
    }
    .current-path-copy .copy-icon::after {
      width: 11px;
      height: 13px;
      top: 3px;
      left: 0;
    }
    .current-path-copy .check-icon {
      display: none;
      width: 16px;
      height: 16px;
    }
    .current-path-copy .check-icon svg {
      width: 100%;
      height: 100%;
    }
    .current-path-copy.success .copy-icon {
      display: none;
    }
    .current-path-copy.success .check-icon {
      display: block;
    }

    /* Tooltip */
    .copy-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #24292e;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
      margin-bottom: 4px;
    }
    .current-path-copy:hover .copy-tooltip {
      opacity: 1;
    }

    /* 搜索高亮 */
    .search-highlight {
      background: #fff8c5;
      color: #24292e;
      font-weight: 500;
      padding: 0 2px;
      border-radius: 2px;
    }
    /* 添加文件区域 */
    .add-file-section {
      padding: 16px;
      border-bottom: 1px solid #e1e4e8;
      background: #f6f8fa;
    }
    .add-file-title {
      font-size: 13px;
      font-weight: 600;
      color: #24292e;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .add-file-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      margin-bottom: 8px;
    }
    .add-file-input::placeholder {
      color: #57606a;
    }
    .add-file-input:focus {
      outline: none;
      border-color: #0969da;
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
    }
    .add-file-hint {
      font-size: 12px;
      color: #57606a;
      text-align: center;
    }

    .file-list {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px;
      min-height: 0;
    }
    .file-item {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 16px;
      cursor: pointer;
      margin-bottom: 4px;
      font-size: 13px;
      color: #1f2328;
      background: transparent;
      border: 2px solid transparent;
      gap: 6px;
      position: relative;
      font-weight: 400;
    }
    .file-item-status {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .file-item:hover {
      background: #f6f8fa;
    }
    .file-item.current {
      background: #e8f0fe;
      color: #0969da;
      border: 2px solid transparent;
      font-weight: 400;
    }
    .file-item .icon {
      flex-shrink: 0;
    }
    .new-dot {
      width: 6px;
      height: 6px;
      background: #007AFF;
      border-radius: 50%;
      flex-shrink: 0;
      margin: 0 auto;
    }
    .status-badge {
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 11px;
      font-weight: 700;
      width: 100%;
      text-align: center;
      flex-shrink: 0;
      display: block;
    }
    .status-modified {
      color: #ff9500;
    }
    .status-deleted {
      color: #ff3b30;
    }
    .file-item .name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    .file-item .close {
      opacity: 0;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .file-item:hover .close {
      opacity: 1;
    }
    .file-item .close:hover {
      background: #ff4444;
      color: white;
    }
    .empty-tip {
      padding: 20px;
      text-align: center;
      color: #6a737d;
      font-size: 13px;
    }

    /* 主内容区 */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* 工具栏 */
    .toolbar {
      height: 48px;
      background: #fff;
      border-bottom: 1px solid #e1e4e8;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
    }
    .toolbar .spacer {
      flex: 1;
    }
    .file-meta {
      font-size: 12px;
      color: #586069;
    }

    /* 刷新按钮 */
    .refresh-button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      border: 1px solid #ff9500;
      background: #fff;
      color: #ff9500;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .refresh-button:hover {
      background: #fff8e6;
    }

    /* 同步按钮 */
    .sync-button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      border: 1px solid #d1d5da;
      background: #fff;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .sync-button:hover {
      background: #f6f8fa;
    }
    .sync-button.synced {
      color: #2ea44f;
      border-color: #2ea44f;
    }
    .sync-button.synced:hover {
      background: #e6f7ed;
    }
    .sync-button.syncing {
      color: #586069;
      cursor: not-allowed;
      opacity: 0.6;
    }
    .sync-button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* 面包屑 */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #24292e;
    }
    .breadcrumb-item {
      color: #586069;
    }
    .breadcrumb-item.active {
      color: #586069;
      font-weight: 500;
    }
    .breadcrumb-separator {
      color: #d1d5da;
    }
    .copy-filename-button {
      padding: 2px 6px;
      margin-left: 4px;
      border: none;
      background: transparent;
      color: #586069;
      cursor: pointer;
      font-size: 14px;
      border-radius: 4px;
      transition: all 0.2s;
      opacity: 0.6;
    }
    .copy-filename-button:hover {
      background: #e1e4e8;
      opacity: 1;
    }

    /* 标签页 */
    .tabs {
      display: flex;
      background: #f6f8fa;
      border-bottom: 1px solid #e1e4e8;
      overflow-x: auto;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f6f8fa;
      border-right: 1px solid #e1e4e8;
      cursor: pointer;
      font-size: 13px;
      white-space: nowrap;
    }
    .tab:hover {
      background: #fff;
    }
    .tab.active {
      background: #fff;
      border-bottom: 2px solid #0969da;
      margin-bottom: -1px;
    }
    .tab.deleted .tab-name {
      color: #ff3b30;
      text-decoration: line-through;
    }
    .tab .close {
      opacity: 0.5;
      padding: 0 4px;
    }
    .tab .close:hover {
      opacity: 1;
      background: #ff4444;
      color: white;
      border-radius: 4px;
    }

    /* 内容区 */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .markdown-wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .markdown-body {
      background: transparent !important;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6a737d;
    }
    .empty-state h2 {
      font-size: 20px;
      margin-bottom: 12px;
      color: #24292e;
    }

    /* 同步对话框 */
    .sync-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }
    .sync-dialog-overlay.show {
      display: flex;
    }
    .sync-dialog {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 520px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .sync-dialog-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e1e4e8;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sync-dialog-title {
      font-size: 16px;
      font-weight: 600;
      color: #24292e;
    }
    .sync-dialog-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #586069;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }
    .sync-dialog-close:hover {
      background: #f6f8fa;
    }
    .sync-dialog-body {
      padding: 24px;
    }
    .sync-dialog-field {
      margin-bottom: 20px;
    }
    .sync-dialog-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #24292e;
      margin-bottom: 8px;
    }
    .sync-dialog-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }
    .sync-dialog-input:focus {
      outline: none;
      border-color: #0969da;
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
    }
    .sync-dialog-recent {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .sync-dialog-recent-item {
      padding: 12px;
      border-bottom: 1px solid #e1e4e8;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .sync-dialog-recent-item:last-child {
      border-bottom: none;
    }
    .sync-dialog-recent-item:hover {
      background: #f6f8fa;
    }
    .sync-dialog-recent-item.selected {
      background: #ddf4ff;
    }
    .sync-dialog-recent-radio {
      margin-top: 2px;
    }
    .sync-dialog-recent-info {
      flex: 1;
    }
    .sync-dialog-recent-title {
      font-size: 14px;
      color: #24292e;
      margin-bottom: 4px;
    }
    .sync-dialog-recent-meta {
      font-size: 12px;
      color: #586069;
    }
    .sync-dialog-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #24292e;
      margin-bottom: 20px;
    }
    .sync-dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #e1e4e8;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .sync-dialog-button {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid #d1d5da;
      background: #fff;
      color: #24292e;
    }
    .sync-dialog-button:hover {
      background: #f6f8fa;
    }
    .sync-dialog-button.primary {
      background: #2ea44f;
      color: #fff;
      border-color: #2ea44f;
    }
    .sync-dialog-button.primary:hover {
      background: #2c974b;
    }
    .sync-dialog-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .sync-dialog-empty {
      padding: 20px;
      text-align: center;
      color: #586069;
      font-size: 13px;
    }
    .sync-dialog-error {
      padding: 12px;
      background: #fff5f5;
      border: 1px solid #ff4444;
      border-radius: 6px;
      color: #cf222e;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .sync-dialog-output {
      background: #f6f8fa;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      user-select: all;
      margin-top: 12px;
      position: relative;
    }
    .sync-dialog-output-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .sync-dialog-copy-btn {
      padding: 4px 8px;
      font-size: 11px;
      background: #fff;
      border: 1px solid #d1d5da;
      border-radius: 4px;
      cursor: pointer;
      color: #586069;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .sync-dialog-copy-btn:hover {
      background: #f6f8fa;
      border-color: #0969da;
      color: #0969da;
    }
    .sync-dialog-copy-btn:active {
      background: #e6f7ed;
    }

    /* 加载动画 */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* 内容刷新闪烁动画 */
    @keyframes flash {
      0% { background: #fff8c5; }
      100% { background: transparent; }
    }

    /* Toast 通知 */
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      min-width: 280px;
      max-width: 400px;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      pointer-events: auto;
      cursor: pointer;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .toast-show {
      opacity: 1;
      transform: translateX(0);
    }

    .toast-hide {
      opacity: 0;
      transform: translateX(100%);
    }

    .toast-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 14px;
      font-weight: bold;
    }

    .toast-message {
      flex: 1;
      color: #24292f;
      line-height: 1.4;
    }

    /* Toast 类型样式 */
    .toast-success {
      border-left: 4px solid #1a7f37;
    }
    .toast-success .toast-icon {
      background: #dafbe1;
      color: #1a7f37;
    }

    .toast-error {
      border-left: 4px solid #d1242f;
    }
    .toast-error .toast-icon {
      background: #ffebe9;
      color: #d1242f;
    }

    .toast-warning {
      border-left: 4px solid #bf8700;
    }
    .toast-warning .toast-icon {
      background: #fff8c5;
      color: #bf8700;
    }

    .toast-info {
      border-left: 4px solid #0969da;
    }
    .toast-info .toast-icon {
      background: #ddf4ff;
      color: #0969da;
    }

    .toast:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    /* ==================== 工作区模式样式 ==================== */

    /* 工作区区域 */
    .workspace-section {
      flex: 1;
      overflow-y: auto;
      padding: 12px 8px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #57606a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-header-actions {
      display: flex;
      gap: 4px;
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      font-size: 14px;
      opacity: 0.6;
    }

    .icon-button:hover {
      background: #f6f8fa;
      opacity: 1;
    }

    /* 工作区项 */
    .workspace-item {
      margin-bottom: 4px;
    }

    .workspace-header {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 6px;
      font-size: 13px;
      color: #24292e;
      user-select: none;
    }

    .workspace-header:hover {
      background: #f6f8fa;
    }

    .workspace-header.active {
      background: #e8f0fe;
      color: #0969da;
      font-weight: 400;
    }

    .workspace-icon {
      margin-right: 6px;
      font-size: 16px;
    }

    .workspace-name {
      flex: 1;
    }

    .workspace-toggle {
      font-size: 12px;
      color: #57606a;
      margin-right: 4px;
      width: 16px;
      text-align: center;
    }

    /* 文件树 */
    .file-tree {
      padding-left: 8px;
      margin-top: 4px;
    }

    .file-tree.loading,
    .file-tree.empty {
      padding: 12px;
      text-align: center;
      font-size: 12px;
      color: #57606a;
    }

    .tree-node {
      margin-bottom: 2px;
    }

    .tree-item {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 13px;
      color: #24292e;
      user-select: none;
    }

    .tree-item:hover {
      background: #f6f8fa;
    }

    .tree-item.current {
      background: #e8f0fe;
      color: #0969da;
      font-weight: 400;
    }

    .tree-toggle {
      width: 16px;
      font-size: 10px;
      color: #57606a;
      flex-shrink: 0;
      text-align: center;
    }

    .tree-icon {
      margin-right: 6px;
      font-size: 14px;
      flex-shrink: 0;
    }

    .tree-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tree-count {
      font-size: 11px;
      color: #57606a;
      background: #f6f8fa;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 4px;
    }

    /* 已打开文件区域 */
    .open-files-section {
      border-top: 1px solid #e1e4e8;
      padding: 12px 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .empty-open-files {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #57606a;
    }

    .open-file-item {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 6px;
      font-size: 13px;
      color: #24292e;
      margin-bottom: 2px;
    }

    .open-file-item:hover {
      background: #f6f8fa;
    }

    .open-file-item.current {
      background: #e8f0fe;
      color: #0969da;
      font-weight: 400;
    }

    .open-file-icon {
      margin-right: 8px;
      font-size: 14px;
    }

    .open-file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .open-file-close {
      opacity: 0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 16px;
      color: #57606a;
    }

    .open-file-item:hover .open-file-close {
      opacity: 1;
    }

    .open-file-close:hover {
      background: #ff4444;
      color: white;
    }

    /* 空工作区提示 */
    .empty-workspace {
      padding: 20px;
      text-align: center;
      color: #57606a;
      font-size: 13px;
    }

    /* ==================== 设置对话框样式 ==================== */

    .settings-section {
      margin-bottom: 24px;
    }

    .settings-section:last-child {
      margin-bottom: 0;
    }

    .settings-section-title {
      font-size: 14px;
      font-weight: 600;
      color: #24292e;
      margin-bottom: 4px;
    }

    .settings-section-desc {
      font-size: 12px;
      color: #57606a;
      margin-bottom: 12px;
    }

    /* 单选按钮组 */
    .settings-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .settings-radio-item {
      display: flex;
      align-items: flex-start;
      padding: 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .settings-radio-item:hover {
      background: #f6f8fa;
      border-color: #0969da;
    }

    .settings-radio-item input[type="radio"] {
      margin-top: 2px;
      margin-right: 12px;
      cursor: pointer;
    }

    .settings-radio-item input[type="radio"]:checked {
      accent-color: #0969da;
    }

    .settings-radio-content {
      flex: 1;
    }

    .settings-radio-title {
      font-size: 13px;
      font-weight: 500;
      color: #24292e;
      margin-bottom: 4px;
    }

    .settings-radio-desc {
      font-size: 12px;
      color: #57606a;
    }

    /* 工作区列表 */
    .settings-workspace-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .settings-workspace-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: #f6f8fa;
      border-radius: 6px;
      gap: 12px;
    }

    .settings-workspace-info {
      flex: 1;
      min-width: 0;
    }

    .settings-workspace-name {
      font-size: 13px;
      font-weight: 500;
      color: #24292e;
      margin-bottom: 4px;
    }

    .settings-workspace-path {
      font-size: 12px;
      color: #57606a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .settings-workspace-remove {
      background: none;
      border: none;
      font-size: 20px;
      color: #57606a;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .settings-workspace-remove:hover {
      background: #ff4444;
      color: white;
    }

    .settings-empty {
      padding: 20px;
      text-align: center;
      color: #57606a;
      font-size: 13px;
      background: #f6f8fa;
      border-radius: 6px;
    }

    /* 设置按钮 */
    .settings-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 4px;
      font-size: 16px;
      color: #57606a;
      transition: all 0.2s;
    }

    .settings-button:hover {
      background: #f6f8fa;
      color: #0969da;
    }
`;
