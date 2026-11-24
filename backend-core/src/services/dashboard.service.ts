import { ActivityEntity, ActivityModel } from '@entities/activity.entity';
import { TaskEntity, TaskModel } from '@entities/task.entity';
import { TimeEntryEntity, TimeEntryModel } from '@entities/time-entry.entity';
import { TrackingSessionEntity, TrackingSessionModel } from '@entities/tracking-session.entity';
import { UserContext } from '@helpers/context.decorator';
import { clip, duration, intersect, Interval, MINUTE_MS, minutes, subtract, union } from '@helpers/interval.helper';
import { addDays, daysBetween, isValidTimeZone, startOfDay } from '@helpers/time-zone.helper';
import { Dashboard, DashboardAppTotal, DashboardDay, DashboardProjectTotal } from '@models/dashboard.model';
import { TenantEntitiesPathParams } from '@models/path.model';
import { ZonedRangeParams } from '@models/range.model';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserSettingsService } from '@services/user-settings.service';

export const GAP_MIN_MINUTES = 5;
const MAX_RANGE_MS = 62 * 24 * 60 * 60 * 1000;

interface EntryInterval extends Interval {
  uuid?: string;
  taskId: string;
  running: boolean;
}

// Everything the dashboard shows, computed for the signed-in user only (their time entries, running
// session and window activity). Intervals are clipped to the requested range and cut at local midnight.
@Injectable()
export class DashboardService {
  public constructor(
    @InjectModel(TimeEntryEntity.name) private readonly timeEntryModel: TimeEntryModel,
    @InjectModel(TrackingSessionEntity.name) private readonly sessionModel: TrackingSessionModel,
    @InjectModel(TaskEntity.name) private readonly taskModel: TaskModel,
    @InjectModel(ActivityEntity.name) private readonly activityModel: ActivityModel,
    private readonly userSettingsService: UserSettingsService,
  ) {}

  public async read(userContext: UserContext, { tenantId }: TenantEntitiesPathParams, range: ZonedRangeParams, now = new Date()): Promise<Dashboard> {
    const from = range.from.getTime();
    const to = range.to.getTime();
    if (to <= from || to - from > MAX_RANGE_MS) {
      throw new HttpException('exception.invalidRange', 400);
    }
    const timeZone = isValidTimeZone(range.timeZone) ? range.timeZone : (await this.userSettingsService.read(userContext)).timeZone;
    const { userId } = userContext;

    const [timeEntries, session, activities, tasks] = await Promise.all([
      this.timeEntryModel
        .find({ tenantId, userId, start: { $lt: range.to }, end: { $gt: range.from } })
        .sort({ start: 1 })
        .lean<TimeEntryEntity[]>(),
      this.sessionModel.findOne({ tenantId, userId }).lean<TrackingSessionEntity>(),
      this.activityModel
        .find({ userId, start: { $lt: range.to }, end: { $gt: range.from } })
        .sort({ start: 1 })
        .lean<ActivityEntity[]>(),
      this.taskModel.find({ tenantId }).select({ uuid: 1, projectId: 1 }).lean<TaskEntity[]>(),
    ]);
    const projectOf = new Map(tasks.map((task) => [task.uuid, task.projectId]));

    const entries: EntryInterval[] = [];
    for (const entry of timeEntries) {
      const clipped = clip({ start: entry.start.getTime(), end: entry.end.getTime() }, from, to);
      if (clipped) {
        entries.push({ ...clipped, uuid: entry.uuid, taskId: entry.taskId, running: false });
      }
    }
    if (session) {
      const clipped = clip({ start: session.start.getTime(), end: now.getTime() }, from, to);
      if (clipped) {
        entries.push({ ...clipped, taskId: session.taskId, running: true });
      }
    }

    const clippedActivities = activities.flatMap((activity) => {
      const clipped = clip({ start: activity.start.getTime(), end: activity.end.getTime() }, from, to);
      return clipped ? [{ ...activity, ...clipped }] : [];
    });

    const tracked = union(entries);
    const active = union(clippedActivities.filter(({ idle }) => !idle));
    const covered = intersect(active, tracked);
    const untracked = subtract(active, tracked);
    const gaps = untracked.filter(({ start, end }) => end - start >= GAP_MIN_MINUTES * MINUTE_MS);

    const days = this.days(range.from, range.to, timeZone, entries, tracked, active, covered, projectOf);

    return {
      from: range.from,
      to: range.to,
      timeZone,
      totals: {
        trackedMinutes: minutes(duration(tracked)),
        activeMinutes: minutes(duration(active)),
        coveredMinutes: minutes(duration(covered)),
        untrackedMinutes: minutes(duration(untracked)),
        offlineTrackedMinutes: minutes(duration(subtract(tracked, active))),
        workingDays: days.filter(({ trackedMinutes }) => trackedMinutes > 0).length,
        longestUntrackedMinutes: minutes(Math.max(0, ...untracked.map(({ start, end }) => end - start))),
        hasActivity: clippedActivities.length > 0,
      },
      days,
      projects: this.projects(entries, projectOf),
      apps: this.apps(clippedActivities, tracked),
      entries: entries.map(({ uuid, taskId, start, end, running }) => ({ uuid, taskId, start: new Date(start), end: new Date(end), running })),
      activities: clippedActivities.map(({ app, title, start, end, idle }) => ({ app, title, start: new Date(start), end: new Date(end), idle })),
      gaps: gaps.map(({ start, end }) => ({ start: new Date(start), end: new Date(end) })),
    };
  }

