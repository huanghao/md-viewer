export const clientScript = `
    // ==================== 状态管理 ====================
    const state = {
      files: new Map(), // path -> { path, name, content, active, lastModified, isRemote }
      currentFile: null,
    };

    // ==================== 状态持久化 ====================
    const STORAGE_KEY = 'md-viewer:openFiles';

    function saveState() {
      const data = {
        files: Array.from(state.files.entries()).map(([path, file]) => [path, {
          path: file.path,
          name: file.name,
          active: file.active,
          isRemote: file.isRemote || false
        }]),
        currentFile: state.currentFile
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    async function restoreState() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        
        const data = JSON.parse(saved);
        if (!data.files || data.files.length === 0) return;

        // 恢复文件列表（重新加载内容）
        for (const [path, fileInfo] of data.files) {
          // 对于远程文件，需要重新 fetch 内容
          const fileData = await loadFile(path, true); // 静默加载，不弹窗
          if (fileData) {
            state.files.set(path, {
              path: fileData.path,
              name: fileData.filename,
              content: fileData.content,
              active: fileInfo.active,
              lastModified: fileData.lastModified,
              isRemote: fileData.isRemote || false
            });
          }
        }

        // 恢复当前文件
        if (data.currentFile && state.files.has(data.currentFile)) {
          state.currentFile = data.currentFile;
        } else {
          // 如果保存的当前文件不存在了，切换到第一个活跃文件
          const activeFiles = Array.from(state.files.values()).filter(f => f.active);
          state.currentFile = activeFiles.length > 0 ? activeFiles[0].path : null;
        }

        renderFiles();
        renderTabs();
        renderContent();
      } catch (e) {
        console.error('恢复状态失败:', e);
      }
    }

    // ==================== API 请求 ====================
    async function loadFile(path, silent = false) {
      try {
        const response = await fetch(\`/api/file?path=\${encodeURIComponent(path)}\`);
        const data = await response.json();
        if (data.error) {
          if (!silent) alert(data.error);
          return null;
        }
        return data;
      } catch (e) {
        if (!silent) alert(\`加载失败: \${e.message}\`);
        return null;
      }
    }

    // 刷新当前文件（页面加载时自动调用）
    async function refreshCurrentFile() {
      if (!state.currentFile) return;
      const data = await loadFile(state.currentFile);
      if (data) {
        const file = state.files.get(data.path);
        if (file) {
          file.content = data.content;
          file.lastModified = data.lastModified;
          renderContent();
          renderFiles();
        }
      }
    }

    // ==================== 消息处理 ====================
    async function onFileLoaded(data, focus = false) {
      state.files.set(data.path, {
        path: data.path,
        name: data.filename,
        content: data.content,
        active: true,
        lastModified: data.lastModified,
        isRemote: data.isRemote || false
      });

      // 只有 focus=true 时才切换到该文件
      if (focus) {
        state.currentFile = data.path;
      }
      
      saveState();
      renderFiles();
      renderTabs();
      renderContent();
    }

    // ==================== UI 渲染 ====================
    function escapeAttr(str) {
      return str ? str.replace(/'/g, "\\\\'") : '';
    }

    // 为同名文件生成区分名称
    function getDisplayNames(files) {
      const fileArray = Array.from(files.values());
      const nameCount = {};
      
      // 统计每个 basename 出现的次数
      fileArray.forEach(file => {
        nameCount[file.name] = (nameCount[file.name] || 0) + 1;
      });
      
      return fileArray.map(file => {
        if (nameCount[file.name] === 1) {
          return { ...file, displayName: file.name };
        }
        
        // 有同名文件，需要找区分
        const parts = file.path.split('/').filter(Boolean);
        const otherFiles = fileArray.filter(f => f.name === file.name && f.path !== file.path);
        
        // 从父目录开始找不同的部分
        let diffPart = '';
        for (let i = parts.length - 2; i >= 0; i--) {
          const part = parts[i];
          const isUnique = otherFiles.every(other => {
            const otherParts = other.path.split('/').filter(Boolean);
            return otherParts[i] !== part;
          });
          if (isUnique) {
            diffPart = part;
            break;
          }
        }
        
        // 如果没找到唯一区分的，就用直接父目录
        if (!diffPart && parts.length >= 2) {
          diffPart = parts[parts.length - 2];
        }
        
        return {
          ...file,
          displayName: diffPart ? file.name + ' (' + diffPart + ')' : file.name
        };
      });
    }

    function renderFiles() {
      const container = document.getElementById('fileList');
      if (state.files.size === 0) {
        container.innerHTML = '<div class="empty-tip">点击上方添加 Markdown 文件</div>';
        return;
      }

      const filesWithDisplay = getDisplayNames(state.files);
      container.innerHTML = filesWithDisplay
        .map(file => {
          const isCurrent = file.path === state.currentFile;
          const classes = [
            'file-item',
            file.active ? 'active' : '',
            isCurrent ? 'current' : ''
          ].filter(Boolean).join(' ');
          return \`
          <div class="\${classes}"
               onclick="switchFile('\${escapeAttr(file.path)}')">
            <span class="icon">📄</span>
            <span class="name">\${file.displayName}</span>
            <span class="close" onclick="event.stopPropagation();removeFile('\${escapeAttr(file.path)}')">×</span>
          </div>
        \`}).join('');
    }

    function renderTabs() {
      const activeFiles = Array.from(state.files.values()).filter(f => f.active);
      const container = document.getElementById('tabs');

      if (activeFiles.length === 0) {
        container.innerHTML = '';
        return;
      }

      // 为活跃标签也计算区分名称（基于所有文件）
      const allFilesWithDisplay = getDisplayNames(state.files);
      const displayNameMap = new Map(allFilesWithDisplay.map(f => [f.path, f.displayName]));
      
      container.innerHTML = activeFiles
        .map(file => \`
          <div class="tab \${file.path === state.currentFile ? 'active' : ''}"
               onclick="switchFile('\${escapeAttr(file.path)}')">
            <span>\${displayNameMap.get(file.path) || file.name}</span>
            <span class="close" onclick="event.stopPropagation();closeFile('\${escapeAttr(file.path)}')">×</span>
          </div>
        \`).join('');
    }

    function renderContent() {
      const container = document.getElementById('content');
      const file = state.currentFile ? state.files.get(state.currentFile) : null;

      if (!file) {
        updateFileMeta(null);
        container.innerHTML = \`
          <div class="empty-state">
            <h2>欢迎使用 MD Viewer</h2>
            <p>在左侧添加 Markdown 文件开始阅读</p>
          </div>
        \`;
        return;
      }

      try {
        const html = marked.parse(file.content || '');
        container.innerHTML = \`
          <div class="markdown-wrapper">
            <div class="markdown-body">\${html}</div>
          </div>
        \`;
      } catch (e) {
        container.innerHTML = \`
          <div class="empty-state">
            <h2>渲染错误</h2>
            <p>\${e.message}</p>
          </div>
        \`;
      }

      updateFileMeta(file.lastModified);
    }

    function formatRelativeTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      const date = new Date(timestamp);

      // 时间单位（毫秒）
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      const week = 7 * day;

      // 计算相对时间文本
      let relativeText;
      if (diff < minute) {
        relativeText = '刚刚';
      } else if (diff < hour) {
        relativeText = Math.floor(diff / minute) + '分钟前';
      } else if (diff < day) {
        relativeText = Math.floor(diff / hour) + '小时前';
      } else if (diff < week) {
        relativeText = Math.floor(diff / day) + '天前';
      } else if (diff < 4 * week) {
        relativeText = Math.floor(diff / week) + '周前';
      } else {
        relativeText = Math.floor(diff / (30 * day)) + '个月前';
      }

      // 格式化日期时间
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeStr = hours + ':' + minutes;

      // 判断是否是今天/昨天/本周
      const nowDate = new Date(now);
      const isSameDay = date.toDateString() === nowDate.toDateString();

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      if (isSameDay) {
        return '今天 ' + timeStr + '（' + relativeText + '）';
      } else if (isYesterday) {
        return '昨天 ' + timeStr + '（' + relativeText + '）';
      } else if (diff < week) {
        return weekDays[date.getDay()] + ' ' + timeStr + '（' + relativeText + '）';
      } else {
        // 更早的显示月-日
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return month + '-' + day + ' ' + timeStr + '（' + relativeText + '）';
      }
    }

    function updateFileMeta(lastModified) {
      const el = document.getElementById('fileMeta');
      if (!el) return;
      if (!lastModified) {
        el.textContent = '最后修改: -';
        return;
      }
      el.textContent = '最后修改: ' + formatRelativeTime(lastModified);
    }

    // ==================== 用户操作 ====================
    async function addFile() {
      const input = document.getElementById('fileInput');
      const path = input.value.trim();
      if (!path) return;

      input.value = '';

      // 加载文件
      const data = await loadFile(path);
      if (data) {
        onFileLoaded(data);
      }
    }

    function switchFile(path) {
      state.currentFile = path;
      const file = state.files.get(path);
      if (file) {
        file.active = true;
      }
      saveState();
      renderFiles();
      renderTabs();
      renderContent();
    }

    function closeFile(path) {
      // 右侧标签页关闭：设为 inactive，不从列表删除
      const file = state.files.get(path);
      if (!file) return;

      file.active = false;

      // 如果关闭的是当前文件，切换到其他文件
      if (state.currentFile === path) {
        const activeFiles = Array.from(state.files.values()).filter(f => f.active);
        state.currentFile = activeFiles.length > 0 ? activeFiles[0].path : null;
      }

      saveState();
      renderFiles();
      renderTabs();
      renderContent();
    }

    function removeFile(path) {
      // 左侧文件列表关闭：直接删除文件
      const file = state.files.get(path);
      if (!file) return;

      // 如果删除的是当前文件，先切换
      if (state.currentFile === path) {
        // 找其他 active 文件，或者找其他任意文件
        const otherActive = Array.from(state.files.values())
          .filter(f => f.active && f.path !== path);
        if (otherActive.length > 0) {
          state.currentFile = otherActive[0].path;
        } else {
          // 没有 active 文件了，找任意其他文件
          const otherFiles = Array.from(state.files.values())
            .filter(f => f.path !== path);
          state.currentFile = otherFiles.length > 0 ? otherFiles[0].path : null;
        }
      }

      // 彻底删除
      state.files.delete(path);

      saveState();
      renderFiles();
      renderTabs();
      renderContent();
    }

    // ==================== 拖拽支持 ====================
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', async e => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files) {
        for (const file of files) {
          if (file.name.endsWith('.md')) {
            const data = await loadFile(file.path);
            if (data) {
              onFileLoaded(data);
            }
          }
        }
      }
    });

    // ==================== URL 参数处理 ====================
    async function handleUrlParams() {
      const params = new URLSearchParams(window.location.search);
      const openPath = params.get('open');
      
      if (openPath) {
        // 从 URL 加载指定文件，默认切换
        const data = await loadFile(openPath);
        if (data) {
          onFileLoaded(data, true);
        }
        // 清除 URL 参数，避免刷新时重复加载
        window.history.replaceState({}, '', '/');
      }
    }

    // ==================== SSE 连接 ====================
    function connectSSE() {
      const evtSource = new EventSource('/api/events');
      
      evtSource.onmessage = (e) => {
        try {
          const { type, data, focus } = JSON.parse(e.data);
          if (type === 'file-opened') {
            onFileLoaded(data, focus);
          }
        } catch (err) {
          console.error('SSE 消息解析错误:', err);
        }
      };
      
      evtSource.onerror = () => {
        console.log('SSE 连接断开，5秒后重连...');
        evtSource.close();
        setTimeout(connectSSE, 5000);
      };
    }

    // ==================== 初始化 ====================
    (async function init() {
      await restoreState();
      await handleUrlParams();
      // 页面刷新时，自动刷新当前正在展示的文件
      await refreshCurrentFile();
      connectSSE();
    })();
`;
