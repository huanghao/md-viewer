// 路径补全：绑定到输入框的键盘与请求逻辑在这里；面板渲染由 path-autocomplete/ 的 React 组件负责。
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { getPathSuggestions } from '../api/files';
import type { PathSuggestion } from '../types';
import { PathSuggestPanel } from '../path-autocomplete/PathSuggestPanel';
import { pathSuggestStore } from '../path-autocomplete/store';

interface PathAutocompleteOptions {
  kind: 'file' | 'directory';
  markdownOnly?: boolean;
  shouldActivate?: (input: string) => boolean;
}

let panelMounted = false;
function ensurePanel(): void {
  if (panelMounted) return;
  panelMounted = true;
  const host = document.createElement('div');
  host.id = 'pathAutocompleteHost';
  document.body.appendChild(host);
  createRoot(host).render(createElement(PathSuggestPanel));
}

export function attachPathAutocomplete(
  input: HTMLInputElement | HTMLTextAreaElement,
  options: PathAutocompleteOptions
): void {
  ensurePanel();
  const owner = Symbol('path-autocomplete');
  let suggestions: PathSuggestion[] = [];
  let activeIndex = -1;
  let requestId = 0;
  let debounceTimer: number | null = null;

  const isVisible = () => pathSuggestStore.getState().visible && pathSuggestStore.getState().owner === owner;

  const hide = () => {
    // 作废尚未返回的请求，避免它们在隐藏后重新打开面板
    requestId += 1;
    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    suggestions = [];
    activeIndex = -1;
    pathSuggestStore.hide(owner);
  };

  const syncPosition = () => {
    const rect = input.getBoundingClientRect();
    pathSuggestStore.update({
      left: Math.round(rect.left + window.scrollX),
      top: Math.round(rect.bottom + window.scrollY + 4),
      width: Math.round(rect.width),
    });
  };

  const render = () => {
    if (suggestions.length === 0) {
      hide();
      return;
    }
    pathSuggestStore.show(owner, {
      items: suggestions,
      activeIndex,
      onPick: (index: number) => choose(index),
    });
    syncPosition();
  };

  const choose = (index: number) => {
    const selected = suggestions[index];
    if (!selected) return;

    const isDirectory = selected.type === 'directory';
    const nextValue = isDirectory && !selected.path.endsWith('/')
      ? `${selected.path}/`
      : selected.path;

    input.value = nextValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    hide();
    if (isDirectory) {
      scheduleRefresh();
    }
  };

  const refresh = async () => {
    const query = input.value.trim();
    if (!query) {
      hide();
      return;
    }
    if (document.body.classList.contains('quick-action-confirm-visible')) {
      hide();
      return;
    }
    if (options.shouldActivate && !options.shouldActivate(query)) {
      hide();
      return;
    }

    const currentReq = ++requestId;
    try {
      const data = await getPathSuggestions(query, {
        kind: options.kind,
        markdownOnly: options.markdownOnly,
      });

      if (currentReq !== requestId) return;
      suggestions = data.suggestions || [];
      activeIndex = suggestions.length > 0 ? 0 : -1;
      render();
    } catch {
      hide();
    }
  };

  const scheduleRefresh = () => {
    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(refresh, 100);
  };

  const moveActive = (delta: number) => {
    if (suggestions.length === 0) return;
    activeIndex = (activeIndex + delta + suggestions.length) % suggestions.length;
    pathSuggestStore.update({ activeIndex });
  };

  input.addEventListener('focus', scheduleRefresh);
  input.addEventListener('input', scheduleRefresh);
  input.addEventListener('path-autocomplete-hide', hide as EventListener);

  input.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).isComposing) return; // 输入法组词中的 Enter/方向键归输入法
    const key = (e as KeyboardEvent).key;
    if (!isVisible()) return;

    if (key === 'ArrowDown') {
      e.preventDefault();
      moveActive(1);
      return;
    }

    if (key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
      return;
    }

    if (key === 'Tab') {
      if (activeIndex >= 0) {
        e.preventDefault();
        choose(activeIndex);
      }
      return;
    }

    if (key === 'Enter') {
      if ((e as KeyboardEvent).metaKey || (e as KeyboardEvent).ctrlKey) {
        return;
      }
      e.preventDefault();
      if (activeIndex >= 0) {
        choose(activeIndex);
        return;
      }
      hide();
      return;
    }

    if (key === 'Escape') {
      e.preventDefault();
      hide();
    }
  });

  input.addEventListener('blur', () => {
    window.setTimeout(hide, 120);
  });

  window.addEventListener('resize', () => {
    if (isVisible()) syncPosition();
  });

  window.addEventListener('scroll', () => {
    if (isVisible()) syncPosition();
  }, true);
}
