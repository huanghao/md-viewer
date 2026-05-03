export function iconSvg(type: 'up' | 'down' | 'check' | 'trash' | 'comment' | 'list' | 'filter' | 'close' | 'edit' | 'reopen'): string {
  if (type === 'up') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>';
  if (type === 'down') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>';
  if (type === 'check') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>';
  if (type === 'trash') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>';
  if (type === 'comment') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>';
  if (type === 'list') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>';
  if (type === 'filter') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>';
  if (type === 'edit') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 2.5a1.5 1.5 0 012.1 2.1L5 13.2l-3 .8.8-3 8.7-8.5z"/></svg>';
  if (type === 'reopen') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM6 5.5l4 2.5-4 2.5V5.5z"/></svg>';
  return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>';
}
