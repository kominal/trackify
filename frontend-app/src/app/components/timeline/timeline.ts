import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Dashboard, DashboardGap } from '@api/models';
import { colorOf } from '@constants/colors';
import { formatMinutes, minutesBetween } from '@helpers/duration';
import { TranslatePipe } from '@ngx-translate/core';
import { Catalog } from '@services/catalog.service';
import { TooltipModule } from 'primeng/tooltip';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

interface Bar {
  left: number;
  width: number;
  color: string;
  tooltip: string;
  running?: boolean;
}

interface GapBar {
  left: number;
  width: number;
  gap: DashboardGap;
  tooltip: string;
}

interface Row {
  day: string;
  date: Date;
  trackedMinutes: number;
  activeMinutes: number;
  entries: Bar[];
  activities: Bar[];
  gaps: GapBar[];
}

// One row per day with two lanes: tracked time (task colours) above, PC activity (by app) below.
// Untracked PC use is hatched on the tracked lane; clicking it offers to book that stretch.
@Component({
  selector: 'app-timeline',
  imports: [TooltipModule, DatePipe, TranslatePipe],
  templateUrl: './timeline.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Timeline {
  public readonly dashboard = input.required<Dashboard>();
  public readonly catalog = input.required<Catalog>();
  public readonly dark = input(false);
  public readonly gapClick = output<DashboardGap>();

  protected readonly formatMinutes = formatMinutes;

  // Hours shown: what the data spans, at least 08–18, rounded to whole hours.
  protected readonly hours = computed(() => {
    const { days, entries, activities } = this.dashboard();
    let first = 8;
    let last = 18;
    const all = [...entries, ...activities.filter(({ idle }) => !idle)];
    for (const day of days) {
      const dayStart = day.start.getTime();
      for (const item of all) {
        if (item.end.getTime() <= dayStart || item.start.getTime() >= dayStart + DAY_MS) {
          continue;
        }
        first = Math.min(first, Math.floor(Math.max(0, item.start.getTime() - dayStart) / HOUR_MS));
        last = Math.max(last, Math.ceil(Math.min(DAY_MS, item.end.getTime() - dayStart) / HOUR_MS));
      }
    }
    return { first, last, ticks: Array.from({ length: last - first + 1 }, (_, index) => first + index) };
  });

  protected readonly rows = computed((): Row[] => {
    const dashboard = this.dashboard();
    const catalog = this.catalog();
    const { first, last } = this.hours();
    const appColors = this.appColors();

    return dashboard.days
      .filter((day) => day.trackedMinutes > 0 || day.activeMinutes > 0 || this.isToday(day.start))
      .map((day): Row => {
        const viewStart = day.start.getTime() + first * HOUR_MS;
        const viewEnd = day.start.getTime() + last * HOUR_MS;
        const span = viewEnd - viewStart;
        const place = (start: Date, end: Date): { left: number; width: number } | undefined => {
          const from = Math.max(start.getTime(), viewStart);
          const to = Math.min(end.getTime(), viewEnd);
          return to > from ? { left: ((from - viewStart) / span) * 100, width: ((to - from) / span) * 100 } : undefined;
        };

        const entries = dashboard.entries.flatMap((entry): Bar[] => {
          const position = place(entry.start, entry.end);
          if (!position) {
            return [];
          }
          const info = catalog.taskInfo.get(entry.taskId);
          return [
            {
              ...position,
              running: entry.running,
              color: colorOf(info?.task.color ?? info?.project?.color, this.dark()),
              tooltip: `${info?.task.name ?? '?'} · ${info?.project?.name ?? ''}\n${this.time(entry.start)} – ${this.time(entry.end)} (${formatMinutes(minutesBetween(entry.start, entry.end))})`,
            },
          ];
        });
        const activities = dashboard.activities
          .filter(({ idle }) => !idle)
          .flatMap((activity): Bar[] => {
            const position = place(activity.start, activity.end);
            return position ? [{ ...position, color: appColors.get(activity.app) ?? '#999', tooltip: `${activity.app}\n${activity.title}\n${this.time(activity.start)} – ${this.time(activity.end)}` }] : [];
          });
        const gaps = dashboard.gaps.flatMap((gap): GapBar[] => {
          const position = place(gap.start, gap.end);
          return position ? [{ ...position, gap, tooltip: `${this.time(gap.start)} – ${this.time(gap.end)} (${formatMinutes(minutesBetween(gap.start, gap.end))})` }] : [];
        });

        return { day: day.day, date: day.start, trackedMinutes: day.trackedMinutes, activeMinutes: day.activeMinutes, entries, activities, gaps };
      });
  });

  // The busiest apps get distinguishable greys/tints; the long tail shares one.
  private readonly appColors = computed(() => {
    const shades = this.dark() ? ['#a1a1aa', '#71717a', '#d4d4d8', '#52525b', '#e4e4e7'] : ['#71717a', '#a1a1aa', '#52525b', '#c4c4cc', '#3f3f46'];
    return new Map(this.dashboard().apps.map(({ app }, index) => [app, shades[Math.min(index, shades.length - 1)]]));
  });

  private time(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private isToday(date: Date): boolean {
    const now = Date.now();
    return now >= date.getTime() && now < date.getTime() + DAY_MS;
  }
}
