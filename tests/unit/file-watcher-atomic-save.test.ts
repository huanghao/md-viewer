import { describe, it, expect, beforeEach } from 'bun:test';
import { createAtomicSaveDetector } from '../../src/file-watcher';

describe('atomic save detection', () => {
  let emitted: Array<{ event: 'changed' | 'deleted'; path: string }>;
  let detector: ReturnType<typeof createAtomicSaveDetector>;

  beforeEach(() => {
    emitted = [];
    detector = createAtomicSaveDetector(
      (path, _mtime) => emitted.push({ event: 'changed', path }),
      (path) => emitted.push({ event: 'deleted', path }),
    );
  });

  it('emits file-changed (not file-deleted) when add follows unlink within debounce window', async () => {
    detector.onUnlink('/tmp/foo.md');
    detector.onAdd('/tmp/foo.md', 1000);

    // wait past debounce window
    await Bun.sleep(400);

    expect(emitted).toEqual([{ event: 'changed', path: '/tmp/foo.md' }]);
  });

  it('emits file-deleted when no add follows unlink within debounce window', async () => {
    detector.onUnlink('/tmp/foo.md');

    await Bun.sleep(400);

    expect(emitted).toEqual([{ event: 'deleted', path: '/tmp/foo.md' }]);
  });

  it('does not confuse unrelated paths', async () => {
    detector.onUnlink('/tmp/foo.md');
    detector.onAdd('/tmp/bar.md', 1000); // different file

    await Bun.sleep(400);

    expect(emitted).toEqual([{ event: 'deleted', path: '/tmp/foo.md' }]);
  });

  it('handles multiple files independently', async () => {
    detector.onUnlink('/tmp/a.md');
    detector.onUnlink('/tmp/b.md');
    detector.onAdd('/tmp/a.md', 1000); // only a is atomic-saved

    await Bun.sleep(400);

    expect(emitted).toContainEqual({ event: 'changed', path: '/tmp/a.md' });
    expect(emitted).toContainEqual({ event: 'deleted', path: '/tmp/b.md' });
    expect(emitted.length).toBe(2);
  });
});
