import { intersect, subtract, union } from '@helpers/interval.helper';
import { addDays, dayKey, daysBetween, offsetOf, startOfDay } from '@helpers/time-zone.helper';

describe('interval helper', () => {
  it('joins overlapping and touching intervals', () => {
    expect(
      union([
        { start: 5, end: 8 },
        { start: 0, end: 2 },
        { start: 2, end: 3 },
        { start: 6, end: 10 },
        { start: 4, end: 4 },
      ]),
    ).toEqual([
      { start: 0, end: 3 },
      { start: 5, end: 10 },
    ]);
  });

  it('intersects and subtracts unions', () => {
    const a = union([
      { start: 0, end: 10 },
      { start: 20, end: 30 },
    ]);
    const b = union([
      { start: 5, end: 25 },
      { start: 28, end: 40 },
    ]);
    expect(intersect(a, b)).toEqual([
      { start: 5, end: 10 },
      { start: 20, end: 25 },
      { start: 28, end: 30 },
    ]);
    expect(subtract(a, b)).toEqual([
      { start: 0, end: 5 },
      { start: 25, end: 28 },
    ]);
  });
});

describe('time zone helper', () => {
  it('knows the Berlin offset in winter and summer', () => {
    expect(offsetOf(new Date('2026-01-15T12:00:00Z'), 'Europe/Berlin')).toBe(3600000);
    expect(offsetOf(new Date('2026-07-15T12:00:00Z'), 'Europe/Berlin')).toBe(7200000);
  });

  it('finds the start of a local day, also on days the clock changes', () => {
    expect(startOfDay('2026-11-24', 'Europe/Berlin').toISOString()).toBe('2026-11-23T23:00:00.000Z');
    expect(startOfDay('2026-07-01', 'Europe/Berlin').toISOString()).toBe('2026-06-30T22:00:00.000Z');
    expect(startOfDay('2026-03-29', 'Europe/Berlin').toISOString()).toBe('2026-03-28T23:00:00.000Z');
    expect(startOfDay('2026-03-30', 'Europe/Berlin').toISOString()).toBe('2026-03-29T22:00:00.000Z');
    expect(startOfDay('2026-11-24', 'UTC').toISOString()).toBe('2026-11-24T00:00:00.000Z');
  });

  it('assigns instants to local days', () => {
    expect(dayKey(new Date('2026-11-23T23:30:00Z'), 'Europe/Berlin')).toBe('2026-11-24');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween(new Date('2026-11-23T23:00:00Z'), new Date('2026-11-26T23:00:00Z'), 'Europe/Berlin')).toEqual(['2026-11-24', '2026-11-25', '2026-11-26']);
  });
});
