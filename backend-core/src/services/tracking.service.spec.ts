import { Color } from '@models/color.model';
import { TrackingService } from '@services/tracking.service';
import { startTestDatabase, TestDatabase } from '../test/database';

const TENANT = '0b0e7f4e-6f0b-4a7e-9d0a-3f5a0c1d2e3f';
const TASK_A = '11111111-2222-4333-8444-555555555555';
const TASK_B = '11111111-2222-4333-8444-666666666666';
const ALICE = { userId: 'alice', email: 'alice@example.com', emailVerified: true, admin: false };
const BOB = { userId: 'bob', email: 'bob@example.com', emailVerified: true, admin: false };
const at = (time: string): Date => new Date(`2026-11-24T${time}:00.000Z`);

describe('TrackingService', () => {
  let db: TestDatabase;
  let service: TrackingService;

  beforeAll(async () => {
    db = await startTestDatabase();
    service = new TrackingService(db.sessionModel, db.timeEntryModel, db.taskModel);
  });
  afterAll(() => db.stop());
  beforeEach(async () => {
    await db.clear();
    await db.taskModel.create([
      { tenantId: TENANT, uuid: TASK_A, projectId: 'p', name: 'A', color: Color.BLUE, priority: 0, archived: false },
      { tenantId: TENANT, uuid: TASK_B, projectId: 'p', name: 'B', priority: 1, archived: false },
    ]);
  });

  it('stores a session as a time entry rounded to whole minutes when switching tasks', async () => {
    await service.start(ALICE, { tenantId: TENANT }, TASK_A, new Date('2026-11-24T08:00:20Z'));
    await service.start(ALICE, { tenantId: TENANT }, TASK_B, new Date('2026-11-24T09:15:40Z'));

    const entries = await db.timeEntryModel.find().lean();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ taskId: TASK_A, userId: 'alice', start: at('08:00'), end: at('09:16') });
    expect(await service.read(ALICE, { tenantId: TENANT })).toMatchObject({ taskId: TASK_B });
  });

  it('drops sessions shorter than five minutes', async () => {
    await service.start(ALICE, { tenantId: TENANT }, TASK_A, at('08:00'));
    expect(await service.stop(ALICE, { tenantId: TENANT }, at('08:03'))).toBeUndefined();
    expect(await db.timeEntryModel.countDocuments()).toBe(0);
    expect(await service.read(ALICE, { tenantId: TENANT })).toBeNull();
  });

  it('continues the last entry when the same task starts again shortly after it stopped', async () => {
    await service.start(ALICE, { tenantId: TENANT }, TASK_A, at('08:00'));
    await service.stop(ALICE, { tenantId: TENANT }, at('09:00'));
    await service.start(ALICE, { tenantId: TENANT }, TASK_A, at('09:03'));
    await service.stop(ALICE, { tenantId: TENANT }, at('10:00'));

    const entries = await db.timeEntryModel.find().lean();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ start: at('08:00'), end: at('10:00') });
  });

  it('starts a new entry after a longer break', async () => {
    await service.start(ALICE, { tenantId: TENANT }, TASK_A, at('08:00'));
    await service.stop(ALICE, { tenantId: TENANT }, at('09:00'));
    await service.start(ALICE, { tenantId: TENANT }, TASK_A, at('09:30'));
    await service.stop(ALICE, { tenantId: TENANT }, at('10:00'));
    expect(await db.timeEntryModel.countDocuments()).toBe(2);
  });

  it('keeps sessions of different users apart', async () => {
    await service.start(ALICE, { tenantId: TENANT }, TASK_A, at('08:00'));
    await service.start(BOB, { tenantId: TENANT }, TASK_B, at('08:10'));
    await service.stop(BOB, { tenantId: TENANT }, at('09:00'));

    expect(await service.read(ALICE, { tenantId: TENANT })).toMatchObject({ taskId: TASK_A });
    expect(await db.timeEntryModel.find().lean()).toEqual([expect.objectContaining({ userId: 'bob', taskId: TASK_B })]);
  });

  it('stores a session once when it is stopped twice at the same time', async () => {
    await service.start(ALICE, { tenantId: TENANT }, TASK_A, at('08:00'));
    await Promise.all([service.stop(ALICE, { tenantId: TENANT }, at('09:00')), service.stop(ALICE, { tenantId: TENANT }, at('09:00'))]);
    expect(await db.timeEntryModel.countDocuments()).toBe(1);
  });

  it('refuses archived and unknown tasks', async () => {
    await db.taskModel.updateOne({ uuid: TASK_B }, { archived: true });
    await expect(service.start(ALICE, { tenantId: TENANT }, TASK_B)).rejects.toThrow('exception.notFound');
    await expect(service.start(ALICE, { tenantId: 'other' }, TASK_A)).rejects.toThrow('exception.notFound');
  });
});
