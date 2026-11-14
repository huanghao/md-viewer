import { describe, it, expect } from 'bun:test';
import { rawFileUrl } from '../../src/client/utils/raw-file';

describe('rawFileUrl', () => {
  it('保留目录分隔符并编码中文与空格', () => {
    expect(rawFileUrl('/Users/a b/文档/x.html')).toBe('/raw/Users/a%20b/%E6%96%87%E6%A1%A3/x.html');
  });
});
