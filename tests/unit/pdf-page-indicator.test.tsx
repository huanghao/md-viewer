import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { PdfPageIndicator } from '../../src/client/pdf-page-indicator/PdfPageIndicator';
import { clampPageInput, pdfPageIndicatorStore } from '../../src/client/pdf-page-indicator/store';

const KEYS = ['window', 'document', 'Event', 'HTMLElement', 'MouseEvent', 'HTMLInputElement'] as const;
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

describe('clampPageInput', () => {
  it('把输入截断到 [1, total]，无效输入回到第 1 页', () => {
    expect(clampPageInput('5', 10)).toBe(5);
    expect(clampPageInput('0', 10)).toBe(1);
    expect(clampPageInput('-3', 10)).toBe(1);
    expect(clampPageInput('99', 10)).toBe(10);
    expect(clampPageInput('', 10)).toBe(1);
    expect(clampPageInput('abc', 10)).toBe(1);
  });
});

describe('pdfPageIndicatorStore', () => {
  it('滚动同步页码，但输入态下不打断用户输入', () => {
    pdfPageIndicatorStore.show({ page: 1, total: 4, onGoto: () => {} });
    pdfPageIndicatorStore.setPage(2);
    expect(pdfPageIndicatorStore.getState().page).toBe(2);
    pdfPageIndicatorStore.startEdit();
    pdfPageIndicatorStore.setPage(3);
    expect(pdfPageIndicatorStore.getState().page).toBe(2);
    pdfPageIndicatorStore.stopEdit();
    pdfPageIndicatorStore.hide();
    expect(pdfPageIndicatorStore.getState().visible).toBe(false);
  });
});

describe('PdfPageIndicator', () => {
  it('显示 当前页 / 总页数，点击进入输入态，Esc 后回到标签', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    const root = createRoot(host);
    pdfPageIndicatorStore.show({ page: 3, total: 8, onGoto: () => {} });
    await act(async () => { root.render(createElement(PdfPageIndicator)); });

    const label = host.querySelector('.pdf-page-indicator-label');
    expect(label?.textContent).toBe('3 / 8');

    await act(async () => { host.querySelector<HTMLElement>('#pdfPageIndicator')!.click(); });
    expect(host.querySelector('.pdf-page-indicator-input')).not.toBeNull();
    expect(host.querySelector('.pdf-page-indicator-label')).toBeNull();

    await act(async () => { pdfPageIndicatorStore.stopEdit(); });
    expect(host.querySelector('.pdf-page-indicator-label')?.textContent).toBe('3 / 8');

    await act(async () => { pdfPageIndicatorStore.hide(); });
    expect(host.querySelector('#pdfPageIndicator')).toBeNull();
    await act(async () => { root.unmount(); });
  });
});
