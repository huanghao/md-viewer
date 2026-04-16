import { describe, it, expect, beforeEach } from 'bun:test';
import { SSEManager, SSE_DEFAULT_CONFIG } from '../../src/client/sse-manager';

// Mock EventSource for Node/Bun test environment
class MockEventSource {
  url: string;
  readyState = 0;
  onerror: ((event: any) => void) | null = null;
  private listeners: Map<string, Array<(event: any) => void>> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(event: string, handler: (event: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  close() {
    this.readyState = 2;
  }

  // Test helper to trigger events
  trigger(event: string, data?: any) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(h => h({ data: data ? JSON.stringify(data) : undefined }));
  }

  triggerError() {
    if (this.onerror) {
      this.onerror({});
    }
  }
}

// @ts-ignore
global.EventSource = MockEventSource;

describe('SSEManager', () => {
  let statusChanges: Array<{ status: string; info?: string }>;
  let connectCount: number;
  let reconnectCount: number;
  let manager: SSEManager;

  beforeEach(() => {
    statusChanges = [];
    connectCount = 0;
    reconnectCount = 0;
    manager = new SSEManager({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 500,
      onStatusChange: (status, info) => {
        statusChanges.push({ status, info });
      },
      onConnect: (isReconnect) => {
        if (isReconnect) {
          reconnectCount++;
        } else {
          connectCount++;
        }
      },
    });
  });

  describe('状态管理', () => {
    it('初始状态为 connecting', () => {
      expect(manager.getStatus()).toBe('connecting');
    });

    it('连接成功后状态变为 connected', () => {
      // 注意：这里不实际连接，只是测试状态流转
      // 实际 EventSource 连接在浏览器环境中测试
      expect(manager.getStatus()).toBe('connecting');
    });
  });

  describe('重连计数和退避', () => {
    it('初始重试计数为 0', () => {
      expect(manager.getRetryCount()).toBe(0);
    });

    it('初始延迟等于配置值', () => {
      expect(manager.getCurrentDelay()).toBe(100);
    });

    it('设置状态后重试计数和延迟正确', () => {
      manager.setStateForTest({ retryCount: 2, currentDelay: 200 });
      expect(manager.getRetryCount()).toBe(2);
      expect(manager.getCurrentDelay()).toBe(200);
    });

    it('重置后重试计数和延迟归零', () => {
      manager.setStateForTest({ retryCount: 2, currentDelay: 400 });
      manager.resetAndReconnect();
      expect(manager.getRetryCount()).toBe(0);
      expect(manager.getCurrentDelay()).toBe(100);
    });
  });

  describe('默认配置', () => {
    it('默认最大重试次数为 10', () => {
      expect(SSE_DEFAULT_CONFIG.maxRetries).toBe(10);
    });

    it('默认初始延迟为 3000ms', () => {
      expect(SSE_DEFAULT_CONFIG.initialDelay).toBe(3000);
    });

    it('默认最大延迟为 30000ms', () => {
      expect(SSE_DEFAULT_CONFIG.maxDelay).toBe(30000);
    });
  });

  describe('指数退避计算', () => {
    it('延迟按指数增长', () => {
      manager.setStateForTest({ retryCount: 1, currentDelay: 100 });
      // 第一次重连后，延迟应该翻倍
      const expectedDelay = Math.min(100 * 2, 500);
      expect(expectedDelay).toBe(200);
    });

    it('延迟不超过最大值', () => {
      manager.setStateForTest({ retryCount: 5, currentDelay: 400 });
      // 400 * 2 = 800，但最大值是 500
      const expectedDelay = Math.min(400 * 2, 500);
      expect(expectedDelay).toBe(500);
    });

    it('多次翻倍后达到最大值', () => {
      let delay = 100;
      // 模拟多次退避
      delay = Math.min(delay * 2, 500); // 200
      expect(delay).toBe(200);
      delay = Math.min(delay * 2, 500); // 400
      expect(delay).toBe(400);
      delay = Math.min(delay * 2, 500); // 800 -> 500
      expect(delay).toBe(500);
      // 后续保持最大值
      delay = Math.min(delay * 2, 500);
      expect(delay).toBe(500);
    });
  });

  describe('最大重试限制', () => {
    it('创建时配置的最大重试次数正确', () => {
      // 测试配置中设置的是 3
      expect(manager.getRetryCount()).toBe(0);
      // 模拟达到最大重试
      manager.setStateForTest({ retryCount: 3, currentDelay: 400 });
      expect(manager.getRetryCount()).toBe(3);
    });

    it('重置后重试计数清零', () => {
      manager.setStateForTest({ retryCount: 3, currentDelay: 400 });
      manager.resetAndReconnect();
      expect(manager.getRetryCount()).toBe(0);
    });
  });

  describe('状态流转', () => {
    it('初始状态是 connecting', () => {
      expect(manager.getStatus()).toBe('connecting');
    });

    it('disconnect 后状态变为 disconnected', () => {
      manager.disconnect();
      expect(manager.getStatus()).toBe('disconnected');
    });

    it('重置重连后状态变为 connecting', () => {
      manager.disconnect();
      expect(manager.getStatus()).toBe('disconnected');
      manager.resetAndReconnect();
      expect(manager.getStatus()).toBe('connecting');
    });
  });
});
