import { ActivityService } from '@services/activity.service';
import { startTestDatabase, TestDatabase } from '../test/database';

const ALICE = { userId: 'alice', email: 'alice@example.com', emailVerified: true, admin: false };
const BOB = { userId: 'bob', email: 'bob@example.com', emailVerified: true, admin: false };
const at = (time: string): Date => new Date(`2026-11-24T${time}Z`);
const segment = (start: string, end: string, app = 'Code', title = 'trackify', idle = false) => ({ start: at(start), end: at(end), app, title, idle });
const NOW = at('18:00:00');

describe('ActivityService', () => {
  let db: TestDatabase;
  let service: ActivityService;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new ActivityService(db.activityModel);
  });
  afterAll(() => db.stop());
  beforeEach(() => db.clear());

  it('merges consecutive segments of the same window, within a batch and across uploads', async () => {
    await service.upload(ALICE, [segment('08:00:00', '08:00:05'), segment('08:00:05', '08:00:10'), segment('08:00:10', '08:01:00', 'chrome', 'Docs')], NOW);
    await service.upload(ALICE, [segment('08:01:00', '08:02:00', 'chrome', 'Docs'), segment('08:02:00', '08:05:00', 'chrome', 'Docs', true)], NOW);

    const stored = await service.list(ALICE, { from: at('00:00:00'), to: at('23:00:00') });
    expect(stored.map(({ app, idle, start, end }) => [app, idle, start.toISOString(), end.toISOString()])).toEqual([
      ['Code', false, '2026-11-24T08:00:00.000Z', '2026-11-24T08:00:10.000Z'],
      ['chrome', false, '2026-11-24T08:00:10.000Z', '2026-11-24T08:02:00.000Z'],
      ['chrome', true, '2026-11-24T08:02:00.000Z', '2026-11-24T08:05:00.000Z'],
    ]);
  });

  it('drops invalid segments: empty, longer than a day, from the future', async () => {
    await service.upload(ALICE, [segment('09:00:00', '09:00:00'), { ...segment('09:00:00', '09:00:00'), start: new Date('2026-11-20T00:00:00Z') }, segment('19:00:00', '19:10:00')], NOW);
    expect(await db.activityModel.countDocuments()).toBe(0);
  });

  it('only ever shows a user their own activity', async () => {
    await service.upload(ALICE, [segment('08:00:00', '09:00:00')], NOW);
    await service.upload(BOB, [segment('08:00:00', '09:00:00', 'Outlook', 'Mail')], NOW);
    expect((await service.list(BOB, { from: at('00:00:00'), to: at('23:00:00') })).map(({ app }) => app)).toEqual(['Outlook']);
  });

  it('removes a range and cuts segments reaching over its edges', async () => {
    await service.upload(ALICE, [segment('08:00:00', '12:00:00'), segment('12:00:00', '13:00:00', 'chrome', 'x')], NOW);
    await service.delete(ALICE, { from: at('09:00:00'), to: at('10:00:00') });
    await service.delete(ALICE, { from: at('12:30:00'), to: at('14:00:00') });

    const stored = await service.list(ALICE, { from: at('00:00:00'), to: at('23:00:00') });
    expect(stored.map(({ app, start, end }) => [app, start.toISOString().slice(11, 16), end.toISOString().slice(11, 16)])).toEqual([
      ['Code', '08:00', '09:00'],
      ['Code', '10:00', '12:00'],
      ['chrome', '12:00', '12:30'],
    ]);
  });
});
