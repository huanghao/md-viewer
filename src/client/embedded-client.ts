// 自动生成的文件，不要手动编辑
// 由 scripts/embed-client.ts 生成

export const EMBEDDED_CLIENT_JS = `"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/client/config.ts
  function loadConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (!saved) return { ...defaultConfig };
      const config = JSON.parse(saved);
      return {
        ...defaultConfig,
        ...config
      };
    } catch (e) {
      console.error("\\u52A0\\u8F7D\\u914D\\u7F6E\\u5931\\u8D25:", e);
      return { ...defaultConfig };
    }
  }
  function saveConfig(config) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error("\\u4FDD\\u5B58\\u914D\\u7F6E\\u5931\\u8D25:", e);
    }
  }
  var CONFIG_KEY, defaultConfig;
  var init_config = __esm({
    "src/client/config.ts"() {
      "use strict";
      CONFIG_KEY = "md-viewer:config";
      defaultConfig = {
        sidebarMode: "simple",
        // 默认使用简单模式
        workspaces: []
      };
    }
  });

  // src/client/workspace-state-persistence.ts
  function saveWorkspaceKnownFiles() {
    try {
      localStorage.setItem(
        WORKSPACE_KNOWN_KEY,
        JSON.stringify(
          Array.from(workspaceKnownFiles.entries()).map(([workspaceId, paths]) => [workspaceId, Array.from(paths)])
        )
      );
    } catch (e) {
      console.error("\\u4FDD\\u5B58\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:", e);
    }
  }
  function restoreWorkspaceKnownFilesFromStorage() {
    workspaceKnownFiles.clear();
    try {
      const savedKnown = localStorage.getItem(WORKSPACE_KNOWN_KEY);
      if (!savedKnown) return;
      const records = JSON.parse(savedKnown);
      if (!Array.isArray(records)) return;
      for (const item of records) {
        if (!Array.isArray(item) || item.length !== 2) continue;
        const workspaceId = item[0];
        const paths = item[1];
        if (typeof workspaceId !== "string" || !Array.isArray(paths)) continue;
        workspaceKnownFiles.set(
          workspaceId,
          new Set(paths.filter((path) => typeof path === "string" && path.length > 0))
        );
      }
    } catch (e) {
      console.error("\\u6062\\u590D\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:", e);
    }
  }
  function getKnownWorkspacePaths(workspaceId) {
    return workspaceKnownFiles.get(workspaceId);
  }
  function setKnownWorkspacePaths(workspaceId, paths) {
    workspaceKnownFiles.set(workspaceId, paths);
    saveWorkspaceKnownFiles();
  }
  function removeKnownWorkspacePaths(workspaceId) {
    const knownSet = workspaceKnownFiles.get(workspaceId);
    workspaceKnownFiles.delete(workspaceId);
    saveWorkspaceKnownFiles();
    return knownSet;
  }
  var WORKSPACE_KNOWN_KEY, workspaceKnownFiles;
  var init_workspace_state_persistence = __esm({
    "src/client/workspace-state-persistence.ts"() {
      "use strict";
      WORKSPACE_KNOWN_KEY = "md-viewer:workspaceKnownFiles";
      workspaceKnownFiles = /* @__PURE__ */ new Map();
    }
  });

  // src/client/workspace-state-missing.ts
  function markWorkspacePathMissing(path) {
    workspaceMissingPaths.add(path);
  }
  function clearWorkspacePathMissing(path) {
    workspaceMissingPaths.delete(path);
  }
  function isWorkspacePathMissing(path) {
    return workspaceMissingPaths.has(path);
  }
  function getWorkspaceMissingPaths(workspacePath) {
    const all = Array.from(workspaceMissingPaths.values());
    if (!workspacePath) return all;
    const prefix = \`\${workspacePath.replace(/\\/+\$/, "")}/\`;
    return all.filter((p) => p.startsWith(prefix));
  }
  var workspaceMissingPaths;
  var init_workspace_state_missing = __esm({
    "src/client/workspace-state-missing.ts"() {
      "use strict";
      workspaceMissingPaths = /* @__PURE__ */ new Set();
    }
  });

  // src/client/workspace-tree-expansion-persistence.ts
  function saveWorkspaceExpandedState() {
    try {
      const payload = Array.from(workspaceExpandedState.entries()).map(([workspaceId, pathMap]) => [
        workspaceId,
        Array.from(pathMap.entries())
      ]);
      localStorage.setItem(WORKSPACE_TREE_EXPANDED_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("\\u4FDD\\u5B58\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:", e);
    }
  }
  function restoreWorkspaceExpandedStateFromStorage() {
    workspaceExpandedState.clear();
    try {
      const raw = localStorage.getItem(WORKSPACE_TREE_EXPANDED_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      for (const item of parsed) {
        if (!Array.isArray(item) || item.length !== 2) continue;
        const workspaceId = item[0];
        const entries = item[1];
        if (typeof workspaceId !== "string" || !Array.isArray(entries)) continue;
        const pathMap = /* @__PURE__ */ new Map();
        for (const pair of entries) {
          if (!Array.isArray(pair) || pair.length !== 2) continue;
          const path = pair[0];
          const expanded = pair[1];
          if (typeof path !== "string" || typeof expanded !== "boolean") continue;
          pathMap.set(path, expanded);
        }
        if (pathMap.size > 0) {
          workspaceExpandedState.set(workspaceId, pathMap);
        }
      }
    } catch (e) {
      console.error("\\u6062\\u590D\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:", e);
    }
  }
  function getWorkspaceExpandedState(workspaceId) {
    return workspaceExpandedState.get(workspaceId);
  }
  function setWorkspaceExpandedState(workspaceId, pathMap) {
    if (pathMap.size === 0) {
      workspaceExpandedState.delete(workspaceId);
      saveWorkspaceExpandedState();
      return;
    }
    workspaceExpandedState.set(workspaceId, new Map(pathMap));
    saveWorkspaceExpandedState();
  }
  function removeWorkspaceExpandedState(workspaceId) {
    if (!workspaceExpandedState.has(workspaceId)) return;
    workspaceExpandedState.delete(workspaceId);
    saveWorkspaceExpandedState();
  }
  function collectExpandedStateFromTree(tree) {
    const out = /* @__PURE__ */ new Map();
    const walk = (node) => {
      if (node.type === "directory") {
        if (typeof node.isExpanded === "boolean") {
          out.set(node.path, node.isExpanded);
        }
        for (const child of node.children || []) {
          walk(child);
        }
      }
    };
    walk(tree);
    return out;
  }
  var WORKSPACE_TREE_EXPANDED_KEY, workspaceExpandedState;
  var init_workspace_tree_expansion_persistence = __esm({
    "src/client/workspace-tree-expansion-persistence.ts"() {
      "use strict";
      WORKSPACE_TREE_EXPANDED_KEY = "md-viewer:workspaceTreeExpandedState";
      workspaceExpandedState = /* @__PURE__ */ new Map();
    }
  });

  // src/client/workspace-state-diff.ts
  function hasListDiff(path) {
    return listDiffPaths.has(path);
  }
  function markListDiff(path) {
    listDiffPaths.add(path);
  }
  function clearListDiff(path) {
    if (!listDiffPaths.has(path)) return;
    listDiffPaths.delete(path);
  }
  function restoreWorkspaceAuxiliaryState() {
    listDiffPaths.clear();
    restoreWorkspaceKnownFilesFromStorage();
    restoreWorkspaceExpandedStateFromStorage();
  }
  function updateWorkspaceListDiff(workspaceId, scannedPaths) {
    const scannedSet = new Set(scannedPaths);
    const knownSet = getKnownWorkspacePaths(workspaceId);
    if (!knownSet) {
      setKnownWorkspacePaths(workspaceId, scannedSet);
      return;
    }
    for (const path of scannedSet) {
      if (!knownSet.has(path)) {
        listDiffPaths.add(path);
      }
      clearWorkspacePathMissing(path);
    }
    for (const oldPath of knownSet) {
      if (!scannedSet.has(oldPath)) {
        listDiffPaths.delete(oldPath);
        markWorkspacePathMissing(oldPath);
      }
    }
    setKnownWorkspacePaths(workspaceId, scannedSet);
  }
  function removeWorkspaceTracking(workspaceId) {
    const knownSet = removeKnownWorkspacePaths(workspaceId);
    if (!knownSet) return;
    for (const path of knownSet) {
      listDiffPaths.delete(path);
    }
  }
  var listDiffPaths;
  var init_workspace_state_diff = __esm({
    "src/client/workspace-state-diff.ts"() {
      "use strict";
      init_workspace_state_persistence();
      init_workspace_state_missing();
      init_workspace_tree_expansion_persistence();
      listDiffPaths = /* @__PURE__ */ new Set();
    }
  });

  // src/client/workspace-state.ts
  var init_workspace_state = __esm({
    "src/client/workspace-state.ts"() {
      "use strict";
      init_workspace_state_diff();
      init_workspace_state_missing();
    }
  });

  // src/client/state.ts
  var state_exports = {};
  __export(state_exports, {
    addOrUpdateFile: () => addOrUpdateFile,
    getFilteredFiles: () => getFilteredFiles,
    getSessionFile: () => getSessionFile,
    getSessionFiles: () => getSessionFiles,
    hasSessionFile: () => hasSessionFile,
    markFileMissing: () => markFileMissing,
    removeFile: () => removeFile,
    restoreState: () => restoreState,
    saveState: () => saveState,
    setSearchQuery: () => setSearchQuery,
    state: () => state,
    switchToFile: () => switchToFile
  });
  function getSessionFile(path) {
    return state.sessionFiles.get(path);
  }
  function hasSessionFile(path) {
    return state.sessionFiles.has(path);
  }
  function getSessionFiles() {
    return Array.from(state.sessionFiles.values());
  }
  function saveState() {
    try {
      const data = {
        files: Array.from(state.sessionFiles.entries()).map(([path, file]) => [path, {
          path: file.path,
          name: file.name,
          isRemote: file.isRemote || false,
          isMissing: file.isMissing || false,
          displayedModified: file.displayedModified,
          lastAccessed: Date.now()
          // 记录最后访问时间用于 LRU
        }]),
        currentFile: state.currentFile
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      if (e.name === "QuotaExceededError" || e.code === 22) {
        console.warn("localStorage \\u914D\\u989D\\u5DF2\\u6EE1\\uFF0C\\u6267\\u884C\\u6E05\\u7406...");
        cleanupOldFiles();
        try {
          const data = {
            files: Array.from(state.sessionFiles.entries()).map(([path, file]) => [path, {
              path: file.path,
              name: file.name,
              isRemote: file.isRemote || false,
              isMissing: file.isMissing || false,
              displayedModified: file.displayedModified,
              lastAccessed: Date.now()
            }]),
            currentFile: state.currentFile
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (retryError) {
          console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25\\uFF08\\u91CD\\u8BD5\\u540E\\uFF09:", retryError);
        }
      } else {
        console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25:", e);
      }
    }
  }
  function cleanupOldFiles() {
    if (state.sessionFiles.size <= MAX_FILES) return;
    const sortedFiles = Array.from(state.sessionFiles.entries()).sort((a, b) => (b[1].lastModified || 0) - (a[1].lastModified || 0));
    const filesToKeep = sortedFiles.slice(0, MAX_FILES);
    const filesToRemove = sortedFiles.slice(MAX_FILES);
    state.sessionFiles.clear();
    filesToKeep.forEach(([path, file]) => {
      state.sessionFiles.set(path, file);
    });
    console.log(\`\\u5DF2\\u6E05\\u7406 \${filesToRemove.length} \\u4E2A\\u65E7\\u6587\\u4EF6\`);
  }
  async function restoreState(loadFile2) {
    try {
      restoreWorkspaceAuxiliaryState();
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data.files || data.files.length === 0) return;
      const validFiles = [];
      for (const [path, fileInfo] of data.files) {
        const fileData = await loadFile2(path, true);
        if (fileData) {
          const savedDisplayedModified = fileInfo.displayedModified || fileData.lastModified;
          state.sessionFiles.set(path, {
            path: fileData.path,
            name: fileData.filename,
            content: fileData.content,
            lastModified: fileData.lastModified,
            displayedModified: savedDisplayedModified,
            isRemote: fileData.isRemote || false,
            isMissing: false
            // 恢复时文件存在，清除 isMissing
          });
          validFiles.push([path, fileInfo]);
        }
      }
      if (validFiles.length !== data.files.length) {
        const currentFile = state.sessionFiles.has(data.currentFile) ? data.currentFile : null;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          files: validFiles,
          currentFile
        }));
      }
      if (data.currentFile && state.sessionFiles.has(data.currentFile)) {
        state.currentFile = data.currentFile;
      } else {
        const firstFile = Array.from(state.sessionFiles.values())[0];
        state.currentFile = firstFile ? firstFile.path : null;
      }
    } catch (e) {
      console.error("\\u6062\\u590D\\u72B6\\u6001\\u5931\\u8D25:", e);
    }
  }
  function addOrUpdateFile(fileData, switchTo = false) {
    if (state.sessionFiles.size >= MAX_FILES && !state.sessionFiles.has(fileData.path)) {
      cleanupOldFiles();
    }
    const existing = state.sessionFiles.get(fileData.path);
    const isNewPath = !existing;
    state.sessionFiles.set(fileData.path, {
      path: fileData.path,
      name: fileData.filename,
      content: fileData.content,
      lastModified: fileData.lastModified,
      displayedModified: fileData.lastModified,
      // 初始化时两者相同
      isRemote: fileData.isRemote || false,
      isMissing: false
    });
    if (switchTo) {
      state.currentFile = fileData.path;
      clearListDiff(fileData.path);
    }
    clearWorkspacePathMissing(fileData.path);
    if (isNewPath) {
      if (!switchTo) {
        markListDiff(fileData.path);
      }
    }
    saveState();
  }
  function removeFile(path) {
    state.sessionFiles.delete(path);
    clearListDiff(path);
    clearWorkspacePathMissing(path);
    if (state.currentFile === path) {
      const remainingFiles = Array.from(state.sessionFiles.values());
      state.currentFile = remainingFiles.length > 0 ? remainingFiles[0].path : null;
    }
    saveState();
  }
  function switchToFile(path) {
    state.currentFile = path;
    clearListDiff(path);
    clearWorkspacePathMissing(path);
    saveState();
  }
  function markFileMissing(path, switchTo = false) {
    const existing = state.sessionFiles.get(path);
    const now = Date.now();
    const name = path.split("/").pop() || existing?.name || path;
    state.sessionFiles.set(path, {
      path,
      name,
      content: existing?.content || "# \\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\n\\n\\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u4E14\\u5F53\\u524D\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\u5185\\u5BB9\\u3002",
      lastModified: existing?.lastModified || now,
      displayedModified: existing?.displayedModified || now,
      isRemote: existing?.isRemote || false,
      isMissing: true
    });
    if (switchTo) {
      state.currentFile = path;
      clearListDiff(path);
    }
    markWorkspacePathMissing(path);
    saveState();
  }
  function setSearchQuery(query) {
    state.searchQuery = query;
  }
  function getFilteredFiles() {
    const query = state.searchQuery.toLowerCase().trim();
    if (!query) {
      return Array.from(state.sessionFiles.values());
    }
    return Array.from(state.sessionFiles.values()).filter((file) => {
      return file.name.toLowerCase().includes(query) || file.path.toLowerCase().includes(query);
    });
  }
  var state, STORAGE_KEY, MAX_FILES;
  var init_state = __esm({
    "src/client/state.ts"() {
      "use strict";
      init_config();
      init_workspace_state();
      state = {
        sessionFiles: /* @__PURE__ */ new Map(),
        currentFile: null,
        searchQuery: "",
        // 搜索关键词
        // 配置
        config: loadConfig(),
        // 工作区模式
        currentWorkspace: null,
        fileTree: /* @__PURE__ */ new Map()
      };
      STORAGE_KEY = "md-viewer:openFiles";
      MAX_FILES = 100;
    }
  });

  // src/client/workspace-tree-expansion.ts
  function mergeDirectoryExpandedState(previousTree, nextTree) {
    const expandedStateByPath = collectDirectoryExpandedState(previousTree);
    if (expandedStateByPath.size === 0) return;
    applyDirectoryExpandedState(nextTree, expandedStateByPath);
  }
  function collectDirectoryExpandedState(node, out = /* @__PURE__ */ new Map()) {
    if (node.type !== "directory") return out;
    if (typeof node.isExpanded === "boolean") {
      out.set(node.path, node.isExpanded);
    }
    for (const child of node.children || []) {
      collectDirectoryExpandedState(child, out);
    }
    return out;
  }
  function applyDirectoryExpandedState(node, stateByPath) {
    if (node.type === "directory") {
      const saved = stateByPath.get(node.path);
      if (typeof saved === "boolean") {
        node.isExpanded = saved;
      }
    }
    for (const child of node.children || []) {
      applyDirectoryExpandedState(child, stateByPath);
    }
  }
  var init_workspace_tree_expansion = __esm({
    "src/client/workspace-tree-expansion.ts"() {
      "use strict";
    }
  });

  // src/client/workspace.ts
  var workspace_exports = {};
  __export(workspace_exports, {
    addWorkspace: () => addWorkspace,
    getCurrentWorkspace: () => getCurrentWorkspace,
    hydrateExpandedWorkspaces: () => hydrateExpandedWorkspaces,
    inferWorkspaceFromPath: () => inferWorkspaceFromPath,
    moveWorkspaceByOffset: () => moveWorkspaceByOffset,
    removeWorkspace: () => removeWorkspace,
    revealFileInWorkspace: () => revealFileInWorkspace,
    scanWorkspace: () => scanWorkspace,
    switchWorkspace: () => switchWorkspace,
    toggleNodeExpanded: () => toggleNodeExpanded,
    toggleWorkspaceExpanded: () => toggleWorkspaceExpanded
  });
  function generateId() {
    return \`ws-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }
  function normalizeWorkspacePath(path) {
    return path.trim().replace(/\\/+\$/, "");
  }
  function findBestWorkspaceForFile(filePath) {
    const normalizedFilePath = normalizeWorkspacePath(filePath);
    let best = null;
    for (const ws of state.config.workspaces) {
      const root = normalizeWorkspacePath(ws.path);
      if (!(normalizedFilePath === root || normalizedFilePath.startsWith(\`\${root}/\`))) continue;
      if (!best || root.length > normalizeWorkspacePath(best.path).length) {
        best = ws;
      }
    }
    return best;
  }
  function expandDirectoryChain(workspaceId, workspacePath, filePath) {
    const tree = state.fileTree.get(workspaceId);
    if (!tree) return;
    const root = normalizeWorkspacePath(workspacePath);
    const target = normalizeWorkspacePath(filePath);
    if (!(target === root || target.startsWith(\`\${root}/\`))) return;
    const relative = target === root ? "" : target.slice(root.length + 1);
    const parts = relative.split("/").filter(Boolean);
    if (parts.length <= 1) return;
    let changed = false;
    let current = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      current = \`\${current}/\${parts[i]}\`;
      const node = findNodeByPath(tree, current);
      if (node && node.type === "directory" && node.isExpanded === false) {
        node.isExpanded = true;
        changed = true;
      }
    }
    if (changed) {
      setWorkspaceExpandedState(workspaceId, collectExpandedStateFromTree(tree));
    }
  }
  function addWorkspace(name, path) {
    const normalizedPath = normalizeWorkspacePath(path);
    const existing = state.config.workspaces.find((ws) => ws.path === normalizedPath);
    if (existing) {
      state.currentWorkspace = existing.id;
      return existing;
    }
    const workspace = {
      id: generateId(),
      name,
      path: normalizedPath,
      isExpanded: false
    };
    state.config.workspaces.push(workspace);
    saveConfig(state.config);
    state.currentWorkspace = workspace.id;
    return workspace;
  }
  function removeWorkspace(id) {
    const index = state.config.workspaces.findIndex((ws) => ws.id === id);
    if (index === -1) return;
    state.config.workspaces.splice(index, 1);
    saveConfig(state.config);
    state.fileTree.delete(id);
    removeWorkspaceTracking(id);
    removeWorkspaceExpandedState(id);
    if (state.currentWorkspace === id) {
      state.currentWorkspace = state.config.workspaces.length > 0 ? state.config.workspaces[0].id : null;
    }
  }
  function switchWorkspace(id) {
    const workspace = state.config.workspaces.find((ws) => ws.id === id);
    if (!workspace) return;
    state.currentWorkspace = id;
  }
  function moveWorkspaceByOffset(workspaceId, offset) {
    const list = state.config.workspaces;
    const from = list.findIndex((ws) => ws.id === workspaceId);
    if (from === -1) return;
    const to = from + offset;
    if (to < 0 || to >= list.length) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    saveConfig(state.config);
  }
  function toggleWorkspaceExpanded(id) {
    const workspace = state.config.workspaces.find((ws) => ws.id === id);
    if (!workspace) return;
    workspace.isExpanded = !workspace.isExpanded;
    saveConfig(state.config);
  }
  function getCurrentWorkspace() {
    if (!state.currentWorkspace) return null;
    return state.config.workspaces.find((ws) => ws.id === state.currentWorkspace) || null;
  }
  async function inferWorkspaceFromPath(filePath) {
    try {
      const response = await fetch("/api/infer-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath })
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.workspacePath) return null;
      const existing = state.config.workspaces.find((ws) => ws.path === data.workspacePath);
      if (existing) return existing;
      const name = data.workspaceName || data.workspacePath.split("/").pop() || "workspace";
      return addWorkspace(name, data.workspacePath);
    } catch (e) {
      console.error("\\u63A8\\u65AD\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:", e);
      return null;
    }
  }
  async function scanWorkspace(workspaceId) {
    const workspace = state.config.workspaces.find((ws) => ws.id === workspaceId);
    if (!workspace) return null;
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15e3);
      const response = await fetch("/api/scan-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: workspace.path }),
        signal: controller.signal
      });
      window.clearTimeout(timeoutId);
      if (!response.ok) {
        console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:", await response.text());
        return null;
      }
      const tree = await response.json();
      const previousTree = state.fileTree.get(workspaceId);
      if (previousTree) {
        mergeDirectoryExpandedState(previousTree, tree);
      }
      const persistedExpandedState = getWorkspaceExpandedState(workspaceId);
      if (persistedExpandedState && persistedExpandedState.size > 0) {
        applyDirectoryExpandedState(tree, persistedExpandedState);
      }
      state.fileTree.set(workspaceId, tree);
      setWorkspaceExpandedState(workspaceId, collectExpandedStateFromTree(tree));
      updateWorkspaceListDiff(workspaceId, collectFilePaths(tree));
      return tree;
    } catch (e) {
      console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:", e);
      return null;
    }
  }
  function collectFilePaths(node) {
    if (!node) return [];
    if (node.type === "file") return [node.path];
    const paths = [];
    for (const child of node.children || []) {
      paths.push(...collectFilePaths(child));
    }
    return paths;
  }
  async function hydrateExpandedWorkspaces() {
    const expanded = state.config.workspaces.filter((ws) => ws.isExpanded);
    for (const ws of expanded) {
      await scanWorkspace(ws.id);
    }
    if (!state.currentWorkspace && state.config.workspaces.length > 0) {
      state.currentWorkspace = state.config.workspaces[0].id;
    }
  }
  async function revealFileInWorkspace(filePath) {
    const workspace = findBestWorkspaceForFile(filePath);
    if (!workspace) return;
    state.currentWorkspace = workspace.id;
    if (!workspace.isExpanded) {
      workspace.isExpanded = true;
      saveConfig(state.config);
    }
    if (!state.fileTree.has(workspace.id)) {
      await scanWorkspace(workspace.id);
    }
    expandDirectoryChain(workspace.id, workspace.path, filePath);
  }
  function toggleNodeExpanded(workspaceId, nodePath) {
    const tree = state.fileTree.get(workspaceId);
    if (!tree) return;
    const node = findNodeByPath(tree, nodePath);
    if (node && node.type === "directory") {
      const currentlyExpanded = node.isExpanded !== false;
      node.isExpanded = !currentlyExpanded;
      setWorkspaceExpandedState(workspaceId, collectExpandedStateFromTree(tree));
    }
  }
  function findNodeByPath(node, path) {
    if (node.path === path) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeByPath(child, path);
        if (found) return found;
      }
    }
    return null;
  }
  var init_workspace = __esm({
    "src/client/workspace.ts"() {
      "use strict";
      init_state();
      init_workspace_state();
      init_config();
      init_workspace_tree_expansion();
      init_workspace_tree_expansion_persistence();
    }
  });

  // src/client/ui/toast.ts
  function initToastContainer() {
    if (toastContainer) return;
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }
  function showToast(options) {
    const config = typeof options === "string" ? { message: options, type: "info", duration: 3e3 } : { type: "info", duration: 3e3, ...options };
    initToastContainer();
    const toast = document.createElement("div");
    toast.className = \`toast toast-\${config.type}\`;
    const icons = {
      success: "\\u2713",
      error: "\\u2717",
      warning: "\\u26A0",
      info: "\\u2139"
    };
    toast.innerHTML = \`
    <span class="toast-icon">\${icons[config.type]}</span>
    <span class="toast-message">\${config.message}</span>
  \`;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add("toast-show");
    });
    if (config.duration && config.duration > 0) {
      setTimeout(() => {
        hideToast(toast);
      }, config.duration);
    }
    toast.addEventListener("click", () => {
      hideToast(toast);
    });
    return toast;
  }
  function hideToast(toast) {
    toast.classList.remove("toast-show");
    toast.classList.add("toast-hide");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
  function showSuccess(message, duration) {
    return showToast({ message, type: "success", duration });
  }
  function showError(message, duration) {
    return showToast({ message, type: "error", duration });
  }
  function showWarning(message, duration) {
    return showToast({ message, type: "warning", duration });
  }
  function showInfo(message, duration) {
    return showToast({ message, type: "info", duration });
  }
  var toastContainer;
  var init_toast = __esm({
    "src/client/ui/toast.ts"() {
      "use strict";
      toastContainer = null;
    }
  });

  // src/client/api/files.ts
  var files_exports = {};
  __export(files_exports, {
    detectPathType: () => detectPathType,
    getNearbyFiles: () => getNearbyFiles,
    getPathSuggestions: () => getPathSuggestions,
    loadFile: () => loadFile,
    openFile: () => openFile,
    searchFiles: () => searchFiles
  });
  async function loadFile(path, silent = false) {
    try {
      const response = await fetch(\`/api/file?path=\${encodeURIComponent(path)}\`);
      const data = await response.json();
      if (data.error) {
        if (!silent) showError(data.error);
        return null;
      }
      return data;
    } catch (e) {
      if (!silent) showError(\`\\u52A0\\u8F7D\\u5931\\u8D25: \${e.message}\`);
      return null;
    }
  }
  async function searchFiles(query, options = {}) {
    const params = new URLSearchParams({ query });
    if (options.limit && Number.isFinite(options.limit)) {
      params.set("limit", String(options.limit));
    }
    for (const root of options.roots || []) {
      if (root.trim()) params.append("root", root.trim());
    }
    const response = await fetch(\`/api/files?\${params.toString()}\`);
    return response.json();
  }
  async function getNearbyFiles(path) {
    const response = await fetch(\`/api/nearby?path=\${encodeURIComponent(path)}\`);
    return response.json();
  }
  async function getPathSuggestions(input, options = {}) {
    const kind = options.kind || "file";
    const markdownOnly = options.markdownOnly !== false;
    const params = new URLSearchParams({
      input,
      kind,
      markdownOnly: markdownOnly ? "true" : "false"
    });
    const response = await fetch(\`/api/path-suggestions?\${params.toString()}\`);
    return response.json();
  }
  async function detectPathType(path) {
    const response = await fetch("/api/detect-path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path })
    });
    return response.json();
  }
  async function openFile(path, focus = true) {
    await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, focus })
    });
  }
  var init_files = __esm({
    "src/client/api/files.ts"() {
      "use strict";
      init_toast();
    }
  });

  // src/client/api/sync.ts
  async function getSyncStatus(path) {
    const response = await fetch(\`/api/sync/status?path=\${encodeURIComponent(path)}\`);
    const data = await response.json();
    return {
      ...data,
      path,
      docId: data?.docId || data?.kmDocId,
      url: data?.url || data?.kmUrl,
      title: data?.title || data?.kmTitle,
      baseTitle: data?.baseTitle,
      version: typeof data?.version === "number" ? data.version : void 0,
      history: Array.isArray(data?.history) ? data.history : []
    };
  }
  async function getRecentParents() {
    const response = await fetch("/api/sync/recent-parents");
    return response.json();
  }
  async function getSyncParentMeta(value) {
    const response = await fetch(\`/api/sync/parent-meta?value=\${encodeURIComponent(value)}\`);
    return response.json();
  }
  async function executeSync(path, title, parentId) {
    const response = await fetch("/api/sync/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filePath: path,
        title,
        parentId
      })
    });
    const data = await response.json();
    return {
      ...data,
      docId: data?.docId || data?.kmDocId,
      url: data?.url || data?.kmUrl,
      title: data?.title || data?.kmTitle
    };
  }
  async function getSyncPreferences() {
    const response = await fetch("/api/sync/preferences");
    return response.json();
  }
  async function saveSyncPreference(key, value) {
    await fetch("/api/sync/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value })
    });
  }
  var init_sync = __esm({
    "src/client/api/sync.ts"() {
      "use strict";
    }
  });

  // src/client/utils/escape.ts
  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(str) {
    return escapeHtml(str);
  }
  function escapeJsSingleQuoted(str) {
    if (!str) return "";
    return String(str).replace(/\\\\/g, "\\\\").replace(/'/g, "\\\\'").replace(/\\r/g, "\\\\r").replace(/\\n/g, "\\\\n").replace(/</g, "\\\\x3C");
  }
  var init_escape = __esm({
    "src/client/utils/escape.ts"() {
      "use strict";
    }
  });

  // src/client/utils/format.ts
  function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1e3);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return \`\${days}\\u5929\\u524D\`;
    if (hours > 0) return \`\${hours}\\u5C0F\\u65F6\\u524D\`;
    if (minutes > 0) return \`\${minutes}\\u5206\\u949F\\u524D\`;
    return "\\u521A\\u521A";
  }
  function formatFileTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return \`\${year}-\${month}-\${day} \${hours}:\${minutes}\`;
  }
  var init_format = __esm({
    "src/client/utils/format.ts"() {
      "use strict";
    }
  });

  // src/client/utils/file-names.ts
  function generateDistinctNames(files) {
    const fileArray = Array.from(files.values());
    const nameCounts = {};
    fileArray.forEach((file) => {
      nameCounts[file.name] = (nameCounts[file.name] || 0) + 1;
    });
    return fileArray.map((file) => {
      if (nameCounts[file.name] === 1) {
        return { ...file, displayName: file.name };
      }
      const pathParts = file.path.split("/").filter(Boolean);
      const sameNameFiles = fileArray.filter((f) => f.name === file.name && f.path !== file.path);
      let distinctPart = "";
      for (let i = pathParts.length - 2; i >= 0; i--) {
        const part = pathParts[i];
        if (sameNameFiles.every((f) => f.path.split("/").filter(Boolean)[i] !== part)) {
          distinctPart = part;
          break;
        }
      }
      if (!distinctPart && pathParts.length >= 2) {
        distinctPart = pathParts[pathParts.length - 2];
      }
      return {
        ...file,
        displayName: distinctPart ? \`\${file.name} (\${distinctPart})\` : file.name
      };
    });
  }
  var init_file_names = __esm({
    "src/client/utils/file-names.ts"() {
      "use strict";
    }
  });

  // src/client/utils/file-status.ts
  function getFileListStatus(file, isListDiff = false) {
    if (file.isMissing) {
      return {
        badge: "D",
        color: "#ff3b30",
        // 红色
        type: "deleted"
      };
    }
    const isDirty = file.lastModified > file.displayedModified;
    if (isDirty) {
      return {
        badge: "M",
        color: "#ff9500",
        // 橙色
        type: "modified"
      };
    }
    if (isListDiff) {
      return {
        badge: "dot",
        color: "#007AFF",
        // 蓝色
        type: "new"
      };
    }
    return {
      badge: null,
      color: null,
      type: "normal"
    };
  }
  var init_file_status = __esm({
    "src/client/utils/file-status.ts"() {
      "use strict";
    }
  });

  // src/client/utils/file-type.ts
  function getFileExtension(path) {
    const match = path.match(/\\.([^.]+)\$/);
    return match ? match[1].toLowerCase() : "";
  }
  function isHtmlFile(path) {
    const ext = getFileExtension(path);
    return ext === "html" || ext === "htm";
  }
  function getFileTypeIcon(path) {
    if (isHtmlFile(path)) {
      return { cls: "html", label: "<>" };
    }
    return { cls: "md", label: "M" };
  }
  var init_file_type = __esm({
    "src/client/utils/file-type.ts"() {
      "use strict";
    }
  });

  // src/client/utils/tab-batch.ts
  function getTabBatchTargets(action, files, currentPath, isClosableUnmodified) {
    if (files.length === 0) return [];
    if (action === "close-all") {
      return files.map((f) => f.path);
    }
    if (!currentPath) return [];
    if (action === "close-others") {
      return files.filter((f) => f.path !== currentPath).map((f) => f.path);
    }
    if (action === "close-right") {
      const currentIndex = files.findIndex((f) => f.path === currentPath);
      if (currentIndex < 0) return [];
      return files.slice(currentIndex + 1).map((f) => f.path);
    }
    return files.filter((f) => f.path !== currentPath && isClosableUnmodified(f.path)).map((f) => f.path);
  }
  var init_tab_batch = __esm({
    "src/client/utils/tab-batch.ts"() {
      "use strict";
    }
  });

  // src/client/utils/workspace-file-name.ts
  function stripWorkspaceTreeDisplayExtension(name) {
    if (!name) return name;
    const stripped = name.replace(/\\.(md|markdown|html?)\$/i, "");
    return stripped || name;
  }
  var init_workspace_file_name = __esm({
    "src/client/utils/workspace-file-name.ts"() {
      "use strict";
    }
  });

  // src/client/ui/path-autocomplete.ts
  function attachPathAutocomplete(input, options) {
    let suggestions = [];
    let activeIndex = -1;
    let requestId = 0;
    let debounceTimer = null;
    const panel = document.createElement("div");
    panel.className = "path-autocomplete-panel";
    panel.style.display = "none";
    document.body.appendChild(panel);
    const isVisible = () => panel.style.display !== "none";
    const hide = () => {
      requestId += 1;
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      panel.style.display = "none";
      suggestions = [];
      activeIndex = -1;
    };
    const syncPosition = () => {
      const rect = input.getBoundingClientRect();
      panel.style.left = \`\${Math.round(rect.left + window.scrollX)}px\`;
      panel.style.top = \`\${Math.round(rect.bottom + window.scrollY + 4)}px\`;
      panel.style.width = \`\${Math.round(rect.width)}px\`;
    };
    const render = () => {
      if (suggestions.length === 0) {
        hide();
        return;
      }
      panel.innerHTML = suggestions.map((item, index) => {
        const cls = index === activeIndex ? "path-autocomplete-item active" : "path-autocomplete-item";
        const icon = item.type === "directory" ? "\\u{1F4C1}" : "\\u{1F4C4}";
        return \`
          <div class="\${cls}" data-index="\${index}">
            <span class="path-autocomplete-icon">\${icon}</span>
            <span class="path-autocomplete-text">\${escapeHtml2(item.display)}</span>
          </div>
        \`;
      }).join("");
      syncPosition();
      panel.style.display = "block";
    };
    const choose = (index) => {
      const selected = suggestions[index];
      if (!selected) return;
      const isDirectory = selected.type === "directory";
      const nextValue = isDirectory && !selected.path.endsWith("/") ? \`\${selected.path}/\` : selected.path;
      input.value = nextValue;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      hide();
      if (isDirectory) {
        scheduleRefresh();
      }
    };
    const refresh = async () => {
      const query = input.value.trim();
      if (!query) {
        hide();
        return;
      }
      if (document.body.classList.contains("quick-action-confirm-visible")) {
        hide();
        return;
      }
      if (options.shouldActivate && !options.shouldActivate(query)) {
        hide();
        return;
      }
      const currentReq = ++requestId;
      try {
        const data = await getPathSuggestions(query, {
          kind: options.kind,
          markdownOnly: options.markdownOnly
        });
        if (currentReq !== requestId) return;
        suggestions = data.suggestions || [];
        activeIndex = suggestions.length > 0 ? 0 : -1;
        render();
      } catch {
        hide();
      }
    };
    const scheduleRefresh = () => {
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(refresh, 100);
    };
    panel.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const target = e.target.closest(".path-autocomplete-item");
      if (!target) return;
      const index = Number(target.dataset.index);
      if (Number.isNaN(index)) return;
      choose(index);
    });
    input.addEventListener("focus", scheduleRefresh);
    input.addEventListener("input", scheduleRefresh);
    input.addEventListener("path-autocomplete-hide", hide);
    input.addEventListener("keydown", (e) => {
      const key = e.key;
      if (!isVisible()) return;
      if (key === "ArrowDown") {
        e.preventDefault();
        if (suggestions.length > 0) {
          activeIndex = (activeIndex + 1) % suggestions.length;
          render();
        }
        return;
      }
      if (key === "ArrowUp") {
        e.preventDefault();
        if (suggestions.length > 0) {
          activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
          render();
        }
        return;
      }
      if (key === "Tab") {
        if (activeIndex >= 0) {
          e.preventDefault();
          choose(activeIndex);
        }
        return;
      }
      if (key === "Enter") {
        if (e.metaKey || e.ctrlKey) {
          return;
        }
        e.preventDefault();
        if (activeIndex >= 0) {
          choose(activeIndex);
          return;
        }
        hide();
        return;
      }
      if (key === "Escape") {
        e.preventDefault();
        hide();
      }
    });
    input.addEventListener("blur", () => {
      window.setTimeout(hide, 120);
    });
    window.addEventListener("resize", () => {
      if (isVisible()) syncPosition();
    });
    window.addEventListener("scroll", () => {
      if (isVisible()) syncPosition();
    }, true);
  }
  function escapeHtml2(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var init_path_autocomplete = __esm({
    "src/client/ui/path-autocomplete.ts"() {
      "use strict";
      init_files();
    }
  });

  // src/client/ui/sidebar-workspace.ts
  function getWorkspaceNameFromPath(path) {
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "workspace";
  }
  function renderFileNameWithTailPriority(name) {
    const stripped = stripWorkspaceTreeDisplayExtension(name) || name;
    return \`<span class="tree-name-full">\${escapeHtml(stripped)}</span>\`;
  }
  function collectTreeFilePaths(node, bag) {
    if (!node) return;
    if (node.type === "file") {
      bag.add(node.path);
      return;
    }
    (node.children || []).forEach((child) => collectTreeFilePaths(child, bag));
  }
  function annotateDirectoryFileCount(node) {
    if (node.type === "file") return 1;
    let count = 0;
    for (const child of node.children || []) {
      count += annotateDirectoryFileCount(child);
    }
    node.fileCount = count;
    return count;
  }
  function buildTreeFromPaths(workspace, filePaths) {
    const workspacePath = workspace.path.replace(/\\/+\$/, "");
    const root = {
      name: workspace.name,
      path: workspacePath,
      type: "directory",
      isExpanded: true,
      children: []
    };
    const directoryMap = /* @__PURE__ */ new Map([[workspacePath, root]]);
    const sortedPaths = Array.from(new Set(filePaths)).sort((a, b) => a.localeCompare(b, "zh-CN"));
    for (const fullPath of sortedPaths) {
      if (!fullPath.startsWith(\`\${workspacePath}/\`)) continue;
      const relative = fullPath.slice(workspacePath.length + 1);
      const parts = relative.split("/").filter(Boolean);
      if (parts.length === 0) continue;
      let currentPath = workspacePath;
      let currentNode = root;
      for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        currentPath = \`\${currentPath}/\${part}\`;
        if (isFile) {
          const exists = (currentNode.children || []).some((child) => child.path === currentPath);
          if (!exists) {
            currentNode.children.push({
              name: part,
              path: currentPath,
              type: "file"
            });
          }
        } else {
          let dirNode = directoryMap.get(currentPath);
          if (!dirNode) {
            dirNode = {
              name: part,
              path: currentPath,
              type: "directory",
              isExpanded: true,
              children: []
            };
            directoryMap.set(currentPath, dirNode);
            currentNode.children.push(dirNode);
          }
          currentNode = dirNode;
        }
      }
    }
    annotateDirectoryFileCount(root);
    return root;
  }
  function buildSearchTree(workspace, query) {
    if (!query) return state.fileTree.get(workspace.id);
    const workspaceRoot = workspace.path.replace(/\\/+\$/, "");
    const workspacePrefix = \`\${workspaceRoot}/\`;
    const matched = Array.from(workspaceSearchPaths).filter((path) => path === workspaceRoot || path.startsWith(workspacePrefix));
    if (matched.length === 0) return void 0;
    return buildTreeFromPaths(workspace, matched);
  }
  function getWorkspaceSearchRoots() {
    return state.config.workspaces.map((workspace) => workspace.path.trim()).filter(Boolean);
  }
  function resetWorkspaceSearchState() {
    workspaceSearchQuery = "";
    workspaceSearchRootsKey = "";
    workspaceSearchLoading = false;
    workspaceSearchLoaded = false;
    workspaceSearchPaths = /* @__PURE__ */ new Set();
  }
  async function runWorkspaceSearch(query, roots, rootsKey, seq) {
    try {
      const data = await searchFiles(query, { roots, limit: 200 });
      if (seq !== workspaceSearchSeq) return;
      workspaceSearchQuery = query;
      workspaceSearchRootsKey = rootsKey;
      workspaceSearchPaths = new Set((data.files || []).map((file) => file.path).filter(Boolean));
      workspaceSearchLoading = false;
      workspaceSearchLoaded = true;
    } catch (error) {
      if (seq !== workspaceSearchSeq) return;
      console.error("\\u5DE5\\u4F5C\\u533A\\u641C\\u7D22\\u5931\\u8D25:", error);
      workspaceSearchQuery = query;
      workspaceSearchRootsKey = rootsKey;
      workspaceSearchPaths = /* @__PURE__ */ new Set();
      workspaceSearchLoading = false;
      workspaceSearchLoaded = true;
    }
    const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
    renderSidebar2();
  }
  function ensureWorkspaceSearchResults(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      resetWorkspaceSearchState();
      return;
    }
    const roots = getWorkspaceSearchRoots();
    const rootsKey = roots.join("\\n");
    if (roots.length === 0) {
      workspaceSearchQuery = trimmed;
      workspaceSearchRootsKey = rootsKey;
      workspaceSearchPaths = /* @__PURE__ */ new Set();
      workspaceSearchLoading = false;
      workspaceSearchLoaded = true;
      return;
    }
    if (workspaceSearchLoaded && !workspaceSearchLoading && workspaceSearchQuery === trimmed && workspaceSearchRootsKey === rootsKey) {
      return;
    }
    if (workspaceSearchLoading && workspaceSearchQuery === trimmed && workspaceSearchRootsKey === rootsKey) {
      return;
    }
    workspaceSearchSeq += 1;
    workspaceSearchQuery = trimmed;
    workspaceSearchRootsKey = rootsKey;
    workspaceSearchLoading = true;
    workspaceSearchLoaded = false;
    workspaceSearchPaths = /* @__PURE__ */ new Set();
    void runWorkspaceSearch(trimmed, roots, rootsKey, workspaceSearchSeq);
  }
  function updateWorkspacePathPreview() {
    const input = document.getElementById(ADD_WORKSPACE_INPUT_ID);
    const preview = document.getElementById(ADD_WORKSPACE_PREVIEW_ID);
    if (!preview) return;
    const value = input?.value.trim() || "";
    preview.textContent = value || "\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84";
  }
  function createAddWorkspaceDialog() {
    const existing = document.getElementById(ADD_WORKSPACE_DIALOG_ID);
    if (existing) return existing;
    const overlay = document.createElement("div");
    overlay.id = ADD_WORKSPACE_DIALOG_ID;
    overlay.className = "sync-dialog-overlay add-workspace-overlay";
    overlay.innerHTML = \`
    <div class="sync-dialog add-workspace-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A</div>
        <button class="sync-dialog-close" onclick="closeAddWorkspaceDialog()">\\xD7</button>
      </div>
      <div class="sync-dialog-body">
        <div class="sync-dialog-field">
          <label class="sync-dialog-label">\\u{1F4C1} \\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84</label>
          <textarea
            id="\${ADD_WORKSPACE_INPUT_ID}"
            class="sync-dialog-input workspace-path-input"
            rows="3"
            placeholder="/Users/huanghao/workspace/md-viewer"
          ></textarea>
          <div class="workspace-path-hint">\\u652F\\u6301\\u7C98\\u8D34\\u957F\\u8DEF\\u5F84\\u3002\\u6309 Ctrl/Cmd + Enter \\u5FEB\\u901F\\u786E\\u8BA4\\u3002</div>
          <div id="\${ADD_WORKSPACE_PREVIEW_ID}" class="workspace-path-preview">\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84</div>
        </div>
      </div>
      <div class="sync-dialog-footer add-workspace-footer">
        <button class="sync-dialog-btn" onclick="closeAddWorkspaceDialog()">\\u53D6\\u6D88</button>
        <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="confirmAddWorkspaceDialog()">\\u6DFB\\u52A0</button>
      </div>
    </div>
  \`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAddWorkspaceDialog();
      }
    });
    const input = overlay.querySelector(\`#\${ADD_WORKSPACE_INPUT_ID}\`);
    if (input) {
      attachPathAutocomplete(input, { kind: "directory", markdownOnly: false });
      input.addEventListener("input", updateWorkspacePathPreview);
      input.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          window.confirmAddWorkspaceDialog();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeAddWorkspaceDialog();
        }
      });
    }
    return overlay;
  }
  function showAddWorkspaceDialog() {
    const overlay = createAddWorkspaceDialog();
    overlay.classList.add("show");
    const input = document.getElementById(ADD_WORKSPACE_INPUT_ID);
    if (input) {
      input.value = "";
      updateWorkspacePathPreview();
      input.focus();
    }
  }
  function closeAddWorkspaceDialog() {
    const overlay = document.getElementById(ADD_WORKSPACE_DIALOG_ID);
    if (overlay) {
      overlay.classList.remove("show");
    }
  }
  async function confirmAddWorkspaceDialog() {
    try {
      const input = document.getElementById(ADD_WORKSPACE_INPUT_ID);
      const path = input?.value.trim() || "";
      if (!path) {
        showWarning("\\u8BF7\\u8F93\\u5165\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84");
        input?.focus();
        return;
      }
      const name = getWorkspaceNameFromPath(path);
      const { addWorkspace: addWorkspace2 } = await Promise.resolve().then(() => (init_workspace(), workspace_exports));
      const workspace = addWorkspace2(name, path);
      const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
      renderSidebar2();
      closeAddWorkspaceDialog();
      showSuccess(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${workspace.name}\`, 2e3);
    } catch (error) {
      console.error("\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:", error);
      showError(\`\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25: \${error?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`);
    }
  }
  function renderWorkspaceSidebar() {
    const query = state.searchQuery.trim().toLowerCase();
    ensureWorkspaceSearchResults(query);
    return \`
    \${renderWorkspaceSection(query)}
  \`;
  }
  function renderWorkspaceSection(query) {
    const workspaces = state.config.workspaces;
    const workspaceItems = workspaces.map((ws, index) => renderWorkspaceItem(ws, index, workspaces.length, query)).filter(Boolean).join("");
    return \`
    <div class="workspace-section">
      \${workspaces.length === 0 ? renderEmptyWorkspace() : ""}
      \${workspaces.length > 0 && !workspaceItems ? '<div class="empty-workspace"><p>\\u672A\\u627E\\u5230\\u5339\\u914D\\u5185\\u5BB9</p></div>' : ""}
      \${workspaceItems}
    </div>
  \`;
  }
  function renderEmptyWorkspace() {
    return \`
    <div class="empty-workspace">
      <p>\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</p>
      <p style="font-size: 12px; color: #57606a; margin-top: 8px;">
        \\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u76EE\\u5F55\\u8DEF\\u5F84\\u540E\\u56DE\\u8F66\\u6DFB\\u52A0
      </p>
    </div>
  \`;
  }
  function renderWorkspaceItem(workspace, index, total, query) {
    const isCurrent = state.currentWorkspace === workspace.id;
    const tree = query ? buildSearchTree(workspace, query) : state.fileTree.get(workspace.id);
    const shouldExpand = query ? true : workspace.isExpanded;
    const toggle = shouldExpand ? "\\u25BC" : "\\u25B6";
    const canMoveUp = index > 0;
    const canMoveDown = index < total - 1;
    const workspaceMatched = !query || workspace.name.toLowerCase().includes(query) || workspace.path.toLowerCase().includes(query);
    const hasTreeMatch = !!tree && !!tree.children && tree.children.length > 0;
    const missingSection = shouldExpand ? renderMissingOpenFiles(workspace.id, workspace.path, tree, query) : "";
    const hasMissingMatch = !!missingSection;
    if (query && !workspaceMatched && !hasTreeMatch && !hasMissingMatch) {
      return "";
    }
    return \`
    <div class="workspace-item">
      <div class="workspace-header \${isCurrent ? "active" : ""}" onclick="handleWorkspaceToggle('\${escapeAttr(workspace.id)}')">
        <span class="workspace-toggle">\${toggle}</span>
        <span class="workspace-icon">\\u{1F4C1}</span>
        <span class="workspace-name">\${escapeHtml(workspace.name)}</span>
        \${pendingRemoveWorkspaceId === workspace.id ? \`
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            \${canMoveUp ? \`
            <button
              class="workspace-order-btn"
              title="\\u4E0A\\u79FB"
              onclick="handleMoveWorkspaceUp('\${escapeAttr(workspace.id)}')"
            >\\u2191</button>
            \` : ""}
            \${canMoveDown ? \`
            <button
              class="workspace-order-btn"
              title="\\u4E0B\\u79FB"
              onclick="handleMoveWorkspaceDown('\${escapeAttr(workspace.id)}')"
            >\\u2193</button>
            \` : ""}
            <button
              class="workspace-remove-confirm"
              title="\\u786E\\u8BA4\\u79FB\\u9664"
              onclick="handleConfirmRemoveWorkspace('\${escapeAttr(workspace.id)}')"
            >\\u5220</button>
          </div>
        \` : \`
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            \${canMoveUp ? \`
            <button
              class="workspace-order-btn"
              title="\\u4E0A\\u79FB"
              onclick="handleMoveWorkspaceUp('\${escapeAttr(workspace.id)}')"
            >\\u2191</button>
            \` : ""}
            \${canMoveDown ? \`
            <button
              class="workspace-order-btn"
              title="\\u4E0B\\u79FB"
              onclick="handleMoveWorkspaceDown('\${escapeAttr(workspace.id)}')"
            >\\u2193</button>
            \` : ""}
          <button
            class="workspace-remove"
            title="\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A"
            onclick="event.stopPropagation();handleAskRemoveWorkspace('\${escapeAttr(workspace.id)}')"
          >
            \\xD7
          </button>
          </div>
        \`}
      </div>
      \${shouldExpand ? renderFileTree(workspace.id, tree, query) : ""}
      \${missingSection}
    </div>
  \`;
  }
  function renderFileTree(workspaceId, tree, query) {
    if (query && workspaceSearchLoading && workspaceSearchQuery === query) {
      return \`
      <div class="file-tree loading">
        <div class="tree-loading">\\u641C\\u7D22\\u4E2D...</div>
      </div>
    \`;
    }
    if (loadingWorkspaceIds.has(workspaceId)) {
      return \`
      <div class="file-tree loading">
        <div class="tree-loading">\\u52A0\\u8F7D\\u4E2D...</div>
      </div>
    \`;
    }
    if (failedWorkspaceIds.has(workspaceId)) {
      return \`
      <div class="file-tree empty">
        <div class="tree-empty" onclick="retryWorkspaceScan('\${escapeAttr(workspaceId)}')" style="cursor: pointer;">\\u52A0\\u8F7D\\u5931\\u8D25\\uFF0C\\u70B9\\u51FB\\u91CD\\u8BD5</div>
      </div>
    \`;
    }
    if (!tree) {
      return \`
      <div class="file-tree empty">
        <div class="tree-empty">\${query ? "\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6" : "\\u76EE\\u5F55\\u6682\\u4E0D\\u53EF\\u7528"}</div>
      </div>
    \`;
    }
    if (!tree.children || tree.children.length === 0) {
      return \`
      <div class="file-tree empty">
        <div class="tree-empty">\${query ? "\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6" : "\\u6B64\\u76EE\\u5F55\\u4E0B\\u6CA1\\u6709 Markdown/HTML \\u6587\\u4EF6"}</div>
      </div>
    \`;
    }
    return \`
    <div class="file-tree">
      \${tree.children.map((node) => renderTreeNode(workspaceId, node, 1)).join("")}
    </div>
  \`;
  }
  function renderTreeNode(workspaceId, node, depth) {
    const indentPx = 4 + depth * 8;
    const isCurrentFile = state.currentFile === node.path;
    if (node.type === "file") {
      const openedFile = getSessionFile(node.path);
      const listDiff = hasListDiff(node.path);
      const isMissing = !!openedFile?.isMissing || isWorkspacePathMissing(node.path);
      const typeIcon = getFileTypeIcon(node.path);
      let statusBadge = "&nbsp;";
      if (openedFile) {
        const status = getFileListStatus(openedFile, listDiff);
        if (status.badge === "dot") {
          statusBadge = '<span class="new-dot"></span>';
        } else if (status.badge) {
          statusBadge = \`<span class="status-badge status-\${status.type}" style="color: \${status.color}">\${status.badge}</span>\`;
        }
      } else if (isMissing) {
        statusBadge = '<span class="status-badge status-deleted" style="color: #cf222e">D</span>';
      } else if (listDiff) {
        statusBadge = '<span class="new-dot"></span>';
      }
      const classes = [
        "tree-item",
        "file-node",
        isMissing ? "missing" : "",
        isCurrentFile ? "current" : ""
      ].filter(Boolean).join(" ");
      return \`
      <div class="tree-node">
        <div class="\${classes}"
             onclick="handleFileClick('\${escapeAttr(node.path)}')">
          <span class="tree-indent" style="width: \${indentPx}px"></span>
          <span class="tree-toggle"></span>
          <span class="file-type-icon \${typeIcon.cls}">\${escapeHtml(typeIcon.label)}</span>
          <span class="tree-status-inline">\${statusBadge}</span>
          <span class="tree-name" title="\${escapeAttr(node.name)}">\${renderFileNameWithTailPriority(node.name)}</span>
        </div>
      </div>
    \`;
    }
    const isExpanded = node.isExpanded !== false;
    const toggle = isExpanded ? "\\u25BC" : "\\u25B6";
    const hasChildren = node.children && node.children.length > 0;
    return \`
    <div class="tree-node">
      <div class="tree-item directory-node">
        <span class="tree-indent" style="width: \${indentPx}px"></span>
        <span class="tree-toggle" onclick="\${hasChildren ? \`event.stopPropagation();handleNodeClick('\${escapeAttr(workspaceId)}', '\${escapeAttr(node.path)}')\` : ""}">\${hasChildren ? toggle : ""}</span>
        <span class="tree-name" onclick="\${hasChildren ? \`event.stopPropagation();handleNodeClick('\${escapeAttr(workspaceId)}', '\${escapeAttr(node.path)}')\` : ""}">\${escapeHtml(node.name)}</span>
        \${node.fileCount ? \`<span class="tree-count">\${node.fileCount}</span>\` : ""}
      </div>
      \${isExpanded && hasChildren ? \`
        <div class="file-tree">
          \${node.children.map((child) => renderTreeNode(workspaceId, child, depth + 1)).join("")}
        </div>
      \` : ""}
    </div>
  \`;
  }
  function renderMissingOpenFiles(workspaceId, workspacePath, tree, query) {
    const filePathsInTree = /* @__PURE__ */ new Set();
    collectTreeFilePaths(tree, filePathsInTree);
    const workspacePrefix = \`\${workspacePath}/\`;
    const missingOpenedFiles = getSessionFiles().filter((file) => {
      if (!file.isMissing) return false;
      if (!file.path.startsWith(workspacePrefix)) return false;
      if (filePathsInTree.has(file.path)) return false;
      if (!query) return true;
      return file.name.toLowerCase().includes(query) || file.path.toLowerCase().includes(query);
    });
    const openedSet = new Set(missingOpenedFiles.map((file) => file.path));
    const missingPaths = getWorkspaceMissingPaths(workspacePath).filter((path) => !openedSet.has(path)).filter((path) => !filePathsInTree.has(path)).filter((path) => {
      if (!query) return true;
      const lower = path.toLowerCase();
      const name = (path.split("/").pop() || "").toLowerCase();
      return lower.includes(query) || name.includes(query);
    });
    if (missingOpenedFiles.length === 0 && missingPaths.length === 0) {
      return "";
    }
    const missingRows = [
      ...missingOpenedFiles.map((file) => ({
        path: file.path,
        name: file.path.split("/").pop() || file.name,
        isCurrent: state.currentFile === file.path,
        hasRetry: true,
        hasClose: true
      })),
      ...missingPaths.map((path) => ({
        path,
        name: path.split("/").pop() || path,
        isCurrent: state.currentFile === path,
        hasRetry: false,
        hasClose: false
      }))
    ];
    return \`
    <div class="tree-missing-section">
      <div class="tree-missing-title">\\u5DF2\\u5220\\u9664</div>
      \${missingRows.map((row) => {
      const typeIcon = getFileTypeIcon(row.path);
      return \`
          <div class="tree-item file-node missing \${row.isCurrent ? "current" : ""}" onclick="handleFileClick('\${escapeAttr(row.path)}')">
            <span class="tree-indent" style="width: 12px"></span>
            <span class="tree-toggle"></span>
            <span class="file-type-icon \${typeIcon.cls}">\${escapeHtml(typeIcon.label)}</span>
            <span class="tree-status-inline"><span class="status-badge status-deleted">D</span></span>
            <span class="tree-name" title="\${escapeAttr(row.name)}">\${renderFileNameWithTailPriority(row.name)}</span>
            \${row.hasRetry ? \`<button class="tree-inline-action" title="\\u91CD\\u8BD5\\u52A0\\u8F7D" onclick="event.stopPropagation(); handleRetryMissingFile('\${escapeAttr(row.path)}')">\\u21BB</button>\` : ""}
            \${row.hasClose ? \`<button class="tree-inline-action danger" title="\\u5173\\u95ED\\u6587\\u4EF6" onclick="event.stopPropagation(); handleCloseFile('\${escapeAttr(row.path)}')">\\xD7</button>\` : ""}
          </div>
        \`;
    }).join("")}
    </div>
  \`;
  }
  function bindWorkspaceEvents() {
    if (!removeOutsideClickBound) {
      removeOutsideClickBound = true;
      document.addEventListener("click", async (e) => {
        if (!pendingRemoveWorkspaceId) return;
        const target = e.target;
        if (!target) return;
        if (target.closest(".workspace-remove-actions") || target.closest(".workspace-remove")) {
          return;
        }
        pendingRemoveWorkspaceId = null;
        const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
        renderSidebar2();
      });
    }
    window.handleWorkspaceToggle = async (workspaceId) => {
      const workspace = state.config.workspaces.find((ws) => ws.id === workspaceId);
      if (!workspace) return;
      state.currentWorkspace = workspaceId;
      if (state.searchQuery.trim()) {
        const { renderSidebar: renderSidebar3 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
        renderSidebar3();
        return;
      }
      toggleWorkspaceExpanded(workspaceId);
      if (workspace.isExpanded && !state.fileTree.has(workspaceId)) {
        loadingWorkspaceIds.add(workspaceId);
        failedWorkspaceIds.delete(workspaceId);
        const { renderSidebar: renderSidebar3 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
        renderSidebar3();
        const tree = await scanWorkspace(workspaceId);
        loadingWorkspaceIds.delete(workspaceId);
        if (!tree) {
          failedWorkspaceIds.add(workspaceId);
          showError(\`\\u5DE5\\u4F5C\\u533A\\u626B\\u63CF\\u5931\\u8D25\\uFF1A\${workspace.name}\`);
        } else {
          failedWorkspaceIds.delete(workspaceId);
        }
      }
      const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
      renderSidebar2();
    };
    window.retryWorkspaceScan = async (workspaceId) => {
      loadingWorkspaceIds.add(workspaceId);
      failedWorkspaceIds.delete(workspaceId);
      const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
      renderSidebar2();
      const tree = await scanWorkspace(workspaceId);
      loadingWorkspaceIds.delete(workspaceId);
      if (!tree) {
        failedWorkspaceIds.add(workspaceId);
        showError("\\u91CD\\u8BD5\\u5931\\u8D25\\uFF0C\\u8BF7\\u68C0\\u67E5\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84\\u662F\\u5426\\u53EF\\u8BBF\\u95EE");
      }
      renderSidebar2();
    };
    window.handleAskRemoveWorkspace = async (workspaceId) => {
      pendingRemoveWorkspaceId = workspaceId;
      const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
      renderSidebar2();
    };
    window.handleConfirmRemoveWorkspace = async (workspaceId) => {
      const workspace = state.config.workspaces.find((ws) => ws.id === workspaceId);
      if (!workspace) return;
      removeWorkspace(workspaceId);
      pendingRemoveWorkspaceId = null;
      const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
      renderSidebar2();
      showSuccess(\`\\u5DF2\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A: \${workspace.name}\`, 2e3);
    };
    window.handleNodeClick = async (workspaceId, nodePath) => {
      toggleNodeExpanded(workspaceId, nodePath);
      const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
      renderSidebar2();
    };
    window.handleFileClick = async (filePath) => {
      const lower = filePath.toLowerCase();
      if (lower.endsWith(".html") || lower.endsWith(".htm")) {
        await window.openExternalFile?.(filePath);
        return;
      }
      const { switchToFile: switchToFile2 } = await Promise.resolve().then(() => (init_state(), state_exports));
      const { loadFile: loadFile2 } = await Promise.resolve().then(() => (init_files(), files_exports));
      if (!hasSessionFile(filePath)) {
        const fileData = await loadFile2(filePath, true);
        if (!fileData) {
          const { markFileMissing: markFileMissing3 } = await Promise.resolve().then(() => (init_state(), state_exports));
          markFileMissing3(filePath, true);
          const main2 = await Promise.resolve().then(() => (init_main(), main_exports));
          main2.renderAll();
          showError("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");
          return;
        }
        const { addOrUpdateFile: addOrUpdateFile2 } = await Promise.resolve().then(() => (init_state(), state_exports));
        addOrUpdateFile2(fileData, true);
      } else {
        switchToFile2(filePath);
      }
      const main = await Promise.resolve().then(() => (init_main(), main_exports));
      main.renderAll();
    };
    window.handleCloseFile = async (filePath) => {
      const { removeFile: removeFile2 } = await Promise.resolve().then(() => (init_state(), state_exports));
      removeFile2(filePath);
      const main = await Promise.resolve().then(() => (init_main(), main_exports));
      main.renderAll();
    };
    window.handleRetryMissingFile = async (filePath) => {
      const { loadFile: loadFile2 } = await Promise.resolve().then(() => (init_files(), files_exports));
      const { addOrUpdateFile: addOrUpdateFile2 } = await Promise.resolve().then(() => (init_state(), state_exports));
      const fileData = await loadFile2(filePath);
      if (!fileData) return;
      addOrUpdateFile2(fileData, state.currentFile === filePath);
      const main = await Promise.resolve().then(() => (init_main(), main_exports));
      main.renderAll();
      showSuccess("\\u6587\\u4EF6\\u5DF2\\u91CD\\u65B0\\u52A0\\u8F7D", 2e3);
    };
    window.showAddWorkspaceDialog = showAddWorkspaceDialog;
    window.closeAddWorkspaceDialog = closeAddWorkspaceDialog;
    window.confirmAddWorkspaceDialog = confirmAddWorkspaceDialog;
    window.handleMoveWorkspaceUp = async (workspaceId) => {
      moveWorkspaceByOffset(workspaceId, -1);
      const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
      renderSidebar2();
    };
    window.handleMoveWorkspaceDown = async (workspaceId) => {
      moveWorkspaceByOffset(workspaceId, 1);
      const { renderSidebar: renderSidebar2 } = await Promise.resolve().then(() => (init_sidebar(), sidebar_exports));
      renderSidebar2();
    };
  }
  var ADD_WORKSPACE_DIALOG_ID, ADD_WORKSPACE_INPUT_ID, ADD_WORKSPACE_PREVIEW_ID, pendingRemoveWorkspaceId, removeOutsideClickBound, loadingWorkspaceIds, failedWorkspaceIds, workspaceSearchQuery, workspaceSearchRootsKey, workspaceSearchLoading, workspaceSearchLoaded, workspaceSearchPaths, workspaceSearchSeq;
  var init_sidebar_workspace = __esm({
    "src/client/ui/sidebar-workspace.ts"() {
      "use strict";
      init_state();
      init_workspace_state();
      init_files();
      init_escape();
      init_file_status();
      init_file_type();
      init_workspace_file_name();
      init_toast();
      init_path_autocomplete();
      init_workspace();
      ADD_WORKSPACE_DIALOG_ID = "addWorkspaceDialogOverlay";
      ADD_WORKSPACE_INPUT_ID = "addWorkspacePathInput";
      ADD_WORKSPACE_PREVIEW_ID = "addWorkspacePathPreview";
      pendingRemoveWorkspaceId = null;
      removeOutsideClickBound = false;
      loadingWorkspaceIds = /* @__PURE__ */ new Set();
      failedWorkspaceIds = /* @__PURE__ */ new Set();
      workspaceSearchQuery = "";
      workspaceSearchRootsKey = "";
      workspaceSearchLoading = false;
      workspaceSearchLoaded = false;
      workspaceSearchPaths = /* @__PURE__ */ new Set();
      workspaceSearchSeq = 0;
    }
  });

  // src/client/api/annotations.ts
  async function readJsonOrThrow(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || \`HTTP \${response.status}\`);
    }
    return data;
  }
  async function fetchAnnotations(path) {
    const response = await fetch(\`/api/annotations?path=\${encodeURIComponent(path)}\`);
    const data = await readJsonOrThrow(response);
    return Array.isArray(data?.annotations) ? data.annotations : [];
  }
  async function upsertAnnotationRemote(path, annotation) {
    const response = await fetch("/api/annotations/item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, annotation })
    });
    const data = await readJsonOrThrow(response);
    if (data?.success !== true || !data?.annotation) {
      throw new Error(data?.error || "\\u4FDD\\u5B58\\u8BC4\\u8BBA\\u5931\\u8D25");
    }
    return data.annotation;
  }
  async function replyAnnotationRemote(path, ref, text, author) {
    const response = await fetch("/api/annotations/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, ...ref, text, author })
    });
    const data = await readJsonOrThrow(response);
    if (data?.success !== true || !data?.annotation) {
      throw new Error(data?.error || "\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25");
    }
    return data.annotation;
  }
  async function deleteAnnotationRemote(path, ref) {
    const response = await fetch("/api/annotations/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, ...ref })
    });
    const data = await readJsonOrThrow(response);
    if (data?.success !== true) {
      throw new Error(data?.error || "\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25");
    }
  }
  async function updateAnnotationStatusRemote(path, ref, status) {
    const response = await fetch("/api/annotations/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, ...ref, status })
    });
    const data = await readJsonOrThrow(response);
    if (data?.success !== true || !data?.annotation) {
      throw new Error(data?.error || "\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25");
    }
    return data.annotation;
  }
  var init_annotations = __esm({
    "src/client/api/annotations.ts"() {
      "use strict";
    }
  });

  // src/client/utils/annotation-anchor.ts
  function collectMatches(text, needle) {
    if (!needle) return [];
    const result = [];
    let index = text.indexOf(needle);
    while (index >= 0) {
      result.push(index);
      index = text.indexOf(needle, index + 1);
    }
    return result;
  }
  function scoreCandidate(text, quote, at, ann) {
    let score = 0;
    const expectedStart = Math.max(0, ann.start || 0);
    const distance = Math.abs(at - expectedStart);
    score += Math.max(0, 1e3 - Math.min(1e3, distance));
    if (ann.quotePrefix) {
      const gotPrefix = text.slice(Math.max(0, at - ann.quotePrefix.length), at);
      if (gotPrefix === ann.quotePrefix) score += 500;
    }
    if (ann.quoteSuffix) {
      const end = at + quote.length;
      const gotSuffix = text.slice(end, end + ann.quoteSuffix.length);
      if (gotSuffix === ann.quoteSuffix) score += 500;
    }
    return score;
  }
  function resolveAnnotationAnchor(text, ann) {
    if (!text || !ann.quote || ann.length <= 0) {
      return { start: ann.start || 0, length: Math.max(1, ann.length || ann.quote?.length || 1), confidence: 0, status: "unanchored" };
    }
    const expectedStart = Math.max(0, ann.start || 0);
    const expectedEnd = expectedStart + Math.max(1, ann.length || ann.quote.length);
    if (expectedEnd <= text.length && text.slice(expectedStart, expectedEnd) === ann.quote) {
      return { start: expectedStart, length: ann.length, confidence: 1, status: "anchored" };
    }
    const matches = collectMatches(text, ann.quote);
    if (matches.length === 0) {
      return { start: expectedStart, length: Math.max(1, ann.length || ann.quote.length), confidence: 0, status: "unanchored" };
    }
    if (matches.length === 1) {
      return { start: matches[0], length: ann.quote.length, confidence: 0.8, status: "anchored" };
    }
    let bestPos = matches[0];
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const pos of matches) {
      const score = scoreCandidate(text, ann.quote, pos, ann);
      if (score > bestScore) {
        bestScore = score;
        bestPos = pos;
      }
    }
    return { start: bestPos, length: ann.quote.length, confidence: 0.6, status: "anchored" };
  }
  var init_annotation_anchor = __esm({
    "src/client/utils/annotation-anchor.ts"() {
      "use strict";
    }
  });

  // src/client/annotation.ts
  function getInitialDensity() {
    try {
      if (typeof localStorage === "undefined") return "default";
      return localStorage.getItem("md-viewer:annotation-density") === "simple" ? "simple" : "default";
    } catch {
      return "default";
    }
  }
  function nextAnnotationSerial(annotations) {
    const maxSerial = annotations.reduce((max, ann) => {
      if (typeof ann.serial !== "number" || !Number.isFinite(ann.serial)) return max;
      return Math.max(max, ann.serial);
    }, 0);
    return maxSerial + 1;
  }
  function normalizeThread(annotation) {
    const fallbackCreatedAt = Number.isFinite(annotation.createdAt) ? annotation.createdAt : Date.now();
    const incoming = Array.isArray(annotation.thread) ? annotation.thread : [];
    const normalized = incoming.map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const note = String(item.note || "").trim();
      if (!note) return null;
      const typeRaw = String(item.type || (index === 0 ? "comment" : "reply"));
      const type = typeRaw === "reply" ? "reply" : "comment";
      const createdAtRaw = Number(item.createdAt);
      const createdAt = Number.isFinite(createdAtRaw) ? Math.floor(createdAtRaw) : fallbackCreatedAt + index;
      const id = String(item.id || "").trim() || \`\${type}-\${createdAt}-\${Math.random().toString(16).slice(2, 8)}\`;
      return { id, type, note, createdAt };
    }).filter((item) => !!item).sort((a, b) => a.createdAt - b.createdAt);
    if (normalized.length === 0) {
      const note = String(annotation.note || "").trim();
      if (!note) return [];
      return [{
        id: \`c-\${annotation.id || fallbackCreatedAt}\`,
        type: "comment",
        note,
        createdAt: fallbackCreatedAt
      }];
    }
    normalized[0].type = "comment";
    for (let i = 1; i < normalized.length; i += 1) normalized[i].type = "reply";
    return normalized;
  }
  function ensureAnnotationThread(annotation) {
    const nextThread = normalizeThread(annotation);
    const prev = JSON.stringify(annotation.thread || []);
    const next = JSON.stringify(nextThread);
    annotation.thread = nextThread;
    annotation.note = nextThread[0]?.note || annotation.note || "";
    return prev !== next;
  }
  function ensureAnnotationThreads(annotations) {
    let changed = false;
    for (const ann of annotations) {
      if (ensureAnnotationThread(ann)) changed = true;
    }
    return changed;
  }
  function ensureAnnotationSerials(annotations) {
    let changed = false;
    const withIndex = annotations.map((ann, index) => ({ ann, index }));
    withIndex.sort((a, b) => {
      const leftTime = Number.isFinite(a.ann.createdAt) ? a.ann.createdAt : 0;
      const rightTime = Number.isFinite(b.ann.createdAt) ? b.ann.createdAt : 0;
      if (leftTime !== rightTime) return leftTime - rightTime;
      return a.index - b.index;
    });
    let cursor = 1;
    for (const { ann } of withIndex) {
      if (typeof ann.serial === "number" && Number.isFinite(ann.serial) && ann.serial > 0) {
        cursor = Math.max(cursor, ann.serial + 1);
        continue;
      }
      ann.serial = cursor;
      cursor += 1;
      changed = true;
    }
    return changed;
  }
  function replaceAnnotationInState(next) {
    const index = state2.annotations.findIndex((item) => item.id === next.id);
    if (index >= 0) {
      state2.annotations[index] = next;
      return;
    }
    state2.annotations.push(next);
  }
  function persistAnnotation(filePath, annotation, errorPrefix = "\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25") {
    void upsertAnnotationRemote(filePath, annotation).then((saved) => {
      if (state2.currentFilePath !== filePath) return;
      replaceAnnotationInState(saved);
      renderAnnotationList(filePath);
      applyAnnotations();
    }).catch((error) => {
      showError(\`\${errorPrefix}: \${error?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`, 2600);
    });
  }
  function persistAnnotations(filePath, annotations, errorPrefix = "\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25") {
    for (const annotation of annotations) {
      persistAnnotation(filePath, annotation, errorPrefix);
    }
  }
  function setAnnotations(filePath) {
    state2.currentFilePath = filePath;
    if (filePath) {
      state2.annotations = [];
      void hydrateAnnotationsFromRemote(filePath);
    } else {
      state2.annotations = [];
    }
    state2.pinnedAnnotationId = null;
    state2.activeAnnotationId = null;
    state2.pendingAnnotation = null;
    state2.pendingAnnotationFilePath = null;
    hideComposer();
    hideQuickAdd(true);
    hidePopover(true);
    if (filePath) {
      const openByFile = loadAnnotationPanelOpenByFile();
      const opened = openByFile[filePath] === true;
      setSidebarCollapsed(!opened);
    } else {
      setSidebarCollapsed(true);
    }
  }
  async function hydrateAnnotationsFromRemote(filePath) {
    try {
      const remote = await fetchAnnotations(filePath);
      if (!Array.isArray(remote)) return;
      if (state2.currentFilePath !== filePath) return;
      state2.annotations = remote;
      const threadChanged = ensureAnnotationThreads(state2.annotations);
      const serialChanged = ensureAnnotationSerials(state2.annotations);
      if (threadChanged || serialChanged) {
        persistAnnotations(filePath, state2.annotations);
      }
      renderAnnotationList(filePath);
      applyAnnotations();
    } catch (error) {
      if (state2.currentFilePath !== filePath) return;
      showError(\`\\u8BC4\\u8BBA\\u52A0\\u8F7D\\u5931\\u8D25: \${error?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`, 2600);
    }
  }
  function getElements() {
    return {
      sidebar: document.getElementById("annotationSidebar"),
      sidebarResizer: document.getElementById("annotationSidebarResizer"),
      reader: document.getElementById("reader"),
      content: document.getElementById("content"),
      composer: document.getElementById("annotationComposer"),
      composerHeader: document.getElementById("annotationComposerHeader"),
      composerNote: document.getElementById("composerNote"),
      quickAdd: document.getElementById("annotationQuickAdd"),
      popover: document.getElementById("annotationPopover"),
      popoverTitle: document.getElementById("popoverTitle"),
      popoverNote: document.getElementById("popoverNote"),
      popoverResolveBtn: document.getElementById("popoverResolveBtn"),
      popoverPrevBtn: document.getElementById("popoverPrevBtn"),
      popoverNextBtn: document.getElementById("popoverNextBtn"),
      annotationList: document.getElementById("annotationList"),
      annotationCount: document.getElementById("annotationCount"),
      filterMenu: document.getElementById("annotationFilterMenu"),
      filterToggle: document.getElementById("annotationFilterToggle"),
      densityToggle: document.getElementById("annotationDensityToggle"),
      closeToggle: document.getElementById("annotationSidebarClose"),
      floatingOpenBtn: document.getElementById("annotationFloatingOpenBtn")
    };
  }
  function getTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeValue && node.nodeValue.length > 0) {
        nodes.push(node);
      }
    }
    return nodes;
  }
  function globalOffsetForPosition(root, targetNode, targetOffset) {
    const nodes = getTextNodes(root);
    let count = 0;
    for (const node of nodes) {
      if (node === targetNode) {
        return count + targetOffset;
      }
      count += node.nodeValue?.length || 0;
    }
    return -1;
  }
  function positionForGlobalOffset(root, offset) {
    const nodes = getTextNodes(root);
    let count = 0;
    for (const node of nodes) {
      const len = node.nodeValue?.length || 0;
      const next = count + len;
      if (offset <= next) {
        return { node, offset: Math.max(0, offset - count) };
      }
      count = next;
    }
    if (nodes.length === 0) return null;
    const last = nodes[nodes.length - 1];
    return { node: last, offset: last.nodeValue?.length || 0 };
  }
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }
  function placeFloating(el, x, y) {
    const width = 360;
    const height = 220;
    const left = clamp(x, 8, window.innerWidth - width - 8);
    const top = clamp(y, 8, window.innerHeight - height - 8);
    el.style.left = \`\${left}px\`;
    el.style.top = \`\${top}px\`;
  }
  function getReaderText(root) {
    return getTextNodes(root).map((node) => node.nodeValue || "").join("");
  }
  function isResolved(ann) {
    return ann.status === "resolved";
  }
  function getAnchorTrack(ann) {
    if (ann.status === "unanchored") return "orphan";
    if ((ann.confidence || 0) >= 0.95) return "exact";
    return "reanchored";
  }
  function matchesFilter(ann, filter) {
    const isOrphan = ann.status === "unanchored" || getAnchorTrack(ann) === "orphan";
    if (filter === "all") return true;
    if (filter === "open") return !isResolved(ann) && !isOrphan;
    if (filter === "resolved") return isResolved(ann) && !isOrphan;
    if (filter === "orphan") return isOrphan;
    return true;
  }
  function getAnnotationCurrentFilePath() {
    return state2.currentFilePath;
  }
  function getActiveAnnotationFilePath() {
    const currentFilePath = state2.currentFilePath;
    const renderedFilePath = document.getElementById("content")?.getAttribute("data-current-file") || null;
    if (!currentFilePath) return null;
    if (!renderedFilePath) return currentFilePath;
    return renderedFilePath === currentFilePath ? currentFilePath : null;
  }
  function iconSvg(type) {
    if (type === "up") return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>';
    if (type === "down") return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>';
    if (type === "check") return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>';
    if (type === "trash") return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>';
    if (type === "comment") return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>';
    if (type === "list") return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>';
    if (type === "filter") return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>';
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>';
  }
  function getVisibleAnnotations() {
    return [...state2.annotations].filter((ann) => matchesFilter(ann, state2.filter)).sort((a, b) => a.start - b.start);
  }
  function updateControlState() {
    const el = getElements();
    el.filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach((node) => {
      const button = node;
      button.classList.toggle("is-active", button.getAttribute("data-filter") === state2.filter);
    });
    if (el.densityToggle) {
      el.densityToggle.classList.toggle("is-simple", state2.density === "simple");
      el.densityToggle.title = state2.density === "simple" ? "\\u5207\\u6362\\u5230\\u9ED8\\u8BA4\\u5217\\u8868" : "\\u5207\\u6362\\u5230\\u6781\\u7B80\\u5217\\u8868";
    }
    if (el.filterToggle) {
      const map = {
        all: "\\u7B5B\\u9009\\uFF1A\\u5168\\u90E8",
        open: "\\u7B5B\\u9009\\uFF1A\\u672A\\u89E3\\u51B3",
        resolved: "\\u7B5B\\u9009\\uFF1A\\u5DF2\\u89E3\\u51B3",
        orphan: "\\u7B5B\\u9009\\uFF1A\\u5B9A\\u4F4D\\u5931\\u8D25"
      };
      el.filterToggle.title = map[state2.filter];
    }
  }
  function updateAnnotationCount() {
    const el = getElements();
    if (!el.annotationCount) return;
    el.annotationCount.textContent = String(getVisibleAnnotations().length);
  }
  function setSidebarCollapsed(collapsed) {
    const el = getElements();
    if (!el.sidebar) return;
    el.sidebar.classList.toggle("collapsed", collapsed);
    document.body.classList.toggle("annotation-sidebar-collapsed", collapsed);
    if (collapsed) {
      el.filterMenu?.classList.add("hidden");
      hideQuickAdd(true);
      hidePopover(true);
    }
  }
  function loadAnnotationPanelOpenByFile() {
    try {
      const raw = localStorage.getItem(ANNOTATION_PANEL_OPEN_BY_FILE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  function saveAnnotationPanelOpenByFile(next) {
    localStorage.setItem(ANNOTATION_PANEL_OPEN_BY_FILE_KEY, JSON.stringify(next));
  }
  function persistCurrentFilePanelOpen(opened) {
    if (!state2.currentFilePath) return;
    const map = loadAnnotationPanelOpenByFile();
    map[state2.currentFilePath] = opened;
    saveAnnotationPanelOpenByFile(map);
  }
  function clampSidebarWidth(width) {
    return Math.max(ANNOTATION_WIDTH_MIN, Math.min(ANNOTATION_WIDTH_MAX, Math.round(width)));
  }
  function setAnnotationSidebarWidth(width) {
    const clamped = clampSidebarWidth(width);
    document.documentElement.style.setProperty("--annotation-sidebar-width", \`\${clamped}px\`);
    localStorage.setItem(ANNOTATION_WIDTH_KEY, String(clamped));
  }
  function initAnnotationSidebarWidth() {
    const saved = Number(localStorage.getItem(ANNOTATION_WIDTH_KEY));
    const width = Number.isFinite(saved) && saved > 0 ? saved : ANNOTATION_WIDTH_DEFAULT;
    setAnnotationSidebarWidth(width);
  }
  function syncAnnotationSidebarLayout() {
    const el = getElements();
    if (!el.sidebar) return;
    const tabs = document.getElementById("tabs");
    const topOffset = Math.max(0, Math.round(tabs?.getBoundingClientRect().bottom || 84));
    const height = Math.max(0, window.innerHeight - topOffset);
    el.sidebar.style.top = \`\${topOffset}px\`;
    el.sidebar.style.height = \`\${height}px\`;
    if (el.sidebarResizer) {
      el.sidebarResizer.style.top = \`\${topOffset}px\`;
      el.sidebarResizer.style.height = \`\${height}px\`;
    }
    if (el.floatingOpenBtn) {
      el.floatingOpenBtn.style.top = \`\${topOffset + 6}px\`;
    }
  }
  function openAnnotationSidebar() {
    setSidebarCollapsed(false);
    persistCurrentFilePanelOpen(true);
    syncAnnotationSidebarLayout();
    syncAnnotationScrollWithContent();
  }
  function closeAnnotationSidebar() {
    setSidebarCollapsed(true);
    persistCurrentFilePanelOpen(false);
  }
  function toggleAnnotationSidebar() {
    const sidebar = getElements().sidebar;
    if (!sidebar) return;
    setSidebarCollapsed(!sidebar.classList.contains("collapsed"));
  }
  function dismissAnnotationPopupByEscape() {
    const el = getElements();
    if (el.filterMenu && !el.filterMenu.classList.contains("hidden")) {
      el.filterMenu.classList.add("hidden");
      return true;
    }
    if (el.quickAdd && !el.quickAdd.classList.contains("hidden")) {
      hideQuickAdd(true);
      return true;
    }
    if (el.composer && !el.composer.classList.contains("hidden")) {
      hideComposer();
      return true;
    }
    if (el.popover && !el.popover.classList.contains("hidden")) {
      state2.pinnedAnnotationId = null;
      hidePopover(true);
      return true;
    }
    return false;
  }
  function mergeAnnotationStatus(currentStatus, resolvedStatus) {
    if (currentStatus === "resolved") return "resolved";
    return resolvedStatus;
  }
  function showQuickAdd(x, y, pendingData) {
    const el = getElements();
    if (!el.quickAdd) return;
    state2.pendingAnnotation = { ...pendingData, note: "", createdAt: Date.now() };
    state2.pendingAnnotationFilePath = el.content?.getAttribute("data-current-file") || state2.currentFilePath;
    const width = 30;
    const height = 30;
    const left = clamp(x, 8, window.innerWidth - width - 8);
    const top = clamp(y, 8, window.innerHeight - height - 8);
    el.quickAdd.style.left = \`\${left}px\`;
    el.quickAdd.style.top = \`\${top}px\`;
    el.quickAdd.classList.remove("hidden");
  }
  function hideQuickAdd(clearPending = false) {
    const el = getElements();
    if (!el.quickAdd) return;
    el.quickAdd.classList.add("hidden");
    if (clearPending) {
      clearTempSelectionMark();
      state2.pendingAnnotation = null;
      state2.pendingAnnotationFilePath = null;
    }
  }
  function openComposerFromPending(x, y) {
    const el = getElements();
    if (!state2.pendingAnnotation || !el.composer || !el.composerNote) return;
    applyTempSelectionMark();
    el.composerNote.value = "";
    autoResizeComposerInput(el.composerNote);
    const left = typeof x === "number" ? x : el.quickAdd ? Number.parseFloat(el.quickAdd.style.left || "0") : 0;
    const top = typeof y === "number" ? y : el.quickAdd ? Number.parseFloat(el.quickAdd.style.top || "0") : 0;
    placeFloating(el.composer, left, top + 34);
    el.composer.classList.remove("hidden");
    hideQuickAdd(false);
    el.composerNote.focus();
  }
  function hideComposer() {
    const el = getElements();
    if (!el.composer) return;
    clearTempSelectionMark();
    state2.pendingAnnotation = null;
    el.composer.classList.add("hidden");
  }
  function clearTempSelectionMark() {
    const reader = document.getElementById("reader");
    if (!reader) return;
    const marks = Array.from(reader.querySelectorAll(".annotation-mark-temp"));
    for (const mark of marks) {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent?.insertBefore(mark.firstChild, mark);
      }
      parent?.removeChild(mark);
    }
  }
  function applyTempSelectionMark() {
    const el = getElements();
    if (!el.reader || !state2.pendingAnnotation) return;
    clearTempSelectionMark();
    const ann = state2.pendingAnnotation;
    const startPos = positionForGlobalOffset(el.reader, ann.start);
    const endPos = positionForGlobalOffset(el.reader, ann.start + ann.length);
    if (!startPos || !endPos) return;
    if (startPos.node === endPos.node && startPos.offset === endPos.offset) return;
    if (startPos.node === endPos.node) {
      const range = document.createRange();
      range.setStart(startPos.node, startPos.offset);
      range.setEnd(endPos.node, endPos.offset);
      const wrapper = document.createElement("span");
      wrapper.className = "annotation-mark-temp";
      try {
        range.surroundContents(wrapper);
      } catch {
      }
      return;
    }
    try {
      const textNodes = [];
      const walker = document.createTreeWalker(el.reader, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while (node = walker.nextNode()) {
        const nodeRange = document.createRange();
        nodeRange.selectNode(node);
        const range = document.createRange();
        range.setStart(startPos.node, startPos.offset);
        range.setEnd(endPos.node, endPos.offset);
        const compareStart = range.compareBoundaryPoints(Range.END_TO_START, nodeRange);
        const compareEnd = range.compareBoundaryPoints(Range.START_TO_END, nodeRange);
        if (compareStart > 0 || compareEnd < 0) continue;
        const nodeStart = node === startPos.node ? startPos.offset : 0;
        const nodeEnd = node === endPos.node ? endPos.offset : node.nodeValue?.length || 0;
        if (nodeStart < nodeEnd) textNodes.push({ node, start: nodeStart, end: nodeEnd });
      }
      for (let i = textNodes.length - 1; i >= 0; i--) {
        const { node: node2, start, end } = textNodes[i];
        const nodeRange = document.createRange();
        nodeRange.setStart(node2, start);
        nodeRange.setEnd(node2, end);
        const wrapper = document.createElement("span");
        wrapper.className = "annotation-mark-temp";
        nodeRange.surroundContents(wrapper);
      }
    } catch {
    }
  }
  function getCommentThread(annotation) {
    ensureAnnotationThread(annotation);
    return annotation.thread || [];
  }
  function renderThreadListHTML(annotation, simple = false) {
    const thread = getCommentThread(annotation);
    const comment = thread[0];
    const replies = thread.slice(1);
    if (simple) {
      return \`
      <div class="annotation-note simple">\${escapeHtml(comment?.note || annotation.note || "\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09")}</div>
      \${replies.length > 0 ? \`<div class="annotation-reply-count">\\u56DE\\u590D \${replies.length}</div>\` : ""}
    \`;
    }
    const body = thread.map((item) => \`<div class="annotation-thread-line \${item.type === "reply" ? "is-reply" : ""}">\${escapeHtml(item.note)}</div>\`).join("");
    return body || '<div class="annotation-thread-line">\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09</div>';
  }
  function appendReply(annotationId, filePath, text) {
    const ann = state2.annotations.find((item) => item.id === annotationId);
    if (!ann) return;
    const note = text.trim();
    if (!note) return;
    const thread = getCommentThread(ann);
    const now = Date.now();
    thread.push({
      id: \`r-\${now}-\${Math.random().toString(16).slice(2, 8)}\`,
      type: "reply",
      note,
      createdAt: now
    });
    ann.thread = thread;
    ann.note = thread[0]?.note || ann.note;
    void replyAnnotationRemote(filePath, { id: annotationId }, note, "me").then((saved) => {
      if (state2.currentFilePath !== filePath) return;
      replaceAnnotationInState(saved);
      renderAnnotationList(filePath);
      applyAnnotations();
    }).catch((error) => {
      showError(\`\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25: \${error?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`, 2600);
    });
  }
  function autoResizeReplyInput(input) {
    input.style.height = "auto";
    const maxHeight = 160;
    const next = Math.min(maxHeight, Math.max(input.scrollHeight, 34));
    input.style.height = \`\${next}px\`;
    input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
  }
  function autoResizeComposerInput(input) {
    input.style.height = "auto";
    const maxHeight = 200;
    const next = Math.min(maxHeight, Math.max(input.scrollHeight, 34));
    input.style.height = \`\${next}px\`;
    input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
  }
  function showPopover(ann, x, y) {
    const el = getElements();
    if (!el.popover || !el.popoverTitle || !el.popoverNote) return;
    const snippet = ann.quote.substring(0, 22);
    el.popoverTitle.textContent = \`#\${ann.serial || 0} | \${snippet}\${ann.quote.length > 22 ? "..." : ""}\`;
    const threadHTML = renderThreadListHTML(ann, false);
    el.popoverNote.innerHTML = \`
    <div class="annotation-thread">\${threadHTML}</div>
    <div class="annotation-reply-entry" data-popover-reply-entry="\${ann.id}" role="button" tabindex="0">
      <textarea rows="1" data-popover-reply-input="\${ann.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9..."></textarea>
    </div>
  \`;
    if (el.popoverResolveBtn) {
      el.popoverResolveBtn.title = isResolved(ann) ? "\\u91CD\\u65B0\\u6253\\u5F00" : "\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3";
      el.popoverResolveBtn.setAttribute("aria-label", isResolved(ann) ? "\\u91CD\\u65B0\\u6253\\u5F00" : "\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3");
    }
    el.popover.style.left = \`\${Math.round(x)}px\`;
    el.popover.style.top = \`\${Math.round(y)}px\`;
    el.popover.classList.remove("hidden");
  }
  function syncPinnedPopoverPosition() {
    const id = state2.pinnedAnnotationId;
    if (!id) return;
    const mark = document.querySelector(\`[data-annotation-id="\${id}"]\`);
    if (!mark) return;
    const ann = state2.annotations.find((item) => item.id === id);
    if (!ann) return;
    const rect = mark.getBoundingClientRect();
    showPopover(ann, rect.right + 8, rect.top + 8);
  }
  function hidePopover(force = false) {
    const el = getElements();
    if (!el.popover) return;
    if (!force && state2.pinnedAnnotationId) return;
    el.popover.classList.add("hidden");
    if (force) {
      state2.pinnedAnnotationId = null;
    }
  }
  function savePendingAnnotation(filePath) {
    const el = getElements();
    if (!state2.pendingAnnotation || !el.composerNote) return;
    const pendingFilePath = state2.pendingAnnotationFilePath;
    if (!pendingFilePath || pendingFilePath !== filePath || pendingFilePath !== state2.currentFilePath) return;
    const note = el.composerNote.value.trim();
    if (!note) return;
    const now = Date.now();
    const ann = {
      ...state2.pendingAnnotation,
      serial: nextAnnotationSerial(state2.annotations),
      note,
      thread: [{
        id: \`c-\${now}-\${Math.random().toString(16).slice(2, 8)}\`,
        type: "comment",
        note,
        createdAt: now
      }]
    };
    state2.annotations.push(ann);
    persistAnnotation(filePath, ann, "\\u521B\\u5EFA\\u8BC4\\u8BBA\\u5931\\u8D25");
    hideComposer();
    applyAnnotations();
    renderAnnotationList(filePath);
  }
  function removeAnnotation(id, filePath) {
    const previous = state2.annotations.slice();
    state2.annotations = state2.annotations.filter((a) => a.id !== id);
    if (state2.pinnedAnnotationId === id) {
      state2.pinnedAnnotationId = null;
      hidePopover(true);
    }
    if (state2.activeAnnotationId === id) {
      state2.activeAnnotationId = null;
    }
    applyAnnotations();
    renderAnnotationList(filePath);
    void deleteAnnotationRemote(filePath, { id }).catch((error) => {
      state2.annotations = previous;
      showError(\`\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25: \${error?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`, 2600);
      applyAnnotations();
      renderAnnotationList(filePath);
    });
  }
  function jumpToAnnotation(id) {
    const el = getElements();
    if (!el.content) return;
    const mark = document.querySelector(\`[data-annotation-id="\${id}"]\`);
    if (mark) {
      const contentRect = el.content.getBoundingClientRect();
      const markRect = mark.getBoundingClientRect();
      const currentTop = el.content.scrollTop;
      const targetTop = currentTop + (markRect.top - contentRect.top);
      const topPadding = 56;
      const finalTop = Math.max(0, targetTop - topPadding);
      el.content.scrollTo({ top: finalTop, behavior: "smooth" });
    }
  }
  function setActiveAnnotation(id, filePath) {
    state2.activeAnnotationId = id;
    applyAnnotations();
    if (id) {
      jumpToAnnotation(id);
      state2.pinnedAnnotationId = id;
      requestAnimationFrame(() => {
        const ann = state2.annotations.find((item) => item.id === id);
        const mark = document.querySelector(\`[data-annotation-id="\${id}"]\`);
        if (!ann || !mark) return;
        const rect = mark.getBoundingClientRect();
        showPopover(ann, rect.right + 8, rect.top + 8);
      });
    }
    renderAnnotationList(filePath);
  }
  function jumpToRelative(id, delta, filePath) {
    const sorted = getVisibleAnnotations();
    const index = sorted.findIndex((item) => item.id === id);
    if (index < 0) return;
    const target = sorted[index + delta];
    if (!target) return;
    setActiveAnnotation(target.id, filePath);
  }
  function getAnnotationAnchorTopById(id) {
    const content = document.getElementById("content");
    const mark = document.querySelector(\`[data-annotation-id="\${id}"]\`);
    if (!content || !mark) return null;
    const contentRect = content.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();
    return content.scrollTop + (markRect.top - contentRect.top);
  }
  function syncAnnotationScrollWithContent() {
    if (state2.density !== "default") return;
    const content = document.getElementById("content");
    const list = document.getElementById("annotationList");
    if (!content || !list) return;
    list.scrollTop = content.scrollTop;
  }
  function toggleResolved(id, filePath) {
    const ann = state2.annotations.find((item) => item.id === id);
    if (!ann) return;
    const previousStatus = ann.status;
    if (ann.status === "resolved") {
      ann.status = (ann.confidence || 0) <= 0 ? "unanchored" : "anchored";
    } else {
      ann.status = "resolved";
    }
    const nextStatus = ann.status || "anchored";
    hidePopover(true);
    applyAnnotations();
    renderAnnotationList(filePath);
    void updateAnnotationStatusRemote(filePath, { id }, nextStatus).catch((error) => {
      ann.status = previousStatus;
      showError(\`\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${error?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`, 2600);
      applyAnnotations();
      renderAnnotationList(filePath);
    });
  }
  function decorateMark(wrapper, ann) {
    wrapper.classList.add("annotation-mark");
    wrapper.dataset.annotationId = ann.id;
    wrapper.classList.add(\`status-\${getAnchorTrack(ann)}\`);
    if (isResolved(ann)) {
      wrapper.classList.add("is-resolved");
    }
  }
  function applySingleAnnotation(ann) {
    const el = getElements();
    if (!el.reader) return;
    if (typeof ann.start !== "number" || typeof ann.length !== "number" || ann.length <= 0) return;
    const startPos = positionForGlobalOffset(el.reader, ann.start);
    const endPos = positionForGlobalOffset(el.reader, ann.start + ann.length);
    if (!startPos || !endPos) return;
    if (startPos.node === endPos.node && startPos.offset === endPos.offset) return;
    if (startPos.node === endPos.node) {
      const range = document.createRange();
      range.setStart(startPos.node, startPos.offset);
      range.setEnd(endPos.node, endPos.offset);
      const wrapper = document.createElement("span");
      decorateMark(wrapper, ann);
      try {
        range.surroundContents(wrapper);
      } catch (_err) {
      }
      return;
    }
    try {
      const textNodes = [];
      const walker = document.createTreeWalker(el.reader, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while (node = walker.nextNode()) {
        const nodeRange = document.createRange();
        nodeRange.selectNode(node);
        const range = document.createRange();
        range.setStart(startPos.node, startPos.offset);
        range.setEnd(endPos.node, endPos.offset);
        const compareStart = range.compareBoundaryPoints(Range.END_TO_START, nodeRange);
        const compareEnd = range.compareBoundaryPoints(Range.START_TO_END, nodeRange);
        if (compareStart > 0 || compareEnd < 0) continue;
        const nodeStart = node === startPos.node ? startPos.offset : 0;
        const nodeEnd = node === endPos.node ? endPos.offset : node.nodeValue?.length || 0;
        if (nodeStart < nodeEnd) {
          textNodes.push({ node, start: nodeStart, end: nodeEnd });
        }
      }
      for (let i = textNodes.length - 1; i >= 0; i--) {
        const { node: node2, start, end } = textNodes[i];
        const nodeRange = document.createRange();
        nodeRange.setStart(node2, start);
        nodeRange.setEnd(node2, end);
        const wrapper = document.createElement("span");
        decorateMark(wrapper, ann);
        nodeRange.surroundContents(wrapper);
      }
    } catch (_err) {
    }
  }
  function attachAnnotationEvents() {
    const el = getElements();
    if (!el.reader) return;
    el.reader.querySelectorAll(".annotation-mark").forEach((markEl) => {
      const id = markEl.getAttribute("data-annotation-id");
      const ann = state2.annotations.find((a) => a.id === id);
      if (!ann) return;
      markEl.classList.toggle("is-active", !!id && id === state2.activeAnnotationId);
      markEl.addEventListener("click", (event) => {
        event.stopPropagation();
        if (state2.pinnedAnnotationId === id) {
          state2.pinnedAnnotationId = null;
          hidePopover(true);
          return;
        }
        state2.activeAnnotationId = id;
        state2.pinnedAnnotationId = id;
        const rect = markEl.getBoundingClientRect();
        showPopover(ann, rect.right + 8, rect.top + 8);
        const filePath = getActiveAnnotationFilePath();
        renderAnnotationList(filePath || null);
      });
    });
  }
  function clearRenderedMarks() {
    const el = getElements();
    if (!el.reader) return;
    const marks = Array.from(el.reader.querySelectorAll(".annotation-mark"));
    for (const mark of marks) {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent?.insertBefore(mark.firstChild, mark);
      }
      parent?.removeChild(mark);
    }
  }
  function applyAnnotations() {
    const el = getElements();
    clearRenderedMarks();
    if (el.reader) {
      const text = getReaderText(el.reader);
      let changed = false;
      const changedAnnotations = [];
      for (const ann of state2.annotations) {
        const resolved = resolveAnnotationAnchor(text, ann);
        let annChanged = false;
        const nextStatus = resolved.status;
        if (ann.start !== resolved.start) {
          ann.start = resolved.start;
          changed = true;
          annChanged = true;
        }
        if (ann.length !== resolved.length) {
          ann.length = resolved.length;
          changed = true;
          annChanged = true;
        }
        const mergedStatus = mergeAnnotationStatus(ann.status, nextStatus);
        if ((ann.status || "anchored") !== mergedStatus) {
          ann.status = mergedStatus;
          changed = true;
          annChanged = true;
        }
        if (ann.confidence !== resolved.confidence) {
          ann.confidence = resolved.confidence;
          changed = true;
          annChanged = true;
        }
        if (annChanged) {
          changedAnnotations.push({ ...ann, thread: ann.thread ? [...ann.thread] : ann.thread });
        }
      }
      if (changed) {
        const currentFile = getActiveAnnotationFilePath();
        if (currentFile) {
          persistAnnotations(currentFile, changedAnnotations, "\\u540C\\u6B65\\u8BC4\\u8BBA\\u951A\\u70B9\\u5931\\u8D25");
        }
      }
    }
    const sorted = [...getVisibleAnnotations()].sort((a, b) => b.start - a.start);
    for (const ann of sorted) {
      applySingleAnnotation(ann);
    }
    attachAnnotationEvents();
  }
  function resolvePositionedAnnotationOverlaps(listEl, contentScrollHeight) {
    const canvas = listEl.querySelector(".annotation-canvas");
    if (!canvas) return;
    const items = Array.from(canvas.querySelectorAll(".annotation-item.positioned"));
    if (items.length === 0) return;
    const gap = 6;
    let previousBottom = 0;
    for (const item of items) {
      const rawAnchorTop = Number(item.getAttribute("data-anchor-top") || "0");
      const anchorTop = Number.isFinite(rawAnchorTop) ? Math.max(0, rawAnchorTop) : 0;
      const resolvedTop = Math.max(anchorTop, previousBottom > 0 ? previousBottom + gap : anchorTop);
      item.style.top = \`\${Math.round(resolvedTop)}px\`;
      previousBottom = resolvedTop + item.offsetHeight;
    }
    const minHeight = Math.max(0, contentScrollHeight);
    const neededHeight = Math.ceil(previousBottom + 24);
    canvas.style.height = \`\${Math.max(minHeight, neededHeight)}px\`;
  }
  function renderAnnotationList(filePath) {
    const el = getElements();
    if (!el.annotationList) return;
    updateAnnotationCount();
    updateControlState();
    if (!filePath || state2.annotations.length === 0) {
      el.annotationList.innerHTML = '<div class="annotation-empty">\\u65E0\\u8BC4\\u8BBA\\uFF08\\u9009\\u4E2D\\u6587\\u672C\\u5373\\u53EF\\u6DFB\\u52A0\\uFF09</div>';
      return;
    }
    const sorted = getVisibleAnnotations();
    if (sorted.length === 0) {
      el.annotationList.innerHTML = '<div class="annotation-empty">\\u5F53\\u524D\\u7B5B\\u9009\\u4E0B\\u65E0\\u8BC4\\u8BBA</div>';
      return;
    }
    const renderItem = (ann, index, positioned = false, top = 0) => \`
    <div class="annotation-item \${state2.activeAnnotationId === ann.id ? "is-active" : ""} status-\${getAnchorTrack(ann)}\${positioned ? " positioned" : ""}" data-annotation-id="\${ann.id}"\${positioned ? \` data-anchor-top="\${Math.max(0, Math.round(top))}" style="top:\${Math.max(0, Math.round(top))}px"\` : ""}>
      <div class="annotation-row-top">
        <div class="annotation-row-title">#\${ann.serial || index + 1} | \${escapeHtml(ann.quote.substring(0, 28))}\${ann.quote.length > 28 ? "..." : ""}</div>
        <div class="annotation-row-actions">
          <button class="annotation-icon-action" data-action="prev" data-id="\${ann.id}" title="\\u4E0A\\u4E00\\u6761">\${iconSvg("up")}</button>
          <button class="annotation-icon-action" data-action="next" data-id="\${ann.id}" title="\\u4E0B\\u4E00\\u6761">\${iconSvg("down")}</button>
          <button class="annotation-icon-action resolve" data-action="resolve" data-id="\${ann.id}" title="\${isResolved(ann) ? "\\u91CD\\u65B0\\u6253\\u5F00" : "\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"}">\${iconSvg("check")}</button>
          <button class="annotation-icon-action danger" data-action="delete" data-id="\${ann.id}" title="\\u5220\\u9664">\${iconSvg("trash")}</button>
        </div>
      </div>
      <div class="annotation-thread">\${renderThreadListHTML(ann, state2.density === "simple")}</div>
      \${state2.density === "simple" ? "" : \`
        <div class="annotation-reply-entry" data-reply-entry="\${ann.id}" role="button" tabindex="0">
          <textarea rows="1" data-reply-input="\${ann.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9..."></textarea>
        </div>
      \`}
    </div>
  \`;
    if (state2.density === "default") {
      const tops = sorted.map((ann) => getAnnotationAnchorTopById(ann.id));
      let maxTop = 0;
      const positionedHtml = sorted.map((ann, index) => {
        const top = tops[index] ?? index * 88;
        maxTop = Math.max(maxTop, top);
        return renderItem(ann, index, true, top);
      }).join("");
      const content = document.getElementById("content");
      const canvasHeight = Math.max(content?.scrollHeight || 0, maxTop + 180);
      el.annotationList.classList.add("default-mode");
      el.annotationList.innerHTML = \`<div class="annotation-canvas" style="height:\${canvasHeight}px">\${positionedHtml}</div>\`;
      resolvePositionedAnnotationOverlaps(el.annotationList, content?.scrollHeight || 0);
      syncAnnotationScrollWithContent();
    } else {
      el.annotationList.classList.remove("default-mode");
      el.annotationList.innerHTML = sorted.map((ann, index) => renderItem(ann, index)).join("");
    }
    el.annotationList.querySelectorAll(".annotation-icon-action").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const target = e.currentTarget;
        const action = target.getAttribute("data-action");
        const id = target.getAttribute("data-id");
        if (!id || !filePath) return;
        if (action === "prev") {
          jumpToRelative(id, -1, filePath);
        } else if (action === "next") {
          jumpToRelative(id, 1, filePath);
        } else if (action === "resolve") {
          toggleResolved(id, filePath);
        } else if (action === "delete") {
          removeAnnotation(id, filePath);
        }
      });
    });
    el.annotationList.querySelectorAll("[data-reply-entry]").forEach((entry) => {
      entry.addEventListener("click", (event) => {
        event.stopPropagation();
        const id = entry.getAttribute("data-reply-entry");
        if (!id) return;
        const input = el.annotationList?.querySelector(\`[data-reply-input="\${id}"]\`);
        if (!input) return;
        autoResizeReplyInput(input);
        input.focus();
      });
      entry.addEventListener("keydown", (event) => {
        const target = event.target;
        if (target instanceof HTMLTextAreaElement) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        const id = entry.getAttribute("data-reply-entry");
        if (!id) return;
        const input = el.annotationList?.querySelector(\`[data-reply-input="\${id}"]\`);
        if (!input) return;
        autoResizeReplyInput(input);
        input.focus();
      });
    });
    el.annotationList.querySelectorAll("[data-reply-input]").forEach((inputEl) => {
      const input = inputEl;
      autoResizeReplyInput(input);
      input.addEventListener("input", () => autoResizeReplyInput(input));
      input.addEventListener("click", (event) => event.stopPropagation());
      inputEl.addEventListener("keydown", (event) => {
        if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return;
        event.preventDefault();
        const input2 = event.currentTarget;
        const id = input2.getAttribute("data-reply-input");
        if (!id || !filePath) return;
        appendReply(id, filePath, input2.value);
        input2.value = "";
        renderAnnotationList(filePath);
      });
    });
    el.annotationList.querySelectorAll(".annotation-item").forEach((itemEl) => {
      itemEl.addEventListener("click", () => {
        const id = itemEl.getAttribute("data-annotation-id");
        if (!id || !filePath) return;
        setActiveAnnotation(id, filePath);
      });
    });
  }
  function handleSelectionForAnnotation(filePath) {
    const el = getElements();
    const renderedFilePath = el.content?.getAttribute("data-current-file");
    if (!filePath || !renderedFilePath || filePath !== renderedFilePath || !el.reader) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!el.reader.contains(range.commonAncestorContainer)) return;
    const quote = selection.toString().trim();
    if (!quote) return;
    const start = globalOffsetForPosition(el.reader, range.startContainer, range.startOffset);
    const end = globalOffsetForPosition(el.reader, range.endContainer, range.endOffset);
    if (start < 0 || end <= start) return;
    const fullText = getReaderText(el.reader);
    const prefixWindow = 32;
    const suffixWindow = 32;
    const quotePrefix = fullText.slice(Math.max(0, start - prefixWindow), start);
    const quoteSuffix = fullText.slice(end, Math.min(fullText.length, end + suffixWindow));
    const rect = range.getBoundingClientRect();
    showQuickAdd(rect.right + 6, rect.top - 8, {
      id: \`ann-\${Date.now()}-\${Math.random().toString(16).slice(2, 8)}\`,
      start,
      length: end - start,
      quote,
      quotePrefix,
      quoteSuffix,
      status: "anchored",
      confidence: 1
    });
  }
  function initAnnotationElements() {
    initAnnotationSidebarWidth();
    setSidebarCollapsed(true);
    document.getElementById("composerSaveBtn")?.addEventListener("click", () => {
      const filePath = getActiveAnnotationFilePath();
      if (filePath) savePendingAnnotation(filePath);
    });
    document.getElementById("composerCancelBtn")?.addEventListener("click", hideComposer);
    getElements().composerNote?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      const filePath = getActiveAnnotationFilePath();
      if (filePath) savePendingAnnotation(filePath);
    });
    getElements().composerNote?.addEventListener("input", (event) => {
      const input = event.currentTarget;
      autoResizeComposerInput(input);
    });
    getElements().quickAdd?.addEventListener("click", (event) => {
      event.stopPropagation();
      openComposerFromPending();
    });
    document.getElementById("popoverCloseBtn")?.addEventListener("click", () => {
      state2.pinnedAnnotationId = null;
      hidePopover(true);
    });
    document.getElementById("popoverDeleteBtn")?.addEventListener("click", () => {
      const filePath = getActiveAnnotationFilePath();
      const id = state2.pinnedAnnotationId;
      if (id && filePath) removeAnnotation(id, filePath);
    });
    document.getElementById("popoverResolveBtn")?.addEventListener("click", () => {
      const filePath = getActiveAnnotationFilePath();
      const id = state2.pinnedAnnotationId;
      if (id && filePath) toggleResolved(id, filePath);
    });
    document.getElementById("popoverPrevBtn")?.addEventListener("click", () => {
      const filePath = getActiveAnnotationFilePath();
      const id = state2.pinnedAnnotationId;
      if (id && filePath) jumpToRelative(id, -1, filePath);
    });
    document.getElementById("popoverNextBtn")?.addEventListener("click", () => {
      const filePath = getActiveAnnotationFilePath();
      const id = state2.pinnedAnnotationId;
      if (id && filePath) jumpToRelative(id, 1, filePath);
    });
    document.getElementById("annotationPopover")?.addEventListener("click", (event) => {
      const target = event.target;
      const filePath = getActiveAnnotationFilePath();
      if (!filePath) return;
      const entry = target.closest("[data-popover-reply-entry]");
      if (entry) {
        event.stopPropagation();
        const id = entry.getAttribute("data-popover-reply-entry");
        if (!id) return;
        const input2 = document.querySelector(\`[data-popover-reply-input="\${id}"]\`);
        if (!input2) return;
        autoResizeReplyInput(input2);
        input2.focus();
        return;
      }
      const input = target.closest("[data-popover-reply-input]");
      if (input) event.stopPropagation();
    });
    document.getElementById("annotationPopover")?.addEventListener("keydown", (event) => {
      const target = event.target;
      if (target instanceof HTMLTextAreaElement) return;
      const entry = target.closest("[data-popover-reply-entry]");
      if (!entry) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      const id = entry.getAttribute("data-popover-reply-entry");
      if (!id) return;
      const input = document.querySelector(\`[data-popover-reply-input="\${id}"]\`);
      if (!input) return;
      autoResizeReplyInput(input);
      input.focus();
    });
    document.getElementById("annotationPopover")?.addEventListener("keydown", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement)) return;
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return;
      const id = target.getAttribute("data-popover-reply-input");
      const filePath = getActiveAnnotationFilePath();
      if (!id || !filePath) return;
      event.preventDefault();
      appendReply(id, filePath, target.value);
      target.value = "";
      const ann = state2.annotations.find((item) => item.id === id);
      const mark = document.querySelector(\`[data-annotation-id="\${id}"]\`);
      const rect = mark?.getBoundingClientRect();
      if (ann) showPopover(ann, rect ? rect.right + 8 : 120, rect ? rect.top + 8 : 120);
      renderAnnotationList(filePath);
    });
    document.getElementById("annotationPopover")?.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement)) return;
      if (!target.hasAttribute("data-popover-reply-input")) return;
      autoResizeReplyInput(target);
    });
    getElements().filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach((node) => {
      node.addEventListener("click", () => {
        const next = node.getAttribute("data-filter");
        if (!next) return;
        state2.filter = next;
        getElements().filterMenu?.classList.add("hidden");
        const currentFile = getActiveAnnotationFilePath();
        applyAnnotations();
        renderAnnotationList(currentFile || null);
      });
    });
    getElements().filterToggle?.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = getElements().filterMenu;
      if (!menu) return;
      menu.classList.toggle("hidden");
    });
    getElements().densityToggle?.addEventListener("click", () => {
      state2.density = state2.density === "default" ? "simple" : "default";
      localStorage.setItem("md-viewer:annotation-density", state2.density);
      const currentFile = getActiveAnnotationFilePath();
      renderAnnotationList(currentFile || null);
    });
    getElements().closeToggle?.addEventListener("click", () => {
      closeAnnotationSidebar();
    });
    getElements().floatingOpenBtn?.addEventListener("click", () => {
      openAnnotationSidebar();
    });
    getElements().sidebarResizer?.addEventListener("mousedown", (event) => {
      if (getElements().sidebar?.classList.contains("collapsed")) return;
      event.preventDefault();
      const root = document.documentElement;
      const currentWidth = Number(getComputedStyle(root).getPropertyValue("--annotation-sidebar-width").replace("px", "")) || ANNOTATION_WIDTH_DEFAULT;
      const startX = event.clientX;
      document.body.classList.add("annotation-sidebar-resizing");
      const onMove = (moveEvent) => {
        const delta = startX - moveEvent.clientX;
        setAnnotationSidebarWidth(currentWidth + delta);
        syncAnnotationSidebarLayout();
      };
      const onUp = () => {
        document.body.classList.remove("annotation-sidebar-resizing");
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
    document.getElementById("content")?.addEventListener("scroll", () => {
      hideQuickAdd(true);
      syncAnnotationScrollWithContent();
      syncPinnedPopoverPosition();
    });
    window.addEventListener("resize", () => {
      syncAnnotationSidebarLayout();
      syncPinnedPopoverPosition();
    });
    window.openAnnotationSidebar = openAnnotationSidebar;
    window.closeAnnotationSidebar = closeAnnotationSidebar;
    window.toggleAnnotationSidebar = toggleAnnotationSidebar;
    document.addEventListener("mousedown", (event) => {
      const target = event.target;
      const els = getElements();
      if (els.composer && !els.composer.contains(target) && !(els.quickAdd && els.quickAdd.contains(target))) {
        hideComposer();
      }
      if (els.popover && !els.popover.contains(target) && !target.closest(".annotation-mark")) {
        state2.pinnedAnnotationId = null;
        hidePopover(true);
      }
      if (els.filterMenu && !els.filterMenu.classList.contains("hidden") && !els.filterMenu.contains(target) && !target.closest("#annotationFilterToggle")) {
        els.filterMenu.classList.add("hidden");
      }
      if (els.quickAdd && !els.quickAdd.classList.contains("hidden") && !els.quickAdd.contains(target) && !target.closest("#annotationComposer")) {
        hideQuickAdd(true);
      }
    });
    getElements().composerHeader?.addEventListener("mousedown", (event) => {
      if (event.target.closest(".annotation-row-actions")) return;
      const composer = getElements().composer;
      if (!composer) return;
      const rect = composer.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const baseLeft = rect.left;
      const baseTop = rect.top;
      event.preventDefault();
      const onMove = (moveEvent) => {
        const nextLeft = baseLeft + (moveEvent.clientX - startX);
        const nextTop = baseTop + (moveEvent.clientY - startY);
        placeFloating(composer, nextLeft, nextTop);
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });
  }
  var ANNOTATION_WIDTH_KEY, ANNOTATION_WIDTH_DEFAULT, ANNOTATION_WIDTH_MIN, ANNOTATION_WIDTH_MAX, state2, ANNOTATION_PANEL_OPEN_BY_FILE_KEY;
  var init_annotation = __esm({
    "src/client/annotation.ts"() {
      "use strict";
      init_escape();
      init_annotations();
      init_toast();
      init_annotation_anchor();
      ANNOTATION_WIDTH_KEY = "md-viewer:annotation-sidebar-width";
      ANNOTATION_WIDTH_DEFAULT = 320;
      ANNOTATION_WIDTH_MIN = 260;
      ANNOTATION_WIDTH_MAX = 540;
      state2 = {
        annotations: [],
        pendingAnnotation: null,
        pendingAnnotationFilePath: null,
        pinnedAnnotationId: null,
        activeAnnotationId: null,
        currentFilePath: null,
        filter: "open",
        density: getInitialDensity()
      };
      ANNOTATION_PANEL_OPEN_BY_FILE_KEY = "md-viewer:annotation-panel-open-by-file";
    }
  });

  // src/client/ui/sidebar.ts
  var sidebar_exports = {};
  __export(sidebar_exports, {
    renderCurrentPath: () => renderCurrentPath,
    renderFiles: () => renderFiles,
    renderSearchBox: () => renderSearchBox,
    renderSidebar: () => renderSidebar,
    renderTabs: () => renderTabs,
    toggleSidebarMode: () => toggleSidebarMode
  });
  function scrollCurrentFileIntoView(container) {
    if (!state.currentFile) return;
    if (hasAutoAnchoredCurrentFile) return;
    requestAnimationFrame(() => {
      const currentItem = container.querySelector(".file-item.current, .tree-item.current");
      if (!currentItem) return;
      const targetScrollTop = currentItem.offsetTop - container.clientHeight * 0.4;
      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      const clampedTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
      container.scrollTo({ top: clampedTop, behavior: "auto" });
      hasAutoAnchoredCurrentFile = true;
    });
  }
  function toggleSidebarMode() {
    state.config.sidebarMode = state.config.sidebarMode === "workspace" ? "simple" : "workspace";
    saveConfig(state.config);
    renderSidebar();
  }
  function touchTabAccess(path) {
    if (!path) return;
    const index = tabAccessOrder.indexOf(path);
    if (index >= 0) tabAccessOrder.splice(index, 1);
    tabAccessOrder.unshift(path);
    if (tabAccessOrder.length > 300) tabAccessOrder.length = 300;
  }
  function getTabRecentRank(path) {
    const index = tabAccessOrder.indexOf(path);
    return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
  }
  function toggleTabManager() {
    tabManagerOpen = !tabManagerOpen;
    renderTabs();
  }
  function closeTabManager() {
    if (!tabManagerOpen) return;
    tabManagerOpen = false;
    renderTabs();
  }
  function setTabManagerQuery(query) {
    tabManagerQuery = (query || "").trimStart();
    if (!tabManagerOpen) tabManagerOpen = true;
    renderTabs();
  }
  function setTabManagerSort(sort) {
    tabManagerSort = sort === "name" ? "name" : "recent";
    renderTabs();
  }
  function ensureTabManagerGlobalEvents() {
    if (tabManagerGlobalBound) return;
    tabManagerGlobalBound = true;
    document.addEventListener("click", (event) => {
      if (!tabManagerOpen) return;
      const target = event.target;
      if (target?.closest(".tab-manager-wrap")) return;
      closeTabManager();
    });
  }
  function ensureTabsScrollHandler() {
    if (tabsScrollHandlerBound) return;
    tabsScrollHandlerBound = true;
    const container = document.getElementById("tabs");
    if (!container) return;
    container.addEventListener("scroll", (event) => {
      const target = event.target;
      if (target.classList.contains("tabs-scroll")) {
        tabsScrollLeft = target.scrollLeft;
      } else if (target.classList.contains("tab-manager-list")) {
        tabManagerListScrollTop = target.scrollTop;
      }
    }, { passive: true, capture: true });
  }
  function applyTabBatchAction(action) {
    const filesWithDisplay = generateDistinctNames(state.sessionFiles);
    const targets = getTabBatchTargets(
      action,
      filesWithDisplay,
      state.currentFile,
      (path) => {
        const file = filesWithDisplay.find((f) => f.path === path);
        if (!file) return false;
        const status = getFileListStatus(file, hasListDiff(file.path));
        return status.type === "normal" || status.type === "new";
      }
    );
    const removeHandler = window.removeFile;
    if (!removeHandler || targets.length === 0) {
      renderTabs();
      return;
    }
    targets.forEach((path) => removeHandler(path));
  }
  function rerenderByMode() {
    if (state.config.sidebarMode === "workspace") {
      renderSidebar();
      return;
    }
    renderFiles();
  }
  function looksLikePathInput(value) {
    const v = value.trim();
    if (!v) return false;
    if (/^https?:\\/\\//i.test(v)) return true;
    if (v.startsWith("/") || v.startsWith("~/") || v.startsWith("./") || v.startsWith("../")) return true;
    if (v.includes("/") || v.includes("\\\\")) return true;
    if (/\\.[a-zA-Z0-9]{1,10}\$/.test(v)) return true;
    return false;
  }
  function renderSearchBox() {
    const container = document.getElementById("searchBox");
    if (!container) return;
    let input = container.querySelector("#searchInput");
    let clearBtn = container.querySelector("#searchClear");
    if (!input || !clearBtn) {
      container.innerHTML = \`
      <div class="search-wrapper">
        <span class="search-icon">\\u{1F50D}</span>
        <input
          type="text"
          class="search-input"
          placeholder="\\u641C\\u7D22\\u6216\\u8F93\\u5165\\u8DEF\\u5F84\\uFF08Enter\\u8865\\u5168\\uFF0CCmd/Ctrl+Enter\\u6DFB\\u52A0\\uFF09"
          id="searchInput"
        />
        <button class="search-clear" id="searchClear">\\xD7</button>
      </div>
    \`;
      input = container.querySelector("#searchInput");
      clearBtn = container.querySelector("#searchClear");
      if (!input || !clearBtn) return;
      attachPathAutocomplete(input, {
        kind: "file",
        markdownOnly: false,
        shouldActivate: looksLikePathInput
      });
      input.addEventListener("input", (e) => {
        window.dismissQuickActionConfirm?.();
        const query = e.target.value;
        lastEscAt = 0;
        lastEscValue = "";
        setSearchQuery(query);
        if (clearBtn) {
          clearBtn.style.display = query ? "block" : "none";
        }
        rerenderByMode();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          input.dispatchEvent(new Event("path-autocomplete-hide"));
          window.handleUnifiedInputSubmit?.(input.value);
          return;
        }
        if (e.defaultPrevented) {
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          input.dispatchEvent(new Event("path-autocomplete-hide"));
          window.handleUnifiedInputSubmit?.(input.value);
        }
        if (e.key === "Escape") {
          window.dismissQuickActionConfirm?.();
          const now = Date.now();
          const currentValue = input.value;
          const isDoubleEsc = now - lastEscAt < 900 && lastEscValue === currentValue;
          if (isDoubleEsc && currentValue) {
            setSearchQuery("");
            input.value = "";
            if (clearBtn) clearBtn.style.display = "none";
            rerenderByMode();
            lastEscAt = 0;
            lastEscValue = "";
            e.preventDefault();
            return;
          }
          lastEscAt = now;
          lastEscValue = currentValue;
        }
      });
      clearBtn.addEventListener("click", () => {
        setSearchQuery("");
        if (input) {
          input.value = "";
        }
        clearBtn.style.display = "none";
        rerenderByMode();
        input?.focus();
      });
    }
    if (document.activeElement !== input && input.value !== state.searchQuery) {
      input.value = state.searchQuery;
    }
    clearBtn.style.display = state.searchQuery ? "block" : "none";
  }
  function renderCurrentPath() {
    const container = document.getElementById("currentPath");
    if (!container) return;
    container.innerHTML = "";
    container.style.display = "none";
  }
  function renderModeSwitchRow() {
    const container = document.getElementById("modeSwitchRow");
    if (!container) return;
    const isWorkspace = state.config.sidebarMode === "workspace";
    const label = isWorkspace ? "\\u5DE5\\u4F5C\\u533A" : "\\u6587\\u4EF6";
    const title = isWorkspace ? "\\u5207\\u6362\\u5230\\u7B80\\u5355\\u6A21\\u5F0F" : "\\u5207\\u6362\\u5230\\u5DE5\\u4F5C\\u533A\\u6A21\\u5F0F";
    container.innerHTML = \`
    <div class="mode-switch-row">
      <button
        class="mode-switch-icon"
        title="\${title}"
        aria-label="\${title}"
        onclick="window.toggleSidebarMode()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 3l4 4l-4 4"></path>
          <path d="M10 7l10 0"></path>
          <path d="M8 13l-4 4l4 4"></path>
          <path d="M4 17l9 0"></path>
        </svg>
      </button>
      <span class="mode-switch-label">\${label}</span>
    </div>
  \`;
  }
  function renderFiles() {
    const container = document.getElementById("fileList");
    if (!container) return;
    if (state.sessionFiles.size === 0) {
      container.innerHTML = '<div class="empty-tip">\\u70B9\\u51FB\\u4E0A\\u65B9\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6</div>';
      return;
    }
    const filteredFiles = getFilteredFiles();
    if (filteredFiles.length === 0) {
      container.innerHTML = '<div class="empty-tip">\\u672A\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6</div>';
      return;
    }
    const filteredMap = new Map(filteredFiles.map((f) => [f.path, f]));
    const filesWithDisplay = generateDistinctNames(filteredMap);
    container.innerHTML = filesWithDisplay.map((file) => {
      const isCurrent = file.path === state.currentFile;
      const isMissing = file.isMissing || false;
      const typeIcon = getFileTypeIcon(file.path);
      const classes = [
        "file-item",
        isCurrent ? "current" : "",
        isMissing ? "deleted" : ""
      ].filter(Boolean).join(" ");
      let displayName = file.displayName || file.name;
      const query = state.searchQuery.toLowerCase().trim();
      if (query) {
        const index = displayName.toLowerCase().indexOf(query);
        if (index !== -1) {
          const before = displayName.substring(0, index);
          const match = displayName.substring(index, index + query.length);
          const after = displayName.substring(index + query.length);
          displayName = \`\${before}<mark class="search-highlight">\${match}</mark>\${after}\`;
        }
      }
      const status = getFileListStatus(file, hasListDiff(file.path));
      let statusBadge = "&nbsp;";
      if (status.badge === "dot") {
        statusBadge = '<span class="new-dot"></span>';
      } else if (status.badge) {
        statusBadge = \`<span class="status-badge status-\${status.type}" style="color: \${status.color}">\${status.badge}</span>\`;
      }
      return \`
      <div class="\${classes}"
           onclick="window.switchFile('\${escapeAttr(file.path)}')">
        <span class="file-type-icon \${typeIcon.cls}">\${escapeHtml(typeIcon.label)}</span>
        <span class="name">\${displayName}</span>
        <span class="file-item-status">\${statusBadge}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('\${escapeAttr(file.path)}')">\\xD7</span>
      </div>
    \`;
    }).join("");
    scrollCurrentFileIntoView(container);
  }
  function renderSidebar() {
    const mode = state.config.sidebarMode;
    const container = document.querySelector(".sidebar");
    if (container) {
      container.classList.toggle("workspace-mode", mode === "workspace");
    }
    renderSearchBox();
    renderModeSwitchRow();
    if (mode === "workspace") {
      renderCurrentPath();
      if (!container) return;
      let fileListContainer = document.getElementById("fileList");
      if (!fileListContainer) {
        fileListContainer = document.createElement("div");
        fileListContainer.id = "fileList";
        fileListContainer.className = "file-list";
        container.appendChild(fileListContainer);
      }
      fileListContainer.innerHTML = renderWorkspaceSidebar();
      bindWorkspaceEvents();
      scrollCurrentFileIntoView(fileListContainer);
    } else {
      renderCurrentPath();
      renderFiles();
    }
    renderTabs();
  }
  function renderTabs() {
    const allFiles = Array.from(state.sessionFiles.values());
    const container = document.getElementById("tabs");
    if (!container) return;
    ensureTabManagerGlobalEvents();
    ensureTabsScrollHandler();
    const prevList = container.querySelector(".tab-manager-list");
    if (prevList) {
      tabManagerListScrollTop = prevList.scrollTop;
    }
    const prevTabsScroll = container.querySelector(".tabs-scroll");
    if (prevTabsScroll) {
      tabsScrollLeft = prevTabsScroll.scrollLeft;
    }
    if (allFiles.length === 0) {
      container.innerHTML = "";
      container.style.display = "none";
      tabManagerOpen = false;
      lastTabsRenderKey = "";
      return;
    }
    const filesWithDisplay = generateDistinctNames(state.sessionFiles);
    const tabsRenderSnapshot = filesWithDisplay.map((file) => {
      const status = getFileListStatus(file, hasListDiff(file.path));
      return [
        file.path,
        file.displayName || file.name,
        file.isMissing ? "1" : "0",
        file.path === state.currentFile ? "1" : "0",
        status.type,
        status.badge || ""
      ].join("|");
    }).join("||");
    const nextTabsRenderKey = [
      state.currentFile || "",
      tabManagerOpen ? "1" : "0",
      tabManagerSort,
      tabManagerQuery,
      tabsRenderSnapshot
    ].join("###");
    if (nextTabsRenderKey === lastTabsRenderKey) {
      return;
    }
    lastTabsRenderKey = nextTabsRenderKey;
    touchTabAccess(state.currentFile);
    container.style.display = "flex";
    const tabsHtml = filesWithDisplay.map((file) => {
      const isCurrent = file.path === state.currentFile;
      const isMissing = file.isMissing || false;
      const classes = ["tab"];
      if (isCurrent) classes.push("active");
      if (isMissing) classes.push("deleted");
      return \`
        <div class="\${classes.join(" ")}"
             onclick="window.switchFile('\${escapeAttr(file.path)}')">
          <span class="tab-name">\${escapeHtml(file.displayName)}</span>
          <span class="tab-close" onclick="event.stopPropagation();window.removeFile('\${escapeAttr(file.path)}')">\\xD7</span>
        </div>
      \`;
    }).join("");
    const query = tabManagerQuery.toLowerCase().trim();
    const managedFiles = filesWithDisplay.filter((file) => {
      const displayName = file.displayName || file.name;
      if (!query) return true;
      return displayName.toLowerCase().includes(query) || file.path.toLowerCase().includes(query);
    }).sort((a, b) => {
      const nameA = a.displayName || a.name;
      const nameB = b.displayName || b.name;
      if (tabManagerSort === "name") {
        return nameA.localeCompare(nameB, "zh-CN");
      }
      const recentDiff = getTabRecentRank(a.path) - getTabRecentRank(b.path);
      if (recentDiff !== 0) return recentDiff;
      return nameA.localeCompare(nameB, "zh-CN");
    });
    const managerListHtml = managedFiles.length === 0 ? '<div class="tab-manager-empty">\\u6CA1\\u6709\\u5339\\u914D\\u7684\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6</div>' : managedFiles.map((file) => {
      const displayName = file.displayName || file.name;
      const isCurrent = file.path === state.currentFile;
      const status = getFileListStatus(file, hasListDiff(file.path));
      const statusBadge = status.badge ? \`<span class="tab-manager-status status-\${status.type}">\${escapeHtml(status.badge)}</span>\` : "";
      return \`
          <div class="tab-manager-item \${isCurrent ? "active" : ""}" onclick="window.switchFile('\${escapeAttr(file.path)}')">
            <span class="tab-manager-name" title="\${escapeAttr(file.path)}">\${escapeHtml(displayName)}</span>
            <span class="tab-manager-actions">
              \${statusBadge}
              <button class="tab-manager-close" type="button" title="\\u5173\\u95ED" onclick="event.stopPropagation();window.removeFile('\${escapeAttr(file.path)}')">\\xD7</button>
            </span>
          </div>
        \`;
    }).join("");
    const batchCount = {
      others: getTabBatchTargets("close-others", filesWithDisplay, state.currentFile, () => false).length,
      right: getTabBatchTargets("close-right", filesWithDisplay, state.currentFile, () => false).length,
      unmodified: getTabBatchTargets("close-unmodified", filesWithDisplay, state.currentFile, (path) => {
        const file = filesWithDisplay.find((f) => f.path === path);
        if (!file) return false;
        const status = getFileListStatus(file, hasListDiff(file.path));
        return status.type === "normal" || status.type === "new";
      }).length,
      all: getTabBatchTargets("close-all", filesWithDisplay, state.currentFile, () => false).length
    };
    container.innerHTML = \`
    <div class="tabs-scroll">\${tabsHtml}</div>
    <div class="tab-manager-wrap">
      <button class="tab-manager-toggle \${tabManagerOpen ? "active" : ""}" type="button" onclick="event.stopPropagation();window.toggleTabManager()">\\u2261 Tabs (\${filesWithDisplay.length})</button>
      <div class="tab-manager-panel \${tabManagerOpen ? "show" : ""}" onclick="event.stopPropagation()">
        <div class="tab-manager-row tab-manager-actions-row">
          <button class="tab-manager-action" type="button" data-action="close-others" onclick="window.applyTabBatchAction('close-others')">\\u5173\\u95ED\\u5176\\u4ED6 (\${batchCount.others})</button>
          <button class="tab-manager-action" type="button" data-action="close-right" onclick="window.applyTabBatchAction('close-right')">\\u5173\\u95ED\\u53F3\\u4FA7 (\${batchCount.right})</button>
          <button class="tab-manager-action" type="button" data-action="close-unmodified" onclick="window.applyTabBatchAction('close-unmodified')">\\u5173\\u95ED\\u672A\\u4FEE\\u6539 (\${batchCount.unmodified})</button>
          <button class="tab-manager-action danger" type="button" data-action="close-all" onclick="window.applyTabBatchAction('close-all')">\\u5173\\u95ED\\u5168\\u90E8 (\${batchCount.all})</button>
        </div>
        <div class="tab-manager-row">
          <input class="tab-manager-search" placeholder="\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6" value="\${escapeAttr(tabManagerQuery)}" oninput="window.setTabManagerQuery(this.value)">
        </div>
        <div class="tab-manager-row">
          <button class="tab-manager-sort \${tabManagerSort === "recent" ? "active" : ""}" type="button" onclick="window.setTabManagerSort('recent')">\\u6700\\u8FD1\\u4F7F\\u7528</button>
          <button class="tab-manager-sort \${tabManagerSort === "name" ? "active" : ""}" type="button" onclick="window.setTabManagerSort('name')">\\u6309\\u540D\\u79F0</button>
        </div>
        <div class="tab-manager-list">\${managerListHtml}</div>
      </div>
    </div>
  \`;
    requestAnimationFrame(() => {
      const listEl = container.querySelector(".tab-manager-list");
      if (listEl && tabManagerListScrollTop > 0) {
        listEl.scrollTop = tabManagerListScrollTop;
      }
      const tabsScrollEl = container.querySelector(".tabs-scroll");
      if (tabsScrollEl && tabsScrollLeft > 0) {
        tabsScrollEl.scrollLeft = tabsScrollLeft;
      }
      syncAnnotationSidebarLayout();
    });
  }
  var lastEscAt, lastEscValue, hasAutoAnchoredCurrentFile, tabManagerOpen, tabManagerQuery, tabManagerSort, tabManagerGlobalBound, tabManagerListScrollTop, tabsScrollLeft, tabsScrollHandlerBound, lastTabsRenderKey, tabAccessOrder;
  var init_sidebar = __esm({
    "src/client/ui/sidebar.ts"() {
      "use strict";
      init_state();
      init_workspace_state();
      init_config();
      init_escape();
      init_file_names();
      init_file_status();
      init_file_type();
      init_tab_batch();
      init_sidebar_workspace();
      init_annotation();
      init_path_autocomplete();
      lastEscAt = 0;
      lastEscValue = "";
      hasAutoAnchoredCurrentFile = false;
      tabManagerOpen = false;
      tabManagerQuery = "";
      tabManagerSort = "recent";
      tabManagerGlobalBound = false;
      tabManagerListScrollTop = 0;
      tabsScrollLeft = 0;
      tabsScrollHandlerBound = false;
      lastTabsRenderKey = "";
      tabAccessOrder = [];
      if (typeof window !== "undefined") {
        window.toggleSidebarMode = toggleSidebarMode;
        window.toggleTabManager = toggleTabManager;
        window.setTabManagerQuery = setTabManagerQuery;
        window.setTabManagerSort = setTabManagerSort;
        window.applyTabBatchAction = applyTabBatchAction;
      }
    }
  });

  // src/client/ui/settings.ts
  function showSettingsDialog() {
    const overlay = document.getElementById("settingsDialogOverlay");
    if (!overlay) {
      createSettingsDialog();
    }
    renderSettingsDialog();
    const overlayEl = document.getElementById("settingsDialogOverlay");
    if (overlayEl) {
      overlayEl.classList.add("show");
    }
  }
  function createSettingsDialog() {
    const overlay = document.createElement("div");
    overlay.id = "settingsDialogOverlay";
    overlay.className = "sync-dialog-overlay";
    overlay.innerHTML = \`
    <div class="sync-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">\\u8BBE\\u7F6E</div>
        <button class="sync-dialog-close" onclick="closeSettingsDialog()">\\xD7</button>
      </div>
      <div class="sync-dialog-body" id="settingsDialogBody">
        <!-- \\u52A8\\u6001\\u5185\\u5BB9 -->
      </div>
      <div class="sync-dialog-footer">
        <button class="sync-dialog-button" onclick="closeSettingsDialog()">\\u53D6\\u6D88</button>
        <button class="sync-dialog-button primary" onclick="saveSettings()">\\u4FDD\\u5B58</button>
      </div>
    </div>
  \`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeSettingsDialog();
      }
    });
  }
  function renderSettingsDialog() {
    const body = document.getElementById("settingsDialogBody");
    if (!body) return;
    const snapshot = getClientStateSnapshot();
    body.innerHTML = \`
    <div class="settings-section">
      <div class="settings-section-title">\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001</div>
      <div class="settings-section-desc">\\u7528\\u4E8E\\u6392\\u67E5\\u672C\\u5730\\u7F13\\u5B58\\u662F\\u5426\\u810F\\u6570\\u636E\\uFF0C\\u53EF\\u76F4\\u63A5\\u6E05\\u7406\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u5F53\\u524D\\u6587\\u4EF6</div><div>\${escapeHtml3(snapshot.currentFile || "\\u65E0")}</div>
        <div>\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6\\u6570</div><div>\${snapshot.openFilesCount}</div>
        <div>\\u5DE5\\u4F5C\\u533A\\u6570</div><div>\${snapshot.workspaceCount}</div>
        <div>\\u8BC4\\u8BBA\\u76F8\\u5173\\u672C\\u5730\\u952E\\u6570</div><div>\${snapshot.commentStateKeyCount}</div>
        <div>md-viewer \\u672C\\u5730\\u952E\\u6570</div><div>\${snapshot.mdvKeyCount}</div>
        <div>localStorage \\u603B\\u952E\\u6570</div><div>\${snapshot.localStorageKeyCount}</div>
      </div>
      <div class="settings-key-list">
        \${snapshot.mdvKeys.map((key) => \`<span class="settings-key-chip">\${escapeHtml3(key)}</span>\`).join("")}
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">\\u6570\\u636E\\u6E05\\u7406</div>
      <div class="settings-section-desc">\\u8BC4\\u8BBA\\u72B6\\u6001\\u6E05\\u7406\\u4F1A\\u540C\\u65F6\\u5220\\u9664\\u670D\\u52A1\\u7AEF SQLite \\u8BC4\\u8BBA\\u6570\\u636E\\u548C\\u5BA2\\u6237\\u7AEF\\u8BC4\\u8BBA\\u76F8\\u5173\\u72B6\\u6001\\uFF0C\\u968F\\u540E\\u81EA\\u52A8\\u5237\\u65B0\\u9875\\u9762\\u3002</div>
      <div class="settings-actions-row">
        <button class="sync-dialog-button" id="clearAllCommentsBtn">\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001</button>
        <button class="sync-dialog-button" id="clearClientStateBtn">\\u6E05\\u7406\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001</button>
      </div>
    </div>
  \`;
    const clearClientStateBtn = document.getElementById("clearClientStateBtn");
    clearClientStateBtn?.addEventListener("click", () => {
      clearClientState();
    });
    const clearAllCommentsBtn = document.getElementById("clearAllCommentsBtn");
    clearAllCommentsBtn?.addEventListener("click", () => {
      void clearAllComments();
    });
  }
  function closeSettingsDialog() {
    const overlay = document.getElementById("settingsDialogOverlay");
    if (overlay) {
      overlay.classList.remove("show");
    }
  }
  function saveSettings() {
    saveConfig(state.config);
    renderSidebar();
    closeSettingsDialog();
  }
  function getClientStateSnapshot() {
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }
    allKeys.sort();
    const mdvKeys = allKeys.filter((key) => key.startsWith("md-viewer:"));
    const commentStateKeyCount = mdvKeys.filter((key) => key === "md-viewer:annotation-panel-open-by-file" || key === "md-viewer:annotation-density" || key === "md-viewer:annotation-sidebar-width" || key.startsWith("md-viewer:annotations:")).length;
    return {
      currentFile: state.currentFile,
      openFilesCount: state.sessionFiles.size,
      workspaceCount: state.config.workspaces.length,
      commentStateKeyCount,
      mdvKeyCount: mdvKeys.length,
      localStorageKeyCount: allKeys.length,
      mdvKeys
    };
  }
  function clearClientState() {
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("md-viewer:")) toDelete.push(key);
    }
    for (const key of toDelete) {
      localStorage.removeItem(key);
    }
    showSuccess(\`\\u5DF2\\u6E05\\u7406\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001\\uFF08\${toDelete.length} \\u9879\\uFF09\`, 1800);
    window.setTimeout(() => window.location.reload(), 250);
  }
  async function clearAllComments() {
    try {
      const response = await fetch("/api/annotations/clear", { method: "POST" });
      const data = await response.json();
      if (!response.ok || data?.success !== true) {
        throw new Error(data?.error || \`HTTP \${response.status}\`);
      }
      const keysToDelete = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith("md-viewer:annotations:")) keysToDelete.push(key);
        if (key === "md-viewer:annotation-panel-open-by-file") keysToDelete.push(key);
        if (key === "md-viewer:annotation-density") keysToDelete.push(key);
        if (key === "md-viewer:annotation-sidebar-width") keysToDelete.push(key);
      }
      for (const key of keysToDelete) {
        localStorage.removeItem(key);
      }
      showSuccess(\`\\u5DF2\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\uFF08\\u670D\\u52A1\\u7AEF \${data?.deleted || 0} \\u6761\\uFF0C\\u672C\\u5730 \${keysToDelete.length} \\u9879\\uFF09\`, 1800);
      window.setTimeout(() => window.location.reload(), 250);
    } catch (error) {
      showError(\`\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${error?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`, 2600);
    }
  }
  function escapeHtml3(input) {
    return String(input || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var init_settings = __esm({
    "src/client/ui/settings.ts"() {
      "use strict";
      init_state();
      init_config();
      init_sidebar();
      init_toast();
      if (typeof window !== "undefined") {
        window.closeSettingsDialog = closeSettingsDialog;
        window.saveSettings = saveSettings;
      }
    }
  });

  // src/client/main.ts
  var main_exports = {};
  __export(main_exports, {
    renderAll: () => renderAll
  });
  function syncAnnotationsForCurrentFile(force = false) {
    const nextPath = state.currentFile && !isHtmlPath(state.currentFile) ? state.currentFile : null;
    const currentAnnotationFilePath = getAnnotationCurrentFilePath();
    if (force || nextPath !== currentAnnotationFilePath) {
      setAnnotations(nextPath);
    }
    applyAnnotations();
    renderAnnotationList(nextPath);
  }
  async function onFileLoaded(data, focus = false) {
    const previousFile = state.currentFile;
    const shouldFocus = focus && !isHtmlPath(data.path);
    addOrUpdateFile(data, shouldFocus);
    if (shouldFocus && state.config.sidebarMode === "workspace") {
      await revealFileInWorkspace(data.path);
    }
    if (shouldFocus && previousFile !== data.path) {
    }
    renderSidebar();
    renderContent();
    syncAnnotationsForCurrentFile(shouldFocus && previousFile !== data.path);
    if (shouldFocus && previousFile !== data.path) {
      scrollContentToTop();
    }
  }
  function scrollContentToTop() {
    const container = document.getElementById("content");
    if (!container) return;
    container.scrollTo({ top: 0, behavior: "auto" });
  }
  function getMaxSidebarWidth() {
    return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, window.innerWidth - 360));
  }
  function clampSidebarWidth2(width) {
    return Math.min(getMaxSidebarWidth(), Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
  }
  function applySidebarWidth(width) {
    const clamped = clampSidebarWidth2(width);
    document.documentElement.style.setProperty("--sidebar-width", \`\${clamped}px\`);
  }
  function initSidebarWidth() {
    const saved = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
    const width = Number.isFinite(saved) && saved > 0 ? saved : SIDEBAR_DEFAULT_WIDTH;
    applySidebarWidth(width);
  }
  function setupSidebarResize() {
    const resizer = document.getElementById("sidebarResizer");
    if (!resizer) return;
    let dragging = false;
    const onMove = (event) => {
      if (!dragging) return;
      const width = clampSidebarWidth2(event.clientX);
      applySidebarWidth(width);
    };
    const onUp = (event) => {
      if (!dragging) return;
      dragging = false;
      const width = clampSidebarWidth2(event.clientX);
      applySidebarWidth(width);
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
      document.body.classList.remove("sidebar-resizing");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    resizer.addEventListener("mousedown", (event) => {
      if (window.innerWidth <= 900) return;
      dragging = true;
      document.body.classList.add("sidebar-resizing");
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      event.preventDefault();
    });
    resizer.addEventListener("dblclick", () => {
      applySidebarWidth(SIDEBAR_DEFAULT_WIDTH);
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(SIDEBAR_DEFAULT_WIDTH));
    });
    window.addEventListener("resize", () => {
      const current = Number.parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width"),
        10
      );
      if (Number.isFinite(current)) {
        applySidebarWidth(current);
      }
    });
  }
  async function refreshCurrentFile() {
    if (!state.currentFile) return;
    await syncFileFromDisk(state.currentFile, { silent: true, highlight: false });
  }
  async function refreshFile(path) {
    const updated = await syncFileFromDisk(path, { silent: false, highlight: true });
    if (updated && state.currentFile === path) {
      showSuccess("\\u6587\\u4EF6\\u5DF2\\u5237\\u65B0", 2e3);
    }
  }
  function flashContentUpdated() {
    const container = document.getElementById("content");
    if (!container) return;
    container.style.animation = "flash 700ms ease-out";
    setTimeout(() => {
      container.style.animation = "";
    }, 700);
  }
  async function syncFileFromDisk(path, options = {}) {
    const file = state.sessionFiles.get(path);
    if (!file || file.isMissing) return false;
    const nextSeq = (fileRefreshSeq.get(path) || 0) + 1;
    fileRefreshSeq.set(path, nextSeq);
    const data = await loadFile(path, options.silent !== false);
    if (!data) return false;
    if (fileRefreshSeq.get(path) !== nextSeq) return false;
    const targetFile = state.sessionFiles.get(path) || state.sessionFiles.get(data.path);
    if (!targetFile) return false;
    targetFile.content = data.content;
    targetFile.lastModified = data.lastModified;
    targetFile.displayedModified = data.lastModified;
    targetFile.isMissing = false;
    saveState();
    if (state.currentFile === path || state.currentFile === data.path) {
      renderContent();
      syncAnnotationsForCurrentFile(false);
      if (options.highlight) {
        flashContentUpdated();
      }
    }
    renderSidebar();
    await updateToolbarButtons();
    return true;
  }
  function renderAll() {
    renderSidebar();
    renderContent();
    syncAnnotationsForCurrentFile(false);
  }
  function isMarkdownContent(file) {
    const lower = \`\${file.name} \${file.path}\`.toLowerCase();
    return lower.includes(".md") || lower.includes(".markdown");
  }
  function normalizeParentIdInput(raw) {
    const input = (raw || "").trim();
    if (!input) return "";
    const pickFromPath = (path) => {
      const segments = path.split("/").map((s) => decodeURIComponent(s).trim()).filter(Boolean);
      for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        if (!seg) continue;
        if (PARENT_URL_SKIP_SEGMENTS.has(seg.toLowerCase())) continue;
        return seg;
      }
      return "";
    };
    if (/^https?:\\/\\//i.test(input)) {
      try {
        const url = new URL(input);
        const picked = pickFromPath(url.pathname);
        return picked || input;
      } catch {
        return input;
      }
    }
    if (input.includes("/")) {
      const picked = pickFromPath(input);
      return picked || input;
    }
    return input;
  }
  function stripVersionSuffix(title) {
    const trimmed = (title || "").trim();
    if (!trimmed) return trimmed;
    return trimmed.replace(/-v\\d+\$/i, "").trim();
  }
  function normalizeJoinedPath(baseDir, relativePath) {
    const merged = \`\${baseDir}/\${relativePath}\`;
    const isAbsolute = merged.startsWith("/");
    const parts = merged.split("/");
    const stack = [];
    for (const part of parts) {
      if (!part || part === ".") continue;
      if (part === "..") {
        if (stack.length > 0) stack.pop();
        continue;
      }
      stack.push(part);
    }
    return \`\${isAbsolute ? "/" : ""}\${stack.join("/")}\`;
  }
  function resolveMarkdownAssetSrc(src, currentFilePath) {
    const trimmed = src.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("/api/")) {
      return null;
    }
    if (isUrlPath(currentFilePath)) {
      return null;
    }
    const qIndex = trimmed.indexOf("?");
    const hIndex = trimmed.indexOf("#");
    const cutIndex = [qIndex, hIndex].filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? -1;
    const pathPart = cutIndex >= 0 ? trimmed.slice(0, cutIndex) : trimmed;
    const suffix = cutIndex >= 0 ? trimmed.slice(cutIndex) : "";
    const baseDir = currentFilePath.slice(0, currentFilePath.lastIndexOf("/"));
    const absPath = pathPart.startsWith("/") ? pathPart : normalizeJoinedPath(baseDir, pathPart);
    return \`/api/file-asset?path=\${encodeURIComponent(absPath)}\${suffix}\`;
  }
  function rewriteMarkdownAssetUrls(container, currentFilePath) {
    const root = container.querySelector(".markdown-body");
    if (!root) return;
    root.querySelectorAll("img[src], video[src], source[src]").forEach((el) => {
      const source = el.getAttribute("src");
      if (!source) return;
      const resolved = resolveMarkdownAssetSrc(source, currentFilePath);
      if (!resolved) return;
      el.setAttribute("src", resolved);
    });
  }
  async function renderMermaidDiagrams(container) {
    const mermaid = window.mermaid;
    if (!mermaid) return;
    const codeBlocks = Array.from(
      container.querySelectorAll(
        ".markdown-body pre > code.language-mermaid, .markdown-body pre > code.lang-mermaid, .markdown-body pre > code.language-flowchart, .markdown-body pre > code.lang-flowchart"
      )
    );
    if (codeBlocks.length === 0) return;
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose"
      });
      mermaidInitialized = true;
    }
    const setCopiedState = (button) => {
      const original = button.textContent || "\\u590D\\u5236";
      button.textContent = "\\u2713";
      button.classList.add("copied");
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove("copied");
      }, 900);
    };
    const createMermaidSourcePanel = (source, showByDefault) => {
      const panel = document.createElement("div");
      panel.className = "mermaid-source-panel";
      panel.style.display = showByDefault ? "block" : "none";
      const head = document.createElement("div");
      head.className = "mermaid-source-head";
      const title = document.createElement("span");
      title.textContent = "Mermaid \\u6E90\\u7801";
      const copyBtn = document.createElement("button");
      copyBtn.className = "mermaid-source-copy";
      copyBtn.textContent = "\\u590D\\u5236";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(source);
          setCopiedState(copyBtn);
        } catch {
        }
      });
      head.appendChild(title);
      head.appendChild(copyBtn);
      const sourcePre = document.createElement("pre");
      const sourceCode = document.createElement("code");
      sourceCode.className = "language-mermaid";
      sourceCode.textContent = source;
      sourcePre.appendChild(sourceCode);
      panel.appendChild(head);
      panel.appendChild(sourcePre);
      const toggleButton = document.createElement("button");
      toggleButton.className = "mermaid-source-toggle";
      toggleButton.textContent = showByDefault ? "\\u9690\\u85CF\\u6E90\\u7801" : "\\u6E90\\u7801";
      toggleButton.addEventListener("click", () => {
        const shown = panel.style.display !== "none";
        panel.style.display = shown ? "none" : "block";
        toggleButton.textContent = shown ? "\\u6E90\\u7801" : "\\u9690\\u85CF\\u6E90\\u7801";
      });
      return { panel, toggleButton };
    };
    for (let i = 0; i < codeBlocks.length; i += 1) {
      const codeEl = codeBlocks[i];
      const preEl = codeEl.closest("pre");
      if (!preEl) continue;
      const sourceRaw = (codeEl.textContent || "").trim();
      if (!sourceRaw) continue;
      const isFlowchartFence = codeEl.classList.contains("language-flowchart") || codeEl.classList.contains("lang-flowchart");
      const firstLine = sourceRaw.split("\\n").find((line) => line.trim().length > 0)?.trim().toLowerCase() || "";
      const source = isFlowchartFence && !firstLine.startsWith("flowchart") && !firstLine.startsWith("graph") ? \`flowchart TD
\${sourceRaw}\` : sourceRaw;
      if (!source) continue;
      try {
        const renderId = \`mdv-mermaid-\${Date.now()}-\${i}\`;
        const { svg, bindFunctions } = await mermaid.render(renderId, source);
        const block = document.createElement("div");
        block.className = "mermaid-block";
        const actions = document.createElement("div");
        actions.className = "mermaid-actions";
        const { panel, toggleButton } = createMermaidSourcePanel(source, false);
        actions.appendChild(toggleButton);
        const host = document.createElement("div");
        host.className = "mermaid";
        host.setAttribute("data-mdv-mermaid", "1");
        host.innerHTML = svg;
        block.appendChild(actions);
        block.appendChild(host);
        block.appendChild(panel);
        preEl.replaceWith(block);
        if (typeof bindFunctions === "function") {
          bindFunctions(host);
        }
      } catch (error) {
        const block = document.createElement("div");
        block.className = "mermaid-fallback-block";
        const actions = document.createElement("div");
        actions.className = "mermaid-actions";
        const { panel, toggleButton } = createMermaidSourcePanel(source, true);
        actions.appendChild(toggleButton);
        const notice = document.createElement("div");
        notice.className = "mermaid-fallback-notice";
        notice.textContent = "Mermaid \\u8BED\\u6CD5\\u9519\\u8BEF\\uFF0C\\u5DF2\\u56DE\\u9000\\u4E3A\\u539F\\u6587\\u663E\\u793A";
        block.appendChild(actions);
        block.appendChild(notice);
        block.appendChild(panel);
        preEl.replaceWith(block);
        console.error("Mermaid \\u6E32\\u67D3\\u5931\\u8D25\\uFF0C\\u5DF2\\u56DE\\u9000\\u539F\\u6587:", error);
      }
    }
  }
  function renderContent() {
    const container = document.getElementById("content");
    if (!container) return;
    if (!state.currentFile) {
      container.removeAttribute("data-current-file");
      container.innerHTML = \`
      <div class="empty-state">
        <h2>\\u6B22\\u8FCE\\u4F7F\\u7528 MD Viewer</h2>
        <p>\\u5728\\u5DE6\\u4FA7\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6\\u5F00\\u59CB\\u9605\\u8BFB</p>
      </div>
    \`;
      return;
    }
    const file = state.sessionFiles.get(state.currentFile);
    if (!file) return;
    if (isHtmlPath(file.path)) {
      container.removeAttribute("data-current-file");
      container.innerHTML = \`
      <div class="empty-state">
        <h2>HTML \\u6587\\u4EF6\\u4EC5\\u652F\\u6301\\u5916\\u90E8\\u6253\\u5F00</h2>
        <p>\\u8BF7\\u5728\\u5217\\u8868\\u4E2D\\u70B9\\u51FB\\u8BE5\\u6587\\u4EF6\\uFF0C\\u5728\\u6D4F\\u89C8\\u5668\\u65B0\\u9875\\u9762\\u67E5\\u770B</p>
      </div>
    \`;
      const meta2 = document.getElementById("fileMeta");
      if (meta2) {
        meta2.textContent = formatRelativeTime(file.lastModified);
      }
      renderBreadcrumb();
      updateToolbarButtons();
      return;
    }
    const html = window.marked.parse(file.content);
    const deletedNotice = file.isMissing ? \`
      <div class="content-file-status deleted">
        \\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u5F53\\u524D\\u5185\\u5BB9\\u4E3A\\u672C\\u5730\\u7F13\\u5B58\\u5FEB\\u7167\\u3002
      </div>
    \` : "";
    container.innerHTML = \`\${deletedNotice}<div class="markdown-body" id="reader">\${html}</div>\`;
    container.setAttribute("data-current-file", file.path);
    rewriteMarkdownAssetUrls(container, file.path);
    void renderMermaidDiagrams(container);
    applyAnnotations();
    const meta = document.getElementById("fileMeta");
    if (meta) {
      meta.textContent = formatRelativeTime(file.lastModified);
    }
    renderBreadcrumb();
    updateToolbarButtons();
  }
  function renderBreadcrumb() {
    const container = document.getElementById("breadcrumb");
    if (!container || !state.currentFile) {
      if (container) container.innerHTML = "";
      return;
    }
    const file = state.sessionFiles.get(state.currentFile);
    if (!file) return;
    const parts = file.path.split("/").filter(Boolean);
    const fileName = parts[parts.length - 1] || "";
    const breadcrumbItems = parts.map((part, index) => {
      const isLast = index === parts.length - 1;
      const path = "/" + parts.slice(0, index + 1).join("/");
      if (isLast) {
        return \`<span class="breadcrumb-item active">\${escapeHtml(part)}</span>\`;
      }
      return \`
      <span class="breadcrumb-item" title="\${escapeAttr(path)}">
        \${escapeHtml(part)}
      </span>
      <span class="breadcrumb-separator">/</span>
    \`;
    }).join("");
    container.innerHTML = \`
    \${breadcrumbItems}
    <button class="copy-filename-button" onclick="copyFileName('\${escapeAttr(fileName)}', event)">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">\\u590D\\u5236\\u8DEF\\u5F84</span>
    </button>
  \`;
  }
  async function showNearbyMenu(e) {
    e.stopPropagation();
    if (!state.currentFile) return;
    const button = e.target;
    const existingMenu = document.querySelector(".nearby-menu");
    if (existingMenu) {
      existingMenu.remove();
      return;
    }
    try {
      const data = await getNearbyFiles(state.currentFile);
      if (!data.files || data.files.length === 0) {
        showInfo("\\u9644\\u8FD1\\u6CA1\\u6709\\u5176\\u4ED6 Markdown \\u6587\\u4EF6", 3e3);
        return;
      }
      const menuElement = document.createElement("div");
      menuElement.className = "nearby-menu";
      menuElement.innerHTML = \`
      <div class="nearby-menu-header">\\u9644\\u8FD1\\u7684\\u6587\\u4EF6</div>
      \${data.files.map((f) => \`
        <div class="nearby-menu-item" onclick="window.addFileByPath('\${escapeAttr(f.path)}', true)">
          \\u{1F4C4} \${escapeHtml(f.name)}
        </div>
      \`).join("")}
    \`;
      const rect = button.getBoundingClientRect();
      menuElement.style.position = "fixed";
      menuElement.style.left = rect.left + "px";
      menuElement.style.top = rect.bottom + 5 + "px";
      document.body.appendChild(menuElement);
      const closeMenu = () => {
        menuElement.remove();
        document.removeEventListener("click", closeMenu);
      };
      setTimeout(() => document.addEventListener("click", closeMenu), 0);
    } catch (err) {
      showError("\\u83B7\\u53D6\\u9644\\u8FD1\\u6587\\u4EF6\\u5931\\u8D25: " + err.message);
    }
  }
  function getWorkspaceNameFromPath2(path) {
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "workspace";
  }
  function isHtmlPath(path) {
    const lower = path.toLowerCase();
    return lower.endsWith(".html") || lower.endsWith(".htm");
  }
  function isUrlPath(path) {
    return /^https?:\\/\\//i.test(path);
  }
  async function openFileInBrowser(path) {
    clearListDiff(path);
    renderSidebar();
    if (isUrlPath(path)) {
      window.open(path, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const response = await fetch("/api/open-local-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path })
      });
      const data = await response.json();
      if (data?.error) {
        showError(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${data.error}\`);
      }
    } catch (error) {
      showError(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${error?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`);
    }
  }
  function looksLikePathInput2(value) {
    const v = value.trim();
    if (!v) return false;
    if (/^https?:\\/\\//i.test(v)) return true;
    if (v.startsWith("/") || v.startsWith("~/") || v.startsWith("./") || v.startsWith("../")) return true;
    if (v.includes("/") || v.includes("\\\\")) return true;
    if (/\\.[a-zA-Z0-9]{1,10}\$/.test(v)) return true;
    return false;
  }
  function clearAddConfirm() {
    pendingAddAction = null;
    const bar = document.getElementById("quickActionConfirm");
    const text = document.getElementById("quickActionConfirmText");
    const actions = document.getElementById("quickActionConfirmActions");
    if (bar) {
      bar.style.display = "none";
      bar.className = "add-file-confirm";
    }
    if (text) text.textContent = "";
    if (actions) actions.innerHTML = "";
    document.body.classList.remove("quick-action-confirm-visible");
  }
  function isAddConfirmVisible() {
    const bar = document.getElementById("quickActionConfirm");
    return !!bar && bar.style.display !== "none";
  }
  function showAddConfirm(message, mode, opts = {}) {
    const searchInput = document.getElementById("searchInput");
    searchInput?.dispatchEvent(new Event("path-autocomplete-hide"));
    const bar = document.getElementById("quickActionConfirm");
    const text = document.getElementById("quickActionConfirmText");
    const actions = document.getElementById("quickActionConfirmActions");
    if (!bar || !text || !actions) return;
    text.textContent = message;
    actions.innerHTML = "";
    bar.className = \`add-file-confirm state-\${mode}\`;
    bar.style.display = "flex";
    document.body.classList.add("quick-action-confirm-visible");
    if (opts.primaryLabel && opts.onPrimary) {
      const primary = document.createElement("button");
      primary.className = "add-file-confirm-button primary";
      primary.textContent = opts.primaryLabel;
      primary.onclick = async () => {
        await opts.onPrimary();
        clearAddConfirm();
      };
      actions.appendChild(primary);
    }
    if (opts.allowCancel !== false) {
      const cancel = document.createElement("button");
      cancel.className = "add-file-confirm-button";
      cancel.textContent = "\\u53D6\\u6D88";
      cancel.onclick = () => clearAddConfirm();
      actions.appendChild(cancel);
    }
  }
  async function executePendingAddAction() {
    if (!pendingAddAction) return;
    if (pendingAddAction.kind === "add-other-file") {
      await addFileByPath(pendingAddAction.path, true);
      return;
    }
    const workspace = addWorkspace(getWorkspaceNameFromPath2(pendingAddAction.path), pendingAddAction.path);
    renderSidebar();
    showSuccess(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${workspace.name}\`, 2e3);
    setSearchQuery("");
    renderSidebar();
  }
  async function addFileByPath(path, focus = true) {
    if (!path.trim()) return;
    const data = await loadFile(path);
    if (data) {
      const shouldFocus = focus && !isHtmlPath(data.path || path);
      await onFileLoaded(data, shouldFocus);
      await openFile(path, focus);
      if (focus && isHtmlPath(data.path || path)) {
        openFileInBrowser(data.path || path);
      }
      setSearchQuery("");
      renderSidebar();
    }
  }
  async function handleSmartAddInput(path) {
    const trimmed = path.trim();
    if (!trimmed) return;
    const result = await detectPathType(trimmed);
    const detectedPath = result.path || trimmed;
    if (result.kind === "md_file" || result.kind === "html_file") {
      clearAddConfirm();
      await addFileByPath(detectedPath, true);
      return;
    }
    if (result.kind === "other_file") {
      pendingAddAction = {
        kind: "add-other-file",
        path: detectedPath,
        ext: result.ext || null
      };
      showAddConfirm(
        \`\\u68C0\\u6D4B\\u5230\\u975E Markdown \\u6587\\u4EF6\${result.ext ? \`: \${result.ext}\` : ""}\`,
        "warning",
        {
          primaryLabel: "\\u7EE7\\u7EED\\u6DFB\\u52A0\\u6587\\u4EF6",
          onPrimary: executePendingAddAction
        }
      );
      return;
    }
    if (result.kind === "directory") {
      pendingAddAction = {
        kind: "add-workspace",
        path: detectedPath
      };
      showAddConfirm("\\u68C0\\u6D4B\\u5230\\u76EE\\u5F55\\uFF0C\\u662F\\u5426\\u4F5C\\u4E3A\\u5DE5\\u4F5C\\u533A\\u6DFB\\u52A0\\uFF1F", "directory", {
        primaryLabel: "\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A",
        onPrimary: executePendingAddAction
      });
      return;
    }
    if (result.kind === "not_found") {
      pendingAddAction = null;
      showAddConfirm("\\u8DEF\\u5F84\\u4E0D\\u5B58\\u5728\\uFF0C\\u8BF7\\u68C0\\u67E5\\u540E\\u91CD\\u8BD5", "error", { allowCancel: true });
      return;
    }
    pendingAddAction = null;
    showAddConfirm(result.error || "\\u65E0\\u6CD5\\u8BC6\\u522B\\u8F93\\u5165\\u8DEF\\u5F84", "error", { allowCancel: true });
  }
  function switchFile(path) {
    removeSyncInfoPopover();
    if (isHtmlPath(path)) {
      openFileInBrowser(path);
      syncAnnotationsForCurrentFile(true);
      return;
    }
    const previousFile = state.currentFile;
    switchToFile(path);
    renderSidebar();
    renderContent();
    syncAnnotationsForCurrentFile(true);
    if (previousFile !== path) {
      scrollContentToTop();
    }
    const file = state.sessionFiles.get(path);
    if (file && !file.isMissing && file.lastModified > file.displayedModified) {
      void syncFileFromDisk(path, { silent: true, highlight: true });
    }
  }
  function removeFileHandler(path) {
    removeFile(path);
    renderSidebar();
    renderContent();
    syncAnnotationsForCurrentFile(true);
  }
  async function searchFilesHandler(rawQuery) {
    const input = document.getElementById("searchInput");
    const query = (typeof rawQuery === "string" ? rawQuery : input?.value || "").trim();
    if (!query) return;
    try {
      const workspaceRoots = state.config.workspaces.map((ws) => ws.path).filter(Boolean);
      const data = await searchFiles(query, {
        roots: workspaceRoots,
        limit: 50
      });
      if (data.files && data.files.length > 0) {
        await addFileByPath(data.files[0].path);
      } else {
        showInfo("\\u6CA1\\u6709\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6", 3e3);
      }
    } catch (err) {
      showError("\\u641C\\u7D22\\u5931\\u8D25: " + err.message);
    }
  }
  function setupDragAndDrop() {
    document.body.addEventListener("dragover", (e) => {
      e.preventDefault();
    });
    document.body.addEventListener("drop", async (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []);
      for (const file of files) {
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith(".md") || lowerName.endsWith(".markdown") || lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
          await addFileByPath(file.path);
        }
      }
    });
  }
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (dismissAnnotationPopupByEscape()) {
          e.preventDefault();
          return;
        }
        if (syncInfoPopoverEl) {
          e.preventDefault();
          removeSyncInfoPopover();
          return;
        }
        const syncOverlay = document.getElementById("syncDialogOverlay");
        if (syncOverlay?.classList.contains("show")) {
          e.preventDefault();
          closeSyncDialog();
          return;
        }
        const settingsOverlay = document.getElementById("settingsDialogOverlay");
        if (settingsOverlay?.classList.contains("show")) {
          e.preventDefault();
          closeSettingsDialog();
          return;
        }
        const addWorkspaceOverlay = document.getElementById("addWorkspaceDialogOverlay");
        if (addWorkspaceOverlay?.classList.contains("show")) {
          e.preventDefault();
          addWorkspaceOverlay.classList.remove("show");
          return;
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.getElementById("searchInput");
        if (input) {
          input.focus();
          input.select();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault();
        if (state.currentFile) {
          removeFileHandler(state.currentFile);
        }
      }
    });
  }
  function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    const filePath = params.get("file");
    const focus = params.get("focus") !== "false";
    if (filePath) {
      addFileByPath(filePath, focus);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }
  function removeSyncInfoPopover() {
    if (syncInfoPopoverEl) {
      syncInfoPopoverEl.remove();
      syncInfoPopoverEl = null;
    }
  }
  function renderSyncCopyButton(onClick, tooltip = "\\u590D\\u5236") {
    return \`
    <button class="copy-filename-button sync-copy-button" onclick="\${onClick}">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">\${escapeHtml(tooltip)}</span>
    </button>
  \`;
  }
  function renderSyncHistoryRows(history) {
    if (!history || history.length === 0) {
      return '<div class="sync-history-empty">\\u6682\\u65E0\\u5386\\u53F2\\u8BB0\\u5F55</div>';
    }
    return \`
    <table class="sync-history-table">
      <thead>
        <tr>
          <th class="sync-history-col-version">\\u7248\\u672C</th>
          <th class="sync-history-col-status">\\u72B6\\u6001</th>
          <th>\\u6807\\u9898</th>
          <th class="sync-history-col-time">\\u65F6\\u95F4</th>
          <th class="sync-history-col-doc">\\u6587\\u6863 / \\u9519\\u8BEF</th>
        </tr>
      </thead>
      <tbody>
        \${history.map((item) => {
      const status = item.status === "failed" ? "failed" : "success";
      const statusText = status === "failed" ? "\\u5931\\u8D25" : "\\u6210\\u529F";
      const versionText = item.version > 0 ? \`v\${item.version}\` : "-";
      const titleText = item.kmTitle || "-";
      const timeText = item.syncedAt ? formatFileTime(item.syncedAt) : "-";
      let docOrError = "-";
      if (item.kmDocId) {
        docOrError = item.kmUrl ? \`<a href="\${escapeAttr(item.kmUrl)}" target="_blank" class="sync-history-link">\${escapeHtml(item.kmDocId)}</a>\` : escapeHtml(item.kmDocId);
      } else if (item.error) {
        docOrError = \`<span class="sync-history-error" title="\${escapeAttr(item.error)}">\${escapeHtml(item.error)}</span>\`;
      }
      return \`
            <tr>
              <td class="sync-history-col-version">\${escapeHtml(versionText)}</td>
              <td class="sync-history-col-status"><span class="sync-history-status is-\${status}">\${statusText}</span></td>
              <td title="\${escapeAttr(titleText)}">\${escapeHtml(titleText)}</td>
              <td class="sync-history-col-time">\${escapeHtml(timeText)}</td>
              <td class="sync-history-col-doc">\${docOrError}</td>
            </tr>
          \`;
    }).join("")}
      </tbody>
    </table>
  \`;
  }
  function refreshSyncHistoryList(history) {
    const historyEl = document.getElementById("syncHistoryList");
    if (!historyEl) return;
    historyEl.innerHTML = renderSyncHistoryRows(history || []);
  }
  async function refreshParentMetaPreview(rawValue) {
    const metaEl = document.getElementById("syncParentMeta");
    if (!metaEl) return;
    const raw = (rawValue || "").trim();
    if (!raw) {
      metaEl.style.display = "none";
      metaEl.innerHTML = "";
      return;
    }
    const parentId = normalizeParentIdInput(raw);
    if (!parentId) {
      metaEl.style.display = "none";
      metaEl.innerHTML = "";
      return;
    }
    metaEl.style.display = "block";
    metaEl.innerHTML = \`<span class="sync-dialog-parent-meta-muted">\\u6B63\\u5728\\u83B7\\u53D6\\u7236\\u6587\\u6863\\u6807\\u9898...</span>\`;
    try {
      const data = await getSyncParentMeta(raw);
      if (!data?.success) {
        metaEl.innerHTML = \`<span class="sync-dialog-parent-meta-muted">\\u672A\\u83B7\\u53D6\\u5230\\u7236\\u6587\\u6863\\u6807\\u9898</span>\`;
        return;
      }
      const title = (data.title || "").trim() || \`Parent \${data.parentId || parentId}\`;
      if (data.url) {
        metaEl.innerHTML = \`<a href="\${escapeAttr(data.url)}" target="_blank" class="sync-dialog-parent-meta-link">\${escapeHtml(title)}</a>\`;
        return;
      }
      metaEl.innerHTML = \`<span class="sync-dialog-parent-meta-text">\${escapeHtml(title)}</span>\`;
    } catch {
      metaEl.innerHTML = \`<span class="sync-dialog-parent-meta-muted">\\u672A\\u83B7\\u53D6\\u5230\\u7236\\u6587\\u6863\\u6807\\u9898</span>\`;
    }
  }
  function setSyncDialogStatus(phase, data) {
    const runningEl = document.getElementById("syncStatusRunning");
    const errorEl = document.getElementById("syncStatusError");
    const successEl = document.getElementById("syncStatusSuccess");
    if (!runningEl || !errorEl || !successEl) return;
    runningEl.style.display = phase === "running" ? "block" : "none";
    errorEl.style.display = phase === "error" ? "block" : "none";
    successEl.style.display = phase === "success" ? "block" : "none";
    if (phase === "error") {
      const messageEl = document.getElementById("syncStatusErrorMessage");
      const outputEl = document.getElementById("syncStatusErrorOutput");
      if (messageEl) {
        messageEl.textContent = data?.message || "\\u540C\\u6B65\\u5931\\u8D25\\uFF0C\\u4FDD\\u7559\\u5F53\\u524D\\u8F93\\u5165\\uFF0C\\u53EF\\u76F4\\u63A5\\u4FEE\\u6539\\u540E\\u91CD\\u8BD5\\u3002";
      }
      if (outputEl) {
        outputEl.textContent = data?.output || "";
      }
    }
    if (phase === "success") {
      const titleLink = document.getElementById("syncStatusDocTitle");
      const timeEl = document.getElementById("syncStatusTime");
      const outputEl = document.getElementById("syncStatusSuccessOutput");
      if (titleLink) {
        titleLink.textContent = data?.title || "\\u5DF2\\u540C\\u6B65\\u6587\\u6863";
        if (data?.url) {
          titleLink.href = data.url;
          titleLink.style.pointerEvents = "";
          titleLink.style.opacity = "";
        } else {
          titleLink.removeAttribute("href");
          titleLink.style.pointerEvents = "none";
          titleLink.style.opacity = "0.75";
        }
      }
      if (timeEl) {
        const ts = data?.time ?? Date.now();
        timeEl.textContent = \`\\u540C\\u6B65\\u65F6\\u95F4\\uFF1A\${formatRelativeTime(ts)} (\${formatFileTime(ts)})\`;
      }
      if (outputEl) {
        outputEl.textContent = data?.output || "";
      }
    }
  }
  async function updateToolbarButtons() {
    if (!state.currentFile) {
      removeSyncInfoPopover();
      const refreshButton2 = document.getElementById("refreshButton");
      const syncButton2 = document.getElementById("syncButton");
      if (refreshButton2) refreshButton2.style.display = "none";
      if (syncButton2) syncButton2.style.display = "none";
      return;
    }
    const file = state.sessionFiles.get(state.currentFile);
    if (!file) return;
    if (file.isMissing) {
      const refreshButton2 = document.getElementById("refreshButton");
      const syncButton2 = document.getElementById("syncButton");
      if (refreshButton2) refreshButton2.style.display = "none";
      if (syncButton2) syncButton2.style.display = "none";
      return;
    }
    const refreshButton = document.getElementById("refreshButton");
    if (refreshButton) {
      const isDirty = file.lastModified > file.displayedModified;
      refreshButton.style.display = isDirty ? "flex" : "none";
    }
    const syncButton = document.getElementById("syncButton");
    if (!isMarkdownContent(file)) {
      removeSyncInfoPopover();
      if (syncButton) syncButton.style.display = "none";
      return;
    }
    await updateSyncButton();
  }
  async function updateSyncButton() {
    const button = document.getElementById("syncButton");
    const buttonText = document.getElementById("syncButtonText");
    if (!button || !buttonText || !state.currentFile) {
      if (button) button.style.display = "none";
      return;
    }
    button.style.display = "block";
    const currentPath = state.currentFile;
    const file = state.sessionFiles.get(currentPath);
    const isDirty = !!file && file.lastModified > file.displayedModified;
    if (isDirty) {
      button.className = "toolbar-text-button";
      buttonText.textContent = "[\\u5148\\u5237\\u65B0\\u540E\\u540C\\u6B65]";
      button.title = "\\u6587\\u4EF6\\u6709\\u672A\\u5237\\u65B0\\u6539\\u52A8\\uFF0C\\u8BF7\\u5148\\u5237\\u65B0";
      button.setAttribute("aria-disabled", "true");
      return;
    }
    button.removeAttribute("aria-disabled");
    button.title = "\\u540C\\u6B65\\u5230\\u5B66\\u57CE";
    button.className = "toolbar-text-button";
    buttonText.textContent = "[\\u2601\\u2191 \\u9996\\u6B21\\u540C\\u6B65]";
    try {
      const data = await getSyncStatus(currentPath);
      if (data.docId) {
        button.className = "toolbar-text-button synced";
        buttonText.textContent = \`[\\u2191 \\u7EE7\\u7EED\\u540C\\u6B65(v\${(data.version || 1) + 1})]\`;
      }
    } catch (e) {
      console.error("\\u83B7\\u53D6\\u540C\\u6B65\\u72B6\\u6001\\u5931\\u8D25:", e);
    }
  }
  async function handleRefreshButtonClick() {
    if (!state.currentFile) return;
    await refreshFile(state.currentFile);
  }
  async function handleSyncButtonClick() {
    if (!state.currentFile) return;
    const file = state.sessionFiles.get(state.currentFile);
    if (file && file.lastModified > file.displayedModified) {
      showWarning("\\u8BF7\\u5148\\u5237\\u65B0\\u6587\\u4EF6\\uFF0C\\u518D\\u7EE7\\u7EED\\u540C\\u6B65");
      return;
    }
    const button = document.getElementById("syncButton");
    if (button && button.classList.contains("syncing")) return;
    await getSyncStatus(state.currentFile);
    removeSyncInfoPopover();
    ensureSyncDialogInteraction();
    showSyncDialog();
  }
  function ensureSyncDialogChrome() {
    const overlay = document.getElementById("syncDialogOverlay");
    if (!overlay) return;
    const dialog = overlay.querySelector(".sync-dialog");
    if (!dialog) return;
    let header = dialog.querySelector(".sync-dialog-header");
    if (!header) {
      header = document.createElement("div");
      header.className = "sync-dialog-header";
      header.innerHTML = \`
      <div class="sync-dialog-title" id="syncDialogTitle">\\u540C\\u6B65\\u5230\\u5B66\\u57CE</div>
      <button class="sync-dialog-close" type="button" aria-label="\\u5173\\u95ED\\u540C\\u6B65\\u7A97\\u53E3">\\xD7</button>
    \`;
      dialog.insertBefore(header, dialog.firstChild);
    }
    let closeBtn = header.querySelector(".sync-dialog-close");
    if (!closeBtn) {
      closeBtn = document.createElement("button");
      closeBtn.className = "sync-dialog-close";
      closeBtn.type = "button";
      closeBtn.setAttribute("aria-label", "\\u5173\\u95ED\\u540C\\u6B65\\u7A97\\u53E3");
      closeBtn.textContent = "\\xD7";
      header.appendChild(closeBtn);
    }
  }
  function ensureSyncDialogInteraction() {
    ensureSyncDialogChrome();
    const overlay = document.getElementById("syncDialogOverlay");
    if (!overlay || syncDialogInteractionBound) return;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeSyncDialog();
      }
    });
    overlay.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      if (!target.closest(".sync-dialog-close")) return;
      closeSyncDialog();
    });
    syncDialogInteractionBound = true;
  }
  async function showSyncDialog() {
    ensureSyncDialogChrome();
    const file = state.sessionFiles.get(state.currentFile);
    if (!file) return;
    const titleMatch = file.content.match(/^#\\s+(.+)\$/m);
    const guessedTitle = titleMatch ? titleMatch[1] : file.name.replace(/\\.(md|markdown|html?|txt)\$/i, "");
    const syncStatus = await getSyncStatus(state.currentFile);
    const currentVersion = syncStatus.version || 0;
    const baseTitle = syncStatus.baseTitle || stripVersionSuffix(syncStatus.title || guessedTitle);
    const nextVersion = currentVersion + 1;
    const nextTitle = nextVersion <= 1 ? baseTitle : \`\${baseTitle}-v\${nextVersion}\`;
    const recentData = await getRecentParents();
    const preferences = await getSyncPreferences();
    const overlay = document.getElementById("syncDialogOverlay");
    const title = document.getElementById("syncDialogTitle");
    const body = document.getElementById("syncDialogBody");
    if (!overlay || !title || !body) return;
    title.textContent = "\\u540C\\u6B65\\u5230\\u5B66\\u57CE";
    let html = \`
    <div class="sync-dialog-field">
      <div class="sync-dialog-meta">\\u5F53\\u524D\\u6587\\u4EF6\\uFF1A\${escapeHtml(state.currentFile || "")}</div>
      <div class="sync-dialog-meta">\\u5F53\\u524D\\u7248\\u672C\\uFF1A\${currentVersion > 0 ? \`v\${currentVersion}\` : "\\u672A\\u7ED1\\u5B9A"} \\xB7 \\u4E0B\\u4E00\\u7248\\u672C\\uFF1Av\${nextVersion}</div>
      <div class="sync-dialog-meta">\\u672C\\u6B21\\u5C06\\u521B\\u5EFA\\uFF1A\${escapeHtml(nextTitle)}</div>
      <input type="hidden" id="syncCurrentVersion" value="\${currentVersion}">
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-label">\\u57FA\\u7840\\u6807\\u9898\\uFF08\\u81EA\\u52A8\\u751F\\u6210 -vN\\uFF09</label>
      <input type="text" class="sync-dialog-input" id="syncTitle" value="\${escapeAttr(baseTitle)}">
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-label">\\u9009\\u62E9\\u4F4D\\u7F6E</label>
  \`;
    if (recentData.parents && recentData.parents.length > 0) {
      html += '<div class="sync-dialog-recent">';
      recentData.parents.forEach((parent) => {
        const isDefault = parent.id === recentData.defaultParentId;
        const titleText = !parent.title || /^Parent\\s+\\S+\$/i.test(parent.title.trim()) ? parent.id : parent.title;
        html += \`
        <div class="sync-dialog-recent-item \${isDefault ? "selected" : ""}" onclick="window.selectRecentParent('\${escapeJsSingleQuoted(parent.id)}', event)">
          <input type="radio" name="recentParent" value="\${escapeAttr(parent.id)}" class="sync-dialog-recent-radio" \${isDefault ? "checked" : ""}>
          <div class="sync-dialog-recent-main">
            \${parent.url ? \`<a href="\${escapeAttr(parent.url)}" target="_blank" class="sync-dialog-recent-title-link" onclick="event.stopPropagation()">\${escapeHtml(titleText)}</a>\` : \`<span class="sync-dialog-recent-title-link">\${escapeHtml(titleText)}</span>\`}
            <span class="sync-dialog-recent-inline-meta">#\${escapeHtml(parent.id)} \\xB7 \${escapeHtml(formatRelativeTime(parent.lastUsed))}</span>
          </div>
        </div>
      \`;
      });
      html += "</div>";
    }
    const placeholder = recentData.parents && recentData.parents.length > 0 ? "\\u6216\\u8F93\\u5165\\u7236\\u6587\\u6863 ID / URL" : "\\u8F93\\u5165\\u7236\\u6587\\u6863 ID / URL";
    html += \`
    <input type="text" class="sync-dialog-input sync-dialog-manual-input" id="syncParentId" placeholder="\${placeholder}" autocomplete="off">
    <div id="syncParentMeta" class="sync-dialog-parent-meta" style="display:none;"></div>
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-checkbox">
        <input type="checkbox" id="syncOpenAfter" \${preferences.openAfterSync !== false ? "checked" : ""}>
        <span>\\u540C\\u6B65\\u540E\\u5728\\u6D4F\\u89C8\\u5668\\u4E2D\\u6253\\u5F00</span>
      </label>
    </div>

    <div class="sync-dialog-field">
      <div class="sync-dialog-codepanel">
        <div class="sync-dialog-codepanel-top">
          <span class="sync-dialog-codepanel-title">\\u5C06\\u6267\\u884C\\u7684\\u547D\\u4EE4</span>
        \${renderSyncCopyButton("window.copySyncCommand(event)", "\\u590D\\u5236\\u547D\\u4EE4")}
        </div>
        <div class="sync-dialog-output" id="syncCommandPreview">km-cli doc create --parent-id "..." --title "\${escapeHtml(nextTitle)}" --markdown-file "\${escapeHtml(state.currentFile || "")}" --json</div>
      </div>
    </div>

    <div class="sync-dialog-footer">
      <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="window.confirmSync()">\\u540C\\u6B65</button>
      <div class="sync-dialog-shortcut-hint">\\u5FEB\\u6377\\u952E\\uFF1ACmd/Ctrl + Enter</div>
    </div>

    <div class="sync-dialog-status">
      <div class="sync-dialog-status-block running" id="syncStatusRunning" style="display:none;">
        \\u6B63\\u5728\\u8C03\\u7528 km-cli\\uFF0C\\u8BF7\\u7A0D\\u5019...
      </div>
      <div class="sync-dialog-status-block error" id="syncStatusError" style="display:none;">
        <div class="sync-dialog-status-message" id="syncStatusErrorMessage"></div>
        <div class="sync-dialog-codepanel">
          <div class="sync-dialog-codepanel-top">
            <span class="sync-dialog-codepanel-title">\\u539F\\u59CB\\u8FD4\\u56DE</span>
            \${renderSyncCopyButton(\`window.copySingleText(document.getElementById('syncStatusErrorOutput')?.textContent || '', event)\`, "\\u590D\\u5236\\u8FD4\\u56DE")}
          </div>
          <div class="sync-dialog-output" id="syncStatusErrorOutput"></div>
        </div>
      </div>
      <div class="sync-dialog-status-block success" id="syncStatusSuccess" style="display:none;">
        <div class="sync-dialog-status-line">
          \\u6587\\u6863\\uFF1A
          <a href="#" target="_blank" class="sync-dialog-doc-link" id="syncStatusDocTitle">\\u5DF2\\u540C\\u6B65\\u6587\\u6863</a>
        </div>
        <div class="sync-dialog-status-line" id="syncStatusTime"></div>
        <div class="sync-dialog-codepanel">
          <div class="sync-dialog-codepanel-top">
            <span class="sync-dialog-codepanel-title">\\u539F\\u59CB\\u8FD4\\u56DE</span>
            \${renderSyncCopyButton(\`window.copySingleText(document.getElementById('syncStatusSuccessOutput')?.textContent || '', event)\`, "\\u590D\\u5236\\u8FD4\\u56DE")}
          </div>
          <div class="sync-dialog-output" id="syncStatusSuccessOutput"></div>
        </div>
      </div>
    </div>
    <div class="sync-dialog-field">
      <div class="sync-dialog-codepanel">
        <div class="sync-dialog-codepanel-top">
          <span class="sync-dialog-codepanel-title">\\u5386\\u53F2\\u7248\\u672C\\uFF08\\u6309\\u65F6\\u95F4\\u5012\\u5E8F\\uFF09</span>
        </div>
        <div class="sync-dialog-history" id="syncHistoryList">\${renderSyncHistoryRows(syncStatus.history || [])}</div>
      </div>
    </div>
  \`;
    body.innerHTML = html;
    if (!document.getElementById("syncCommandPreview")) {
      const checkbox = body.querySelector(".sync-dialog-checkbox");
      if (checkbox) {
        const fallback = document.createElement("div");
        fallback.className = "sync-dialog-field";
        fallback.innerHTML = \`
        <div class="sync-dialog-codepanel">
          <div class="sync-dialog-codepanel-top">
            <span class="sync-dialog-codepanel-title">\\u5C06\\u6267\\u884C\\u7684\\u547D\\u4EE4</span>
          \${renderSyncCopyButton("window.copySyncCommand(event)", "\\u590D\\u5236\\u547D\\u4EE4")}
          </div>
          <div class="sync-dialog-output" id="syncCommandPreview">km-cli doc create --parent-id "..." --title "\${escapeHtml(nextTitle)}" --markdown-file "\${escapeHtml(state.currentFile || "")}" --json</div>
        </div>
      \`;
        checkbox.parentNode.insertBefore(fallback, checkbox);
      }
    }
    overlay.classList.add("show");
    const titleInput = document.getElementById("syncTitle");
    const parentInput = document.getElementById("syncParentId");
    if (titleInput) {
      titleInput.addEventListener("input", updateCommandPreview);
      titleInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        if (!(event.metaKey || event.ctrlKey)) return;
        event.preventDefault();
        void confirmSync();
      });
    }
    if (parentInput) {
      parentInput.addEventListener("input", () => {
        document.querySelectorAll(".sync-dialog-recent-item").forEach((item) => {
          item.classList.remove("selected");
        });
        document.querySelectorAll(".sync-dialog-recent-radio").forEach((radio) => {
          radio.checked = false;
        });
        const metaEl = document.getElementById("syncParentMeta");
        if (metaEl) {
          metaEl.style.display = "none";
          metaEl.innerHTML = "";
        }
        updateCommandPreview();
      });
      parentInput.addEventListener("blur", () => {
        refreshParentMetaPreview(parentInput.value);
      });
      parentInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        if (!(event.metaKey || event.ctrlKey)) return;
        event.preventDefault();
        void confirmSync();
      });
    }
    updateCommandPreview();
    setSyncDialogStatus("idle");
  }
  function updateCommandPreview() {
    const preview = document.getElementById("syncCommandPreview");
    const titleInput = document.getElementById("syncTitle");
    const parentInput = document.getElementById("syncParentId");
    const selectedRadio = document.querySelector(".sync-dialog-recent-radio:checked");
    const versionInput = document.getElementById("syncCurrentVersion");
    if (!preview || !state.currentFile) return;
    const baseTitle = (titleInput?.value || "").trim() || "...";
    const currentVersion = Number(versionInput?.value || 0) || 0;
    const nextVersion = currentVersion + 1;
    const versionedTitle = nextVersion <= 1 ? baseTitle : \`\${baseTitle}-v\${nextVersion}\`;
    let parentId = parentInput?.value.trim() || selectedRadio?.value || "...";
    parentId = normalizeParentIdInput(parentId) || "...";
    preview.textContent = \`km-cli doc create --parent-id "\${parentId}" --title "\${versionedTitle}" --markdown-file "\${state.currentFile}" --json\`;
  }
  function selectRecentParent(parentId, e) {
    const items = document.querySelectorAll(".sync-dialog-recent-item");
    items.forEach((item) => item.classList.remove("selected"));
    if (e && e.currentTarget) {
      e.currentTarget.classList.add("selected");
    }
    const radio = e && e.currentTarget ? e.currentTarget.querySelector('input[type="radio"]') : null;
    if (radio) radio.checked = true;
    const parentInput = document.getElementById("syncParentId");
    if (parentInput) parentInput.value = "";
    const metaEl = document.getElementById("syncParentMeta");
    if (metaEl) {
      metaEl.style.display = "none";
      metaEl.innerHTML = "";
    }
    updateCommandPreview();
  }
  async function confirmSync() {
    const titleInput = document.getElementById("syncTitle");
    const parentInput = document.getElementById("syncParentId");
    const selectedRadio = document.querySelector(".sync-dialog-recent-radio:checked");
    const openAfter = document.getElementById("syncOpenAfter")?.checked;
    if (!state.currentFile) return;
    const title = titleInput?.value.trim();
    let parentId = parentInput?.value.trim() || selectedRadio?.value;
    parentId = normalizeParentIdInput(parentId || "");
    if (!title) {
      showWarning("\\u8BF7\\u8F93\\u5165\\u6807\\u9898");
      return;
    }
    if (!parentId) {
      showWarning("\\u8BF7\\u9009\\u62E9\\u4F4D\\u7F6E\\u6216\\u8F93\\u5165\\u7236\\u6587\\u6863 ID");
      return;
    }
    try {
      await saveSyncPreference("openAfterSync", openAfter);
    } catch (err) {
      console.error("\\u4FDD\\u5B58\\u504F\\u597D\\u5931\\u8D25:", err);
    }
    const button = document.querySelector(".sync-dialog-btn-primary");
    if (button) {
      button.disabled = true;
      button.textContent = "\\u540C\\u6B65\\u4E2D...";
    }
    setSyncDialogStatus("running");
    try {
      const result = await executeSync(state.currentFile, title, parentId);
      if (result.success) {
        const now = Date.now();
        if (openAfter && result.url) {
          window.open(result.url, "_blank");
          closeSyncDialog();
          updateSyncButton();
          return;
        }
        const rawOutput = typeof result.output === "string" && result.output.trim() ? result.output : JSON.stringify(result, null, 2);
        const docTitle = (result.title || "").trim() || "\\u5DF2\\u540C\\u6B65\\u6587\\u6863";
        setSyncDialogStatus("success", {
          title: docTitle,
          url: result.url || "",
          output: rawOutput,
          time: now
        });
        const status = await getSyncStatus(state.currentFile);
        refreshSyncHistoryList(status.history || []);
        updateSyncButton();
      } else {
        const rawOutput = typeof result.output === "string" && result.output.trim() ? result.output : JSON.stringify(result, null, 2);
        setSyncDialogStatus("error", {
          message: "\\u540C\\u6B65\\u5931\\u8D25\\uFF0C\\u4FDD\\u7559\\u5F53\\u524D\\u8F93\\u5165\\uFF0C\\u53EF\\u76F4\\u63A5\\u4FEE\\u6539\\u540E\\u91CD\\u8BD5\\u3002",
          output: rawOutput
        });
        const status = await getSyncStatus(state.currentFile);
        refreshSyncHistoryList(status.history || []);
      }
    } catch (err) {
      setSyncDialogStatus("error", {
        message: \`\\u540C\\u6B65\\u5931\\u8D25: \${err.message}\`,
        output: err?.stack || err?.message || "\\u672A\\u77E5\\u9519\\u8BEF"
      });
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "\\u540C\\u6B65";
      }
    }
  }
  function closeSyncDialog() {
    const overlay = document.getElementById("syncDialogOverlay");
    if (overlay) {
      overlay.classList.remove("show");
    }
    removeSyncInfoPopover();
  }
  function copySyncCommand(e) {
    const preview = document.getElementById("syncCommandPreview");
    if (preview) {
      copyTextWithFeedback(preview.textContent || "", e);
    }
  }
  function resolveCopyFeedbackTarget(e) {
    if (!e?.target) return null;
    return e.target.closest(".copy-filename-button, .sync-dialog-copy-btn, .sync-dialog-btn");
  }
  function applyCopyFeedback(target) {
    if (!target) return;
    if (target.classList.contains("copy-filename-button")) {
      target.classList.add("success");
      const tooltip = target.querySelector(".copy-tooltip");
      const originalText2 = tooltip?.textContent;
      if (tooltip) tooltip.textContent = "\\u5DF2\\u590D\\u5236";
      setTimeout(() => {
        target.classList.remove("success");
        if (tooltip && originalText2) tooltip.textContent = originalText2;
      }, 1e3);
      return;
    }
    const originalText = target.textContent;
    target.textContent = "\\u2713 \\u5DF2\\u590D\\u5236";
    setTimeout(() => {
      if (originalText != null) target.textContent = originalText;
    }, 1e3);
  }
  function copyTextWithFeedback(text, e) {
    navigator.clipboard.writeText(text).then(() => {
      applyCopyFeedback(resolveCopyFeedbackTarget(e));
    }).catch(() => {
      showError("\\u590D\\u5236\\u5931\\u8D25");
    });
  }
  function copySingleText(text, e) {
    copyTextWithFeedback(text, e);
  }
  function copyFileName(fileName, event) {
    copyTextWithFeedback(fileName, event);
  }
  function copyErrorInfo(e) {
    const outputs = document.querySelectorAll(".sync-dialog-output");
    if (outputs.length > 0) {
      const texts = Array.from(outputs).map((el) => el.textContent || "").join("\\n\\n");
      copyTextWithFeedback(texts, e);
    }
  }
  function initFontScale() {
    const saved = localStorage.getItem("fontScale");
    if (saved) {
      currentFontScale = parseFloat(saved);
    }
    applyFontScale();
  }
  function applyFontScale() {
    document.documentElement.style.setProperty("--font-scale", currentFontScale.toString());
    updateFontScaleDisplay();
    localStorage.setItem("fontScale", currentFontScale.toString());
  }
  function updateFontScaleDisplay() {
    const button = document.getElementById("fontScaleText");
    if (button) {
      const percent = Math.round(currentFontScale * 100);
      button.textContent = \`\${percent}%\`;
    }
    const options = document.querySelectorAll(".font-scale-option");
    options.forEach((option) => {
      option.classList.remove("active");
    });
    const currentPercent = Math.round(currentFontScale * 100);
    options.forEach((option) => {
      const text = option.textContent?.trim();
      if (text === \`\${currentPercent}%\`) {
        option.classList.add("active");
      }
    });
  }
  function setFontScale(scale) {
    currentFontScale = scale;
    applyFontScale();
    closeFontScaleMenu();
  }
  function toggleFontScaleMenu() {
    const menu = document.getElementById("fontScaleMenu");
    if (!menu) return;
    const isVisible = menu.style.display !== "none";
    if (isVisible) {
      closeFontScaleMenu();
    } else {
      menu.style.display = "block";
      updateFontScaleDisplay();
    }
  }
  function closeFontScaleMenu() {
    const menu = document.getElementById("fontScaleMenu");
    if (menu) {
      menu.style.display = "none";
    }
  }
  function connectSSE() {
    const eventSource = new EventSource("/api/events");
    eventSource.addEventListener("file-changed", async (e) => {
      const data = JSON.parse(e.data);
      const file = getSessionFile(data.path);
      if (file) {
        file.lastModified = data.lastModified;
        renderSidebar();
        await updateToolbarButtons();
      }
    });
    eventSource.addEventListener("file-deleted", async (e) => {
      const data = JSON.parse(e.data);
      const file = getSessionFile(data.path);
      if (file) {
        file.isMissing = true;
        saveState();
      } else {
        markWorkspacePathMissing(data.path);
      }
      renderSidebar();
      if (state.currentFile === data.path) {
        renderContent();
        updateToolbarButtons();
        showError("\\u6587\\u4EF6\\u5DF2\\u4E0D\\u5B58\\u5728");
      }
    });
    eventSource.addEventListener("file-opened", async (e) => {
      const data = JSON.parse(e.data);
      await onFileLoaded(data, data.focus !== false);
    });
    eventSource.onerror = () => {
      console.error("SSE \\u8FDE\\u63A5\\u65AD\\u5F00\\uFF0C\\u5C1D\\u8BD5\\u91CD\\u8FDE...");
      eventSource.close();
      setTimeout(connectSSE, 3e3);
    };
  }
  function startWorkspacePolling() {
    window.setInterval(async () => {
      if (workspacePollRunning) return;
      if (state.config.sidebarMode !== "workspace") return;
      const expanded = state.config.workspaces.filter((ws) => ws.isExpanded);
      if (expanded.length === 0) return;
      workspacePollRunning = true;
      try {
        for (const ws of expanded) {
          await scanWorkspace(ws.id);
        }
        renderSidebar();
      } finally {
        workspacePollRunning = false;
      }
    }, 1500);
  }
  var SIDEBAR_WIDTH_STORAGE_KEY, SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH, fileRefreshSeq, PARENT_URL_SKIP_SEGMENTS, workspacePollRunning, mermaidInitialized, syncDialogInteractionBound, pendingAddAction, syncInfoPopoverEl, currentFontScale;
  var init_main = __esm({
    "src/client/main.ts"() {
      init_state();
      init_workspace_state();
      init_workspace();
      init_files();
      init_sync();
      init_escape();
      init_format();
      init_sidebar();
      init_toast();
      init_settings();
      init_annotation();
      SIDEBAR_WIDTH_STORAGE_KEY = "md-viewer:sidebar-width";
      SIDEBAR_DEFAULT_WIDTH = 260;
      SIDEBAR_MIN_WIDTH = 220;
      SIDEBAR_MAX_WIDTH = 680;
      fileRefreshSeq = /* @__PURE__ */ new Map();
      PARENT_URL_SKIP_SEGMENTS = /* @__PURE__ */ new Set(["doc", "docs", "page", "pages", "content", "wiki"]);
      workspacePollRunning = false;
      mermaidInitialized = false;
      syncDialogInteractionBound = false;
      pendingAddAction = null;
      syncInfoPopoverEl = null;
      currentFontScale = 1;
      document.addEventListener("click", (e) => {
        const menu = document.getElementById("fontScaleMenu");
        const button = document.getElementById("fontScaleButton");
        const syncButton = document.getElementById("syncButton");
        if (!menu || !button) return;
        const target = e.target;
        if (!menu.contains(target) && !button.contains(target)) {
          closeFontScaleMenu();
        }
        if (syncInfoPopoverEl && !syncInfoPopoverEl.contains(target) && !syncButton?.contains(target)) {
          removeSyncInfoPopover();
        }
      });
      window.addEventListener("resize", removeSyncInfoPopover);
      window.addEventListener("scroll", removeSyncInfoPopover, true);
      window.addFile = () => {
        const input = document.getElementById("searchInput");
        if (input) {
          handleSmartAddInput(input.value).catch((err) => {
            showError(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${err?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`);
          });
        }
      };
      window.handleUnifiedInputSubmit = (value) => {
        const input = document.getElementById("searchInput");
        const raw = (typeof value === "string" ? value : input?.value || "").trim();
        if (!raw) return;
        if (!looksLikePathInput2(raw)) {
          searchFilesHandler(raw).catch((err) => {
            showError(\`\\u641C\\u7D22\\u5931\\u8D25: \${err?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`);
          });
          return;
        }
        handleSmartAddInput(raw).catch((err) => {
          showError(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${err?.message || "\\u672A\\u77E5\\u9519\\u8BEF"}\`);
        });
      };
      window.dismissQuickActionConfirm = () => {
        if (isAddConfirmVisible()) {
          clearAddConfirm();
        }
      };
      window.switchFile = switchFile;
      window.removeFile = removeFileHandler;
      window.showNearbyMenu = showNearbyMenu;
      window.addFileByPath = addFileByPath;
      window.refreshFile = refreshFile;
      window.handleRefreshButtonClick = handleRefreshButtonClick;
      window.handleSyncButtonClick = handleSyncButtonClick;
      window.closeSyncDialog = closeSyncDialog;
      window.selectRecentParent = selectRecentParent;
      window.confirmSync = confirmSync;
      window.copySyncCommand = copySyncCommand;
      window.copySingleText = copySingleText;
      window.copyFileName = copyFileName;
      window.copyErrorInfo = copyErrorInfo;
      window.showToast = showToast;
      window.showSettingsDialog = showSettingsDialog;
      window.toggleFontScaleMenu = toggleFontScaleMenu;
      window.setFontScale = setFontScale;
      window.openExternalFile = openFileInBrowser;
      (async () => {
        ensureSyncDialogInteraction();
        initSidebarWidth();
        initFontScale();
        initAnnotationElements();
        syncAnnotationSidebarLayout();
        window.addEventListener("resize", () => {
          syncAnnotationSidebarLayout();
        });
        await restoreState(loadFile);
        await hydrateExpandedWorkspaces();
        startWorkspacePolling();
        renderSidebar();
        renderContent();
        syncAnnotationsForCurrentFile(true);
        setupDragAndDrop();
        setupSidebarResize();
        document.addEventListener("click", (e) => {
          if (!isAddConfirmVisible()) return;
          const target = e.target;
          if (!target) return;
          if (target.closest(".sidebar-header")) return;
          if (target.closest("#quickActionConfirm")) return;
          clearAddConfirm();
        });
        handleURLParams();
        setupKeyboardShortcuts();
        document.addEventListener("mouseup", () => {
          setTimeout(() => {
            const filePath = document.getElementById("content")?.getAttribute("data-current-file") || null;
            handleSelectionForAnnotation(filePath);
          }, 0);
        });
        await refreshCurrentFile();
        connectSSE();
      })();
    }
  });
  init_main();
})();
//# sourceMappingURL=client.js.map
`;
