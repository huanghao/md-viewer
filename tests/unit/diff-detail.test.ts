import { describe, it, expect } from 'bun:test';
import { splitHtmlLines } from '../../src/client/utils/diff-detail';

describe('splitHtmlLines', () => {
  it('纯文本按行拆分，忽略末尾换行', () => {
    expect(splitHtmlLines('a\nb\n')).toEqual(['a', 'b']);
  });
  it('跨行 span 在行尾关闭并在下一行重新打开', () => {
    expect(splitHtmlLines('<span class="c">x\ny</span>z\n')).toEqual([
      '<span class="c">x</span>',
      '<span class="c">y</span>z',
    ]);
  });
  it('保留空行', () => {
    expect(splitHtmlLines('a\n\nb')).toEqual(['a', '', 'b']);
  });
});
