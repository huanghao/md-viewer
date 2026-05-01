// tests/unit/zoom.test.ts
import { describe, expect, it } from 'bun:test';
import { ZOOM_STEP, parseZoomInput } from '../../src/client/zoom';

describe('ZOOM_STEP', () => {
  it('is 0.25', () => {
    expect(ZOOM_STEP).toBe(0.25);
  });
});

describe('parseZoomInput', () => {
  it('parses plain integer as percent', () => {
    expect(parseZoomInput('150')).toBe(1.5);
  });
  it('parses percent string', () => {
    expect(parseZoomInput('150%')).toBe(1.5);
  });
  it('parses decimal ratio ≤ 5.0 as-is', () => {
    expect(parseZoomInput('1.5')).toBe(1.5);
  });
  it('parses "100%"', () => {
    expect(parseZoomInput('100%')).toBe(1.0);
  });
  it('returns null for empty string', () => {
    expect(parseZoomInput('')).toBeNull();
  });
  it('returns null for non-numeric', () => {
    expect(parseZoomInput('abc')).toBeNull();
  });
  it('trims whitespace', () => {
    expect(parseZoomInput('  120%  ')).toBe(1.2);
  });
});
