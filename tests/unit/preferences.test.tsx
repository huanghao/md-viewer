import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';

// 主题即时预览会动态导入 main.ts（启动副作用很重），测试里替换掉
mock.module('../../src/client/main', () => ({ applyTheme: () => {} }));

const KEYS = ['window', 'document', 'Event', 'HTMLElement', 'localStorage', 'requestAnimationFrame'] as const;
const saved: Record<string, any> = {};

beforeAll(() => {
  const win = new Window({ url: 'http://localhost/' });
  for (const k of KEYS) {
    saved[k] = (globalThis as any)[k];
    (globalThis as any)[k] = k === 'window' ? win : (win as any)[k];
  }
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  for (const k of KEYS) (globalThis as any)[k] = saved[k];
  delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});

const { state } = await import('../../src/client/state');
const { loadConfig } = await import('../../src/client/config');
const { showPreferences, closePreferences, isPreferencesOpen } = await import('../../src/client/ui/preferences');
const { setPrefTab } = await import('../../src/client/preferences/controller');

// 偏好设置里的异步标签页（评论、Agent）会请求后端，这里统一返回空数据
const realFetch = globalThis.fetch;
globalThis.fetch = (async () => new Response('[]', { headers: { 'Content-Type': 'application/json' } })) as any;

async function flush(): Promise<void> {
  for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
}

const overlay = () => document.getElementById('preferencesOverlay');
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

afterEach(async () => {
  await act(async () => closePreferences());
  await flush();
});

describe('偏好设置对话框', () => {
  it('打开后展示四个标签页，关闭后对话框消失', async () => {
    await act(async () => showPreferences());
    await flush();
    expect(isPreferencesOpen()).toBe(true);
    expect(overlay()).not.toBeNull();
    const navItems = [...document.querySelectorAll('.preferences-nav-item')].map((n) => n.textContent?.trim());
    expect(navItems).toEqual(['外观', '快捷键', '评论', 'Agent']);

    await act(async () => closePreferences());
    await flush();
    expect(isPreferencesOpen()).toBe(false);
    expect(overlay()).toBeNull();
  });

  it('取消会还原正文主题与行内公式设置', async () => {
    state.config.markdownTheme = 'github';
    state.config.mathInline = true;
    await act(async () => showPreferences());
    await flush();

    state.config.markdownTheme = 'notion';
    state.config.mathInline = false;
    await act(async () => byId<HTMLButtonElement>('prefCancel')!.click());
    await flush();

    expect(state.config.markdownTheme).toBe('github');
    expect(state.config.mathInline).toBe(true);
    expect(isPreferencesOpen()).toBe(false);
  });

  it('外观标签页保存后写入配置', async () => {
    await act(async () => showPreferences());
    await flush();

    const poll = byId<HTMLSelectElement>('pollIntervalSelect');
    expect(poll).not.toBeNull();
    await act(async () => {
      poll!.value = '10000';
      poll!.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flush();
    await act(async () => byId<HTMLButtonElement>('prefSave')!.click());
    await flush();

    expect(isPreferencesOpen()).toBe(false);
    expect(loadConfig().workspacePollInterval).toBe(10000);
  });

  it('快捷键标签页展示重置按钮，切换标签页后外观内容消失', async () => {
    await act(async () => showPreferences());
    await flush();
    expect(byId('markdownThemeSelect')).not.toBeNull();

    await act(async () => setPrefTab('快捷键'));
    await flush();
    expect(byId('markdownThemeSelect')).toBeNull();
    expect(byId('resetAllBindingsBtn')).not.toBeNull();
  });
});
