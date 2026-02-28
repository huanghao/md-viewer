import { showSuccess, showError } from './toast';

interface MenuItem {
  icon: string;
  label: string;
  action: () => void;
}

let currentMenu: HTMLElement | null = null;

// 创建并显示右键菜单
export function showContextMenu(x: number, y: number, items: MenuItem[]): void {
  // 移除已存在的菜单
  hideContextMenu();

  // 创建菜单元素
  const menu = document.createElement('div');
  menu.className = 'context-menu show';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  // 添加菜单项
  items.forEach((item, index) => {
    const menuItem = document.createElement('div');
    menuItem.className = 'context-menu-item';
    menuItem.innerHTML = `
      <span class="context-menu-icon">${item.icon}</span>
      <span>${item.label}</span>
    `;
    menuItem.addEventListener('click', () => {
      item.action();
      hideContextMenu();
    });
    menu.appendChild(menuItem);

    // 如果不是最后一项，可以添加分隔线（可选）
    // if (index < items.length - 1) {
    //   const divider = document.createElement('div');
    //   divider.className = 'context-menu-divider';
    //   menu.appendChild(divider);
    // }
  });

  document.body.appendChild(menu);
  currentMenu = menu;

  // 调整位置防止超出屏幕
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${window.innerWidth - rect.width - 10}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${window.innerHeight - rect.height - 10}px`;
  }

  // 点击其他地方关闭菜单
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true });
  }, 0);
}

// 隐藏右键菜单
export function hideContextMenu(): void {
  if (currentMenu) {
    currentMenu.remove();
    currentMenu = null;
  }
}

// 复制文本到剪贴板
async function copyToClipboard(text: string, successMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess(successMessage, 2000);
  } catch (err) {
    console.error('复制失败:', err);
    showError('复制失败', 2000);
  }
}

// 为文件路径显示右键菜单
export function showFileContextMenu(event: MouseEvent, filePath: string): void {
  event.preventDefault();
  event.stopPropagation();

  const fileName = filePath.split('/').pop() || filePath;

  const items: MenuItem[] = [
    {
      icon: '📄',
      label: '复制文件名',
      action: () => copyToClipboard(fileName, '已复制文件名')
    },
    {
      icon: '📋',
      label: '复制完整路径',
      action: () => copyToClipboard(filePath, '已复制完整路径')
    }
  ];

  showContextMenu(event.clientX, event.clientY, items);
}
