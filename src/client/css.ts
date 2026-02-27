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
    }
    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #e1e4e8;
    }
    .sidebar-header h1 {
      font-size: 16px;
      color: #24292e;
      margin-bottom: 12px;
    }
    .add-file {
      display: flex;
      gap: 8px;
    }
    .add-file input {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid #d1d5da;
      border-radius: 6px;
      font-size: 12px;
    }
    .add-file button {
      padding: 6px 12px;
      background: #2ea44f;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }
    .add-file button:hover {
      background: #2c974b;
    }
    .file-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .file-item {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 4px;
      font-size: 13px;
      color: #24292e;
    }
    .file-item:hover {
      background: #f6f8fa;
    }
    .file-item.active {
      background: #ddf4ff;
      color: #0969da;
    }
    .file-item.current {
      border-left: 3px solid #0969da;
      padding-left: 7px;
    }
    .file-item .icon {
      margin-right: 8px;
    }
    .file-item .name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

    /* 面包屑 */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #24292e;
      position: relative;
    }
    .breadcrumb-folder {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      user-select: none;
    }
    .breadcrumb-folder:hover {
      background: #f6f8fa;
    }
    .breadcrumb-separator {
      color: #d1d5da;
    }
    .breadcrumb-file {
      color: #0969da;
      font-weight: 500;
    }

    /* 附近文件菜单 */
    .nearby-menu {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 8px;
      background: #fff;
      border: 1px solid #d1d5da;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      min-width: 280px;
      max-width: 400px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
    }
    .nearby-menu.show {
      display: block;
    }
    .nearby-menu-section {
      padding: 8px 0;
      border-bottom: 1px solid #e1e4e8;
    }
    .nearby-menu-section:last-child {
      border-bottom: none;
    }
    .nearby-menu-title {
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #57606a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .nearby-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 13px;
      color: #24292e;
    }
    .nearby-menu-item:hover {
      background: #f6f8fa;
    }
    .nearby-menu-item.current {
      background: #ddf4ff;
      color: #0969da;
    }
    .nearby-menu-item .icon {
      flex-shrink: 0;
    }
    .nearby-menu-item .name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .nearby-menu-item .badge {
      font-size: 11px;
      color: #57606a;
      background: #f6f8fa;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .nearby-menu-empty {
      padding: 16px 12px;
      text-align: center;
      color: #57606a;
      font-size: 12px;
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

    /* 加载动画 */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
`;
