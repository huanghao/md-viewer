// Bun test doesn't process CSS files like esbuild does.
// Mock all .css imports to return empty string so tests don't break.
import { mock } from 'bun:test';

mock.module('/Users/huanghao/workspace/md-viewer/src/client/styles.css', () => ({ default: '/* mocked */' }));
mock.module('/Users/huanghao/workspace/md-viewer/src/client/vendor-github-markdown.css', () => ({ default: '.markdown-body { color: #24292e; font-size: 16px; line-height: 1.5; word-wrap: break-word; /* mocked vendor css */ }' }));
mock.module('/Users/huanghao/workspace/md-viewer/src/client/vendor-highlight-github.css', () => ({ default: '.hljs { display: block; overflow-x: auto; padding: 0.5em; color: #333; background: #f8f8f8; /* mocked vendor css */ }' }));
