const isMac = navigator.platform.toUpperCase().includes('MAC');
const mod = isMac ? '⌘' : 'Ctrl+';

const modKey = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  { group: '导航' },
  { key: `${mod}F`, desc: '快速打开文件' },
  { key: 'j / k', desc: '文件列表上 / 下移动' },
  { key: 'h / l', desc: '切换到左 / 右 tab' },
  { key: `${modKey}+1~9`, desc: '跳到第 N 个文件' },
  { group: '文件' },
  { key: `${mod}W`, desc: '关闭当前文件' },
  { group: '视图' },
  { key: `${mod}K`, desc: '聚焦搜索框' },
  { key: `${mod}⇧K`, desc: '内容搜索' },
  { key: `${mod}+`, desc: '放大' },
  { key: `${mod}−`, desc: '缩小' },
  { key: `${mod}0`, desc: '重置缩放' },
  { group: 'Diff 模式' },
  { key: 'j', desc: '下一个变更块' },
  { key: 'k', desc: '上一个变更块' },
  { group: '通用' },
  { key: 'Esc', desc: '关闭弹窗 / 批注面板' },
];

let popover: HTMLElement | null = null;

function buildPopover(): HTMLElement {
  const el = document.createElement('div');
  el.id = 'shortcutsHelpPopover';
  el.className = 'shortcuts-help-popover hidden';

  const rows = SHORTCUTS.map(s => {
    if ('group' in s && !('key' in s)) {
      return `<div class="shortcuts-help-group">${s.group}</div>`;
    }
    return `<div class="shortcuts-help-row"><kbd>${s.key}</kbd><span>${s.desc}</span></div>`;
  }).join('');

  el.innerHTML = `
    <div class="shortcuts-help-header">
      <span>键盘快捷键</span>
      <button class="shortcuts-help-close" id="shortcutsHelpClose">×</button>
    </div>
    <div class="shortcuts-help-body">${rows}</div>
  `;

  document.body.appendChild(el);

  el.querySelector('#shortcutsHelpClose')?.addEventListener('click', hideShortcutsHelp);

  document.addEventListener('click', (e) => {
    if (!popover || popover.classList.contains('hidden')) return;
    const btn = document.getElementById('shortcutsHelpBtn');
    const target = e.target as Node;
    if (!el.contains(target) && !btn?.contains(target)) {
      hideShortcutsHelp();
    }
  });

  return el;
}

export function showShortcutsHelp(): void {
  if (!popover) popover = buildPopover();

  const btn = document.getElementById('shortcutsHelpBtn');
  if (btn) {
    const rect = btn.getBoundingClientRect();
    popover.style.top = `${rect.bottom + 6}px`;
    popover.style.right = `${window.innerWidth - rect.right}px`;
  }

  popover.classList.remove('hidden');
}

export function hideShortcutsHelp(): void {
  popover?.classList.add('hidden');
}

export function toggleShortcutsHelp(): void {
  if (!popover || popover.classList.contains('hidden')) {
    showShortcutsHelp();
  } else {
    hideShortcutsHelp();
  }
}

export function isShortcutsHelpVisible(): boolean {
  return !!(popover && !popover.classList.contains('hidden'));
}
