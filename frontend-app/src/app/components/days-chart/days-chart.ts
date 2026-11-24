import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID } from '@angular/core';
import { Dashboard } from '@api/models';
import { colorOf } from '@constants/colors';
import { formatMinutes } from '@helpers/duration';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { Catalog } from '@services/catalog.service';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';

// Theme colours are CSS variables that may reference other variables; a probe element resolves them to a value Chart.js can use.
function resolveColor(variable: string, fallback: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${variable}, ${fallback})`;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color || fallback;
}

// Hours per day, stacked by project. A thin line on top marks the PC activity of the day.
@Component({
  selector: 'app-days-chart',
  imports: [ChartModule],
  template: `<p-chart type="bar" [data]="data()" [options]="options()" height="260px" />`,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DaysChart {
  public readonly dashboard = input.required<Dashboard>();
  public readonly catalog = input.required<Catalog>();

  private readonly applicationStateService = inject(ApplicationStateService);
  private readonly translateService = inject(TranslateService);
  private readonly locale = inject(LOCALE_ID);

  protected readonly data = computed<ChartData<'bar' | 'line'>>(() => {
    const dark = !!this.applicationStateService.darkMode();
    const { days, totals } = this.dashboard();
    const catalog = this.catalog();
    const format = new Intl.DateTimeFormat(this.locale, { weekday: 'short', day: '2-digit', month: '2-digit' });
    const projectIds = [...new Set(days.flatMap((day) => day.projects.map(({ projectId }) => projectId)))];
    // Days still to come have no value at all (not zero), so the activity line stops at today.
    const now = Date.now();
    const future = days.map((day) => day.start.getTime() > now);

    const datasets: ChartData<'bar' | 'line'>['datasets'] = projectIds.map((projectId) => {
      const project = catalog.project.get(projectId);
      const color = colorOf(project?.color, dark);
      return {
        type: 'bar' as const,
        label: project?.name ?? this.translateService.instant('tracking.noProject'),
        data: days.map((day, index) => (future[index] ? null : (day.projects.find((share) => share.projectId === projectId)?.minutes ?? 0) / 60)),
        backgroundColor: color,
        borderRadius: 3,
        stack: 'tracked',
        maxBarThickness: 48,
      };
    });
    if (totals.hasActivity) {
      datasets.push({
        type: 'line' as const,
        label: this.translateService.instant('dashboard.activeTime'),
        data: days.map((day, index) => (future[index] ? null : day.activeMinutes / 60)),
        borderColor: resolveColor('--p-text-muted-color', '#71717a'),
        borderDash: [4, 4],
        borderWidth: 2,
        pointRadius: 3,
        tension: 0,
      });
    }
    return { labels: days.map((day) => format.format(day.start)), datasets };
  });

  protected readonly options = computed<ChartOptions<'bar'>>(() => {
    this.applicationStateService.darkMode();
    const text = resolveColor('--p-text-muted-color', '#64748b');
    const grid = resolveColor('--p-content-border-color', '#e2e8f0');
    return {
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { color: text, usePointStyle: true, boxWidth: 10 } },
        tooltip: {
          filter: (item) => (item.parsed.y ?? 0) > 0,
          callbacks: { label: (item) => `${item.dataset.label}: ${formatMinutes((item.parsed.y ?? 0) * 60)}` },
        },
      },
      scales: {
        x: { stacked: true, ticks: { color: text }, grid: { display: false }, border: { color: grid } },
        y: { stacked: true, beginAtZero: true, ticks: { color: text, callback: (value) => `${value} h` }, grid: { color: grid }, border: { display: false } },
      },
    };
  });
}
