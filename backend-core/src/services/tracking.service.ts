import { TaskEntity, TaskModel } from '@entities/task.entity';
import { TimeEntryEntity, TimeEntryModel } from '@entities/time-entry.entity';
import { TrackingSessionEntity, TrackingSessionModel } from '@entities/tracking-session.entity';
import { UserContext } from '@helpers/context.decorator';
import { created } from '@helpers/entity-service.helper';
import { MINUTE_MS } from '@helpers/interval.helper';
import { TenantEntitiesPathParams } from '@models/path.model';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// Sessions shorter than this are dropped when they stop (a task clicked by mistake, a quick switch back).
export const MIN_ENTRY_MS = 5 * MINUTE_MS;
// Starting a task again within this time after it stopped continues its last entry instead of starting a new one.
export const RESUME_WINDOW_MS = 5 * MINUTE_MS;

function toMinute(date: Date): Date {
  return new Date(Math.round(date.getTime() / MINUTE_MS) * MINUTE_MS);
}

@Injectable()
export class TrackingService {
  public constructor(
    @InjectModel(TrackingSessionEntity.name) private readonly sessionModel: TrackingSessionModel,
    @InjectModel(TimeEntryEntity.name) private readonly timeEntryModel: TimeEntryModel,
    @InjectModel(TaskEntity.name) private readonly taskModel: TaskModel,
  ) {}

  public async read(userContext: UserContext, { tenantId }: TenantEntitiesPathParams): Promise<TrackingSessionEntity | null> {
    return this.sessionModel.findOne({ tenantId, userId: userContext.userId }).lean<TrackingSessionEntity>();
  }

  // Starts tracking the task, or switches to it: the running session (if any) becomes a time entry first.
  public async start(userContext: UserContext, { tenantId }: TenantEntitiesPathParams, taskId: string, now = new Date()): Promise<TrackingSessionEntity> {
    await this.taskModel.findOne({ tenantId, uuid: taskId, archived: { $ne: true } }).orFail(new HttpException('exception.notFound', 404));

    const running = await this.read(userContext, { tenantId });
    if (running?.taskId === taskId) {
      return running;
    }

    await this.stop(userContext, { tenantId }, now);

    let start = now;
    const latest = await this.timeEntryModel.findOne({ tenantId, userId: userContext.userId }).sort({ end: -1 });
    if (latest?.taskId === taskId && now.getTime() - latest.end.getTime() < RESUME_WINDOW_MS) {
      // Back to the task just left: carry on with its entry rather than splitting it in two.
      start = latest.start;
      await latest.deleteOne();
    }

    const session = created<TrackingSessionEntity>(userContext, { tenantId, userId: userContext.userId, taskId, start });
    await this.sessionModel.updateOne({ tenantId, userId: userContext.userId }, session, { upsert: true });
    return session;
  }

  // Stops the running session. It is stored as a time entry (rounded to whole minutes) unless it was too short.
  public async stop(userContext: UserContext, { tenantId }: TenantEntitiesPathParams, now = new Date()): Promise<TimeEntryEntity | undefined> {
    // findOneAndDelete makes concurrent stops (two windows, the tray and the page) store the session once.
    const session = await this.sessionModel.findOneAndDelete({ tenantId, userId: userContext.userId }).lean<TrackingSessionEntity>();
    if (!session) {
      return undefined;
    }

    const start = toMinute(session.start);
    const end = toMinute(now);
    if (end.getTime() - start.getTime() < MIN_ENTRY_MS) {
      return undefined;
    }

    const entry = await this.timeEntryModel.create(created<TimeEntryEntity>(userContext, { tenantId, userId: userContext.userId, taskId: session.taskId, start, end }));
    return entry.toObject();
  }
}
