// Toast 类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast 配置
interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number; // 毫秒，0 表示不自动关闭
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

  toast.innerHTML = `
    <span class="toast-icon">${icons[config.type!]}</span>
    <span class="toast-message">${config.message}</span>
  `;

  // 添加到容器
  toastContainer!.appendChild(toast);

  // 触发动画
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // 自动关闭
  if (config.duration && config.duration > 0) {
    setTimeout(() => {
      hideToast(toast);
    }, config.duration);
  }

  // 点击关闭
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
