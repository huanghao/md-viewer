export const styles = `
    :root {
      --font-scale: 1.0;
      --sidebar-width: 260px;
    }

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
      width: var(--sidebar-width);
      background: #fff;
      border-right: 1px solid #e1e4e8;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .sidebar-resizer {
      width: 8px;
      cursor: col-resize;
      background: transparent;
      border-left: 1px solid transparent;
      border-right: 1px solid transparent;
      transition: background-color 0.15s ease;
      flex-shrink: 0;
    }
    .sidebar-resizer:hover {
      background: rgba(9, 105, 218, 0.08);
    }
    body.sidebar-resizing {
      cursor: col-resize;
      user-select: none;
    }
    body.sidebar-resizing .sidebar-resizer {
      background: rgba(9, 105, 218, 0.12);
    }
    .sidebar-header {
      padding: 0;
      border-bottom: none;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header h1 {
      font-size: 16px;
      color: #24292e;
      height: 48px;
      margin: 0;
      padding: 0 12px;
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
      margin: 0;
      width: 100%;
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
      padding: 8px 30px 8px 30px;
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

    #searchBox {
      height: 34px;
      padding: 0 12px;
      display: flex;
      align-items: center;
    }
    #modeSwitchRow {
      height: 28px;
      padding: 0 12px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
    }
    .mode-switch-row {
      height: 28px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #57606a;
    }
    .mode-switch-icon {
      width: 20px;
      height: 20px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #6b7280;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .mode-switch-icon:hover {
      background: #f1f5f9;
      color: #374151;
    }
    .mode-switch-icon svg {
      width: 14px;
      height: 14px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .mode-switch-label {
      font-size: 13px;
      font-weight: 500;
      color: #57606a;
      letter-spacing: 0.2px;
      user-select: none;
    }

    .quick-action-confirm-host {
      margin-top: 0;
      position: relative;
      z-index: 2601;
    }
    body.quick-action-confirm-visible .quick-action-confirm-host {
      margin-top: 6px;
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
    .sidebar.workspace-mode .sidebar-header {
      border-bottom: none;
    }
    .sidebar.workspace-mode .add-file-section {
      border-bottom: none;
      padding: 8px 12px 6px 12px;
      background: transparent;
    }
    .sidebar.workspace-mode .add-file-title {
      margin-bottom: 4px;
      font-size: 12px;
    }
    .sidebar.workspace-mode .add-file-hint {
      margin-top: 4px;
      font-size: 11px;
      line-height: 1.3;
    }
    .sidebar.workspace-mode .workspace-section {
      padding-top: 0;
    }
    .add-file-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      margin-bottom: 0;
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
      text-align: left;
      margin-top: 8px;
    }
    .add-file-input-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .add-file-button {
      height: 34px;
      min-width: 54px;
      border-radius: 6px;
      border: 1px solid #d0d7de;
      background: #fff;
      color: #57606a;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      padding: 0 10px;
      flex-shrink: 0;
    }
    .add-file-button:hover {
      background: #f6f8fa;
      border-color: #b6bec7;
      color: #24292e;
    }
    .add-file-confirm {
      margin-top: 10px;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
    }
    .add-file-confirm.state-warning {
      background: #fff8c5;
      border-color: #f0d264;
      color: #7a4e00;
    }
    .add-file-confirm.state-directory {
      background: #eaf5ff;
      border-color: #a8d3ff;
      color: #095a9f;
    }
    .add-file-confirm.state-error {
      background: #ffebe9;
      border-color: #ffb3ad;
      color: #cf222e;
    }
    .add-file-confirm-text {
      line-height: 1.4;
      flex: 1;
    }
    .add-file-confirm-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    .add-file-confirm-button {
      height: 26px;
      border-radius: 6px;
      border: 1px solid #d0d7de;
      background: #fff;
      color: #24292e;
      font-size: 12px;
      padding: 0 10px;
      cursor: pointer;
    }
    .add-file-confirm-button.primary {
      border-color: #0969da;
      background: #0969da;
      color: #fff;
      font-weight: 600;
    }
    .add-file-confirm-button:hover {
      filter: brightness(0.98);
    }
    .path-autocomplete-panel {
      position: absolute;
      z-index: 2500;
      max-height: 260px;
      overflow-y: auto;
      background: #ffffff;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(31, 35, 40, 0.12);
    }
    .path-autocomplete-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      font-size: 12px;
      cursor: pointer;
      color: #24292e;
      border-bottom: 1px solid #f0f2f5;
    }
    .path-autocomplete-item:last-child {
      border-bottom: none;
    }
    .path-autocomplete-item:hover,
    .path-autocomplete-item.active {
      background: #e8f0fe;
      color: #0969da;
    }
    .path-autocomplete-icon {
      width: 16px;
      text-align: center;
      flex-shrink: 0;
    }
    .path-autocomplete-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    .file-list {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 6px 8px 8px;
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
    .file-item.deleted {
      color: #cf222e;
      background: #fff5f5;
    }
    .file-item.deleted .name {
      color: #cf222e;
      text-decoration: line-through;
    }
    .file-item.deleted.current {
      background: #ffebe9;
      color: #cf222e;
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
    .file-item .file-item-status {
      margin-left: auto;
      order: 2;
    }
    .file-item .close {
      opacity: 0;
      padding: 2px 6px;
      border-radius: 4px;
      order: 3;
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
      min-width: 0;
    }

    @media (max-width: 900px) {
      :root {
        --sidebar-width: 260px !important;
      }
      .sidebar-resizer {
        display: none;
      }
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
      color: #9ca3af;
      font-weight: 400;
      white-space: nowrap;
    }

    /* 字体缩放按钮 */
    .font-scale-button {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 400;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
      cursor: pointer;
      border: none;
      background: transparent;
      color: #9ca3af;
      transition: all 0.15s ease;
      white-space: nowrap;
      position: relative;
    }

    .font-scale-button:hover {
      background: rgba(0, 0, 0, 0.04);
      color: #6b7280;
    }

    /* 字体缩放菜单 */
    .font-scale-menu {
      position: absolute;
      top: 48px;
      right: 80px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 4px 0;
      min-width: 80px;
      z-index: 1000;
    }

    .font-scale-option {
      padding: 6px 16px;
      font-size: 13px;
      color: #374151;
      cursor: pointer;
      transition: background 0.15s ease;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
    }

    .font-scale-option:hover {
      background: #f3f4f6;
    }

    .font-scale-option.active {
      color: #3b82f6;
      font-weight: 500;
    }

    .font-scale-option.active::after {
      content: ' ✓';
      margin-left: 8px;
    }

    /* 纯文本工具栏按钮 */
    .toolbar-text-button {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 400;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
      cursor: pointer;
      border: none;
      background: transparent;
      color: #6b7280;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .toolbar-text-button:hover {
      background: rgba(0, 0, 0, 0.04);
      color: #374151;
    }

    .toolbar-text-button:active {
      background: rgba(0, 0, 0, 0.08);
    }

    /* 已同步状态 */
    .toolbar-text-button.synced {
      color: #1a7f37;
    }

    .toolbar-text-button.synced:hover {
      background: rgba(26, 127, 55, 0.08);
    }
    .sync-info-popover {
      z-index: 40;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
      padding: 10px 12px;
    }
    .sync-info-popover-link {
      display: inline-block;
      max-width: 100%;
      color: #0969da;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-bottom: 1px dashed rgba(9, 105, 218, 0.35);
    }
    .sync-info-popover-link:hover {
      border-bottom-color: #0969da;
    }
    .sync-info-popover-time {
      margin-top: 6px;
      color: #57606a;
      font-size: 12px;
      line-height: 1.35;
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
      padding: 4px;
      margin-left: 6px;
      border: none;
      background: transparent;
      color: #586069;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.2s;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
    }
    .copy-filename-button:hover {
      background: rgba(0,0,0,0.05);
    }
    .copy-filename-button:active {
      transform: scale(0.95);
    }
    .copy-filename-button.success {
      color: #1a7f37;
    }

    /* GitHub 风格复制图标 - 双重方框 */
    .copy-icon {
      width: 13px;
      height: 13px;
      position: relative;
      display: inline-block;
    }
    .copy-icon::before,
    .copy-icon::after {
      content: '';
      position: absolute;
      border: 1.2px solid currentColor;
      border-radius: 2px;
    }
    .copy-icon::before {
      width: 8px;
      height: 10px;
      top: 0;
      left: 3px;
    }
    .copy-icon::after {
      width: 8px;
      height: 10px;
      top: 3px;
      left: 0;
    }

    /* 对勾图标 */
    .check-icon {
      display: none;
      width: 13px;
      height: 13px;
    }
    .check-icon svg {
      width: 100%;
      height: 100%;
    }
    .copy-filename-button.success .copy-icon {
      display: none;
    }
    .copy-filename-button.success .check-icon {
      display: inline-block;
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
      z-index: 1000;
    }
    .copy-filename-button:hover .copy-tooltip {
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

    /* 文件类型徽章 */
    .file-type-badge {
      display: inline-block;
      background: #f3f4f6;
      color: #6b7280;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
      font-weight: 500;
      vertical-align: middle;
    }
    .tab .file-type-badge {
      font-size: 10px;
      padding: 1px 5px;
      margin-left: 4px;
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
      font-size: calc(16px * var(--font-scale));
    }
    .content-file-status {
      margin-bottom: 12px;
      padding: 9px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.45;
    }
    .content-file-status.deleted {
      border-color: #ffd6d1;
      background: #fff4f2;
      color: #b42318;
    }

    .markdown-body h1 {
      font-size: calc(2em * var(--font-scale));
    }

    .markdown-body h2 {
      font-size: calc(1.5em * var(--font-scale));
    }

    .markdown-body h3 {
      font-size: calc(1.25em * var(--font-scale));
    }

    .markdown-body h4 {
      font-size: calc(1em * var(--font-scale));
    }

    .markdown-body h5 {
      font-size: calc(0.875em * var(--font-scale));
    }

    .markdown-body h6 {
      font-size: calc(0.85em * var(--font-scale));
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
      border-radius: 10px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 520px;
      max-height: 80vh;
      overflow-y: auto;
    }
    .sync-dialog-header {
      padding: 14px 16px;
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
      padding: 14px 16px;
    }
    .sync-dialog-field {
      margin-bottom: 12px;
    }
    .sync-dialog-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #24292e;
      margin-bottom: 6px;
    }
    .sync-dialog-input {
      width: 100%;
      padding: 7px 10px;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
    }
    .sync-dialog-input:focus {
      outline: none;
      border-color: #0969da;
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
    }
    .sync-dialog-recent {
      max-height: 168px;
      overflow-y: auto;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .sync-dialog-recent-item {
      padding: 8px 10px;
      border-bottom: 1px solid #e1e4e8;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sync-dialog-recent-item:last-child {
      border-bottom: none;
    }
    .sync-dialog-recent-item:hover {
      background: #f6f8fa;
    }
    .sync-dialog-recent-item.selected {
      background: #f8fafc;
    }
    .sync-dialog-recent-radio {
      margin: 0;
    }
    .sync-dialog-recent-main {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }
    .sync-dialog-recent-title-link {
      color: #24292e;
      text-decoration: none;
      border-bottom: 1px dashed transparent;
      min-width: 0;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 13px;
      line-height: 1.2;
    }
    .sync-dialog-recent-title-link:hover {
      color: #0969da;
      border-bottom-color: #0969da;
    }
    .sync-dialog-recent-inline-meta {
      font-size: 12px;
      color: #586069;
      flex-shrink: 0;
      line-height: 1.2;
    }
    .sync-dialog-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #24292e;
      margin-bottom: 0;
    }
    .sync-dialog-manual-input {
      margin-top: 8px;
    }
    .sync-dialog-parent-meta {
      margin-top: 6px;
      min-height: 18px;
      font-size: 12px;
      line-height: 1.4;
    }
    .sync-dialog-parent-meta-link {
      color: #0969da;
      text-decoration: none;
      border-bottom: 1px dashed rgba(9, 105, 218, 0.35);
      display: inline-block;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sync-dialog-parent-meta-link:hover {
      border-bottom-color: #0969da;
    }
    .sync-dialog-parent-meta-text {
      color: #374151;
    }
    .sync-dialog-parent-meta-muted {
      color: #6b7280;
    }
    .sync-dialog-footer {
      padding: 10px 16px;
      border-top: 1px solid #e1e4e8;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .sync-dialog-status {
      margin-top: 10px;
    }
    .sync-dialog-status-block {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 9px 10px;
      font-size: 12px;
      line-height: 1.5;
    }
    .sync-dialog-status-block.running {
      background: #f5f8ff;
      border-color: #d6e4ff;
      color: #1d4ed8;
    }
    .sync-dialog-status-block.error {
      background: #fff4f2;
      border-color: #ffd6d1;
      color: #b42318;
    }
    .sync-dialog-status-block.success {
      background: #edfdf3;
      border-color: #c7f0d4;
      color: #116329;
    }
    .sync-dialog-status-message {
      margin-bottom: 8px;
    }
    .sync-dialog-status-line {
      margin-bottom: 8px;
      color: #374151;
    }
    .sync-dialog-btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid #d1d5da;
      background: #fff;
      color: #24292e;
    }
    .sync-dialog-btn:hover {
      background: #f6f8fa;
    }
    .sync-dialog-btn-primary {
      background: #0969da;
      color: #fff;
      border-color: #0969da;
    }
    .sync-dialog-btn-primary:hover {
      background: #0550ae;
    }
    .sync-dialog-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .sync-dialog-button {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
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
      background: #0969da;
      color: #fff;
      border-color: #0969da;
    }
    .sync-dialog-button.primary:hover {
      background: #0550ae;
    }
    .sync-dialog-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .sync-dialog-link {
      color: #0969da;
      text-decoration: none;
      font-size: 12px;
      word-break: break-all;
    }
    .sync-dialog-doc-link {
      color: #0969da;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
      display: inline-block;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-bottom: 1px dashed rgba(9, 105, 218, 0.35);
    }
    .sync-dialog-doc-link:hover {
      border-bottom-color: #0969da;
    }
    .sync-dialog-link:hover {
      text-decoration: underline;
    }
    .sync-dialog-link-row {
      margin-top: -2px;
      margin-bottom: 10px;
    }
    .sync-dialog-meta {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.5;
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
    .sync-dialog-codepanel {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #fafbfc;
      overflow: hidden;
    }
    .sync-dialog-codepanel-top {
      height: 30px;
      padding: 0 8px 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #eceff3;
      background: #f8fafc;
    }
    .sync-dialog-codepanel-title {
      font-size: 12px;
      color: #6b7280;
    }
    .sync-dialog-output {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 8px 10px;
      font-family: monospace;
      font-size: 12px;
      max-height: 160px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      user-select: text;
      margin-top: 0;
      position: relative;
    }
    .sync-dialog-output-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .sync-copy-button {
      margin-left: 0;
      width: 20px;
      height: 20px;
      padding: 0;
      color: #6b7280;
      opacity: 0.9;
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
    .add-workspace-dialog {
      max-width: 680px;
    }
    .workspace-path-input {
      resize: vertical;
      min-height: 92px;
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .workspace-path-hint {
      margin-top: 8px;
      font-size: 12px;
      color: #57606a;
    }
    .workspace-path-preview {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #d0d7de;
      background: #f6f8fa;
      color: #24292e;
      font-size: 12px;
      font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      line-height: 1.45;
      word-break: break-all;
      max-height: 120px;
      overflow: auto;
    }
    .add-workspace-footer {
      justify-content: flex-end;
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
      cursor: default;
      border-radius: 6px;
      font-size: 13px;
      color: #24292e;
      user-select: none;
      min-height: 32px;
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
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .workspace-remove {
      opacity: 0;
      margin-left: 8px;
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: #57606a;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
      flex-shrink: 0;
      transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;
    }

    .workspace-header:hover .workspace-remove {
      opacity: 1;
    }

    .workspace-remove:hover {
      background: #ffebe9;
      color: #cf222e;
    }

    .workspace-remove-actions {
      display: flex;
      gap: 2px;
      margin-left: 6px;
      flex-shrink: 0;
    }

    .workspace-order-btn {
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: #57606a;
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      opacity: 0;
      transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;
    }

    .workspace-header:hover .workspace-order-btn {
      opacity: 1;
    }

    .workspace-order-btn:hover {
      background: #f6f8fa;
      color: #24292e;
    }

    .workspace-remove-confirm {
      min-width: 40px;
      height: 22px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
      font-weight: 600;
      background: #ffebe9;
      color: #cf222e;
      padding: 0 8px;
    }

    .workspace-remove-confirm:hover {
      background: #ffd8d3;
    }

    .workspace-toggle,
    button.workspace-toggle,
    .workspace-name,
    button.workspace-name,
    .tree-toggle,
    button.tree-toggle,
    .tree-name,
    button.tree-name {
      appearance: none;
      -webkit-appearance: none;
      border: none;
      background: transparent;
      font: inherit;
      margin: 0;
      padding: 0;
      box-shadow: none;
      outline: none;
      text-align: left;
    }

    .workspace-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 20px;
      font-size: 12px;
      line-height: 1;
      color: #57606a;
      margin-right: 4px;
      width: 16px;
      text-align: center;
      cursor: pointer;
      flex-shrink: 0;
    }

    .workspace-name {
      display: inline-flex;
      align-items: center;
      min-height: 20px;
      cursor: pointer;
    }

    /* 文件树 */
    .file-tree {
      padding-left: 0;
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
      width: 100%;
      box-sizing: border-box;
      cursor: default;
      border-radius: 4px;
      font-size: 13px;
      color: #24292e;
      user-select: none;
      gap: 4px;
      position: relative;
      min-height: 28px;
    }

    .tree-item:hover {
      background: #f6f8fa;
    }

    .tree-item.file-node {
      cursor: pointer;
    }

    .tree-item.current {
      background: #dbeafe;
      color: #0969da;
      font-weight: 400;
    }

    .tree-indent {
      flex: 0 0 auto;
      height: 1px;
    }

    .tree-item .file-item-status {
      width: 10px;
      height: 10px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
    }

    .tree-toggle {
      width: 10px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      line-height: 1;
      color: #57606a;
      flex-shrink: 0;
      text-align: center;
      cursor: pointer;
    }

    .tree-icon {
      margin-right: 6px;
      font-size: 14px;
      flex-shrink: 0;
    }

    .tree-name {
      flex: 1;
      display: inline-flex;
      align-items: center;
      min-height: 20px;
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
      margin-left: 2px;
    }

    .tree-missing-section {
      margin-top: 6px;
      padding-left: 8px;
    }

    .tree-missing-title {
      font-size: 11px;
      color: #cf222e;
      padding: 4px 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-weight: 600;
    }

    .tree-item.missing {
      color: #cf222e;
      text-decoration: line-through;
      background: #fff5f5;
      opacity: 0.95;
    }

    .tree-item.missing:hover {
      background: #ffebeb;
    }

    .tree-inline-action {
      border: 1px solid #d0d7de;
      border-radius: 4px;
      background: #fff;
      color: #57606a;
      font-size: 11px;
      line-height: 1;
      padding: 2px 5px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .tree-inline-action:hover {
      border-color: #0969da;
      color: #0969da;
    }

    .tree-inline-action.danger:hover {
      border-color: #cf222e;
      color: #cf222e;
      background: #ffebe9;
    }

    /* 已移除：独立已打开文件区域，状态已合并到工作区文件树 */
    .open-files-section,
    .empty-open-files,
    .open-file-item,
    .open-file-icon,
    .open-file-name,
    .open-file-close {
      display: none;
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

    /* 设置按钮已统一为 toolbar-button 样式 */
`;
