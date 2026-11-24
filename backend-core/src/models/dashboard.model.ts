import { ApiProperty } from '@nestjs/swagger';

export class DashboardTotals {
  public trackedMinutes: number;
  // Minutes the PC was in use (window activity that was not idle).
  public activeMinutes: number;
  // Active minutes that were tracked.
  public coveredMinutes: number;
  // Active minutes nothing was tracked for.
  public untrackedMinutes: number;
  // Tracked minutes without PC activity (meetings, calls, work away from the desk).
  public offlineTrackedMinutes: number;
  // Days with tracked time.
  public workingDays: number;
  public longestUntrackedMinutes: number;
  // Whether the range has any window activity at all (no desktop app → no comparison).
  public hasActivity: boolean;
}

export class DashboardProjectShare {
  public projectId: string;
  public minutes: number;
}

export class DashboardDay {
  // Calendar day, YYYY-MM-DD, in the requested time zone.
  public day: string;
  @ApiProperty({ type: String, format: 'date-time' }) public start: Date;
  public trackedMinutes: number;
  public activeMinutes: number;
  public coveredMinutes: number;
  @ApiProperty({ type: [DashboardProjectShare] }) public projects: DashboardProjectShare[];
}

export class DashboardTaskTotal {
  public taskId: string;
  public minutes: number;
  public entryCount: number;
}

export class DashboardProjectTotal {
  public projectId: string;
  public minutes: number;
  public entryCount: number;
  @ApiProperty({ type: [DashboardTaskTotal] }) public tasks: DashboardTaskTotal[];
}

export class DashboardAppTotal {
  public app: string;
  public minutes: number;
  // Of those minutes, the ones that fell into tracked time.
  public coveredMinutes: number;
}

export class DashboardTimelineEntry {
  // Missing for the running session.
  @ApiProperty({ required: false }) public uuid?: string;
  public taskId: string;
  @ApiProperty({ type: String, format: 'date-time' }) public start: Date;
  @ApiProperty({ type: String, format: 'date-time' }) public end: Date;
  public running: boolean;
}

export class DashboardTimelineActivity {
  public app: string;
  public title: string;
  @ApiProperty({ type: String, format: 'date-time' }) public start: Date;
  @ApiProperty({ type: String, format: 'date-time' }) public end: Date;
  public idle: boolean;
}

export class DashboardGap {
  @ApiProperty({ type: String, format: 'date-time' }) public start: Date;
  @ApiProperty({ type: String, format: 'date-time' }) public end: Date;
}

export class Dashboard {
  @ApiProperty({ type: String, format: 'date-time' }) public from: Date;
  @ApiProperty({ type: String, format: 'date-time' }) public to: Date;
  public timeZone: string;
  public totals: DashboardTotals;
  @ApiProperty({ type: [DashboardDay] }) public days: DashboardDay[];
  @ApiProperty({ type: [DashboardProjectTotal] }) public projects: DashboardProjectTotal[];
  @ApiProperty({ type: [DashboardAppTotal] }) public apps: DashboardAppTotal[];
  @ApiProperty({ type: [DashboardTimelineEntry] }) public entries: DashboardTimelineEntry[];
  @ApiProperty({ type: [DashboardTimelineActivity] }) public activities: DashboardTimelineActivity[];
  // Untracked stretches of PC use (at least GAP_MIN_MINUTES long), the candidates for "create entry".
  @ApiProperty({ type: [DashboardGap] }) public gaps: DashboardGap[];
}
