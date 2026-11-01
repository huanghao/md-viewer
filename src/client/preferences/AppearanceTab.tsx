import { useEffect, useState } from 'react';
import { state } from '../state';
import { getAllStorageKeys, storageRemove } from '../utils/storage';
import { MD_THEMES, HL_THEMES } from '../themes/index';
import { applyThemeLive, registerPreferencesSaver, saveConfigAndNotify } from './controller';

function clientStateSnapshot() {
  const mdvKeys = getAllStorageKeys().filter((k) => k.startsWith('md-viewer'));
  return {
    currentFile: state.currentFile || '',
    openFilesCount: state.sessionFiles.size,
    workspaceCount: state.config.workspaces.length,
    mdvKeys,
    localStorageKeyCount: localStorage.length,
    commentStateKeyCount: getAllStorageKeys().filter((k) => k.startsWith('annotation')).length,
  };
}

/** 外观与通用设置：正文/代码主题即时预览，其余项在保存时写入配置 */
export function AppearanceTab() {
  const [markdownTheme, setMarkdownTheme] = useState(state.config.markdownTheme);
  const [codeTheme, setCodeTheme] = useState(state.config.codeTheme);
  const [mathInline, setMathInline] = useState(state.config.mathInline !== false);
  const [optimisticUndo, setOptimisticUndo] = useState(state.config.optimisticUndo !== false);
  const [pollInterval, setPollInterval] = useState(state.config.workspacePollInterval ?? 5000);
  const snap = clientStateSnapshot();

  useEffect(() => {
    registerPreferencesSaver(async () => {
      state.config.markdownTheme = markdownTheme;
      state.config.codeTheme = codeTheme;
      state.config.mathInline = mathInline;
      state.config.workspacePollInterval = pollInterval;
      state.config.optimisticUndo = optimisticUndo;
      await saveConfigAndNotify();
    });
    return () => registerPreferencesSaver(null);
  }, [markdownTheme, codeTheme, mathInline, optimisticUndo, pollInterval]);

  return (
    <>
      <div className="settings-group">
        <div className="settings-group-title">外观</div>
        <div className="settings-section-desc">切换 Markdown 正文样式和代码高亮配色。</div>
        <div className="settings-row">
          <label className="settings-label">正文样式</label>
          <select
            id="markdownThemeSelect"
            className="settings-select"
            value={markdownTheme}
            onChange={(e) => {
              state.config.markdownTheme = e.target.value;
              setMarkdownTheme(e.target.value);
              applyThemeLive();
            }}
          >
            {MD_THEMES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        <div className="settings-row">
          <label className="settings-label">代码高亮</label>
          <select
            id="codeThemeSelect"
            className="settings-select"
            value={codeTheme}
            onChange={(e) => {
              state.config.codeTheme = e.target.value;
              setCodeTheme(e.target.value);
              applyThemeLive();
            }}
          >
            {HL_THEMES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">数学公式</div>
        <div className="settings-section-desc">使用 KaTeX 渲染 LaTeX 公式。<code>$$...$$</code> 块级公式始终启用。</div>
        <div className="settings-row">
          <label className="settings-label">行内公式 <code>$...$</code></label>
          <label className="settings-toggle">
            <input id="mathInlineCheckbox" type="checkbox" checked={mathInline} onChange={(e) => setMathInline(e.target.checked)} />
            <span className="settings-toggle-label">启用（关闭可避免 <code>$</code> 货币符号误触发）</span>
          </label>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">评论</div>
        <div className="settings-row">
          <label className="settings-label">乐观撤销</label>
          <label className="settings-toggle">
            <input id="optimisticUndoCheckbox" type="checkbox" checked={optimisticUndo} onChange={(e) => setOptimisticUndo(e.target.checked)} />
            <span className="settings-toggle-label">删除/解决评论后显示撤销按钮（4 秒内可撤销）</span>
          </label>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">工作区</div>
        <div className="settings-section-desc">工作区文件树的轮询间隔，用于感知新增/删除文件。修改后刷新页面生效。</div>
        <div className="settings-row">
          <label className="settings-label">轮询间隔</label>
          <select id="pollIntervalSelect" className="settings-select" value={pollInterval} onChange={(e) => setPollInterval(Number(e.target.value))}>
            {[2000, 5000, 10000, 30000].map((v) => <option key={v} value={v}>{v / 1000}s</option>)}
          </select>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">客户端状态</div>
        <div className="settings-section-desc">用于排查本地缓存是否脏数据，可直接清理。</div>
        <div className="settings-kv-grid">
          <div>当前文件</div><div>{snap.currentFile || '无'}</div>
          <div>已打开文件数</div><div>{snap.openFilesCount}</div>
          <div>工作区数</div><div>{snap.workspaceCount}</div>
          <div>评论相关本地键数</div><div>{snap.commentStateKeyCount}</div>
          <div>md-viewer 本地键数</div><div>{snap.mdvKeys.length}</div>
          <div>localStorage 总键数</div><div>{snap.localStorageKeyCount}</div>
        </div>
        <div className="settings-key-list">
          {snap.mdvKeys.map((key) => <span key={key} className="settings-key-chip">{key}</span>)}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">数据清理</div>
        <div className="settings-section-desc">清理浏览器里 md-viewer 的本地缓存（不影响服务端评论），随后自动刷新页面。</div>
        <div className="settings-actions-row">
          <button
            className="sync-dialog-button"
            id="clearClientStateBtn"
            onClick={() => {
              getAllStorageKeys().filter((k) => k.startsWith('md-viewer')).forEach(storageRemove);
              location.reload();
            }}
          >
            清理客户端状态
          </button>
        </div>
      </div>
    </>
  );
}
