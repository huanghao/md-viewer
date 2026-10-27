import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Composer } from './Composer';
import { Messages } from './Messages';
import { SessionBar, type SessionBarActions } from './SessionBar';
import { Stats } from './Stats';
import { Tray } from './Tray';
import { StatusLine } from './StatusLine';

/**
 * Agent 面板的 React 挂载点。容器节点仍是 public/index.html 里的固定元素
 * （滚动、划词监听等手写逻辑依赖它们），React 只接管容器的内部内容。
 */

let roots: Root[] = [];

export function mountAgentViews(actions: SessionBarActions): void {
  unmountAgentViews();
  const messages = document.getElementById('agentChatMessages');
  if (messages) {
    const root = createRoot(messages);
    root.render(createElement(Messages, { container: messages }));
    roots.push(root);
  }
  const header = document.getElementById('agentChatHeader');
  if (header) {
    const root = createRoot(header);
    root.render(createElement(SessionBar, actions));
    roots.push(root);
  }
  const status = document.getElementById('agentChatStatus');
  if (status) {
    const root = createRoot(status);
    root.render(createElement(StatusLine));
    roots.push(root);
  }
  const tray = document.getElementById('agentTrayRoot');
  if (tray) {
    const root = createRoot(tray);
    root.render(createElement(Tray));
    roots.push(root);
  }
  const compose = document.getElementById('agentChatCompose');
  if (compose) {
    const root = createRoot(compose);
    root.render(createElement(Composer));
    roots.push(root);
  }
  const stats = document.getElementById('agentChatStats');
  if (stats) {
    const root = createRoot(stats);
    root.render(createElement(Stats));
    roots.push(root);
  }
}

export function unmountAgentViews(): void {
  roots.forEach((r) => r.unmount());
  roots = [];
}
