import { describe, it, expect } from 'bun:test';
import { loadConfig } from '../../src/config';

describe('config.json dead fields', () => {
  it('editor block should not exist in server Config', () => {
    const config = loadConfig();
    expect((config as any).editor).toBeUndefined();
  });
});
