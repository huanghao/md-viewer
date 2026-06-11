// TDD: diff banner 按钮通过 data-action + 回调驱动，不依赖 window.*
import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { initDiffBannerActions, buildDiffBannerHTML, updateBannerForMode } from '../../src/client/ui/diff-banner';

let win: Window;
let doc: Document;

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
  doc.body.innerHTML = '';
});

afterEach(() => {
  doc.body.innerHTML = '';
  win.close();
});

describe('buildDiffBannerHTML', () => {
  it('生成的 HTML 不包含 window. 调用', () => {
    const html = buildDiffBannerHTML();
    expect(html).not.toContain('window.');
  });

  it('每个操作按钮带有 data-action 属性', () => {
    doc.body.innerHTML = `<div id="diffBanner">${buildDiffBannerHTML()}</div>`;
    expect(doc.querySelector('[data-action="diff-prev"]')).not.toBeNull();
    expect(doc.querySelector('[data-action="diff-next"]')).not.toBeNull();
    expect(doc.querySelector('[data-action="diff-accept"]')).not.toBeNull();
    expect(doc.querySelector('[data-action="diff-close"]')).not.toBeNull();
    expect(doc.querySelector('[data-action="diff-mode-toggle"]')).not.toBeNull();
  });
});

describe('updateBannerForMode', () => {
  it('paragraph 模式更新 label 和 toggle 按钮文字', () => {
    doc.body.innerHTML = `<div id="diffBanner">${buildDiffBannerHTML()}</div>`;
    const banner = doc.getElementById('diffBanner')!;
    updateBannerForMode(banner as unknown as HTMLElement, 'paragraph');
    expect(banner.querySelector('.diff-banner-label')!.textContent).toBe('段落 Diff · 显示变更段落');
    expect((banner.querySelector('#diffModeToggle') as HTMLElement).textContent).toBe('行级视图');
  });

  it('line 模式更新 label 和 toggle 按钮文字', () => {
    doc.body.innerHTML = `<div id="diffBanner">${buildDiffBannerHTML()}</div>`;
    const banner = doc.getElementById('diffBanner')!;
    updateBannerForMode(banner as unknown as HTMLElement, 'line');
    expect(banner.querySelector('.diff-banner-label')!.textContent).toBe('行级 Diff · 完整行变更');
    expect((banner.querySelector('#diffModeToggle') as HTMLElement).textContent).toBe('段落视图');
  });
});

describe('initDiffBannerActions', () => {
  function makeCallbacks() {
    return {
      onNavigate: mock(() => {}),
      onAccept: mock(() => {}),
      onClose: mock(() => {}),
      onSwitchMode: mock(() => {}),
    };
  }

  it('点击 diff-prev 调用 onNavigate(-1)', () => {
    doc.body.innerHTML = `<div id="diffBanner">${buildDiffBannerHTML()}</div>`;
    const cbs = makeCallbacks();
    initDiffBannerActions(doc.getElementById('diffBanner')!, cbs);
    (doc.querySelector('[data-action="diff-prev"]') as HTMLElement).click();
    expect(cbs.onNavigate).toHaveBeenCalledTimes(1);
    expect(cbs.onNavigate).toHaveBeenCalledWith(-1);
  });

  it('点击 diff-next 调用 onNavigate(1)', () => {
    doc.body.innerHTML = `<div id="diffBanner">${buildDiffBannerHTML()}</div>`;
    const cbs = makeCallbacks();
    initDiffBannerActions(doc.getElementById('diffBanner')!, cbs);
    (doc.querySelector('[data-action="diff-next"]') as HTMLElement).click();
    expect(cbs.onNavigate).toHaveBeenCalledWith(1);
  });

  it('点击 diff-accept 调用 onAccept()', () => {
    doc.body.innerHTML = `<div id="diffBanner">${buildDiffBannerHTML()}</div>`;
    const cbs = makeCallbacks();
    initDiffBannerActions(doc.getElementById('diffBanner')!, cbs);
    (doc.querySelector('[data-action="diff-accept"]') as HTMLElement).click();
    expect(cbs.onAccept).toHaveBeenCalledTimes(1);
  });

  it('点击 diff-close 调用 onClose()', () => {
    doc.body.innerHTML = `<div id="diffBanner">${buildDiffBannerHTML()}</div>`;
    const cbs = makeCallbacks();
    initDiffBannerActions(doc.getElementById('diffBanner')!, cbs);
    (doc.querySelector('[data-action="diff-close"]') as HTMLElement).click();
    expect(cbs.onClose).toHaveBeenCalledTimes(1);
  });

  it('点击 diff-mode-toggle 调用 onSwitchMode()', () => {
    doc.body.innerHTML = `<div id="diffBanner">${buildDiffBannerHTML()}</div>`;
    const cbs = makeCallbacks();
    initDiffBannerActions(doc.getElementById('diffBanner')!, cbs);
    (doc.querySelector('[data-action="diff-mode-toggle"]') as HTMLElement).click();
    expect(cbs.onSwitchMode).toHaveBeenCalledTimes(1);
  });

  it('点击 banner 非按钮区域不触发任何回调', () => {
    doc.body.innerHTML = `<div id="diffBanner">${buildDiffBannerHTML()}</div>`;
    const cbs = makeCallbacks();
    initDiffBannerActions(doc.getElementById('diffBanner')!, cbs);
    doc.getElementById('diffBanner')!.click();
    expect(cbs.onNavigate).toHaveBeenCalledTimes(0);
    expect(cbs.onAccept).toHaveBeenCalledTimes(0);
    expect(cbs.onClose).toHaveBeenCalledTimes(0);
    expect(cbs.onSwitchMode).toHaveBeenCalledTimes(0);
  });
});
