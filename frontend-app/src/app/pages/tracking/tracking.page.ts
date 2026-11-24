import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Dashboard, MembershipPermission } from '@api/models';
import { DashboardHttpService } from '@api/services';
import { colorOf } from '@constants/colors';
import { addLocalDays, now, startOfLocalDay } from '@helpers/clock';
import { formatClock, formatMinutes, minutesBetween } from '@helpers/duration';
import { loaded } from '@helpers/loaded.helper';
import { background, queryDate } from '@helpers/util';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { CatalogService, TaskInfo } from '@services/catalog.service';
import { TenantService } from '@services/tenant.service';
import { TrackingService } from '@services/tracking.service';
import { UserService } from '@services/user.service';
import { ButtonModule } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';

interface ProjectGroup {
  key: string;
  name: string;
  client?: string;
  tasks: (TaskInfo & { color: string; minutesToday: number })[];
}

@Component({
  selector: 'app-tracking-page',
  imports: [ButtonModule, InputTextModule, IconField, InputIcon, FormsModule, TranslatePipe, DatePipe, TooltipModule, RouterLink, Message],
  templateUrl: './tracking.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'scroll-page' },
})
export class TrackingPage {
  protected readonly trackingService = inject(TrackingService);
  protected readonly catalogService = inject(CatalogService);
  protected readonly tenantService = inject(TenantService);
  protected readonly applicationStateService = inject(ApplicationStateService);
  protected readonly userService = inject(UserService);
  private readonly dashboardHttpService = inject(DashboardHttpService);

  protected readonly formatMinutes = formatMinutes;
  protected readonly ManageCatalog = MembershipPermission.ManageCatalog;
  private readonly now = now();
  private readonly minute = now(60 * 1000);
  protected readonly search = signal('');

  // Today's entries and totals; reloaded on every start/stop and once a minute for the running session.
  private readonly today = loaded(
    computed(() => {
      const tenantId = this.tenantService.tenant()?.uuid;
      this.trackingService.changes();
      this.minute();
      const from = startOfLocalDay();
      return tenantId ? { tenantId, from, to: addLocalDays(from, 1) } : undefined;
    }),
    ({ tenantId, from, to }) => this.dashboardHttpService.read({ tenantId, from: queryDate(from), to: queryDate(to), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }, background()),
  );
  protected readonly todayValue = this.today.value;

  protected readonly running = computed(() => {
    const session = this.trackingService.session();
    if (!session) {
      return undefined;
    }
    const info = this.catalogService.catalog().taskInfo.get(session.taskId);
    return { session, info, color: this.colorOf(info), clock: formatClock(this.now().getTime() - session.start.getTime()) };
  });

  protected readonly groups = computed((): ProjectGroup[] => {
    const query = this.search().trim().toLocaleLowerCase();
    const minutesPerTask = this.minutesPerTask(this.todayValue());
    const groups = new Map<string, ProjectGroup>();
    for (const info of this.catalogService.catalog().taskInfos) {
      if (info.task.archived || info.project?.archived) {
        continue;
      }
      const haystack = `${info.task.name} ${info.project?.name ?? ''} ${info.client?.name ?? ''}`.toLocaleLowerCase();
      if (query && !query.split(/\s+/).every((word) => haystack.includes(word))) {
        continue;
      }
      const key = info.project?.uuid ?? '';
      const group = groups.get(key) ?? { key, name: info.project?.name ?? '', client: info.client?.name, tasks: [] };
      group.tasks.push({ ...info, color: this.colorOf(info), minutesToday: minutesPerTask.get(info.task.uuid) ?? 0 });
      groups.set(key, group);
    }
    return [...groups.values()];
  });

  protected readonly entries = computed(() => {
    const today = this.todayValue();
    const catalog = this.catalogService.catalog();
    return (today?.entries ?? [])
      .map((entry) => {
        const info = catalog.taskInfo.get(entry.taskId);
        return { ...entry, info, color: this.colorOf(info), minutes: minutesBetween(entry.start, entry.end) };
      })
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  });

  protected readonly totalToday = computed(() => this.todayValue()?.totals.trackedMinutes ?? 0);

  // Enter starts the first match of the search.
  protected startFirstMatch(): void {
    const first = this.groups()[0]?.tasks[0];
    if (first) {
      this.trackingService.start(first.task.uuid);
      this.search.set('');
    }
  }

  private colorOf(info: TaskInfo | undefined): string {
    return colorOf(info?.task.color ?? info?.project?.color, !!this.applicationStateService.darkMode());
  }

  private minutesPerTask(today: Dashboard | undefined): Map<string, number> {
    const result = new Map<string, number>();
    for (const project of today?.projects ?? []) {
      for (const task of project.tasks) {
        result.set(task.taskId, task.minutes);
      }
    }
    return result;
  }
}
