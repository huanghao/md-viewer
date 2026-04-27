// Toast 类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast 配置
interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number; // 毫秒，0 表示不自动关闭
  action?: { label: string; onClick: () => void };
}

// Toast 容器
let toastContainer: HTMLElement | null = null;

// 初始化 Toast 容器
function initToastContainer() {
  if (toastContainer) return;

  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
}

// 显示 Toast
export function showToast(options: ToastOptions | string) {
  // 支持简单的字符串调用
  const config: ToastOptions = typeof options === 'string'
    ? { message: options, type: 'info', duration: 3000 }
    : { type: 'info', duration: 3000, ...options };

  initToastContainer();

  // 创建 Toast 元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${config.type}`;

  // 图标
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };

  const actionHtml = config.action
    ? `<button class="toast-action">${config.action.label}</button>`
    : '';
  const progressHtml = config.duration && config.duration > 0
    ? `<div class="toast-progress"><div class="toast-progress-bar"></div></div>`
    : '';
  toast.innerHTML = `
    <span class="toast-icon">${icons[config.type!]}</span>
    <span class="toast-message">${config.message}</span>
    ${actionHtml}
    ${progressHtml}
  `;

  // 添加到容器
  toastContainer!.appendChild(toast);

  // 触发入场动画，然后启动进度条
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
    if (config.duration && config.duration > 0) {
      const bar = toast.querySelector('.toast-progress-bar') as HTMLElement | null;
      if (bar) {
        bar.style.transitionDuration = `${config.duration}ms`;
        requestAnimationFrame(() => { bar.style.width = '0%'; });
      }
    }
  });

  // 自动关闭
  if (config.duration && config.duration > 0) {
    setTimeout(() => {
      hideToast(toast);
    }, config.duration);
  }

  // action 按钮
  if (config.action) {
    const btn = toast.querySelector('.toast-action') as HTMLButtonElement | null;
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      config.action!.onClick();
      hideToast(toast);
    });
  }

  // 点击 toast 本身关闭（不含 action 按钮）
  toast.addEventListener('click', () => {
    hideToast(toast);
  });

  return toast;
}

// 隐藏 Toast
function hideToast(toast: HTMLElement) {
  toast.classList.remove('toast-show');
  toast.classList.add('toast-hide');

  setTimeout(() => {
    toast.remove();
  }, 300); // 动画时长
}

// 便捷方法
export function showSuccess(message: string, duration?: number) {
  return showToast({ message, type: 'success', duration });
}

export function showError(message: string, duration?: number) {
  return showToast({ message, type: 'error', duration });
}

export function showWarning(message: string, duration?: number) {
  return showToast({ message, type: 'warning', duration });
}

export function showInfo(message: string, duration?: number) {
  return showToast({ message, type: 'info', duration });
}
