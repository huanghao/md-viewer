import { Window } from 'happy-dom';

const win = new Window({ url: 'http://localhost/' });

// Inject all DOM globals so happy-dom's internal `this.window` resolves correctly
Object.defineProperties(globalThis, {
  window:      { value: win, writable: true, configurable: true },
  document:    { value: win.document, writable: true, configurable: true },
  HTMLElement: { value: win.HTMLElement, writable: true, configurable: true },
  Element:     { value: win.Element, writable: true, configurable: true },
  Node:        { value: win.Node, writable: true, configurable: true },
  Event:       { value: win.Event, writable: true, configurable: true },
  MouseEvent:  { value: win.MouseEvent, writable: true, configurable: true },
});
