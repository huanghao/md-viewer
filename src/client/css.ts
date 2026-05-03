export const styles = `
    :root {
      --font-scale: 1.0;
      --sidebar-width: 260px;
      --annotation-sidebar-width: 320px;
      --chat-sidebar-width: 300px;

      /* color tokens */
      --color-text-primary:   #24292e;
      --color-text-secondary: #57606a;
      --color-text-muted:     #8b949e;
      --color-border:         #d0d7de;
      --color-border-subtle:  #e8ecf0;
      --color-bg-subtle:      #f6f8fa;
      --color-accent:         #0969da;
      --color-error:          #cf222e;
      --color-error-bg:       #ffebe9;
      --color-success:        #1a7f37;
      --color-success-alt:    #2da44e;
      --color-success-bg:     #dafbe1;
      --color-warning-bg:     #fff8c5;

      /* typography tokens */
      --text-xs: 11px;
      --text-sm: 13px;

      /* radius tokens */
      --radius-sm: 4px;
      --radius-md: 6px;
      --radius-lg: 8px;

      /* z-index tokens */
      --z-menu: 20;
      --z-scrollbar: 50;
      --z-sidebar: 80;
      --z-sidebar-resizer: 81;
      --z-floating-btn: 90;
      --z-dropdown: 1000;
      --z-tab-manager: 2100;
      --z-autocomplete: 2500;
      --z-quick-action: 2601;
      --z-overlay: 9000;
      --z-popover: 9998;
      --z-quick-add: 9999;
      --z-find-bar: 10000;
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
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      transition: width 0.18s ease, min-width 0.18s ease;
    }
    body.sidebar-collapsed .sidebar {
      width: 0 !important;
      min-width: 0 !important;
      overflow: hidden;
      border-right: none;
    }
    body.sidebar-collapsed .sidebar-resizer {
      display: none;
    }
    .sidebar-search-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 8px 0;
    }
    .sidebar-collapse-btn {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .sidebar-collapse-btn:hover {
      background: var(--color-bg-subtle);
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
    .sidebar-collapse-btn svg {
      width: 16px;
      height: 16px;
    }
    .sidebar-floating-open-btn {
      position: fixed;
      left: 8px;
      top: 90px;
      width: 32px;
      height: 32px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      background: #fff;
      color: var(--color-text-secondary);
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
      z-index: var(--z-floating-btn);
    }
    body.sidebar-collapsed .sidebar-floating-open-btn {
      display: inline-flex;
    }
    .sidebar-floating-open-btn:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
      background: var(--color-bg-subtle);
    }
    .sidebar-floating-open-btn svg {
      width: 16px;
      height: 16px;
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
    body.toc-resizing {
      cursor: row-resize;
      user-select: none;
    }
    .sidebar-header {
      padding: 0;
      border-bottom: none;
      display: flex;
      flex-direction: column;
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
      color: var(--color-text-secondary);
      pointer-events: none;
    }
    .search-input {
      flex: 1;
      padding: 8px 30px 8px 30px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-family: inherit;
    }
    .search-input::placeholder {
      color: var(--color-text-secondary);
    }
    .search-input:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
    }
    .search-clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      font-size: 20px;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 0 4px;
      border-radius: var(--radius-sm);
    }
    .search-clear:hover {
      background: var(--color-bg-subtle);
      color: var(--color-text-primary);
    }

    #searchBox {
      height: 34px;
      padding: 0;
      display: flex;
      align-items: center;
    }
    #modeSwitchRow {
      display: block;
      padding: 0;
      margin: 0;
    }
    .mode-switch-row {
      height: 28px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--color-text-secondary);
    }
    .mode-switch-icon {
      width: 20px;
      height: 20px;
      border: none;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-secondary);
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
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text-secondary);
      letter-spacing: 0.2px;
      user-select: none;
    }

    /* ==================== Three-Tab View Switcher ==================== */
    .view-tabs {
      display: flex;
      border-bottom: 1px solid #e8e8e8;
      background: #fafafa;
      padding: 0;
      flex-shrink: 0;
      width: 100%;
    }
    .view-tab {
      flex: 1;
      font-size: var(--text-sm);
      font-weight: 500;
      color: #888;
      padding: 10px 0 9px;
      text-align: center;
      cursor: pointer;
      border: none;
      background: transparent;
      border-bottom: 2px solid transparent;
      user-select: none;
      transition: color 0.15s, border-color 0.15s;
    }
    .view-tab:hover { color: #444; background: #f3f3f3; }
    .view-tab.active {
      color: var(--color-accent);
      border-bottom-color: var(--color-accent);
    }

    .quick-action-confirm-host {
      margin-top: 0;
      position: relative;
      z-index: var(--z-quick-action);
    }
    body.quick-action-confirm-visible .quick-action-confirm-host {
      margin-top: 8px;
    }

    /* 当前文件路径 */
    .current-path-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--color-bg-subtle);
      border-radius: var(--radius-md);
      margin-bottom: 8px;
      font-size: var(--text-sm);
    }
    .current-path-text {
      flex: 1;
      color: var(--color-text-secondary);
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
      border-radius: var(--radius-sm);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #586069;
      transition: all 0.2s;
    }
    .current-path-copy:hover {
      background: rgba(0,0,0,0.05);
      color: var(--color-text-primary);
    }
    .current-path-copy:active {
      transform: scale(0.95);
    }
    .current-path-copy.success {
      color: var(--color-success);
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
      border-radius: var(--radius-sm);
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
      background: var(--color-text-primary);
      color: white;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
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
      background: var(--color-warning-bg);
      color: var(--color-text-primary);
      font-weight: 500;
      padding: 0 2px;
      border-radius: 2px;
    }
    /* 添加文件区域 */
    .add-file-section {
      padding: 16px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-subtle);
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
      font-size: var(--text-sm);
    }
    .sidebar.workspace-mode .add-file-hint {
      margin-top: 4px;
      font-size: var(--text-xs);
      line-height: 1.3;
    }
    .sidebar.workspace-mode .workspace-section {
      padding-top: 0;
    }
    .add-file-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-family: inherit;
      margin-bottom: 0;
    }
    .add-file-input::placeholder {
      color: var(--color-text-secondary);
    }
    .add-file-input:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
    }
    .add-file-hint {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
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
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-subtle);
      background: #fff;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      font-weight: 500;
      cursor: pointer;
      padding: 0 10px;
      flex-shrink: 0;
    }
    .add-file-button:hover {
      background: var(--color-bg-subtle);
      border-color: #b6bec7;
      color: var(--color-text-primary);
    }
    .add-file-confirm {
      margin-top: 10px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: var(--text-sm);
    }
    .add-file-confirm.state-warning {
      background: var(--color-warning-bg);
      border-color: #f0d264;
      color: #7a4e00;
    }
    .add-file-confirm.state-directory {
      background: #eaf5ff;
      border-color: #a8d3ff;
      color: #095a9f;
    }
    .add-file-confirm.state-error {
      background: var(--color-error-bg);
      border-color: #ffb3ad;
      color: var(--color-error);
    }
    .add-file-confirm-text {
      line-height: 1.4;
      flex: 1;
    }
    .add-file-confirm-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    .add-file-confirm-button {
      height: 26px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-subtle);
      background: #fff;
      color: var(--color-text-primary);
      font-size: var(--text-sm);
      padding: 0 10px;
      cursor: pointer;
    }
    .add-file-confirm-button.primary {
      border-color: var(--color-accent);
      background: var(--color-accent);
      color: #fff;
      font-weight: 600;
    }
    .add-file-confirm-button:hover {
      filter: brightness(0.98);
    }
    .path-autocomplete-panel {
      position: absolute;
      z-index: var(--z-autocomplete);
      max-height: 260px;
      overflow-y: auto;
      background: #ffffff;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 24px rgba(31, 35, 40, 0.12);
    }
    .path-autocomplete-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      font-size: var(--text-sm);
      cursor: pointer;
      color: var(--color-text-primary);
      border-bottom: 1px solid #f0f2f5;
    }
    .path-autocomplete-item:last-child {
      border-bottom: none;
    }
    .path-autocomplete-item:hover,
    .path-autocomplete-item.active {
      background: #e8f0fe;
      color: var(--color-accent);
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

    /* TOC 上下分栏 */
    .toc-resizer {
      height: 1px;
      cursor: row-resize;
      background: var(--color-border, #d0d7de);
      flex-shrink: 0;
      display: none;
      position: relative;
    }
    .toc-resizer::after {
      content: '';
      position: absolute;
      left: 0; right: 0;
      top: -3px; bottom: -3px;
    }

    .toc-resizer:hover, .toc-resizer.dragging {
      background: var(--color-accent);
    }

    .sidebar.toc-visible .toc-resizer {
      display: block;
    }

    .toc-open-btn {
      display: none;
      align-items: center;
      width: 100%;
      padding: 5px 8px 5px 10px;
      border: none;
      border-top: 1px solid var(--color-border, #d0d7de);
      background: transparent;
      color: var(--color-text-muted, #8b949e);
      font-size: var(--text-xs);
      cursor: pointer;
      flex-shrink: 0;
    }
    .toc-open-btn span { flex: 1; text-align: left; }
    .toc-open-btn:hover {
      background: var(--color-bg-subtle, #f6f8fa);
      color: var(--color-text-secondary, #57606a);
    }
    /* Show open button only when toc-has-content and NOT toc-visible */
    .sidebar.toc-has-content:not(.toc-visible) .toc-open-btn {
      display: flex;
    }

    .toc-pane {
      flex-shrink: 0;
      flex-basis: var(--toc-pane-height, 240px);
      max-height: var(--toc-pane-height, 240px);
      display: none;
      overflow: hidden;
    }

    .sidebar.toc-visible .toc-pane {
      display: flex;
      flex-direction: column;
    }

    .toc-header {
      display: flex;
      align-items: center;
      padding: 4px 8px 2px;
      flex-shrink: 0;
    }
    .toc-header-label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-muted, #8b949e);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      flex: 1;
    }
    .toc-toggle-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: var(--color-text-muted, #8b949e);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      padding: 0;
    }
    .toc-toggle-btn:hover {
      background: var(--color-bg-subtle, #f6f8fa);
      color: var(--color-text-secondary, #57606a);
    }
    .toc-toggle-btn svg {
      width: 12px;
      height: 12px;
    }

    .toc-panel {
      padding: 2px 8px 6px;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }

    .toc-empty {
      padding: 8px 0;
      color: var(--color-text-muted, #8b949e);
      font-size: var(--text-sm);
    }
    .toc-error {
      padding: 8px 0;
      color: var(--color-error);
      font-size: var(--text-sm);
      line-height: 1.5;
    }
    .toc-error-detail {
      display: block;
      margin-top: 4px;
      font-size: var(--text-xs);
      color: var(--color-text-muted, #8b949e);
      word-break: break-all;
    }

    .toc-item {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      font-size: var(--text-sm);
      color: #1f2328;
      cursor: pointer;
      border-radius: var(--radius-sm);
      text-decoration: none;
      margin-bottom: 2px;
      overflow: hidden;
    }
    .toc-item-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .toc-item:hover {
      background: var(--color-bg-subtle, #f6f8fa);
    }

    .toc-item.active {
      color: var(--color-accent);
      background: #dbeafe;
    }

    .toc-item[data-level="1"] { padding-left: 8px; font-weight: 500; }
    .toc-item[data-level="2"] { padding-left: 20px; font-weight: 400; }
    .toc-item[data-level="3"] { padding-left: 32px; font-size: var(--text-xs); color: var(--color-text-secondary, #57606a); }
    .toc-level-badge {
      display: none;
      font-size: 10px;
      font-weight: 400;
      color: var(--color-text-muted, #8b949e);
      margin-right: 5px;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }
    .toc-item.active .toc-level-badge {
      display: inline;
    }
    .toc-page-badge {
      margin-left: auto;
      padding-left: 6px;
      font-size: 10px;
      color: var(--color-text-muted, #8b949e);
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      margin-bottom: 2px;
      font-size: var(--text-sm);
      color: #1f2328;
      background: transparent;
      gap: 4px;
      position: relative;
      font-weight: 400;
    }
    .file-item:hover {
      background: var(--color-bg-subtle);
    }
    .file-item.current {
      background: #dbeafe;
      color: var(--color-accent);
      font-weight: 400;
    }
    .file-item.missing {
      color: var(--color-error);
      background: #fff5f5;
    }
    .file-item.missing .tree-name {
      color: var(--color-error);
      text-decoration: line-through;
    }
    .file-item.missing.current {
      background: var(--color-error-bg);
      color: var(--color-error);
    }
    .file-item .tree-toggle {
      display: none;
    }
    .file-type-icon {
      width: 16px;
      height: 16px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1;
      flex: 0 0 auto;
      user-select: none;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    .file-type-icon.md {
      background: #f3f4f6;
      color: #4b5563;
      border-color: #d1d5db;
    }
    .file-type-icon.html {
      background: #eaf4ff;
      color: #0b64c0;
      border-color: #b9d8fb;
    }
    .file-type-icon.pdf {
      background: #fff0f0;
      color: #c0392b;
      border-color: #f5b7b1;
    }
    .file-item.current .file-type-icon.html,
    .tree-item.current .file-type-icon.html {
      background: #f3f8ff;
      color: #4f88bf;
      border-color: #d8e8fb;
    }
    .file-item.missing .file-type-icon,
    .tree-item.missing .file-type-icon {
      background: #f8f0f0;
      color: #b56a6a;
      border-color: #efdbdb;
    }
    .tree-item .file-type-icon {
      font-size: 9px;
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
      font-size: var(--text-xs);
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
    .file-item .tree-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    .file-item .tree-status-inline {
      margin-left: auto;
      order: 2;
    }
    .file-item .close {
      width: 0;
      overflow: hidden;
      padding: 0;
      border-radius: var(--radius-sm);
      order: 3;
    }
    .file-item:hover .close {
      width: auto;
      padding: 2px 6px;
    }
    .file-item .close:hover {
      background: #ff4444;
      color: white;
    }
    .empty-tip {
      padding: 20px;
      text-align: center;
      color: #6a737d;
      font-size: var(--text-sm);
    }

    /* 主内容区 */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
      position: relative;
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
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
    }
    .toolbar .spacer {
      flex: 1;
    }
    .file-meta {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      font-weight: 400;
      white-space: nowrap;
    }

    /* 连接状态指示器 */
    .connection-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
    }
    .connection-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #d1d5db;
      transition: all 0.2s ease;
      position: relative;
    }
    .connection-indicator.connected {
      background: #10b981;
    }
    .connection-indicator.connecting {
      background: #f59e0b;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .connection-indicator.disconnected {
      background: #ef4444;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .connection-text {
      white-space: nowrap;
    }

    /* 缩放控件三件套 */
    .zoom-control {
      display: inline-flex;
      align-items: center;
      border-radius: var(--radius-sm);
    }

    .zoom-step-btn {
      padding: 4px 6px;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: var(--text-sm);
      line-height: 1;
      transition: background 0.15s ease, color 0.15s ease;
      flex-shrink: 0;
    }

    .zoom-step-btn:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--color-text-secondary);
    }

    .zoom-input {
      width: 5ch;
      padding: 2px 2px;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
      text-align: center;
      outline: none;
      cursor: default;
      transition: color 0.15s ease, background 0.15s ease;
    }

    .zoom-input:focus {
      cursor: text;
      color: var(--color-text-primary);
      background: rgba(0, 0, 0, 0.04);
      border-radius: 2px;
      width: 5ch;
    }


    /* 纯文本工具栏按钮 */
    .toolbar-text-button {
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      font-weight: 400;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
      cursor: pointer;
      border: none;
      background: transparent;
      color: var(--color-text-secondary);
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

    .toolbar-text-button.is-active {
      background: rgba(0, 0, 0, 0.06);
      color: var(--color-text-primary, #111827);
      font-weight: 500;
    }

    /* 标签页 */
    .tabs {
      display: flex;
      align-items: stretch;
      background: var(--color-bg-subtle);
      border-bottom: 1px solid var(--color-border);
      overflow: visible;
    }
    .tabs-scroll {
      display: flex;
      flex: 1;
      min-width: 0;
      overflow-x: auto;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--color-bg-subtle);
      border-right: 1px solid var(--color-border);
      cursor: pointer;
      font-size: var(--text-sm);
      white-space: nowrap;
    }
    .tab:hover {
      background: #fff;
    }
    .tab.active {
      background: #fff;
      border-bottom: 2px solid var(--color-accent);
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
      border-radius: var(--radius-sm);
    }
    .tab-manager-wrap {
      position: relative;
      flex-shrink: 0;
      border-left: 1px solid var(--color-border);
    }
    .tab-manager-toggle {
      height: 100%;
      min-height: 36px;
      padding: 0 12px;
      border: none;
      border-radius: 0;
      border-left: 1px solid transparent;
      background: var(--color-bg-subtle);
      color: #4b5563;
      font-size: var(--text-sm);
      cursor: pointer;
      white-space: nowrap;
    }
    .tab-manager-toggle:hover,
    .tab-manager-toggle.active {
      background: #fff;
      color: var(--color-accent);
    }
    .tab-manager-panel {
      display: none;
      position: absolute;
      right: 6px;
      top: calc(100% + 6px);
      width: 320px;
      max-height: min(520px, calc(100vh - 72px));
      padding: 10px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      background: #fff;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
      z-index: var(--z-tab-manager);
      overflow: hidden;
    }
    .tab-manager-panel.show {
      display: flex;
      flex-direction: column;
    }
    .tab-manager-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }
    .tab-manager-actions-row {
      flex-wrap: wrap;
    }
    .tab-manager-action {
      border: 1px solid #d1d5da;
      border-radius: var(--radius-md);
      background: #fff;
      color: #334155;
      font-size: var(--text-sm);
      padding: 4px 8px;
      cursor: pointer;
      white-space: nowrap;
    }
    .tab-manager-action:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
      background: #eff6ff;
    }
    .tab-manager-action.danger:hover {
      border-color: #ef4444;
      color: #b42318;
      background: #fff1f2;
    }
    .file-type-badge {
      display: inline-block;
      background: #f3f4f6;
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      margin-left: 8px;
      font-weight: 500;
      vertical-align: middle;
    }
    .tab .file-type-badge {
      font-size: 10px;
      padding: 1px 5px;
      margin-left: 4px;
    }
    .tab {
      transition: transform 140ms cubic-bezier(0.2, 0, 0, 1);
      will-change: transform;
    }
    .tab.tab-dragging {
      opacity: 0;
      pointer-events: none;
    }
    .tab-drag-ghost {
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: var(--text-sm);
      white-space: nowrap;
      background: #fff;
      border: 1px solid var(--color-border);
      border-bottom: 2px solid var(--color-accent);
      border-radius: 4px 4px 0 0;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      transform: scaleY(1.06);
      transform-origin: bottom center;
      cursor: grabbing;
    }
    .file-item {
      transition: transform 140ms cubic-bezier(0.2, 0, 0, 1);
      will-change: transform;
    }
    .file-item.file-item-dragging {
      opacity: 0;
      pointer-events: none;
    }
    .file-drag-ghost {
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      padding: 6px 12px;
      font-size: var(--text-sm);
      white-space: nowrap;
      background: #fff;
      border: 1px solid var(--color-border);
      border-left: 2px solid var(--color-accent);
      border-radius: 4px;
      box-shadow: 4px 4px 12px rgba(0,0,0,0.14);
      cursor: grabbing;
    }

    /* 内容区 */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      padding-right: calc(var(--annotation-sidebar-width) + 24px);
      scrollbar-width: none;
    }
    .content::-webkit-scrollbar {
      width: 0;
    }
    .html-preview-frame {
      display: block;
      width: calc(100% + 48px);
      margin: -24px;
      height: calc(100% + 48px);
      min-height: calc(100vh - 48px);
      border: none;
      background: #fff;
    }
    body.annotation-sidebar-collapsed .content {
      padding-right: 24px;
    }
    .content.diff-active {
      padding: 24px;
      padding-right: calc(var(--annotation-sidebar-width) + 24px);
    }
    body.annotation-sidebar-collapsed .content.diff-active {
      padding-right: 24px;
    }
    .markdown-wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      padding: 32px;
      border-radius: var(--radius-lg);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .markdown-body {
      background: transparent !important;
      font-size: calc(16px * var(--font-scale));
    }
    .markdown-body .mermaid-block,
    .markdown-body .mermaid-fallback-block {
      margin: 16px 0;
    }
    .markdown-body .mermaid-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
    }
    .markdown-body .mermaid-source-toggle {
      border: 1px solid var(--color-border-subtle);
      background: #fff;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      line-height: 1;
      border-radius: var(--radius-md);
      padding: 5px 9px;
      cursor: pointer;
    }
    .markdown-body .mermaid-source-toggle:hover {
      border-color: var(--color-text-muted);
      color: #374151;
    }
    .markdown-body .mermaid {
      margin: 0;
      padding: 8px;
      border-radius: var(--radius-lg);
      border: 1px solid #e5e7eb;
      background: #ffffff;
      overflow-x: auto;
    }
    .markdown-body .mermaid svg {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }
    .markdown-body .mermaid-fallback-notice {
      margin: 0 0 8px;
      padding: 6px 10px;
      border-radius: var(--radius-md);
      border: 1px solid #f0d8a8;
      background: #fff8e6;
      color: #8a5a00;
      font-size: var(--text-sm);
      line-height: 1.4;
    }
    .markdown-body .mermaid-source-panel {
      margin-top: 8px;
      border: 1px solid #e5e7eb;
      border-radius: var(--radius-lg);
      background: #fbfcfe;
      overflow: hidden;
    }
    .markdown-body .mermaid-source-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      border-bottom: 1px solid #e5e7eb;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
    }
    .markdown-body .mermaid-source-copy {
      border: 1px solid var(--color-border-subtle);
      background: #fff;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      line-height: 1;
      border-radius: var(--radius-md);
      padding: 5px 9px;
      cursor: pointer;
    }
    .markdown-body .mermaid-source-copy:hover {
      border-color: var(--color-text-muted);
      color: #374151;
    }
    .markdown-body .mermaid-source-copy.copied {
      color: var(--color-success);
      border-color: #9bd0aa;
      background: #f2fbf5;
    }
    .markdown-body .mermaid-source-panel pre {
      margin: 0;
      border: none;
      border-radius: 0;
      background: transparent;
    }
    .content-file-status {
      margin-bottom: 12px;
      padding: 9px 12px;
      border: 1px solid #e5e7eb;
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
      line-height: 1.45;
    }
    .content-file-status.deleted {
      border-color: #ffd6d1;
      background: #fff4f2;
      color: #b42318;
    }
    .markdown-body h1 { font-size: calc(2em * var(--font-scale)); }
    .markdown-body h2 { font-size: calc(1.5em * var(--font-scale)); }
    .markdown-body h3 { font-size: calc(1.25em * var(--font-scale)); }
    .markdown-body h4 { font-size: calc(1em * var(--font-scale)); }
    .markdown-body h5 { font-size: calc(0.875em * var(--font-scale)); }
    .markdown-body h6 { font-size: calc(0.85em * var(--font-scale)); }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6a737d;
    }
    .empty-state h2 {
      font-size: 20px;
      margin-bottom: 12px;
      color: var(--color-text-primary);
    }

    /* 面包屑 */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--text-sm);
      color: var(--color-text-primary);
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
      margin-left: 8px;
      border: none;
      background: transparent;
      color: #586069;
      cursor: pointer;
      border-radius: var(--radius-sm);
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
      color: var(--color-success);
    }

    .copy-abspath-icon {
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-mono);
      line-height: 1;
      color: var(--color-text-muted);
      width: 13px;
      height: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .copy-abspath-button.success .copy-abspath-icon { display: none; }
    .copy-abspath-button:not(.success) .check-icon { display: none; }

    /* 加载动画 */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* GitHub 风格复制图标 */
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

    /* ── Diff inline 视图 ── */

    /* Banner 提示条（替代原 diff-header + diff-nav-bar） */
    .diff-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 16px;
      padding-right: calc(var(--annotation-sidebar-width) + 16px);
      background: var(--color-warning-bg);
      border-bottom: 1px solid #d4a72c;
      font-size: var(--text-sm);
      color: #633c01;
      flex-shrink: 0;
    }
    body.annotation-sidebar-collapsed .diff-banner {
      padding-right: 16px;
    }
    .diff-banner-label {
      flex: 1;
      font-weight: 500;
    }
    .diff-nav-btn {
      padding: 3px 9px;
      border-radius: var(--radius-sm);
      border: 1px solid #d4a72c;
      background: #fff;
      color: #633c01;
      font-size: var(--text-xs);
      cursor: pointer;
    }
    .diff-nav-btn:hover { background: #fff3cd; }
    .diff-nav-btn:disabled { opacity: 0.4; cursor: default; }
    .diff-nav-count {
      font-size: var(--text-xs);
      color: #633c01;
      min-width: 36px;
      text-align: center;
    }
    .diff-accept-btn {
      padding: 4px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-success-alt);
      background: var(--color-success-alt);
      color: #fff;
      font-size: var(--text-sm);
      cursor: pointer;
      font-weight: 500;
    }
    .diff-accept-btn:hover { background: #218a3e; }
    .diff-close-btn {
      padding: 4px 10px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-subtle);
      background: #fff;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      cursor: pointer;
    }
    .diff-close-btn:hover { background: var(--color-bg-subtle); }

    /* Inline diff 内容区 */
    .diff-inline-body {
    }

    /* 每个 diff block 的容器 */
    .diff-block {
      border-radius: var(--radius-sm);
    }

    /* 新增 block */
    .diff-block-insert {
      background: #e6ffec;
    }

    /* 删除 block */
    .diff-block-delete {
      background: var(--color-error-bg);
    }
    .diff-block-delete * {
      text-decoration: line-through;
      color: #82071e !important;
    }

    /* 修改：删除部分 */
    .diff-block-modify-del {
      background: var(--color-error-bg);
    }
    .diff-block-modify-del * {
      text-decoration: line-through;
      color: #82071e !important;
    }

    /* 修改：新增部分 */
    .diff-block-modify-ins {
      background: #e6ffec;
    }

    /* 变更分组容器 */
    .diff-group {
      border-radius: var(--radius-sm);
      margin: 2px 0;
    }
    .diff-group.diff-focused .diff-block-insert { background: #abf2bc; }
    .diff-group.diff-focused .diff-block-delete { background: #ffd7d5; }
    .diff-group.diff-focused .diff-block-modify-del { background: #ffd7d5; }
    .diff-group.diff-focused .diff-block-modify-ins { background: #abf2bc; }

    /* group 内的 equal 上下文行 */
    .diff-group-context {
      background: var(--color-bg-subtle);
      padding: 2px 0;
      color: var(--color-text-secondary);
    }

    /* 无差异提示 */
    .diff-no-changes {
      padding: 40px;
      text-align: center;
      color: var(--color-text-secondary);
      font-size: 14px;
    }

    #diffButton.active {
      color: var(--color-accent);
      background: rgba(9, 105, 218, 0.08);
    }

    /* 内容刷新闪烁动画 */
    @keyframes flash {
      0% { background: var(--color-warning-bg); }
      100% { background: transparent; }
    }

    /* Toast 通知 */
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: var(--z-find-bar);
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
      border-radius: var(--radius-lg);
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
      position: relative;
      overflow: hidden;
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

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(0,0,0,0.06);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      overflow: hidden;
    }
    .toast-progress-bar {
      height: 100%;
      width: 100%;
      background: var(--color-accent);
      transition: width linear;
      opacity: 0.6;
    }

    .toast-action {
      flex-shrink: 0;
      margin-left: 8px;
      padding: 2px 10px;
      border: 1px solid currentColor;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-accent);
      font-size: var(--text-xs);
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .toast-action:hover { background: rgba(9,105,218,0.08); }

    /* Toast 类型样式 */
    .toast-success {
      border-left: 4px solid var(--color-success);
    }
    .toast-success .toast-icon {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .toast-error {
      border-left: 4px solid #d1242f;
    }
    .toast-error .toast-icon {
      background: var(--color-error-bg);
      color: #d1242f;
    }

    .toast-warning {
      border-left: 4px solid #bf8700;
    }
    .toast-warning .toast-icon {
      background: var(--color-warning-bg);
      color: #bf8700;
    }

    .toast-info {
      border-left: 4px solid var(--color-accent);
    }
    .toast-info .toast-icon {
      background: #ddf4ff;
      color: var(--color-accent);
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
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text-secondary);
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
      border-radius: var(--radius-sm);
      font-size: 14px;
      opacity: 0.6;
    }

    .icon-button:hover {
      background: var(--color-bg-subtle);
      opacity: 1;
    }

    /* 工作区项 */
    .workspace-item {
      margin-bottom: 4px;
    }
    .workspace-header {
      display: flex;
      align-items: center;
      padding: 5px 10px;
      cursor: pointer;
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      font-weight: 600;
      color: #444;
      user-select: none;
    }

    .workspace-header:hover {
      background: var(--color-bg-subtle);
    }

    .workspace-header.active {
      background: #dbeafe;
      color: var(--color-accent);
      font-weight: 600;
    }

    .workspace-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    .workspace-name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .workspace-name--failed {
      color: var(--color-error);
      opacity: 0.7;
    }

    .workspace-remove {
      opacity: 0;
      margin-left: 8px;
      width: 22px;
      height: 22px;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-secondary);
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
      background: var(--color-error-bg);
      color: var(--color-error);
    }

    .workspace-remove-actions {
      display: flex;
      gap: 2px;
      margin-left: 8px;
      flex-shrink: 0;
    }

    .workspace-order-btn {
      width: 22px;
      height: 22px;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
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
      background: var(--color-bg-subtle);
      color: var(--color-text-primary);
    }

    .workspace-remove-confirm {
      min-width: 40px;
      height: 22px;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: var(--text-sm);
      line-height: 1;
      font-weight: 600;
      background: var(--color-error-bg);
      color: var(--color-error);
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
      font-size: 9px;
      color: #aaa;
      width: 10px;
      flex-shrink: 0;
      transition: transform 0.15s;
    }
    .workspace-toggle.open {
      transform: rotate(90deg);
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
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
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
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      color: var(--color-text-primary);
      user-select: none;
      gap: 4px;
      position: relative;
      min-height: 28px;
    }

    .tree-item:hover {
      background: var(--color-bg-subtle);
    }

    .tree-item.file-node {
      cursor: pointer;
    }

    .tree-item.current {
      background: #dbeafe;
      color: var(--color-accent);
      font-weight: 400;
    }

    .tree-indent {
      flex: 0 0 auto;
      height: 1px;
    }

    .tree-item .tree-status-inline {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .tree-toggle {
      width: 10px;
      flex-shrink: 0;
      font-size: 9px;
      color: #aaa;
      cursor: pointer;
      transition: transform 0.15s;
    }
    .tree-toggle.open {
      transform: rotate(90deg);
    }

    .tree-icon {
      margin-right: 8px;
      font-size: 14px;
      flex-shrink: 0;
    }

    .tree-name {
      flex: 1;
      min-width: 0;
      display: inline-flex;
      align-items: center;
      overflow: hidden;
      min-height: 20px;
    }
    .tree-name-full {
      min-width: 0;
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tree-count {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      background: var(--color-bg-subtle);
      padding: 2px 6px;
      border-radius: var(--radius-md);
      margin-left: 2px;
    }

    .chat-session-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-accent);
      flex-shrink: 0;
      margin-left: 3px;
      vertical-align: middle;
      opacity: 0.8;
    }
    .chat-session-dot.streaming {
      animation: chat-session-pulse 1.2s ease-in-out infinite;
    }
    @keyframes chat-session-pulse {
      0%, 100% { opacity: 0.8; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.3); }
    }
    .annotation-count-badge {
      background: #e05252;
      color: white;
      border-radius: var(--radius-md);
      padding: 1px 6px;
      font-size: var(--text-xs);
      font-weight: 600;
      line-height: 1.4;
      flex-shrink: 0;
    }

    .tree-missing-section {
      margin-top: 8px;
      padding-left: 8px;
    }

    .tree-missing-title {
      font-size: var(--text-xs);
      color: var(--color-error);
      padding: 4px 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-weight: 600;
    }

    .tree-item.missing {
      color: var(--color-error);
      text-decoration: line-through;
      background: #fff5f5;
      opacity: 0.95;
    }

    .tree-item.missing .tree-name {
      text-decoration: line-through;
    }

    .tree-item.missing:hover {
      background: #ffebeb;
    }

    .tree-inline-action {
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-sm);
      background: #fff;
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      line-height: 1;
      padding: 2px 5px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .tree-inline-action:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }

    .tree-inline-action.danger:hover {
      border-color: var(--color-error);
      color: var(--color-error);
      background: var(--color-error-bg);
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
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
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
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .settings-section-desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin-bottom: 12px;
    }

    .settings-group {
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .settings-group:last-child { border-bottom: none; }
    .settings-group-title {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }
    .settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 4px 0;
    }
    .settings-label {
      font-size: var(--text-sm);
      color: #24292f;
      flex-shrink: 0;
    }
    .settings-select {
      font-size: 12px;
      padding: 3px 8px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      background: #fff;
      color: #24292f;
      cursor: pointer;
    }
    .settings-select:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px rgba(9,105,218,0.1);
    }
    .settings-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .settings-toggle-label {
      font-size: 12px;
      color: var(--color-text-secondary);
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
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;
    }

    .settings-radio-item:hover {
      background: var(--color-bg-subtle);
      border-color: var(--color-accent);
    }

    .settings-radio-item input[type="radio"] {
      margin-top: 2px;
      margin-right: 12px;
      cursor: pointer;
    }

    .settings-radio-item input[type="radio"]:checked {
      accent-color: var(--color-accent);
    }

    .settings-radio-content {
      flex: 1;
    }

    .settings-radio-title {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .settings-radio-desc {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
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
      background: var(--color-bg-subtle);
      border-radius: var(--radius-md);
      gap: 12px;
    }

    .settings-workspace-info {
      flex: 1;
      min-width: 0;
    }

    .settings-workspace-name {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .settings-workspace-path {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .settings-workspace-remove {
      background: none;
      border: none;
      font-size: 20px;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }

    .settings-workspace-remove:hover {
      background: #ff4444;
      color: white;
    }

    .settings-empty {
      padding: 20px;
      text-align: center;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      background: var(--color-bg-subtle);
      border-radius: var(--radius-md);
    }
    .settings-kv-grid {
      display: grid;
      grid-template-columns: 130px 1fr;
      gap: 8px 10px;
      font-size: var(--text-sm);
      color: #374151;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: var(--radius-lg);
      background: #fafbfc;
      margin-bottom: 10px;
    }
    .settings-kv-grid > div:nth-child(2n + 1) {
      color: var(--color-text-secondary);
    }
    .settings-key-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      max-height: 140px;
      overflow: auto;
      padding: 8px;
      border: 1px solid #e5e7eb;
      border-radius: var(--radius-lg);
      background: #fff;
    }
    .settings-key-chip {
      font-size: var(--text-xs);
      line-height: 1;
      color: #4b5563;
      border: 1px solid #d1d5db;
      border-radius: 999px;
      padding: 4px 8px;
      background: #f9fafb;
    }
    .settings-actions-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* 设置按钮已统一为 toolbar-button 样式 */

    /* ==================== 圈点评论功能 ==================== */

    /* 评论/翻译 tab 行 */
    .annotation-tabs {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-subtle);
      position: relative;
    }
    .annotation-tab-actions {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 0 4px;
      flex-shrink: 0;
    }
    .annotation-tab-actions-group {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .annotation-tab-actions-group.hidden {
      display: none;
    }
    .annotation-tab {
      flex: 1;
      padding: 7px 4px;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      font-size: var(--text-sm);
      font-family: inherit;
      cursor: pointer;
      color: var(--color-text-secondary);
      transition: color 0.1s, border-color 0.1s;
    }
    .annotation-tab:hover { color: #24292f; }
    .annotation-tab.is-active {
      color: var(--color-accent);
      border-bottom-color: var(--color-accent);
      font-weight: 600;
    }
    .annotation-tab-count {
      margin-left: 3px;
      font-size: var(--text-xs);
      font-weight: normal;
      opacity: 0.7;
    }
    /* ==================== Chat Tab ==================== */
    .chat-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .chat-msg-user {
      align-self: flex-end;
      max-width: 88%;
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: 10px 10px 2px 10px;
      padding: 7px 11px;
      font-size: var(--text-sm);
      line-height: 1.5;
      color: var(--color-text-primary);
    }
    .chat-msg-ai {
      align-self: flex-start;
      max-width: 96%;
      font-size: var(--text-sm);
      line-height: 1.7;
      color: var(--color-text-primary);
      padding: 2px 0;
    }
    .chat-msg-ai p { margin-bottom: 8px; }
    .chat-msg-ai p:last-child { margin-bottom: 0; }
    .chat-msg-ai code {
      background: var(--color-bg-subtle);
      border: 1px solid var(--color-border-subtle);
      padding: 1px 4px;
      border-radius: var(--radius-sm);
      font-family: monospace;
      font-size: 12px;
    }
    .chat-msg-ai pre {
      background: var(--color-bg-subtle);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 10px;
      overflow-x: auto;
      margin: 8px 0;
    }
    .chat-tool-call {
      background: var(--color-bg-subtle);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 6px 10px;
      margin: 4px 0;
      font-size: 11px;
      font-family: monospace;
      color: var(--color-text-muted);
    }
    .chat-tool-call .chat-tool-name { color: var(--color-accent); font-weight: 600; }
    .chat-tool-result { color: var(--color-success); margin-top: 3px; white-space: pre-wrap; word-break: break-all; }
    .chat-sel-bar {
      padding: 6px 12px;
      border-top: 1px solid var(--color-border);
      background: var(--color-bg-subtle);
      flex-shrink: 0;
      font-size: 12px;
    }
    .chat-sel-bar-label {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 3px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-sel-bar-label button {
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 11px;
      padding: 0;
    }
    .chat-sel-bar-label button:hover { color: var(--color-text-secondary); }
    .chat-sel-bar-text {
      color: var(--color-text-secondary);
      font-style: italic;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chat-input-area {
      padding: 8px 10px 6px;
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: 5px;
      align-items: flex-end;
      flex-shrink: 0;
    }
    .chat-input {
      flex: 1;
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 6px 9px;
      color: var(--color-text-primary);
      font-size: var(--text-sm);
      resize: none;
      outline: none;
      min-height: 32px;
      max-height: 90px;
      line-height: 1.4;
      font-family: inherit;
    }
    .chat-input:focus { border-color: var(--color-accent); }
    .chat-send-btn {
      background: var(--color-accent);
      border: 1px solid var(--color-accent);
      border-radius: var(--radius-md);
      color: #fff;
      padding: 5px 10px;
      cursor: pointer;
      font-size: var(--text-sm);
      flex-shrink: 0;
    }
    .chat-send-btn:hover { opacity: 0.85; }
    .chat-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .chat-hint {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      padding: 0 10px 5px;
      flex-shrink: 0;
    }
    .chat-cursor {
      display: inline-block;
      width: 2px;
      height: 13px;
      background: var(--color-accent);
      animation: chat-blink 1s step-end infinite;
      vertical-align: middle;
      margin-left: 1px;
    }
    @keyframes chat-blink { 50% { opacity: 0; } }
    .chat-empty {
      padding: 20px 12px;
      text-align: center;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
    .chat-config-bar {
      padding: 6px 12px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      flex-shrink: 0;
    }
    .chat-config-bar input {
      flex: 1;
      background: #fff;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 3px 6px;
      color: var(--color-text-primary);
      font-size: var(--text-xs);
      outline: none;
    }
    .chat-config-bar input:focus { border-color: var(--color-accent); }
    .chat-quick-prompts {
      padding: 5px 10px 2px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      flex-shrink: 0;
    }
    .chat-quick-btn {
      background: var(--color-bg-subtle);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 3px 9px;
      font-size: 11px;
      color: var(--color-text-secondary);
      cursor: pointer;
      white-space: nowrap;
      line-height: 1.4;
    }
    .chat-quick-btn:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
      background: #fff;
    }

    /* 评论侧边栏 */
    .annotation-sidebar {
      width: var(--annotation-sidebar-width);
      background: var(--color-bg-subtle);
      border-left: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      transition: transform 0.2s ease, opacity 0.2s ease;
      position: fixed;
      right: 0;
      top: 84px;
      height: calc(100vh - 84px);
      z-index: var(--z-sidebar);
    }
    .annotation-sidebar.collapsed {
      opacity: 0;
      transform: translateX(100%);
      pointer-events: none;
    }
    /* 拆分模式下独立的 Chat 面板 */
    .chat-sidebar {
      width: var(--chat-sidebar-width);
      background: var(--color-bg-subtle);
      border-left: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      position: fixed;
      right: var(--annotation-sidebar-width);
      top: 84px;
      height: calc(100vh - 84px);
      z-index: var(--z-sidebar);
    }
    .chat-sidebar .chat-list {
      display: flex !important;
      flex: 1;
      overflow: hidden;
    }
    /* 拆分模式下内容区 padding 需要同时考虑两个面板 */
    body.sidebar-split .content {
      padding-right: calc(var(--annotation-sidebar-width) + var(--chat-sidebar-width) + 24px) !important;
    }
    body.sidebar-split .doc-scrollbar {
      right: calc(var(--annotation-sidebar-width) + var(--chat-sidebar-width)) !important;
    }
    /* split 按钮激活态 */
    #annotationSplitToggle.is-active {
      color: var(--color-accent);
      background: rgba(9,105,218,0.08);
    }
    .annotation-sidebar-resizer {
      position: fixed;
      top: 84px;
      right: calc(var(--annotation-sidebar-width) - 4px);
      width: 8px;
      height: calc(100vh - 84px);
      cursor: col-resize;
      background: transparent;
      z-index: var(--z-sidebar-resizer);
      transition: background-color 0.15s ease;
    }
    .annotation-sidebar-resizer:hover {
      background: rgba(9, 105, 218, 0.08);
    }
    body.annotation-sidebar-collapsed .annotation-sidebar-resizer {
      display: none;
    }
    body.annotation-sidebar-resizing {
      cursor: col-resize;
      user-select: none;
    }
    #chatSidebarResizer {
      position: fixed;
      top: 84px;
      right: calc(var(--annotation-sidebar-width) + var(--chat-sidebar-width) - 4px);
      width: 8px;
      height: calc(100vh - 84px);
      cursor: col-resize;
      background: transparent;
      z-index: var(--z-sidebar-resizer);
      transition: background-color 0.15s ease;
    }
    #chatSidebarResizer:hover {
      background: rgba(9, 105, 218, 0.08);
    }
    .annotation-icon-btn {
      width: 30px;
      height: 30px;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    .annotation-icon-btn svg {
      width: 17px;
      height: 17px;
      fill: currentColor;
    }
    .annotation-icon-btn.is-simple svg {
      opacity: 0.55;
    }
    .annotation-icon-btn:hover {
      background: var(--color-bg-subtle);
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
    .annotation-filter-menu {
      position: absolute;
      top: 34px;
      right: 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 6px;
      background: #fff;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);
      z-index: var(--z-menu);
      min-width: 112px;
    }
    .annotation-filter-menu.hidden {
      display: none;
    }
    .annotation-filter-item {
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-text-primary);
      text-align: left;
      font-size: var(--text-sm);
      border-radius: var(--radius-md);
      padding: 5px 8px;
      cursor: pointer;
    }
    .annotation-filter-item:hover {
      background: var(--color-bg-subtle);
    }
    .annotation-filter-item.is-active {
      background: #edf4ff;
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
    .annotation-filter-sub {
      margin-left: 10px;
      font-size: 11px;
      opacity: 0.85;
    }

    .annotation-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      transition: opacity 0.2s ease;
    }
    .annotation-sidebar.collapsed .annotation-list {
      opacity: 0;
      pointer-events: none;
    }
    .annotation-empty {
      padding: 20px;
      text-align: center;
      color: #6a737d;
      font-size: var(--text-sm);
    }
    .annotation-item {
      background: #fff;
      border: 1px solid var(--color-border);
      border-left: 4px solid transparent;
      border-radius: var(--radius-lg);
      padding: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .annotation-item.is-active {
      background: #f6f9ff;
      border-color: #9ec2f8;
    }
    .annotation-item.status-exact {
      border-left-color: #b99a55;
    }
    .annotation-item.status-reanchored {
      border-left-color: #b99a55;
    }
    .annotation-item.status-unanchored {
      border-left-color: #9a7b4f;
    }
    .annotation-item.is-resolved {
      opacity: 0.55;
      border-left-color: var(--color-text-muted);
    }
    .annotation-item.is-resolved:hover {
      opacity: 0.85;
    }
    .annotation-item:hover {
      border-color: var(--color-accent);
      box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
    }
    .annotation-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .annotation-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 20px;
      padding: 0 6px;
      background: var(--color-accent);
      color: #fff;
      font-size: var(--text-xs);
      font-weight: 600;
      border-radius: var(--radius-md);
      line-height: 1;
    }
    .annotation-quote {
      display: none;
    }
    .annotation-row-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }
    .annotation-row-title {
      font-size: var(--text-sm);
      color: #374151;
      font-weight: 600;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .annotation-row-actions {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
    }
    .annotation-icon-action {
      width: 26px;
      height: 26px;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .annotation-icon-action svg {
      width: 15px;
      height: 15px;
      fill: currentColor;
    }
    .annotation-icon-action:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
      background: #eef5ff;
    }
    .annotation-icon-action.resolve {
      color: #7c6a35;
    }
    .annotation-icon-action.resolve:hover {
      border-color: #9e8750;
      background: #f2ead7;
    }
    .annotation-icon-action.resolve.is-resolved {
      color: var(--color-success);
    }
    .annotation-icon-action.resolve.is-resolved:hover {
      border-color: var(--color-success-alt);
      background: var(--color-success-bg);
    }
    .annotation-icon-action.danger {
      color: #8c6d4a;
    }
    .annotation-icon-action.danger:hover {
      border-color: #a4875f;
      background: #f7efe5;
    }
    .annotation-icon-action.is-copied {
      color: var(--color-success);
      border-color: var(--color-success-alt);
      background: var(--color-success-bg);
    }
    .annotation-note {
      font-size: var(--text-sm);
      color: var(--color-text-primary);
      line-height: 1.4;
      margin-bottom: 2px;
      white-space: pre-wrap;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .annotation-note.simple {
      -webkit-line-clamp: 1;
    }
    .annotation-thread {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .annotation-thread-line {
      font-size: var(--text-sm);
      color: var(--color-text-primary);
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
      position: relative;
      display: flex;
      align-items: flex-start;
    }
    .annotation-thread-line .annotation-thread-text {
      flex: 1;
      min-width: 0;
    }
    .annotation-thread-edit-btn {
      position: absolute;
      top: 0;
      display: none;
      width: 18px;
      height: 18px;
      padding: 0;
      border: none;
      background: rgba(255,255,255,0.85);
      box-shadow: 0 0 2px rgba(0,0,0,0.08);
      cursor: pointer;
      color: var(--color-text-secondary);
      border-radius: var(--radius-sm);
      line-height: 1;
    }
    .annotation-thread-edit-btn:nth-of-type(1) { right: 0; }
    .annotation-thread-edit-btn:nth-of-type(2) { right: 20px; }
    .annotation-thread-edit-btn svg {
      width: 11px;
      height: 11px;
      fill: currentColor;
    }
    .annotation-thread-edit-btn:hover {
      color: var(--color-accent);
      background: #f0f6ff;
    }
    .annotation-thread-line:hover .annotation-thread-edit-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .annotation-thread-line.is-editing {
      display: block;
    }
    .annotation-thread-edit-input {
      width: 100%;
      min-height: 34px;
      padding: 4px 6px;
      border: 1px solid var(--color-accent);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      font-family: inherit;
      line-height: 1.4;
      resize: none;
      outline: none;
      box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.12);
      box-sizing: border-box;
    }
    .annotation-thread-line.is-reply {
      color: #4b5563;
      padding-left: 10px;
      border-left: 2px solid #e5e7eb;
    }
    .annotation-reply-count {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }
    .annotation-reply-entry {
      margin-top: 8px;
      border: 1px solid #e5e7eb;
      border-radius: var(--radius-md);
      background: #fafbfc;
      padding: 4px 6px;
      cursor: text;
    }
    .annotation-reply-entry:focus-within {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.12);
      background: #fff;
    }
    .annotation-reply-entry textarea {
      width: 100%;
      min-height: 34px;
      padding: 4px 2px;
      border: none;
      border-radius: 0;
      font-size: var(--text-sm);
      font-family: inherit;
      line-height: 1.5;
      resize: none;
      background: transparent;
      outline: none;
      box-shadow: none;
    }
    .annotation-meta {
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .annotation-status-tag {
      border: 1px solid var(--color-border-subtle);
      color: var(--color-text-secondary);
      font-size: 10px;
      border-radius: 999px;
      padding: 1px 6px;
      background: #fff;
    }
    .annotation-status-tag.warn {
      border-color: #ffd8d3;
      color: var(--color-error);
      background: #fff8f8;
    }
    .annotation-actions {
      display: flex;
      gap: 8px;
    }
    .annotation-btn {
      padding: 4px 10px;
      font-size: var(--text-sm);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      background: #fff;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all 0.15s;
    }
    .annotation-btn:hover {
      background: var(--color-bg-subtle);
      border-color: #b6bec7;
    }
    .annotation-btn-primary {
      background: #b79d63;
      border-color: #b79d63;
      color: #fffdf7;
    }
    .annotation-btn-primary:hover {
      background: #a48a52;
      border-color: #a48a52;
    }
    .annotation-btn-danger {
      color: #8c6d4a;
      border-color: #b89a72;
    }
    .annotation-btn-danger:hover {
      background: #f7efe5;
    }
    .annotation-btn-resolve {
      color: var(--color-success);
      border-color: var(--color-success);
    }
    .annotation-btn-resolve:hover {
      background: #eaf9ef;
    }
    .annotation-list.default-mode {
      position: relative;
      overflow-y: auto;
      padding: 0 10px;
    }
    .annotation-canvas {
      position: relative;
      width: 100%;
    }
    .annotation-item.positioned {
      position: absolute;
      left: 0;
      right: 0;
      margin-bottom: 0;
    }
    .annotation-list:not(.default-mode) .annotation-item {
      border-left: 1px solid var(--color-border);
      position: relative;
    }
    .annotation-list:not(.default-mode) .annotation-item.status-exact,
    .annotation-list:not(.default-mode) .annotation-item.status-reanchored,
    .annotation-list:not(.default-mode) .annotation-item.status-unanchored {
      border-left-color: var(--color-border);
    }
    .annotation-list:not(.default-mode) .annotation-item.is-active::before {
      content: '';
      position: absolute;
      left: -1px;
      top: 7px;
      bottom: 7px;
      width: 3px;
      border-radius: var(--radius-sm);
      background: var(--color-accent);
    }
    .annotation-floating-open-btn {
      position: fixed;
      right: 8px;
      top: 90px;
      width: 32px;
      height: 32px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      background: #fff;
      color: var(--color-text-secondary);
      cursor: pointer;
      z-index: var(--z-floating-btn);
      display: none;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
    }
    .annotation-floating-open-btn:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
      background: var(--color-bg-subtle);
    }
    .annotation-floating-open-btn svg {
      width: 17px;
      height: 17px;
      fill: currentColor;
    }
    body.annotation-sidebar-collapsed .annotation-floating-open-btn {
      display: inline-flex;
    }
    .todo-floating-btn {
      position: fixed;
      right: calc(var(--annotation-sidebar-width, 320px) + 10px);
      bottom: 100px;
      width: 36px;
      height: 36px;
      border: 1px solid var(--color-border-subtle);
      border-radius: 999px;
      background: #fff;
      color: var(--color-text-secondary);
      cursor: pointer;
      z-index: var(--z-floating-btn);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(15,23,42,0.1), 0 1px 2px rgba(15,23,42,0.06);
      transition: all 0.15s;
    }
    .todo-floating-btn:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
      box-shadow: 0 4px 12px rgba(9,105,218,0.15);
    }
    .todo-floating-btn svg { width: 15px; height: 15px; }
    body.annotation-sidebar-collapsed .todo-floating-btn {
      right: 8px;
      bottom: 104px;
    }
    .todo-floating-badge {
      position: absolute;
      top: -5px; right: -5px;
      background: var(--color-accent); color: #fff;
      font-size: 10px; font-weight: 700;
      min-width: 16px; height: 16px; padding: 0 3px;
      border-radius: 999px;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
    }
    .todo-floating-badge.hidden { display: none; }
    .annotation-btn-icon {
      padding: 2px 6px;
      font-size: 16px;
      line-height: 1;
    }

    /* 评论高亮标记 */
    .annotation-mark {
      background: #fffbe6;
      border-bottom: 2px solid #fadb14;
      border-radius: 2px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .annotation-mark:hover {
      background: #fff1b8;
    }
    .annotation-mark.is-active {
      background: #ffe58f;
      border-bottom-color: #d4b106;
    }
    .annotation-mark-temp {
      background: transparent;
      border-bottom: 2px solid #fadb14;
      border-radius: 1px;
    }

    /* 评论浮窗 */
    .annotation-composer,
    .annotation-popover {
      position: fixed;
      z-index: var(--z-quick-add);
      width: 340px;
      background: #fff;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
      padding: 10px;
    }
    .annotation-composer.hidden,
    .annotation-popover.hidden {
      display: none;
    }
    .annotation-composer-header,
    .annotation-popover-header {
      margin-bottom: 8px;
    }
    .annotation-composer-header {
      cursor: move;
      user-select: none;
    }
    .annotation-composer .annotation-composer-input {
      margin-top: 0;
    }
    .annotation-popover-note {
      font-size: var(--text-sm);
      color: var(--color-text-primary);
      line-height: 1.45;
      white-space: normal;
      word-break: break-word;
    }
    .annotation-quick-add {
      position: fixed;
      z-index: var(--z-popover);
      width: 32px;
      height: 32px;
      border: 1px solid var(--color-border-subtle);
      border-radius: 999px;
      background: #fff;
      color: var(--color-text-secondary);
      box-shadow: 0 3px 10px rgba(31, 41, 55, 0.12);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .annotation-quick-add:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
      background: #f6f9ff;
      box-shadow: 0 4px 12px rgba(31, 41, 55, 0.16);
    }
    .annotation-quick-add.hidden {
      display: none;
    }
    .annotation-quick-add svg {
      width: 15px;
      height: 15px;
    }

    /* 响应式：窄屏时隐藏评论侧边栏 */
    @media (max-width: 1200px) {
      .annotation-sidebar {
        display: none;
      }
      .annotation-sidebar-resizer {
        display: none !important;
      }
      .annotation-floating-open-btn {
        display: none !important;
      }
      .content {
        padding-right: 24px;
      }
    }

    /* ==================== Find Bar ==================== */
    #findBar {
      display: none;
      position: fixed;
      top: 12px;
      right: 16px;
      z-index: var(--z-find-bar);
      align-items: center;
      gap: 4px;
      background: var(--bg-primary, #fff);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      padding: 6px 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.14);
    }
    #findBar.visible {
      display: flex;
    }
    #findBarInput {
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-sm);
      padding: 3px 8px;
      font-size: var(--text-sm);
      width: 200px;
      outline: none;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #1f2328);
    }
    #findBarInput:focus {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 2px rgba(9,105,218,0.2);
    }
    #findBarCount {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      min-width: 52px;
      text-align: center;
    }
    #findBarCount.no-result {
      color: var(--color-error);
    }
    #findBar button {
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 3px 6px;
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      line-height: 1;
    }
    #findBar button:hover {
      background: var(--color-bg-subtle);
      color: #1f2328;
    }
    mark.find-highlight {
      background: #fff3b0;
      color: inherit;
      border-radius: 2px;
      padding: 0 1px;
    }
    mark.find-highlight-current {
      background: #ff9500;
      color: #fff;
    }

    /* ==================== JSON Viewer ==================== */
    .json-viewer {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: calc(13px * var(--font-scale));
      line-height: 1.6;
      padding: 16px 20px;
      color: var(--color-text-primary);
      user-select: text;
    }
    .json-viewer ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .json-viewer li {
      padding: 0;
    }
    .json-node {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding: 1px 0;
      cursor: default;
    }
    .json-node-expandable {
      cursor: pointer;
    }
    .json-node-expandable:hover {
      background: rgba(0,0,0,0.04);
      border-radius: var(--radius-sm);
    }
    .json-toggle {
      display: inline-block;
      width: 14px;
      font-size: 10px;
      color: #6a737d;
      flex-shrink: 0;
      user-select: none;
    }
    .json-key {
      color: #005cc5;
      white-space: nowrap;
    }
    .json-colon {
      color: var(--color-text-primary);
      margin-right: 4px;
    }
    .json-string { color: #22863a; }
    .json-number { color: #005cc5; }
    .json-boolean { color: #e36209; }
    .json-null { color: #6a737d; }
    .json-bracket {
      color: #6a737d;
      font-weight: 500;
    }
    .json-count {
      color: #6a737d;
      font-size: var(--text-xs);
      margin-left: 4px;
    }
    .json-preview {
      color: #6a737d;
      font-size: var(--text-sm);
      margin-left: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }
    .json-children {
      padding-left: 20px;
    }
    .json-children.collapsed {
      display: none;
    }
    .json-error {
      background: #ffeef0;
      border: 1px solid #fdb8c0;
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      color: #b31d28;
      margin-bottom: 12px;
    }
    .json-error pre {
      margin-top: 8px;
      font-size: var(--text-sm);
      color: #586069;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .json-line-header {
      font-size: var(--text-xs);
      color: #6a737d;
      padding: 4px 0 2px;
      border-top: 1px solid #eaecef;
      margin-top: 8px;
      user-select: none;
    }
    .json-line-header:first-child {
      border-top: none;
      margin-top: 0;
    }
    mark.json-match {
      background: #fff3b0;
      color: inherit;
      border-radius: 2px;
      padding: 0 1px;
    }
    .json-no-results {
      color: #6a737d;
      font-style: italic;
      padding: 20px;
      text-align: center;
    }
    /* ==================== Focus View ==================== */
    .focus-view {
      padding: 4px 0;
    }
    .focus-filter-bar {
      display: flex;
      align-items: center;
      padding: 5px 8px;
      border-bottom: 1px solid #f0f0f0;
      background: #fefefe;
      gap: 6px;
      flex-shrink: 0;
    }
    .focus-active-tags {
      display: flex;
      gap: 3px;
      flex: 1;
      flex-wrap: wrap;
    }
    .focus-active-tag {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: var(--radius-md);
      background: var(--color-accent);
      color: #fff;
      font-weight: 500;
    }
    .focus-active-sep {
      width: 1px;
      height: 10px;
      background: #d8d8d8;
      align-self: center;
      flex-shrink: 0;
    }
    .focus-filter-popup-wrap {
      position: relative;
      flex-shrink: 0;
    }
    .focus-filter-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border: 1px solid #e0e0e0;
      border-radius: var(--radius-sm);
      background: #fff;
      color: #999;
      cursor: pointer;
      transition: all 0.12s;
    }
    .focus-filter-btn:hover, .focus-filter-btn.active {
      border-color: var(--color-accent);
      color: var(--color-accent);
      background: rgba(9,105,218,0.06);
    }
    .focus-filter-popup {
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      padding: 8px;
      z-index: 200;
      min-width: 140px;
    }
    .focus-popup-section { }
    .focus-popup-label {
      font-size: 10px;
      color: #999;
      margin-bottom: 5px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .focus-popup-options {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .focus-popup-option {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: var(--radius-md);
      border: 1px solid #e0e0e0;
      background: #fff;
      color: #666;
      cursor: pointer;
      transition: all 0.12s;
    }
    .focus-popup-option:hover { border-color: #aaa; color: #333; }
    .focus-popup-option.active {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }
    .focus-popup-divider {
      height: 1px;
      background: #f0f0f0;
      margin: 8px 0;
    }
    .focus-ws-group {
      border-bottom: 1px solid #f0f0f0;
    }
    .focus-ws-group:last-child {
      border-bottom: none;
    }
    .focus-ws-header {
      display: flex;
      align-items: center;
      padding: 5px 10px;
      cursor: pointer;
      user-select: none;
      gap: 5px;
    }
    .focus-ws-header:hover {
      background: rgba(0,0,0,0.03);
    }
    .focus-ws-arrow {
      font-size: 9px;
      color: #aaa;
      width: 10px;
      flex-shrink: 0;
      transition: transform 0.15s;
    }
    .focus-ws-arrow.open {
      transform: rotate(90deg);
    }
    .focus-ws-name {
      font-size: var(--text-sm);
      font-weight: 600;
      color: #444;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .focus-ws-badge {
      font-size: 10px;
      background: #e8f0fe;
      color: #4a7fd4;
      border-radius: var(--radius-lg);
      padding: 1px 5px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .focus-ws-badge.empty {
      background: #f3f4f6;
      color: #bbb;
    }
    .focus-ws-files {
      padding: 2px 0 4px;
    }
    .focus-file-item {
      padding-left: 20px;
    }
    .focus-file-time {
      font-size: 10px;
      color: #bbb;
      flex-shrink: 0;
    }
    .focus-pin-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 10px;
      padding: 0 2px;
      opacity: 0.5;
      flex-shrink: 0;
      line-height: 1;
    }
    .focus-pin-btn:hover, .focus-pin-btn.active { opacity: 1; }
    .focus-empty {
      font-size: var(--text-sm);
      color: #aaa;
      padding: 12px 16px;
      font-style: italic;
    }
    /* Pin button — show on hover, works in all views */
    .tree-item .tree-pin-btn, .file-item .tree-pin-btn {
      display: none;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 10px;
      padding: 0 2px;
      opacity: 0.5;
      line-height: 1;
      margin-left: auto;
    }
    .tree-item:hover .tree-pin-btn, .file-item:hover .tree-pin-btn { display: inline; }
    .tree-item .tree-pin-btn.active, .file-item .tree-pin-btn.active { display: inline; opacity: 1; }

    /* ==================== Sync / Settings Dialog ==================== */
    .sync-dialog-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: var(--z-overlay);
      align-items: center;
      justify-content: center;
    }
    .sync-dialog-overlay.show {
      display: flex;
    }
    .sync-dialog {
      background: #fff;
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      width: 480px;
      max-width: calc(100vw - 48px);
      max-height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sync-dialog-header {
      display: flex;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .sync-dialog-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      flex: 1;
    }
    .sync-dialog-close {
      background: none;
      border: none;
      font-size: 18px;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .sync-dialog-close:hover { color: var(--color-text-primary); }
    .sync-dialog-body {
      padding: 18px;
      overflow-y: auto;
      flex: 1;
    }
    .sync-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 18px;
      border-top: 1px solid var(--color-border);
      flex-shrink: 0;
    }
    .sync-dialog-button {
      font-size: var(--text-sm);
      padding: 6px 14px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      background: var(--color-bg-subtle);
      color: var(--color-text-primary);
      cursor: pointer;
    }
    .sync-dialog-button:hover { background: var(--color-border); }
    .sync-dialog-button.primary {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }
    .sync-dialog-button.primary:hover { background: #0757ba; }
    /* add-workspace dialog specific */
    .add-workspace-overlay .sync-dialog { width: 520px; }
    .sync-dialog-field { margin-bottom: 14px; }
    .sync-dialog-label { display: block; font-size: var(--text-sm); font-weight: 500; color: var(--color-text-primary); margin-bottom: 6px; }
    .sync-dialog-input {
      width: 100%;
      font-size: var(--text-sm);
      padding: 7px 10px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      resize: vertical;
      font-family: inherit;
    }
    .sync-dialog-input:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(9,105,218,0.15); }
    .workspace-path-hint { font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 4px; }
    .workspace-path-preview { font-size: var(--text-xs); color: var(--color-accent); margin-top: 4px; font-family: monospace; word-break: break-all; }
    .add-workspace-footer { justify-content: flex-end; }
    .sync-dialog-btn {
      font-size: var(--text-sm);
      padding: 6px 14px;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      background: var(--color-bg-subtle);
      color: var(--color-text-primary);
      cursor: pointer;
    }
    .sync-dialog-btn:hover { background: var(--color-border); }
    .sync-dialog-btn-primary {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }
    .sync-dialog-btn-primary:hover { background: #0757ba; }

    /* PDF Viewer */
    /* When PDF is active, remove content padding (PDF viewer has its own) */
    .content[data-pdf] {
      padding: 0;
      padding-right: var(--annotation-sidebar-width);
    }
    body.annotation-sidebar-collapsed .content[data-pdf] {
      padding-right: 0;
    }

    .pdf-viewer-container {
      padding: 16px;
      background: #525659;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .pdf-page-wrapper {
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      background: white;
    }

    .pdf-page-wrapper canvas {
      display: block;
    }

    .pdf-highlight {
      background: rgba(255, 220, 0, 0.4) !important;
      border-radius: 2px;
    }

    /* 选中文字的临时高亮：用 <mark> 包裹精确选中范围 */
    mark.pdf-selection-mark {
      background: rgba(0, 120, 215, 0.35);
      color: inherit;
      border-radius: 2px;
      display: inline;
      padding: 0;
      margin: 0;
      line-height: inherit;
      vertical-align: baseline;
    }

    /* 评论进行中：点加号后变为黄色下划线（对应 MD 的 annotation-mark-temp） */
    mark.pdf-selection-mark-temp {
      background: transparent;
      color: inherit;
      display: inline;
      padding: 0;
      margin: 0;
      line-height: inherit;
      vertical-align: baseline;
      border-bottom: 2px solid #fadb14;
    }

    /* PDF 页码指示器 */
    .pdf-page-indicator {
      position: fixed;
      bottom: 20px;
      right: calc(var(--annotation-sidebar-width) + 20px);
      background: rgba(30, 30, 30, 0.75);
      color: #fff;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: var(--text-sm);
      z-index: var(--z-scrollbar);
      cursor: pointer;
      user-select: none;
      backdrop-filter: blur(4px);
      transition: opacity 0.15s;
    }
    body.annotation-sidebar-collapsed .pdf-page-indicator {
      right: 20px;
    }
    .pdf-page-indicator:hover { opacity: 0.9; }
    .pdf-page-indicator-input {
      width: 3em;
      background: transparent;
      border: none;
      border-bottom: 1px solid rgba(255,255,255,0.6);
      color: #fff;
      font-size: var(--text-sm);
      text-align: center;
      outline: none;
      padding: 0;
      -moz-appearance: textfield;
    }
    .pdf-page-indicator-input::-webkit-outer-spin-button,
    .pdf-page-indicator-input::-webkit-inner-spin-button { -webkit-appearance: none; }

    /* 系统监控浮窗 */
    .monitor-panel {
      position: absolute;
      top: 48px;
      right: 100px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      min-width: 340px;
      max-width: 480px;
      z-index: var(--z-dropdown);
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
      font-size: var(--text-sm);
      overflow: hidden;
    }
    .monitor-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px 0 0;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    .monitor-tabs {
      display: flex;
      gap: 0;
    }
    .monitor-tab {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 8px 14px;
      font-size: var(--text-sm);
      font-family: inherit;
      color: var(--color-text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.1s, border-color 0.1s;
    }
    .monitor-tab:hover { color: #374151; }
    .monitor-tab.is-active {
      color: #111827;
      border-bottom-color: #3b82f6;
      font-weight: 600;
    }
    .monitor-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: var(--color-text-muted);
      line-height: 1;
      padding: 0 4px;
      flex-shrink: 0;
    }
    .monitor-close:hover { color: #374151; }
    .monitor-body {
      max-height: 360px;
      overflow-y: auto;
      padding: 6px 0;
    }

    /* 内存 tab — 复用旧样式类名 */
    .pdf-mem-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      color: #374151;
    }
    .pdf-mem-row.pdf-mem-empty {
      color: var(--color-text-muted);
      font-style: italic;
    }
    .pdf-mem-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .pdf-mem-pages { color: var(--color-text-secondary); white-space: nowrap; }
    .pdf-mem-mb { color: #0b64c0; white-space: nowrap; min-width: 52px; text-align: right; }
    .pdf-mem-idle { color: #f59e0b; white-space: nowrap; font-size: var(--text-xs); }
    .pdf-mem-total {
      padding: 6px 12px 2px;
      border-top: 1px solid #f3f4f6;
      margin-top: 4px;
      color: #374151;
      font-weight: 600;
      text-align: right;
    }

    /* 翻译 tab */
    .monitor-stat-section {
      padding: 6px 12px 2px;
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .monitor-stat-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 12px;
      color: #374151;
    }
    .monitor-stat-key { color: var(--color-text-secondary); }
    .monitor-stat-val { color: #111827; font-weight: 500; }
    .monitor-stat-val.is-error { color: #dc2626; }
    .monitor-stat-val.is-ok { color: #16a34a; }
    .monitor-calls-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px 2px;
      border-top: 1px solid #f3f4f6;
      margin-top: 4px;
    }
    .monitor-calls-title {
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .monitor-clear-btn {
      background: none;
      border: 1px solid #e5e7eb;
      border-radius: var(--radius-sm);
      padding: 1px 6px;
      font-size: var(--text-xs);
      font-family: inherit;
      color: var(--color-text-secondary);
      cursor: pointer;
    }
    .monitor-clear-btn:hover { background: #f3f4f6; color: #374151; }
    .monitor-call-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 3px 12px;
      color: #374151;
      font-size: var(--text-xs);
    }
    .monitor-call-row.is-error { color: #dc2626; }
    .monitor-call-time { color: var(--color-text-muted); white-space: nowrap; flex-shrink: 0; }
    .monitor-call-dur { white-space: nowrap; flex-shrink: 0; min-width: 44px; text-align: right; }
    .monitor-call-status { flex-shrink: 0; }
    .monitor-call-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--color-text-secondary);
    }
    .monitor-call-row.is-error .monitor-call-text { color: #dc2626; }

    /* 自定义滚动条 */
    .doc-scrollbar {
      position: fixed;
      right: var(--annotation-sidebar-width);
      top: 0;
      bottom: 0;
      width: 14px;
      z-index: var(--z-scrollbar);
      cursor: pointer;
      background: transparent;
    }
    body.annotation-sidebar-collapsed .doc-scrollbar {
      right: 0;
    }
    .doc-scrollbar-thumb {
      position: absolute;
      left: 3px;
      right: 3px;
      background: rgba(0,0,0,0.45);
      border-radius: 4px;
      min-height: 20px;
      cursor: grab;
    }
    .doc-scrollbar-thumb:hover {
      background: rgba(0,0,0,0.6);
    }
    .doc-scrollbar-thumb:active {
      cursor: grabbing;
      background: rgba(0,0,0,0.7);
    }
    .doc-scrollbar-markers {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .doc-scrollbar-marker {
      position: absolute;
      left: 0;
      right: 0;
      min-height: 3px;
      opacity: 0.6;
      border-radius: 1px;
    }

    #reader .para-translation {
      color: var(--color-text-secondary);
      margin-top: 0.2em;
      margin-bottom: 1em;
    }

    /* ── Todo panel ── */
    .todo-panel { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }

    /* ── Todo list ── */
    .todo-list-container { flex: 1; overflow-y: auto; }
    .todo-item { display: flex; align-items: flex-start; gap: 9px; padding: 10px 12px; border-bottom: 1px solid #f5f5f4; position: relative; }
    .todo-item:hover { background: #fafaf9; }
    .todo-item:hover .todo-item-actions { opacity: 1; }
    .todo-item.done .todo-item-quote { text-decoration: line-through; color: var(--color-text-secondary); }
    .todo-item.done .todo-item-note { opacity: 0.5; }
    .todo-item.removing { animation: todoFadeOut 0.28s ease forwards; }
    @keyframes todoFadeOut { 0% { opacity: 1; max-height: 100px; } 40% { opacity: 0; } 100% { opacity: 0; max-height: 0; padding: 0; border: none; } }

    /* ── Checkbox ── */
    .todo-cb { width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; border: 1.5px solid #d6d3d1; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; background: #fff; transition: all 0.12s; }
    .todo-cb:hover { border-color: var(--color-accent); background: #eff6ff; }
    .todo-cb.checked { background: var(--color-accent); border-color: var(--color-accent); }
    .todo-cb.checked::after { content: ''; width: 8px; height: 5px; border-left: 1.5px solid #fff; border-bottom: 1.5px solid #fff; transform: rotate(-45deg) translate(1px,-1px); display: block; }

    /* ── Item body ── */
    .todo-item-body { flex: 1; min-width: 0; }
    .todo-item-top { display: flex; align-items: baseline; gap: 5px; margin-bottom: 2px; flex-wrap: nowrap; }
    .todo-item-file { font-size: 11px; color: var(--color-accent); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; cursor: pointer; flex-shrink: 1; }
    .todo-item-file:hover { text-decoration: underline; }
    .todo-item-file.missing { color: var(--color-text-secondary); }
    .todo-item-missing-badge { font-size: 10px; background: #fee2e2; color: #b91c1c; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; font-weight: 500; }
    .todo-item-time { font-size: 11px; color: #c4b5b0; margin-left: auto; flex-shrink: 0; white-space: nowrap; }
    .todo-item-quote { font-size: 12.5px; color: var(--color-text-secondary); line-height: 1.5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-style: italic; }
    .todo-item-quote.expanded { white-space: normal; overflow: visible; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; }
    .todo-item-note { font-size: 12px; color: var(--color-text-secondary); margin-top: 3px; line-height: 1.45; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .todo-item-expand { display: none; font-size: 11px; color: var(--color-text-secondary); cursor: pointer; background: none; border: none; padding: 0; font-family: inherit; margin-top: 2px; }
    .todo-item-expand:hover { color: var(--color-text-primary); }
    .todo-item-long .todo-item-expand { display: inline-block; }

    /* ── Item hover actions ── */
    .todo-item-actions { opacity: 0; position: absolute; right: 8px; top: 8px; display: flex; gap: 2px; transition: opacity 0.12s; }
    .todo-item-action { width: 24px; height: 24px; border-radius: 5px; background: #fff; border: 1px solid var(--color-border-subtle); color: var(--color-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
    .todo-item-action:hover { color: var(--color-text-primary); border-color: #a8a29e; }
    .todo-item-action.del:hover { color: #ef4444; border-color: #fca5a5; background: #fff5f5; }
    .todo-item-action svg { width: 12px; height: 12px; }

    /* ── Done section ── */
    .todo-done-section { border-top: 1px solid #f5f5f4; }
    .todo-done-toggle { padding: 8px 14px; font-size: 11.5px; color: var(--color-text-secondary); cursor: pointer; display: flex; align-items: center; gap: 5px; user-select: none; transition: color 0.1s; }
    .todo-done-toggle:hover { color: var(--color-text-primary); }
    .todo-done-toggle svg { width: 11px; height: 11px; transition: transform 0.15s; flex-shrink: 0; }
    .todo-done-toggle.open svg { transform: rotate(90deg); }
    .todo-done-items { display: none; }
    .todo-done-items.visible { display: block; }

    /* ── Todo composer ── */
    .todo-composer-quote { background: #f5f5f4; border-left: 3px solid var(--color-accent); padding: 7px 10px; border-radius: 0 6px 6px 0; font-size: 12px; color: var(--color-text-secondary); line-height: 1.55; font-style: italic; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 8px; }

    /* ── Quick-add two-button wrap ── */
    .annotation-quick-add-wrap { position: fixed; z-index: var(--z-quick-add); display: flex; flex-direction: column; min-width: 168px; background: #fff; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: 4px; box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    .annotation-quick-add-wrap.hidden { display: none; }
    .quick-add-btn { display: flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: var(--radius-sm); border: none; font-size: 13px; cursor: pointer; font-weight: 400; color: var(--color-text-primary); background: transparent; transition: background 0.1s; font-family: inherit; width: 100%; text-align: left; }
    .quick-add-btn:hover { background: var(--color-bg-subtle); }
    .quick-add-btn.todo { color: var(--color-accent); }
    .quick-add-btn svg { width: 13px; height: 13px; flex-shrink: 0; opacity: 0.55; }
    .quick-add-section { padding: 4px; }
    .quick-add-section + .quick-add-section { border-top: 1px solid var(--color-border-subtle); }
    .quick-add-section-label { font-size: 10px; color: var(--color-text-muted); padding: 4px 8px 2px; text-transform: uppercase; letter-spacing: 0.4px; }
    .quick-add-btn.quick-prompt { color: var(--color-text-secondary); }

    /* ── Copy menu ── */
    .todo-copy-menu { position: fixed; background: #1c1917; border-radius: 8px; padding: 4px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: calc(var(--z-quick-add) + 1); min-width: 180px; }
    .todo-copy-menu.hidden { display: none; }
    .todo-copy-menu-item { padding: 7px 10px; color: #e7e5e4; font-size: 12px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 7px; }
    .todo-copy-menu-item:hover { background: rgba(255,255,255,0.1); }
    .todo-copy-menu-item svg { width: 12px; height: 12px; color: #a8a29e; flex-shrink: 0; }

    /* ── Shortcuts help popover ── */
    .shortcuts-help-popover { position: fixed; z-index: var(--z-popover); background: #fff; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); box-shadow: 0 8px 24px rgba(0,0,0,0.16); width: 260px; font-size: var(--text-sm); }
    .shortcuts-help-popover.hidden { display: none; }
    .shortcuts-help-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px 8px; border-bottom: 1px solid var(--color-border-subtle); font-weight: 600; color: var(--color-text-primary); }
    .shortcuts-help-close { background: none; border: none; cursor: pointer; font-size: 16px; color: var(--color-text-secondary); padding: 0 2px; line-height: 1; }
    .shortcuts-help-close:hover { color: var(--color-text-primary); }
    .shortcuts-help-body { padding: 8px 12px 12px; }
    .shortcuts-help-group { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary); margin: 10px 0 4px; }
    .shortcuts-help-group:first-child { margin-top: 2px; }
    .shortcuts-help-row { display: flex; align-items: center; justify-content: space-between; padding: 3px 0; color: var(--color-text-primary); }
    .shortcuts-help-row kbd { font-family: var(--font-mono, monospace); font-size: 11px; background: var(--color-bg-subtle, #f6f8fa); border: 1px solid var(--color-border); border-radius: 4px; padding: 1px 6px; color: var(--color-text-secondary); white-space: nowrap; }
    .shortcuts-help-row span { color: var(--color-text-secondary); font-size: var(--text-sm); }

    /* ── Quick Open ── */
    .quick-open-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.25); display: flex; align-items: flex-start; justify-content: center; padding-top: 72px; z-index: 9000; }
    .quick-open-panel { background: var(--color-bg-primary, #fff); border-radius: var(--radius-lg, 10px); box-shadow: 0 16px 48px rgba(0,0,0,0.22); width: 520px; max-width: calc(100vw - 32px); overflow: hidden; border: 1px solid var(--color-border, #d0d0d0); }
    .quick-open-input-row { display: flex; align-items: center; padding: 0 14px; border-bottom: 1px solid var(--color-border, #eee); gap: 8px; }
    .quick-open-search-icon { font-size: 15px; color: var(--color-text-muted, #aaa); flex-shrink: 0; }
    .quick-open-input { flex: 1; border: none; outline: none; font-size: 15px; padding: 13px 0; color: var(--color-text-primary, #111); background: transparent; font-family: inherit; }
    .quick-open-hint { font-size: 11px; color: var(--color-text-muted, #bbb); flex-shrink: 0; }
    .quick-open-results { max-height: 320px; overflow-y: auto; }
    .quick-open-section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-muted, #bbb); padding: 8px 14px 4px; }
    .quick-open-item { display: flex; align-items: center; gap: 10px; padding: 7px 14px; cursor: pointer; }
    .quick-open-item:hover, .quick-open-item.active { background: var(--color-bg-subtle, #f5f5f5); }
    .quick-open-item.active { background: #eff6ff; }
    .quick-open-item-icon { font-size: 14px; flex-shrink: 0; color: var(--color-text-muted, #999); }
    .quick-open-item-name { flex: 1; font-size: 13px; color: var(--color-text-primary, #1a1a1a); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .quick-open-item-name em { font-style: normal; font-weight: 600; color: #2563eb; }
    .quick-open-item-path { font-size: 11px; color: var(--color-text-muted, #bbb); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; text-align: right; }
    .quick-open-tab-badge { font-size: 10px; background: #e0e7ff; color: #4f46e5; border-radius: 3px; padding: 1px 5px; flex-shrink: 0; }
    .quick-open-footer { display: flex; gap: 14px; padding: 7px 14px; border-top: 1px solid var(--color-border, #eee); background: var(--color-bg-subtle, #fafafa); }
    .quick-open-footer-hint { font-size: 11px; color: var(--color-text-muted, #bbb); display: flex; align-items: center; gap: 4px; }
    .quick-open-footer-hint kbd { display: inline-block; padding: 1px 5px; border: 1px solid var(--color-border, #ddd); border-bottom: 2px solid var(--color-border, #ccc); border-radius: 3px; background: var(--color-bg-subtle, #f0f0f0); font-size: 10px; font-family: monospace; }
    .quick-open-empty { padding: 20px 14px; font-size: 13px; color: var(--color-text-muted, #aaa); text-align: center; }

    /* ── Preferences modal ── */
    .preferences-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: none; align-items: center; justify-content: center; z-index: 8000; }
    .preferences-overlay.show { display: flex; }
    .preferences-dialog { background: var(--color-bg-primary, #fff); border-radius: var(--radius-lg, 12px); box-shadow: 0 8px 40px rgba(0,0,0,0.2); width: 700px; max-width: calc(100vw - 48px); max-height: calc(100vh - 80px); display: flex; flex-direction: column; overflow: hidden; }
    .preferences-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--color-border, #eee); font-weight: 600; font-size: 15px; flex-shrink: 0; }
    .preferences-close { width: 26px; height: 26px; border-radius: 50%; border: none; background: var(--color-bg-subtle, #f0f0f0); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted, #666); }
    .preferences-close:hover { background: var(--color-border, #e0e0e0); }
    .preferences-body { display: flex; flex: 1; overflow: hidden; }
    .preferences-nav { width: 160px; background: var(--color-bg-subtle, #f7f7f7); border-right: 1px solid var(--color-border, #eee); padding: 12px 8px; flex-shrink: 0; overflow-y: auto; }
    .preferences-nav-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 7px; font-size: 13px; color: var(--color-text-secondary, #555); cursor: pointer; margin-bottom: 2px; user-select: none; }
    .preferences-nav-item:hover { background: var(--color-bg-primary, #fff); }
    .preferences-nav-item.active { background: #e8f0fe; color: #1a56db; font-weight: 500; }
    .preferences-nav-icon { font-size: 15px; }
    .preferences-content { flex: 1; overflow-y: auto; padding: 20px 24px; }
    .preferences-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--color-border, #eee); background: var(--color-bg-subtle, #fafafa); flex-shrink: 0; }
    .preferences-btn { padding: 7px 16px; border-radius: var(--radius-md, 7px); font-size: 13px; cursor: pointer; border: 1px solid var(--color-border, #ddd); background: var(--color-bg-primary, white); color: var(--color-text-primary, #333); }
    .preferences-btn:hover { background: var(--color-bg-subtle, #f0f0f0); }
    .preferences-btn.primary { background: var(--color-accent, #2563eb); color: white; border-color: var(--color-accent, #2563eb); font-weight: 500; }
    .preferences-btn.primary:hover { background: #1d4ed8; }
    .qc-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--color-bg-subtle, #f6f8fa); border: 1px solid var(--color-border, #d0d7de); border-radius: 5px; margin-bottom: 4px; }
    .qc-item-drag { color: var(--color-text-muted, #8b949e); cursor: grab; }
    .qc-item-text { flex: 1; background: none; border: none; outline: none; font-size: 13px; min-width: 0; }
    .qc-item-del { background: none; border: none; cursor: pointer; color: var(--color-text-muted, #8b949e); padding: 2px 4px; border-radius: 3px; }
    .qc-item-del:hover { background: var(--color-error-bg, #ffebe9); color: var(--color-error, #cf222e); }
    .qc-preset-chip { padding: 3px 10px; border: 1px solid var(--color-border-subtle, #e8ecf0); border-radius: 20px; background: var(--color-bg-subtle, #f6f8fa); color: var(--color-accent, #0969da); font-size: 12px; cursor: pointer; }
    .qc-preset-chip:hover { background: var(--color-border-subtle, #e8ecf0); }

    /* ── RAG 搜索面板 ── */
    .rag-search-container {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .rag-search-wrap {
      display: flex; flex-direction: column; height: 100%;
    }
    .rag-search-input-wrap {
      flex-shrink: 0; margin: 8px 8px 0;
    }
    .rag-results-area {
      flex: 1; overflow-y: auto; padding: 4px 0;
    }
    .rag-empty {
      padding: 20px 12px; text-align: center;
      font-size: var(--text-sm); color: var(--color-text-muted);
      line-height: 1.6;
    }
    .rag-empty small { font-size: var(--text-xs); }
    .rag-item {
      padding: 7px 10px; border-bottom: 1px solid var(--color-border-subtle);
      cursor: pointer;
    }
    .rag-item:hover { background: var(--color-bg-subtle); }
    .rag-item.active {
      background: #f0f6ff;
      border-left: 2px solid var(--color-accent);
      padding-left: 8px;
    }
    .rag-item-file {
      font-size: var(--text-xs); color: var(--color-text-muted);
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 2px; gap: 6px;
    }
    .rag-item-path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
    .rag-item-score { flex-shrink: 0; color: var(--color-text-muted); opacity: 0.7; font-variant-numeric: tabular-nums; }
    .rag-item-heading {
      font-size: var(--text-sm); font-weight: 500;
      color: var(--color-text-primary); margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .rag-item-snippet {
      font-size: var(--text-xs); color: var(--color-text-secondary);
      line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden;
    }
mark.rag-highlight {
      background: #fff3b0; border-radius: 2px; padding: 0 1px;
      outline: 2px solid #e6c700; outline-offset: 1px;
    }

`;
