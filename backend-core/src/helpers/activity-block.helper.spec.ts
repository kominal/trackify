import { activityBlocks, ActivitySegmentInterval } from '@helpers/activity-block.helper';
import { MINUTE_MS } from '@helpers/interval.helper';

// Segments one after the other without a pause: [app, minutes, title?]. 'idle' is an idle segment, 'off' a stretch nothing was recorded in.
function sequence(...parts: [string, number, string?][]): ActivitySegmentInterval[] {
  const segments: ActivitySegmentInterval[] = [];
  let cursor = 0;
  for (const [app, length, title] of parts) {
    const end = cursor + length * MINUTE_MS;
    if (app !== 'off') {
      segments.push({ app, title: title ?? '', idle: app === 'idle', start: cursor, end });
    }
    cursor = end;
  }
  return segments;
}

const shape = (segments: ActivitySegmentInterval[]): [string, number, number][] => activityBlocks(segments).map(({ app, start, end }) => [app, start / MINUTE_MS, end / MINUTE_MS]);

describe('activity block helper', () => {
  it('keeps a block going over a short look at another app', () => {
    const blocks = activityBlocks(sequence(['Code', 30], ['chrome', 3], ['Code', 20]));

    expect(blocks).toEqual([{ app: 'Code', title: '', idle: false, start: 0, end: 53 * MINUTE_MS, detours: [{ app: 'chrome', seconds: 180 }] }]);
  });

  it('starts a new block when the other app was used for five minutes or longer', () => {
    expect(shape(sequence(['Code', 30], ['chrome', 6], ['Code', 20]))).toEqual([
      ['Code', 0, 30],
      ['chrome', 30, 36],
      ['Code', 36, 56],
    ]);
    expect(shape(sequence(['Code', 30], ['chrome', 5], ['Code', 20]))).toHaveLength(3);
  });

  it('counts several apps in a row as one detour and sums them per app', () => {
    const blocks = activityBlocks(sequence(['Code', 30], ['chrome', 1], ['Slack', 2], ['chrome', 1.5], ['Code', 20]));

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      app: 'Code',
      end: 54.5 * MINUTE_MS,
      detours: [
        { app: 'chrome', seconds: 150 },
        { app: 'Slack', seconds: 120 },
      ],
    });
  });

  it('measures the time away, not each app on its own', () => {
    expect(shape(sequence(['Code', 30], ['chrome', 3], ['Slack', 3], ['Code', 20]))).toEqual([
      ['Code', 0, 30],
      ['chrome', 30, 33],
      ['Slack', 33, 36],
      ['Code', 36, 56],
    ]);
  });

  it('leaves a short stop on the way to another app as it is', () => {
    expect(shape(sequence(['Code', 30], ['chrome', 2], ['Outlook', 40]))).toEqual([
      ['Code', 0, 30],
      ['chrome', 30, 32],
      ['Outlook', 32, 72],
    ]);
  });

  it('calms down rapid switching between apps', () => {
    expect(shape(sequence(['Code', 1], ['chrome', 1], ['Code', 1], ['Slack', 1], ['chrome', 1], ['Slack', 1], ['Outlook', 10]))).toEqual([
      ['Code', 0, 3],
      ['Slack', 3, 6],
      ['Outlook', 6, 16],
    ]);
  });

  it('does not cut on a title change and names the block after its longest title', () => {
    const blocks = activityBlocks(sequence(['chrome', 5, 'Mail'], ['chrome', 20, 'Docs'], ['Code', 2, 'x'], ['chrome', 10, 'Mail']));

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ app: 'chrome', title: 'Docs', start: 0, end: 37 * MINUTE_MS, detours: [{ app: 'Code', seconds: 120 }] });
  });

  it('ends a block at idle time and at stretches that were not recorded', () => {
    expect(shape(sequence(['Code', 30], ['idle', 2], ['Code', 20]))).toEqual([
      ['Code', 0, 30],
      ['idle', 30, 32],
      ['Code', 32, 52],
    ]);
    expect(shape(sequence(['Code', 30], ['off', 2], ['Code', 20]))).toEqual([
      ['Code', 0, 30],
      ['Code', 32, 52],
    ]);
    expect(shape(sequence(['Code', 30], ['chrome', 1], ['off', 2], ['Code', 20]))).toEqual([
      ['Code', 0, 30],
      ['chrome', 30, 31],
      ['Code', 33, 53],
    ]);
  });

  it('joins segments that are only seconds apart and ignores empty ones', () => {
    const blocks = activityBlocks([
      { app: 'Code', title: 'a', idle: false, start: 0, end: 10 * MINUTE_MS },
      { app: 'Code', title: 'a', idle: false, start: 10 * MINUTE_MS + 30_000, end: 20 * MINUTE_MS },
      { app: 'Code', title: 'a', idle: false, start: 20 * MINUTE_MS, end: 20 * MINUTE_MS },
    ]);

    expect(blocks).toEqual([{ app: 'Code', title: 'a', idle: false, start: 0, end: 20 * MINUTE_MS, detours: [] }]);
    expect(activityBlocks([])).toEqual([]);
  });
});
