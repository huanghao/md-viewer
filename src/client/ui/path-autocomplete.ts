import { getPathSuggestions } from '../api/files';
import type { PathSuggestion } from '../types';

interface PathAutocompleteOptions {
  kind: 'file' | 'directory';
  markdownOnly?: boolean;
}

export function attachPathAutocomplete(
  input: HTMLInputElement | HTMLTextAreaElement,
  options: PathAutocompleteOptions
): void {
  let suggestions: PathSuggestion[] = [];
  let activeIndex = -1;
  let requestId = 0;
  let debounceTimer: number | null = null;

  const panel = document.createElement('div');
  panel.className = 'path-autocomplete-panel';
  panel.style.display = 'none';
  document.body.appendChild(panel);

  const isVisible = () => panel.style.display !== 'none';

  const hide = () => {
    panel.style.display = 'none';
    suggestions = [];
    activeIndex = -1;
  };

  const syncPosition = () => {
    const rect = input.getBoundingClientRect();
    panel.style.left = `${Math.round(rect.left + window.scrollX)}px`;
    panel.style.top = `${Math.round(rect.bottom + window.scrollY + 4)}px`;
    panel.style.width = `${Math.round(rect.width)}px`;
  };

  const render = () => {
    if (suggestions.length === 0) {
      hide();
      return;
    }

    panel.innerHTML = suggestions
      .map((item, index) => {
        const cls = index === activeIndex
          ? 'path-autocomplete-item active'
          : 'path-autocomplete-item';
        const icon = item.type === 'directory' ? '📁' : '📄';
        return `
          <div class="${cls}" data-index="${index}">
            <span class="path-autocomplete-icon">${icon}</span>
            <span class="path-autocomplete-text">${escapeHtml(item.display)}</span>
          </div>
        `;
      })
      .join('');

    syncPosition();
    panel.style.display = 'block';
  };

  const choose = (index: number) => {
    const selected = suggestions[index];
    if (!selected) return;

    input.value = selected.path;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    hide();
  };

  const refresh = async () => {
    const query = input.value.trim();
    if (!query) {
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

  panel.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const target = (e.target as HTMLElement).closest('.path-autocomplete-item') as HTMLElement | null;
    if (!target) return;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    choose(index);
  });

  input.addEventListener('focus', scheduleRefresh);
  input.addEventListener('input', scheduleRefresh);

  input.addEventListener('keydown', (e) => {
    const key = (e as KeyboardEvent).key;
    if (!isVisible()) return;

    if (key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        activeIndex = (activeIndex + 1) % suggestions.length;
        render();
      }
      return;
    }

    if (key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
        render();
      }
      return;
    }

    if (key === 'Enter' || key === 'Tab') {
      if (activeIndex >= 0) {
        e.preventDefault();
        choose(activeIndex);
      }
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
