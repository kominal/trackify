import { DashboardService } from '@services/dashboard.service';
import { UserSettingsService } from '@services/user-settings.service';
import { startTestDatabase, TestDatabase } from '../test/database';

const TENANT = '0b0e7f4e-6f0b-4a7e-9d0a-3f5a0c1d2e3f';
const ALICE = { userId: 'alice', email: 'alice@example.com', emailVerified: true, admin: false };
const d = (iso: string): Date => new Date(iso);

describe('DashboardService', () => {
  let db: TestDatabase;
  let service: DashboardService;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new DashboardService(db.timeEntryModel, db.sessionModel, db.taskModel, db.activityModel, new UserSettingsService(db.userModel));
  });
  afterAll(() => db.stop());
  beforeEach(async () => {
    await db.clear();
    await db.taskModel.create([
      { tenantId: TENANT, uuid: 'task-a', projectId: 'project-1', name: 'A' },
      { tenantId: TENANT, uuid: 'task-b', projectId: 'project-2', name: 'B' },
    ]);
  });

  it('compares tracked time with PC activity and finds the untracked gaps', async () => {
    // Berlin is UTC+1 in November: 08:00 local = 07:00Z.
    await db.timeEntryModel.create([
      { tenantId: TENANT, uuid: 'e1', userId: 'alice', taskId: 'task-a', start: d('2026-11-24T07:00:00Z'), end: d('2026-11-24T09:00:00Z') },
      { tenantId: TENANT, uuid: 'e2', userId: 'alice', taskId: 'task-b', start: d('2026-11-24T10:00:00Z'), end: d('2026-11-24T11:00:00Z') },
      // Someone else's time never counts.
      { tenantId: TENANT, uuid: 'e3', userId: 'bob', taskId: 'task-b', start: d('2026-11-24T07:00:00Z'), end: d('2026-11-24T15:00:00Z') },
    ]);
    await db.activityModel.create([
      { userId: 'alice', app: 'Code', title: 'x', idle: false, start: d('2026-11-24T07:30:00Z'), end: d('2026-11-24T09:30:00Z') },
      { userId: 'alice', app: 'Code', title: 'x', idle: true, start: d('2026-11-24T09:30:00Z'), end: d('2026-11-24T09:40:00Z') },
      { userId: 'alice', app: 'chrome', title: 'y', idle: false, start: d('2026-11-24T09:40:00Z'), end: d('2026-11-24T10:30:00Z') },
      { userId: 'bob', app: 'Outlook', title: 'z', idle: false, start: d('2026-11-24T07:00:00Z'), end: d('2026-11-24T15:00:00Z') },
    ]);

    const dashboard = await service.read(ALICE, { tenantId: TENANT }, { from: d('2026-11-23T23:00:00Z'), to: d('2026-11-24T23:00:00Z'), timeZone: 'Europe/Berlin' }, d('2026-11-24T20:00:00Z'));

    expect(dashboard.totals).toEqual({
      trackedMinutes: 180,
      activeMinutes: 170,
      coveredMinutes: 120,
      untrackedMinutes: 50,
      offlineTrackedMinutes: 60,
      workingDays: 1,
      longestUntrackedMinutes: 30,
      hasActivity: true,
    });
    expect(dashboard.gaps.map(({ start, end }) => [start.toISOString(), end.toISOString()])).toEqual([
      ['2026-11-24T09:00:00.000Z', '2026-11-24T09:30:00.000Z'],
      ['2026-11-24T09:40:00.000Z', '2026-11-24T10:00:00.000Z'],
    ]);
    expect(dashboard.projects.map(({ projectId, minutes, entryCount }) => [projectId, minutes, entryCount])).toEqual([
      ['project-1', 120, 1],
      ['project-2', 60, 1],
    ]);
    expect(dashboard.apps).toEqual([
      { app: 'Code', minutes: 120, coveredMinutes: 90 },
      { app: 'chrome', minutes: 50, coveredMinutes: 30 },
    ]);
    expect(dashboard.days).toHaveLength(1);
    expect(dashboard.days[0]).toMatchObject({ day: '2026-11-24', trackedMinutes: 180, activeMinutes: 170, coveredMinutes: 120 });
  });

  it('cuts entries at local midnight and counts the running session up to now', async () => {
    await db.timeEntryModel.create({ tenantId: TENANT, uuid: 'night', userId: 'alice', taskId: 'task-a', start: d('2026-11-24T22:00:00Z'), end: d('2026-11-25T00:00:00Z') });
    await db.sessionModel.create({ tenantId: TENANT, uuid: 's', userId: 'alice', taskId: 'task-b', start: d('2026-11-25T08:00:00Z') });

    const dashboard = await service.read(ALICE, { tenantId: TENANT }, { from: d('2026-11-23T23:00:00Z'), to: d('2026-11-25T23:00:00Z'), timeZone: 'Europe/Berlin' }, d('2026-11-25T09:30:00Z'));

    expect(dashboard.days.map(({ day, trackedMinutes }) => [day, trackedMinutes])).toEqual([
      ['2026-11-24', 60],
      ['2026-11-25', 150],
    ]);
    expect(dashboard.entries.find(({ running }) => running)).toMatchObject({ taskId: 'task-b', end: d('2026-11-25T09:30:00Z') });
    expect(dashboard.totals.hasActivity).toBe(false);
  });

  it('refuses ranges that are empty or too long', async () => {
    await expect(service.read(ALICE, { tenantId: TENANT }, { from: d('2026-11-24T00:00:00Z'), to: d('2026-11-24T00:00:00Z') })).rejects.toThrow('exception.invalidRange');
    await expect(service.read(ALICE, { tenantId: TENANT }, { from: d('2026-01-01T00:00:00Z'), to: d('2026-11-24T00:00:00Z') })).rejects.toThrow('exception.invalidRange');
  });
});
