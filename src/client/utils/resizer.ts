interface ResizerOptions {
  element: HTMLElement;
  bodyClass: string;
  onMove: (delta: number, clientX: number) => void;
  onEnd: (delta: number, clientX: number) => void;
  guard?: () => boolean;
}

export function createResizer({ element, bodyClass, onMove, onEnd, guard }: ResizerOptions): void {
  element.addEventListener('mousedown', (event: MouseEvent) => {
    if (guard && !guard()) return;
    event.preventDefault();
    const startX = event.clientX;
    document.body.classList.add(bodyClass);

    const handleMove = (e: MouseEvent) => {
      onMove(startX - e.clientX, e.clientX);
    };
    const handleUp = (e: MouseEvent) => {
      document.body.classList.remove(bodyClass);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      onEnd(startX - e.clientX, e.clientX);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  });
}
