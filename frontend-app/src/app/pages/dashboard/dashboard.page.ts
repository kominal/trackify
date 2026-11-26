import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardGap } from '@api/models';
import { DashboardHttpService } from '@api/services';
import { DaysChart } from '@components/days-chart/days-chart';
import { Timeline } from '@components/timeline/timeline';
import { colorOf } from '@constants/colors';
import { TimeEntryEditDialog, TimeEntryEditData } from '@dialogs/time-entry-edit/time-entry-edit.dialog';
import { addLocalDays, startOfLocalDay, startOfLocalMonth, startOfLocalWeek } from '@helpers/clock';
import { formatMinutes } from '@helpers/duration';
import { loaded } from '@helpers/loaded.helper';
import { background, queryDate } from '@helpers/util';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationStateService, DashboardPreset } from '@services/application-state.service';
import { CatalogService } from '@services/catalog.service';
import { NativeService } from '@services/native.service';
import { TenantService } from '@services/tenant.service';
import { TrackingService } from '@services/tracking.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { Message } from 'primeng/message';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { map } from 'rxjs';

type Preset = DashboardPreset | 'custom';

const REMEMBERED_PRESETS: DashboardPreset[] = ['day', 'week', 'month'];

interface Range {
  from: Date;
  to: Date;
  preset: Preset;
}

function parseDay(value: string | null): Date | undefined {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
}

