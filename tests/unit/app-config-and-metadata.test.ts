import { describe, expect, it } from 'bun:test';
import { pickPdfDefaultScale } from '../../src/client/app-config';
import { applyCreatedTimes } from '../../src/client/file-metadata';

describe('pickPdfDefaultScale', () => {
  it('读取正数缩放，其它情况返回 null', () => {
    expect(pickPdfDefaultScale({ pdf: { defaultScale: 1.5 } })).toBe(1.5);
    expect(pickPdfDefaultScale({ pdf: { defaultScale: 0 } })).toBeNull();
    expect(pickPdfDefaultScale({ pdf: { defaultScale: 'big' as any } })).toBeNull();
    expect(pickPdfDefaultScale({})).toBeNull();
    expect(pickPdfDefaultScale(null)).toBeNull();
  });
});

describe('applyCreatedTimes', () => {
  it('只填充缺失字段，已有值不覆盖，返回是否变化', () => {
    const files = new Map<string, { createdAt?: number | null; gitCreatedAt?: number | null }>([
      ['/a.md', { createdAt: null, gitCreatedAt: null }],
      ['/b.md', { createdAt: 10, gitCreatedAt: null }],
    ]);
    const changed = applyCreatedTimes(files, {
      '/a.md': { createdAt: 1, gitCreatedAt: 2 },
      '/b.md': { createdAt: 99, gitCreatedAt: 3 },
      '/missing.md': { createdAt: 5 },
    });
    expect(changed).toBe(true);
    expect(files.get('/a.md')).toEqual({ createdAt: 1, gitCreatedAt: 2 });
    expect(files.get('/b.md')).toEqual({ createdAt: 10, gitCreatedAt: 3 });
  });

  it('没有可填充内容时返回 false', () => {
    const files = new Map([['/a.md', { createdAt: 1, gitCreatedAt: 1 }]]);
    expect(applyCreatedTimes(files, { '/a.md': { createdAt: 9 } })).toBe(false);
  });
});
