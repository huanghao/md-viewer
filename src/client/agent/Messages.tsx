import { Fragment, useLayoutEffect, useRef } from 'react';
import type { AgentRun, AgentTranscriptMsg } from '../api/agent';
import { renderMath } from '../content-renderer';
import { highlightCodeBlocks } from '../utils/code-highlight';
import { escapeHtml } from '../utils/escape';
import { fmtDuration, fmtTime, shouldRenderMsg } from './format';
import { useAgentState } from './useAgentState';

// 助手回复按 markdown 渲染（复用正文渲染同一个 marked 实例），其它消息类型
// 保持纯文本——状态行/工具调用没有 markdown 语义，React 默认转义即可
function renderMarkdown(text: string): string {
  try {
    return (window as any).marked.parse(text);
  } catch {
    return escapeHtml(text);
  }
}

const PLAIN_KIND: Record<string, { cls: string; prefix: string }> = {
  user: { cls: 'agent-msg-user', prefix: '' },
  tool: { cls: 'agent-msg-tool', prefix: '🔧 ' },
  'tool-result': { cls: 'agent-msg-tool', prefix: '→ ' },
  error: { cls: 'agent-msg-error', prefix: '' },
  result: { cls: 'agent-msg-result', prefix: '' },
  thinking: { cls: 'agent-msg-thinking', prefix: '💭 ' },
};

function Time({ ts }: { ts: number }) {
  return <span className="agent-msg-time">{fmtTime(ts)}</span>;
}

function MarkdownMsg({ m }: { m: AgentTranscriptMsg }) {
  const ref = useRef<HTMLDivElement>(null);
  // 时间戳和正文在同一个节点里（样式依赖 :last-child），所以一起放进 html
  const html = `${renderMarkdown(m.text)}<span class="agent-msg-time">${fmtTime(m.timestamp)}</span>`;
  useLayoutEffect(() => {
    if (!ref.current) return;
    highlightCodeBlocks(ref.current);
    renderMath(ref.current);
  }, [html]);
  return <div ref={ref} className="agent-msg agent-msg-text agent-msg-markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Msg({ m }: { m: AgentTranscriptMsg }) {
  const plain = PLAIN_KIND[m.kind];
  if (!plain) return <MarkdownMsg m={m} />;
  return (
    <div className={`agent-msg ${plain.cls}`}>
      {plain.prefix}{m.text}<Time ts={m.timestamp} />
    </div>
  );
}

function RunDivider({ run }: { run: AgentRun }) {
  const time = new Date(run.startedAt).toLocaleString();
  const duration = run.finishedAt ? fmtDuration(run.finishedAt - run.startedAt) : '运行中';
  let cmd = '';
  try { cmd = run.command ? JSON.parse(run.command)[0] : ''; } catch { /* 非 JSON 命令不展示 */ }
  return <div className="agent-run-divider">{time} · {duration}{cmd ? ` · ${cmd}` : ''}</div>;
}

/** 距离底部不足这个值就认为用户「在跟着看」，新内容到来时自动贴底 */
const STICK_THRESHOLD = 60;

/** container 是外层可滚动的 #agentChatMessages，由它负责滚动，组件只渲染内容 */
export function Messages({ container }: { container: HTMLElement }) {
  const loading = useAgentState((s) => s.loading);
  const pastRuns = useAgentState((s) => s.pastRuns);
  const live = useAgentState((s) => s.live);
  const stick = useRef(true);

  useLayoutEffect(() => {
    const onScroll = () => { stick.current = container.scrollHeight - container.scrollTop - container.clientHeight < STICK_THRESHOLD; };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [container]);

  useLayoutEffect(() => {
    if (stick.current) container.scrollTop = container.scrollHeight;
  }, [container, loading, pastRuns, live]);

  // 底栏（状态行、chip、输入框）高度变化会改变消息区可视高度：跟着看的时候保持贴底，不让最后一条被遮住
  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (stick.current) container.scrollTop = container.scrollHeight;
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [container]);

  const liveShown = live.filter(shouldRenderMsg);
  // 已经有内容可看时，后台重载不闪「加载中…」，数据到了直接替换；只有首次加载才显示占位
  if (loading && pastRuns.length === 0 && liveShown.length === 0) return <div className="agent-chat-empty">加载中…</div>;
  if (pastRuns.length === 0 && liveShown.length === 0) {
    return <div className="agent-chat-empty">还没有对话，在下面输入内容开始，或点 /mdv 处理这个文档的批注。</div>;
  }
  return (
    <>
      {pastRuns.map((r) => (
        <Fragment key={r.id}>
          <RunDivider run={r} />
          {(r.transcript ?? []).filter(shouldRenderMsg).map((m, i) => <Msg key={i} m={m} />)}
        </Fragment>
      ))}
      {liveShown.map((m, i) => <Msg key={`l${i}`} m={m} />)}
    </>
  );
}
