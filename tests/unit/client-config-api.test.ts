import { describe, it, expect } from 'bun:test';

describe('GET /api/config', () => {
  it('returns clientConfig with pdf.defaultScale', async () => {
    const { handleGetClientConfig } = await import('../../src/handlers');
    const response = handleGetClientConfig();
    const data = await response.json();
    expect(data).toHaveProperty('pdf');
    expect(data.pdf).toHaveProperty('defaultScale');
    expect(typeof data.pdf.defaultScale).toBe('number');
  });
});
