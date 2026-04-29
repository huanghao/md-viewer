import { describe, expect, it } from 'bun:test';
import { relativeTime } from '../../src/client/utils/relative-time';

const now = Date.now();
const min = 60 * 1000;
const hour = 60 * min;
const day = 24 * hour;

describe('relativeTime', () => {
  it('returns "just now" for < 1 min', () => {
    expect(relativeTime(now - 30 * 1000, now)).toBe('just now');
  });
  it('returns "Xm ago" for < 1 hour', () => {
    expect(relativeTime(now - 43 * min, now)).toBe('43m ago');
  });
  it('returns "Xh ago" for < 24 hours', () => {
    expect(relativeTime(now - 3 * hour, now)).toBe('3h ago');
  });
  it('returns "Xd ago" for 1-6 days', () => {
    expect(relativeTime(now - 2 * day, now)).toBe('2d ago');
  });
  it('returns "Mon DD" for 7-364 days same year', () => {
    const ts = now - 30 * day;
    const d = new Date(ts);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const expected = `${months[d.getMonth()]} ${d.getDate()}`;
    expect(relativeTime(ts, now)).toBe(expected);
  });
  it('returns "Mon DD, YYYY" for >= 1 year ago', () => {
    const ts = now - 400 * day;
    const d = new Date(ts);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const expected = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    expect(relativeTime(ts, now)).toBe(expected);
  });
  it('uses current time when now is omitted', () => {
    const ts = Date.now() - 5 * min;
    expect(relativeTime(ts)).toBe('5m ago');
  });
});
