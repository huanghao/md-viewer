export const styles = `
    :root {
      --font-scale: 1.0;
      --sidebar-width: 260px;
      --annotation-sidebar-width: 320px;
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
      display: block;
      padding: 0;
      margin: 0;
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
      font-size: 13px;
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
      color: #0969da;
      border-bottom-color: #0969da;
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
    .file-type-icon {
      width: 18px;
      height: 18px;
      border-radius: 5px;
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
    .file-item.current .file-type-icon.html,
    .tree-item.current .file-type-icon.html {
      background: #f3f8ff;
      color: #4f88bf;
      border-color: #d8e8fb;
    }
    .file-item.deleted .file-type-icon,
    .tree-item.missing .file-type-icon {
      background: #f8f0f0;
      color: #b56a6a;
      border-color: #efdbdb;
    }
    .tree-item .file-type-icon {
      width: 16px;
      height: 16px;
      font-size: 9px;
      border-radius: 4px;
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

    /* 标签页 */
    .tabs {
      display: flex;
      align-items: stretch;
      background: #f6f8fa;
      border-bottom: 1px solid #e1e4e8;
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
    .tab-manager-wrap {
      position: relative;
      flex-shrink: 0;
      border-left: 1px solid #e1e4e8;
    }
    .tab-manager-toggle {
      height: 100%;
      min-height: 36px;
      padding: 0 12px;
      border: none;
      border-radius: 0;
      border-left: 1px solid transparent;
      background: #f6f8fa;
      color: #4b5563;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .tab-manager-toggle:hover,
    .tab-manager-toggle.active {
      background: #fff;
      color: #0969da;
    }
    .tab-manager-panel {
      display: none;
      position: absolute;
      right: 6px;
      top: calc(100% + 6px);
      width: 320px;
      max-height: min(520px, calc(100vh - 72px));
      padding: 10px;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
      z-index: 2100;
      overflow: hidden;
    }
    .tab-manager-panel.show {
      display: flex;
      flex-direction: column;
    }
    .tab-manager-row {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }
    .tab-manager-actions-row {
      flex-wrap: wrap;
    }
    .tab-manager-action {
      border: 1px solid #d1d5da;
      border-radius: 6px;
      background: #fff;
      color: #334155;
      font-size: 12px;
      padding: 4px 8px;
      cursor: pointer;
      white-space: nowrap;
    }
    .tab-manager-action:hover {
      border-color: #0969da;
      color: #0969da;
      background: #eff6ff;
    }
    .tab-manager-action.danger:hover {
      border-color: #ef4444;
      color: #b42318;
      background: #fff1f2;
    }
    .tab-manager-search {
      width: 100%;
      padding: 7px 9px;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      font-size: 12px;
    }
    .tab-manager-search:focus {
      outline: none;
      border-color: #0969da;
      box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.12);
    }
    .tab-manager-sort {
      border: 1px solid #d1d5da;
      border-radius: 6px;
      background: #fff;
      color: #374151;
      font-size: 12px;
      padding: 4px 8px;
      cursor: pointer;
    }
    .tab-manager-sort.active {
      border-color: #0969da;
      color: #0969da;
      background: #eef6ff;
    }
    .tab-manager-list {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: auto;
      flex: 1;
      min-height: 120px;
    }
    .tab-manager-empty {
      padding: 12px;
      color: #6b7280;
      font-size: 12px;
      text-align: center;
    }
    .tab-manager-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
      cursor: pointer;
    }
    .tab-manager-item:last-child {
      border-bottom: none;
    }
    .tab-manager-item:hover {
      background: #f8fafc;
    }
    .tab-manager-item.active {
      background: #eff6ff;
    }
    .tab-manager-name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #1f2937;
    }
    .tab-manager-actions {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .tab-manager-status {
      display: inline-block;
      min-width: 14px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
    }
    .tab-manager-status.status-modified {
      color: #9a6700;
    }
    .tab-manager-status.status-deleted {
      color: #b42318;
    }
    .tab-manager-close {
      width: 20px;
      height: 20px;
      border: 1px solid #d1d5da;
      border-radius: 4px;
      background: #fff;
      color: #6b7280;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }
    .tab-manager-close:hover {
      border-color: #ef4444;
      color: #ef4444;
    }
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
      padding-right: calc(var(--annotation-sidebar-width) + 24px);
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
    .markdown-body .mermaid-block,
    .markdown-body .mermaid-fallback-block {
      margin: 16px 0;
    }
    .markdown-body .mermaid-actions {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 6px;
    }
    .markdown-body .mermaid-source-toggle {
      border: 1px solid #d0d7de;
      background: #fff;
      color: #57606a;
      font-size: 12px;
      line-height: 1;
      border-radius: 6px;
      padding: 5px 9px;
      cursor: pointer;
    }
    .markdown-body .mermaid-source-toggle:hover {
      border-color: #9ca3af;
      color: #374151;
    }
    .markdown-body .mermaid {
      margin: 0;
      padding: 8px;
      border-radius: 8px;
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
      border-radius: 6px;
      border: 1px solid #f0d8a8;
      background: #fff8e6;
      color: #8a5a00;
      font-size: 12px;
      line-height: 1.4;
    }
    .markdown-body .mermaid-source-panel {
      margin-top: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fbfcfe;
      overflow: hidden;
    }
    .markdown-body .mermaid-source-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      border-bottom: 1px solid #e5e7eb;
      color: #57606a;
      font-size: 12px;
    }
    .markdown-body .mermaid-source-copy {
      border: 1px solid #d0d7de;
      background: #fff;
      color: #57606a;
      font-size: 12px;
      line-height: 1;
      border-radius: 6px;
      padding: 5px 9px;
      cursor: pointer;
    }
    .markdown-body .mermaid-source-copy:hover {
      border-color: #9ca3af;
      color: #374151;
    }
    .markdown-body .mermaid-source-copy.copied {
      color: #1a7f37;
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
      border-radius: 8px;
      font-size: 13px;
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
      color: #24292e;
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

    /* Diff 视图 */
    .diff-view {
      font-family: 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
      overflow-x: auto;
    }
    .diff-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #f6f8fa;
      border-bottom: 1px solid #e1e4e8;
      font-size: 13px;
      color: #57606a;
      flex-shrink: 0;
    }
    .diff-header-titles {
      display: flex;
      gap: 0;
      flex: 1;
    }
    .diff-header-old,
    .diff-header-new {
      flex: 1;
      padding: 0 8px;
      font-size: 12px;
    }
    .diff-header-old { color: #b42318; }
    .diff-header-new { color: #1a7f37; }
    .diff-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    .diff-accept-btn {
      padding: 5px 12px;
      border-radius: 6px;
      border: 1px solid #2da44e;
      background: #2da44e;
      color: #fff;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .diff-accept-btn:hover {
      background: #218a3e;
      border-color: #218a3e;
    }
    .diff-close-btn {
      padding: 5px 12px;
      border-radius: 6px;
      border: 1px solid #d0d7de;
      background: #fff;
      color: #24292f;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .diff-close-btn:hover {
      background: #f6f8fa;
    }
    .diff-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .diff-table td {
      padding: 1px 8px;
      vertical-align: top;
      white-space: pre-wrap;
      word-break: break-all;
      width: 50%;
    }
    .diff-line-no {
      width: 40px !important;
      min-width: 40px;
      max-width: 40px;
      color: #8b949e;
      text-align: right;
      padding-right: 12px !important;
      user-select: none;
      font-size: 11px;
    }
    .diff-row-delete td {
      background: #ffebe9;
      color: #b42318;
    }
    .diff-row-delete .diff-line-no {
      background: #ffd6d1;
      color: #b42318;
    }
    .diff-row-insert td {
      background: #e6ffec;
      color: #1a7f37;
    }
    .diff-row-insert .diff-line-no {
      background: #ccffd8;
      color: #1a7f37;
    }
    .diff-row-equal td {
      background: #fff;
      color: #24292f;
    }
    .diff-row-mixed .diff-row-delete-cell {
      background: #ffebe9;
      color: #b42318;
    }
    .diff-row-mixed .diff-line-no:first-child {
      background: #ffd6d1;
      color: #b42318;
    }
    .diff-row-mixed .diff-row-insert-cell {
      background: #e6ffec;
      color: #1a7f37;
    }
    .diff-row-mixed .diff-line-no:last-of-type {
      background: #ccffd8;
      color: #1a7f37;
    }
    .diff-cell-empty {
      background: #f6f8fa !important;
    }
    .diff-view-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .diff-view-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: auto;
    }
    .diff-no-changes {
      padding: 40px;
      text-align: center;
      color: #57606a;
      font-size: 14px;
    }
    #diffButton.active {
      color: #0969da;
      background: rgba(9, 105, 218, 0.08);
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

    .tree-item.missing .tree-name {
      text-decoration: line-through;
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
    .settings-kv-grid {
      display: grid;
      grid-template-columns: 130px 1fr;
      gap: 8px 10px;
      font-size: 12px;
      color: #374151;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fafbfc;
      margin-bottom: 10px;
    }
    .settings-kv-grid > div:nth-child(2n + 1) {
      color: #6b7280;
    }
    .settings-key-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 140px;
      overflow: auto;
      padding: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
    }
    .settings-key-chip {
      font-size: 11px;
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

    /* 评论侧边栏 */
    .annotation-sidebar {
      width: var(--annotation-sidebar-width);
      background: #f6f8fa;
      border-left: 1px solid #e1e4e8;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      transition: transform 0.2s ease, opacity 0.2s ease;
      position: fixed;
      right: 0;
      top: 84px;
      height: calc(100vh - 84px);
      z-index: 80;
    }
    .annotation-sidebar.collapsed {
      opacity: 0;
      transform: translateX(100%);
      pointer-events: none;
    }
    .annotation-sidebar-resizer {
      position: fixed;
      top: 84px;
      right: calc(var(--annotation-sidebar-width) - 4px);
      width: 8px;
      height: calc(100vh - 84px);
      cursor: col-resize;
      background: transparent;
      z-index: 81;
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
    .annotation-sidebar-header {
      padding: 8px 10px;
      border-bottom: 1px solid #e1e4e8;
      background: #fff;
      transition: padding 0.2s ease;
      position: relative;
    }
    .annotation-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .annotation-sidebar-header h3 {
      font-size: 13px;
      font-weight: 600;
      color: #24292e;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
    }
    .annotation-header-actions {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .annotation-icon-btn {
      width: 30px;
      height: 30px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: #57606a;
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
      background: #f6f8fa;
      border-color: #0969da;
      color: #0969da;
    }
    .annotation-filter-menu {
      position: absolute;
      top: 36px;
      right: 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 6px;
      background: #fff;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);
      z-index: 20;
      min-width: 112px;
    }
    .annotation-filter-menu.hidden {
      display: none;
    }
    .annotation-filter-item {
      border: 1px solid transparent;
      background: transparent;
      color: #24292e;
      text-align: left;
      font-size: 12px;
      border-radius: 6px;
      padding: 5px 8px;
      cursor: pointer;
    }
    .annotation-filter-item:hover {
      background: #f6f8fa;
    }
    .annotation-filter-item.is-active {
      background: #edf4ff;
      border-color: #0969da;
      color: #0969da;
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
      font-size: 13px;
    }
    .annotation-item {
      background: #fff;
      border: 1px solid #e1e4e8;
      border-left: 4px solid transparent;
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 6px;
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
    .annotation-item.status-orphan {
      border-left-color: #9a7b4f;
    }
    .annotation-item.is-resolved {
      opacity: 0.55;
      border-left-color: #8b949e;
    }
    .annotation-item.is-resolved:hover {
      opacity: 0.85;
    }
    .annotation-item:hover {
      border-color: #0969da;
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
      background: #0969da;
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      border-radius: 10px;
      line-height: 1;
    }
    .annotation-quote {
      display: none;
    }
    .annotation-row-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 4px;
    }
    .annotation-row-title {
      font-size: 13px;
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
      border-radius: 5px;
      background: transparent;
      color: #6b7280;
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
      border-color: #0969da;
      color: #0969da;
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
      color: #1a7f37;
    }
    .annotation-icon-action.resolve.is-resolved:hover {
      border-color: #2da44e;
      background: #dafbe1;
    }
    .annotation-icon-action.danger {
      color: #8c6d4a;
    }
    .annotation-icon-action.danger:hover {
      border-color: #a4875f;
      background: #f7efe5;
    }
    .annotation-note {
      font-size: 13px;
      color: #24292e;
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
      font-size: 13px;
      color: #24292e;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 4px;
    }
    .annotation-thread-line .annotation-thread-text {
      flex: 1;
      min-width: 0;
    }
    .annotation-thread-edit-btn {
      flex-shrink: 0;
      display: none;
      width: 18px;
      height: 18px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #6b7280;
      border-radius: 3px;
      line-height: 1;
    }
    .annotation-thread-edit-btn svg {
      width: 11px;
      height: 11px;
      fill: currentColor;
    }
    .annotation-thread-edit-btn:hover {
      color: #0969da;
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
      border: 1px solid #0969da;
      border-radius: 4px;
      font-size: 13px;
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
      font-size: 12px;
      color: #6b7280;
    }
    .annotation-reply-entry {
      margin-top: 6px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #fafbfc;
      padding: 4px 6px;
      cursor: text;
    }
    .annotation-reply-entry:focus-within {
      border-color: #0969da;
      box-shadow: 0 0 0 2px rgba(9, 105, 218, 0.12);
      background: #fff;
    }
    .annotation-reply-entry textarea {
      width: 100%;
      min-height: 34px;
      padding: 4px 2px;
      border: none;
      border-radius: 0;
      font-size: 12px;
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
      border: 1px solid #d0d7de;
      color: #57606a;
      font-size: 10px;
      border-radius: 999px;
      padding: 1px 6px;
      background: #fff;
    }
    .annotation-status-tag.warn {
      border-color: #ffd8d3;
      color: #cf222e;
      background: #fff8f8;
    }
    .annotation-actions {
      display: flex;
      gap: 8px;
    }
    .annotation-btn {
      padding: 4px 10px;
      font-size: 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #fff;
      color: #24292e;
      cursor: pointer;
      transition: all 0.15s;
    }
    .annotation-btn:hover {
      background: #f6f8fa;
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
      color: #1a7f37;
      border-color: #1a7f37;
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
      border-left: 1px solid #e1e4e8;
      position: relative;
    }
    .annotation-list:not(.default-mode) .annotation-item.status-exact,
    .annotation-list:not(.default-mode) .annotation-item.status-reanchored,
    .annotation-list:not(.default-mode) .annotation-item.status-orphan {
      border-left-color: #e1e4e8;
    }
    .annotation-list:not(.default-mode) .annotation-item.is-active::before {
      content: '';
      position: absolute;
      left: -1px;
      top: 7px;
      bottom: 7px;
      width: 3px;
      border-radius: 3px;
      background: #0969da;
    }
    .annotation-floating-open-btn {
      position: fixed;
      right: 8px;
      top: 90px;
      width: 32px;
      height: 32px;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      background: #fff;
      color: #57606a;
      cursor: pointer;
      z-index: 90;
      display: none;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
    }
    .annotation-floating-open-btn:hover {
      border-color: #0969da;
      color: #0969da;
      background: #f6f8fa;
    }
    .annotation-floating-open-btn svg {
      width: 17px;
      height: 17px;
      fill: currentColor;
    }
    body.annotation-sidebar-collapsed .annotation-floating-open-btn {
      display: inline-flex;
    }
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
      z-index: 9999;
      width: 340px;
      background: #fff;
      border: 1px solid #d0d7de;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
      padding: 10px;
    }
    .annotation-composer.hidden,
    .annotation-popover.hidden {
      display: none;
    }
    .annotation-composer-header,
    .annotation-popover-header {
      margin-bottom: 6px;
    }
    .annotation-composer-header {
      cursor: move;
      user-select: none;
    }
    .annotation-composer .annotation-composer-input {
      margin-top: 0;
    }
    .annotation-popover-note {
      font-size: 13px;
      color: #24292e;
      line-height: 1.45;
      white-space: normal;
      word-break: break-word;
    }
    .annotation-quick-add {
      position: fixed;
      z-index: 9998;
      width: 32px;
      height: 32px;
      border: 1px solid #d0d7de;
      border-radius: 999px;
      background: #fff;
      color: #6b7280;
      box-shadow: 0 3px 10px rgba(31, 41, 55, 0.12);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .annotation-quick-add:hover {
      border-color: #0969da;
      color: #0969da;
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
      z-index: 10000;
      align-items: center;
      gap: 4px;
      background: var(--bg-primary, #fff);
      border: 1px solid #d0d7de;
      border-radius: 8px;
      padding: 6px 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.14);
    }
    #findBar.visible {
      display: flex;
    }
    #findBarInput {
      border: 1px solid #d0d7de;
      border-radius: 4px;
      padding: 3px 8px;
      font-size: 13px;
      width: 200px;
      outline: none;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #1f2328);
    }
    #findBarInput:focus {
      border-color: #0969da;
      box-shadow: 0 0 0 2px rgba(9,105,218,0.2);
    }
    #findBarCount {
      font-size: 12px;
      color: #57606a;
      min-width: 52px;
      text-align: center;
    }
    #findBarCount.no-result {
      color: #cf222e;
    }
    #findBar button {
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 13px;
      color: #57606a;
      line-height: 1;
    }
    #findBar button:hover {
      background: #f6f8fa;
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
      color: #24292e;
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
      border-radius: 3px;
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
      color: #24292e;
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
      font-size: 11px;
      margin-left: 4px;
    }
    .json-preview {
      color: #6a737d;
      font-size: 12px;
      margin-left: 6px;
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
      border-radius: 4px;
      padding: 12px 16px;
      color: #b31d28;
      margin-bottom: 12px;
    }
    .json-error pre {
      margin-top: 8px;
      font-size: 12px;
      color: #586069;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .json-line-header {
      font-size: 11px;
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
      padding: 5px 10px;
      border-bottom: 1px solid #f0f0f0;
      background: #fefefe;
      gap: 6px;
      flex-shrink: 0;
    }
    .focus-filter-label {
      font-size: 11px;
      color: #999;
      flex-shrink: 0;
    }
    .focus-time-pills {
      display: flex;
      gap: 3px;
    }
    .focus-time-pill {
      font-size: 10px;
      padding: 1px 7px;
      border-radius: 10px;
      border: 1px solid #e0e0e0;
      background: #fff;
      color: #666;
      cursor: pointer;
      transition: all 0.12s;
    }
    .focus-time-pill:hover { border-color: #aaa; color: #333; }
    .focus-time-pill.active {
      background: #0969da;
      border-color: #0969da;
      color: #fff;
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
      font-size: 12px;
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
      border-radius: 8px;
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
    .focus-file-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .focus-file-dot.modified { background: #f59e0b; }
    .focus-file-dot.new-file { background: #007AFF; }
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
      font-size: 12px;
      color: #aaa;
      padding: 12px 16px;
      font-style: italic;
    }
    /* Pin button in full tree view — show on hover */
    .tree-item .tree-pin-btn {
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
    .tree-item:hover .tree-pin-btn { display: inline; }
    .tree-item .tree-pin-btn.active { display: inline; opacity: 1; }

    /* ==================== Sync / Settings Dialog ==================== */
    .sync-dialog-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 9000;
      align-items: center;
      justify-content: center;
    }
    .sync-dialog-overlay.show {
      display: flex;
    }
    .sync-dialog {
      background: #fff;
      border-radius: 8px;
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
      border-bottom: 1px solid #e1e4e8;
      flex-shrink: 0;
    }
    .sync-dialog-title {
      font-size: 14px;
      font-weight: 600;
      color: #24292e;
      flex: 1;
    }
    .sync-dialog-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #57606a;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .sync-dialog-close:hover { color: #24292e; }
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
      border-top: 1px solid #e1e4e8;
      flex-shrink: 0;
    }
    .sync-dialog-button {
      font-size: 13px;
      padding: 6px 14px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #f6f8fa;
      color: #24292e;
      cursor: pointer;
    }
    .sync-dialog-button:hover { background: #e1e4e8; }
    .sync-dialog-button.primary {
      background: #0969da;
      border-color: #0969da;
      color: #fff;
    }
    .sync-dialog-button.primary:hover { background: #0757ba; }
    /* add-workspace dialog specific */
    .add-workspace-overlay .sync-dialog { width: 520px; }
    .sync-dialog-field { margin-bottom: 14px; }
    .sync-dialog-label { display: block; font-size: 12px; font-weight: 500; color: #24292e; margin-bottom: 6px; }
    .sync-dialog-input {
      width: 100%;
      font-size: 13px;
      padding: 7px 10px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      resize: vertical;
      font-family: inherit;
    }
    .sync-dialog-input:focus { outline: none; border-color: #0969da; box-shadow: 0 0 0 3px rgba(9,105,218,0.15); }
    .workspace-path-hint { font-size: 11px; color: #57606a; margin-top: 4px; }
    .workspace-path-preview { font-size: 11px; color: #0969da; margin-top: 4px; font-family: monospace; word-break: break-all; }
    .add-workspace-footer { justify-content: flex-end; }
    .sync-dialog-btn {
      font-size: 13px;
      padding: 6px 14px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #f6f8fa;
      color: #24292e;
      cursor: pointer;
    }
    .sync-dialog-btn:hover { background: #e1e4e8; }
    .sync-dialog-btn-primary {
      background: #0969da;
      border-color: #0969da;
      color: #fff;
    }
    .sync-dialog-btn-primary:hover { background: #0757ba; }

    /* PDF Viewer */
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

    .pdf-text-layer span {
      position: absolute;
      white-space: pre;
      cursor: text;
      transform-origin: 0% 0%;
    }

    .pdf-highlight {
      background: rgba(255, 220, 0, 0.4) !important;
      border-radius: 2px;
    }

    .pdf-translation-overlay {
      word-break: break-all;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
`;