function formatDay(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [ButtonModule, SelectButtonModule, DatePickerModule, FormsModule, TranslatePipe, DatePipe, DecimalPipe, TooltipModule, SkeletonModule, Message, Timeline, DaysChart],
  templateUrl: './dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  // The timeline profits from every pixel, so this page uses the full window width.
  host: { class: 'scroll-page max-w-none!' },
})
export class DashboardPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dashboardHttpService = inject(DashboardHttpService);
  private readonly tenantService = inject(TenantService);
  private readonly trackingService = inject(TrackingService);
  private readonly utilService = inject(UtilService);
  protected readonly catalogService = inject(CatalogService);
  protected readonly applicationStateService = inject(ApplicationStateService);
  protected readonly nativeService = inject(NativeService);

  protected readonly formatMinutes = formatMinutes;
  protected readonly presets: { label: string; value: Preset }[] = [
    { label: 'dashboard.day', value: 'day' },
    { label: 'dashboard.week', value: 'week' },
    { label: 'dashboard.month', value: 'month' },
  ];

  // The range lives in the URL (?preset=week&from=2026-11-23), so it survives reloads and can be shared.
  // Opened without one (the menu link), the dashboard continues where it was left.
  protected readonly range = toSignal(
    this.route.queryParamMap.pipe(
      map((params): Range => {
        const query = params.has('preset') ? { preset: params.get('preset'), from: params.get('from'), to: params.get('to') } : this.remembered();
        const preset = (query.preset as Preset | null) ?? 'week';
        const from = parseDay(query.from ?? null);
        if (preset === 'custom') {
          const to = parseDay(query.to ?? null);
          if (from && to && to >= from) {
            return { preset, from, to: addLocalDays(to, 1) };
          }
        }
        if (preset === 'day') {
          const day = startOfLocalDay(from);
          return { preset, from: day, to: addLocalDays(day, 1) };
        }
        if (preset === 'month') {
          const month = startOfLocalMonth(from);
          return { preset, from: month, to: new Date(month.getFullYear(), month.getMonth() + 1, 1) };
        }
        const week = startOfLocalWeek(from);
        return { preset: 'week', from: week, to: addLocalDays(week, 7) };
      }),
    ),
    { requireSync: true },
  );

  public constructor() {
    effect(() => {
      const { preset, from, to } = this.range();
      const params: Record<string, string> = { preset, from: formatDay(from) };
      if (preset === 'custom') {
        params['to'] = formatDay(addLocalDays(to, -1));
      } else {
        this.applicationStateService.formElement.controls.dashboardPreset.setValue(preset);
      }
      this.applicationStateService.dashboardRange = { params, storedOn: formatDay(new Date()) };
    });
  }

  private readonly reload = signal(0);
  private readonly dashboard = loaded(
    computed(() => {
      const tenantId = this.tenantService.tenant()?.uuid;
      const { from, to } = this.range();
      this.trackingService.changes();
      this.reload();
      return tenantId ? { tenantId, from, to } : undefined;
    }),
    ({ tenantId, from, to }) => this.dashboardHttpService.read({ tenantId, from: queryDate(from), to: queryDate(to), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }, background()),
  );
  protected readonly data = this.dashboard.value;
  protected readonly loading = this.dashboard.loading;

  protected readonly customRange = computed(() => {
    const { from, to } = this.range();
    return [from, addLocalDays(to, -1)];
  });

  protected readonly coverage = computed(() => {
    const totals = this.data()?.totals;
    return totals && totals.activeMinutes > 0 ? (totals.coveredMinutes / totals.activeMinutes) * 100 : undefined;
  });

  protected readonly averagePerDay = computed(() => {
    const totals = this.data()?.totals;
    return totals && totals.workingDays > 0 ? totals.trackedMinutes / totals.workingDays : 0;
  });

  protected readonly projects = computed(() => {
    const data = this.data();
    const catalog = this.catalogService.catalog();
    const dark = !!this.applicationStateService.darkMode();
    const total = data?.totals.trackedMinutes || 1;
    return (data?.projects ?? []).map((project) => {
      const entity = catalog.project.get(project.projectId);
      return {
        ...project,
        name: entity?.name,
        client: entity?.clientId ? catalog.clients.find(({ uuid }) => uuid === entity.clientId)?.name : undefined,
        color: colorOf(entity?.color, dark),
        share: (project.minutes / total) * 100,
        tasks: project.tasks.map((task) => ({ ...task, name: catalog.taskInfo.get(task.taskId)?.task.name, share: (task.minutes / total) * 100 })),
      };
    });
  });

  protected readonly apps = computed(() => {
    const data = this.data();
    const total = data?.totals.activeMinutes || 1;
    return (data?.apps ?? []).map((app) => ({ ...app, share: (app.minutes / total) * 100, coverage: app.minutes > 0 ? (app.coveredMinutes / app.minutes) * 100 : 0 }));
  });

  private remembered(): { preset: string; from?: string; to?: string } {
    const { dashboardRange, formElement } = this.applicationStateService;
    if (dashboardRange?.storedOn === formatDay(new Date())) {
      return dashboardRange.params as { preset: string; from?: string; to?: string };
    }
    const preset = formElement.controls.dashboardPreset.value;
    return { preset: REMEMBERED_PRESETS.includes(preset) ? preset : 'week' };
  }

  protected selectPreset(preset: Preset): void {
    void this.router.navigate([], { queryParams: { preset, from: formatDay(new Date()) }, replaceUrl: true });
  }

  protected shift(direction: 1 | -1): void {
    const { preset, from, to } = this.range();
    let next: Date;
    if (preset === 'month') {
      next = new Date(from.getFullYear(), from.getMonth() + direction, 1);
    } else {
      next = addLocalDays(from, direction * Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));
    }
    const queryParams: Record<string, string> = { preset, from: formatDay(next) };
    if (preset === 'custom') {
      queryParams['to'] = formatDay(addLocalDays(next, Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) - 1));
    }
    void this.router.navigate([], { queryParams, replaceUrl: true });
  }

  protected selectCustom(dates: (Date | null)[] | null): void {
    const [from, to] = dates ?? [];
    if (from && to) {
      void this.router.navigate([], { queryParams: { preset: 'custom', from: formatDay(from), to: formatDay(to) }, replaceUrl: true });
    }
  }

  protected bookGap(gap: DashboardGap): void {
    const tenantId = this.tenantService.tenant()?.uuid;
    if (!tenantId) {
      return;
    }
    this.utilService.open<TimeEntryEditData, boolean>('timeEntryAdd', TimeEntryEditDialog, { tenantId, start: gap.start, end: gap.end }, '640px').subscribe((saved) => {
      if (saved) {
        this.trackingService.refresh();
        this.reload.update((value) => value + 1);
      }
    });
  }
}
