import { Fragment, useState, useRef, useSyncExternalStore } from 'react';
import { copyAbsolutePath, copyRelativePath } from '../utils/clipboard';
import { toolbarStore, type PdfMode } from './store';

export interface ToolbarDeps {
  onDiff: () => void;
  onRefresh: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** 缩放输入框失焦或回车时提交原始文本，由调用方解析 */
  onZoomCommit: (raw: string) => void;
  onPdfMode: (mode: PdfMode) => void;
  onSettings: () => void;
}

const homePrefixRe = /^\/(?:Users|home)\/[^/]+/;

function Breadcrumb({ path }: { path: string }) {
  const homeMatch = path.match(homePrefixRe);
  const displayPath = homeMatch ? '~' + path.slice(homeMatch[0].length) : path;
  // 按 / 切分，开头的 ~ 作为第一段
  const parts = displayPath.startsWith('~/')
    ? ['~', ...displayPath.slice(2).split('/').filter(Boolean)]
    : displayPath.split('/').filter(Boolean);

  return (
    <>
      <div className="breadcrumb" id="breadcrumb">
        {parts.map((part, i) => {
          const isLast = i === parts.length - 1;
          return isLast ? (
            <span key={i} className="breadcrumb-item active" title={path}>{part}</span>
          ) : (
            <Fragment key={i}>
              <span className="breadcrumb-item" title={path}>{part}</span>
              <span className="breadcrumb-separator">/</span>
            </Fragment>
          );
        })}
        <button className="copy-filename-button" title="复制相对路径" onClick={(e) => copyRelativePath(path, e.nativeEvent)}>
          <span className="copy-icon" />
          <CheckIcon />
          <span className="copy-tooltip">复制相对路径</span>
        </button>
        <button className="copy-filename-button copy-abspath-button" title="复制绝对路径" onClick={(e) => copyAbsolutePath(path, e.nativeEvent)}>
          <span className="copy-abspath-icon">/</span>
          <CheckIcon />
          <span className="copy-tooltip">复制绝对路径</span>
        </button>
        <button
          className="copy-filename-button open-in-editor-button"
          title="在 VS Code 中打开"
          onClick={() => {
            fetch('/api/open-in-editor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path }),
            }).catch(() => {});
          }}
        >
          <span className="open-editor-icon">↗</span>
        </button>
      </div>
    </>
  );
}

function CheckIcon() {
  return (
    <span className="check-icon">
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
      </svg>
    </span>
  );
}

function ZoomControl({ deps }: { deps: ToolbarDeps }) {
  const { zoomText } = useSyncExternalStore(toolbarStore.subscribe, toolbarStore.getState);
  // 聚焦编辑时显示草稿，不被后台的缩放刷新覆盖（与原来 focus 时跳过更新一致）
  const [draft, setDraft] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  return (
    <div className="zoom-control" id="zoomControl">
      <button className="zoom-step-btn" id="zoomOutBtn" title="缩小 (⌘−)" onClick={deps.onZoomOut}>−</button>
      <input
        className="zoom-input"
        id="fontScaleInput"
        type="text"
        value={draft ?? zoomText}
        title="缩放比例，可直接输入（如 150%）"
        onFocus={(e) => { setDraft(zoomText); e.currentTarget.select(); }}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={(e) => {
          const raw = cancelledRef.current ? zoomText : e.currentTarget.value;
          cancelledRef.current = false;
          setDraft(null);
          deps.onZoomCommit(raw);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          else if (e.key === 'Escape') {
            cancelledRef.current = true;
            e.currentTarget.blur();
          }
        }}
      />
      <button className="zoom-step-btn" id="zoomInBtn" title="放大 (⌘+)" onClick={deps.onZoomIn}>+</button>
    </div>
  );
}

/** 顶部工具栏：面包屑、PDF 模式、Diff/刷新、缩放、设置。渲染到静态的 #toolbar 容器内。 */
export function Toolbar({ deps }: { deps: ToolbarDeps }) {
  const s = useSyncExternalStore(toolbarStore.subscribe, toolbarStore.getState);
  const pdfBtn = (mode: PdfMode, label: string, title: string) => (
    <button
      className={`toolbar-text-button${s.pdfMode === mode ? ' is-active' : ''}`}
      id={mode === 'select' ? 'pdfModeSelectBtn' : 'pdfModeAnnotateBtn'}
      title={title}
      style={{ display: s.pdfVisible ? '' : 'none' }}
      onClick={() => deps.onPdfMode(mode)}
    >
      <span>{label}</span>
    </button>
  );

  return (
    <>
      {s.breadcrumbPath ? <Breadcrumb path={s.breadcrumbPath} /> : <div className="breadcrumb" id="breadcrumb" />}
      <div className="spacer" />
      {pdfBtn('select', '[𝐓 选择]', '文本选择模式')}
      {pdfBtn('annotate', '[⬚ 批注]', '拉框批注模式')}
      <button
        className={`toolbar-text-button${s.diffActive ? ' active' : ''}`}
        id="diffButton"
        title="查看修改内容"
        style={{ display: s.diffVisible ? 'flex' : 'none' }}
        onClick={deps.onDiff}
      >
        <span id="diffButtonText">[± Diff]</span>
      </button>
      <button
        className="toolbar-text-button"
        id="refreshButton"
        title="文件已更新，点击刷新"
        style={{ display: s.refreshVisible ? 'flex' : 'none' }}
        onClick={deps.onRefresh}
      >
        <span id="refreshButtonText">[↻ 刷新]</span>
      </button>
      <ZoomControl deps={deps} />
      <button className="toolbar-text-button" title="设置" onClick={deps.onSettings}>
        <span id="settingsButtonText">[⚙ 设置]</span>
      </button>
    </>
  );
}