  private days(from: Date, to: Date, timeZone: string, entries: EntryInterval[], tracked: Interval[], active: Interval[], covered: Interval[], projectOf: Map<string, string>): DashboardDay[] {
    return daysBetween(from, to, timeZone).map((day) => {
      const dayStart = startOfDay(day, timeZone).getTime();
      const dayEnd = startOfDay(addDays(day, 1), timeZone).getTime();
      const within = (intervals: Interval[]): Interval[] => intervals.flatMap((interval) => clip(interval, dayStart, dayEnd) ?? []);

      const perProject = new Map<string, Interval[]>();
      for (const entry of entries) {
        const clipped = clip(entry, dayStart, dayEnd);
        if (clipped) {
          const projectId = projectOf.get(entry.taskId) ?? '';
          perProject.set(projectId, [...(perProject.get(projectId) ?? []), clipped]);
        }
      }

      return {
        day,
        start: new Date(dayStart),
        trackedMinutes: minutes(duration(within(tracked))),
        activeMinutes: minutes(duration(within(active))),
        coveredMinutes: minutes(duration(within(covered))),
        projects: [...perProject].map(([projectId, intervals]) => ({ projectId, minutes: minutes(duration(union(intervals))) })).sort((a, b) => b.minutes - a.minutes),
      };
    });
  }

  private projects(entries: EntryInterval[], projectOf: Map<string, string>): DashboardProjectTotal[] {
    const projects = new Map<string, DashboardProjectTotal>();
    for (const entry of entries) {
      const projectId = projectOf.get(entry.taskId) ?? '';
      const project = projects.get(projectId) ?? { projectId, minutes: 0, entryCount: 0, tasks: [] };
      const ms = entry.end - entry.start;
      project.minutes += ms;
      project.entryCount += 1;
      const task = project.tasks.find(({ taskId }) => taskId === entry.taskId);
      if (task) {
        task.minutes += ms;
        task.entryCount += 1;
      } else {
        project.tasks.push({ taskId: entry.taskId, minutes: ms, entryCount: 1 });
      }
      projects.set(projectId, project);
    }
    return [...projects.values()].map((project) => ({ ...project, minutes: minutes(project.minutes), tasks: project.tasks.map((task) => ({ ...task, minutes: minutes(task.minutes) })).sort((a, b) => b.minutes - a.minutes) })).sort((a, b) => b.minutes - a.minutes);
  }

  private apps(activities: (Interval & { app: string; idle: boolean })[], tracked: Interval[]): DashboardAppTotal[] {
    const perApp = new Map<string, Interval[]>();
    for (const activity of activities) {
      if (!activity.idle) {
        perApp.set(activity.app, [...(perApp.get(activity.app) ?? []), activity]);
      }
    }
    return [...perApp]
      .map(([app, intervals]) => {
        const used = union(intervals);
        return { app, minutes: minutes(duration(used)), coveredMinutes: minutes(duration(intersect(used, tracked))) };
      })
      .filter(({ minutes: total }) => total > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 25);
  }
}
