/**
 * SSE 连接管理器
 * 管理连接状态、重连策略（指数退避）、最大重试限制
 */

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface SSEManagerOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  onStatusChange: (status: ConnectionStatus, retryInfo?: string) => void;
  onConnect: (isReconnect: boolean) => void;
}

export class SSEManager {
  private retryCount = 0;
  private currentDelay: number;
  private maxRetries: number;
  private initialDelay: number;
  private maxDelay: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private status: ConnectionStatus = 'connecting';
  private onStatusChange: (status: ConnectionStatus, retryInfo?: string) => void;
  private onConnect: (isReconnect: boolean) => void;
  private eventSource: EventSource | null = null;

  constructor(options: SSEManagerOptions) {
    this.maxRetries = options.maxRetries;
    this.initialDelay = options.initialDelay;
    this.maxDelay = options.maxDelay;
    this.currentDelay = options.initialDelay;
    this.onStatusChange = options.onStatusChange;
    this.onConnect = options.onConnect;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  getCurrentDelay(): number {
    return this.currentDelay;
  }

  connect(isReconnect = false): EventSource {
    this.cleanup();
    this.updateStatus('connecting', isReconnect ? `${this.retryCount + 1}/${this.maxRetries}` : undefined);

    this.eventSource = new EventSource('/api/events');

    this.eventSource.addEventListener('connected', () => {
      if (this.retryCount > 0) {
        this.retryCount = 0;
        this.currentDelay = this.initialDelay;
      }
      this.updateStatus('connected');
      this.onConnect(isReconnect);
    });

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.scheduleReconnect();
    };

    return this.eventSource;
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      this.updateStatus('failed');
      return;
    }

    this.retryCount++;
    const retryText = `${this.retryCount}/${this.maxRetries}`;
    this.updateStatus('connecting', retryText);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(true);
    }, this.currentDelay);

    // 指数退避
    this.currentDelay = Math.min(this.currentDelay * 2, this.maxDelay);
  }

  resetAndReconnect(): void {
    this.retryCount = 0;
    this.currentDelay = this.initialDelay;
    this.cleanupTimer();
    this.connect(true);
  }

  disconnect(): void {
    this.cleanup();
    this.updateStatus('disconnected');
  }

  private cleanup(): void {
    this.cleanupTimer();
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private cleanupTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private updateStatus(status: ConnectionStatus, info?: string): void {
    this.status = status;
    this.onStatusChange(status, info);
  }

  // 用于测试：直接设置内部状态
  setStateForTest(state: { retryCount: number; currentDelay: number }): void {
    this.retryCount = state.retryCount;
    this.currentDelay = state.currentDelay;
  }
}

// 默认配置常量
export const SSE_DEFAULT_CONFIG = {
  maxRetries: 10,
  initialDelay: 3000,
  maxDelay: 30000,
};
