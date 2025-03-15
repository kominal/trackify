import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { combineLatest, map } from 'rxjs';
import { Record } from '../../api/backend-core/models/record';
import { Task } from '../../api/backend-core/models/task';
import { ClientHttpService, ProjectHttpService, RecordHttpService, TaskHttpService } from '../../api/backend-core/services';
import { shareReplayOne } from '../../helpers/util';
import { TenantService } from '../../services/tenant.service';
import { TrackingService } from '../../services/tracking.service';

interface Section {
  task: Task;
  record: Record;
  start: number;
  end: number;
  duration: string;
}

interface Day {
  sections: Section[];
}

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, NgClass, TooltipModule, DatePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  public trackingService = inject(TrackingService);
  private clientHttpService = inject(ClientHttpService);
  private projectHttpService = inject(ProjectHttpService);
  private taskHttpService = inject(TaskHttpService);
  private recordHttpService = inject(RecordHttpService);

  public trackers$ = combineLatest([
    this.clientHttpService.list({ tenantId: TenantService.tenantId, pageIndex: -1, pageSize: 0, select: 'uuid name' }).pipe(map((r) => r.items)),
    this.projectHttpService.list({ tenantId: TenantService.tenantId, pageIndex: -1, pageSize: 0, select: 'uuid name clientId' }).pipe(map((r) => r.items)),
    this.taskHttpService.list({ tenantId: TenantService.tenantId, pageIndex: -1, pageSize: 0, select: 'uuid name projectId' }).pipe(map((r) => r.items)),
  ]).pipe(
    map(([clients, projects, tasks]) =>
      tasks
        .map((task) => {
          const project = projects.find((p) => p.uuid === task.projectId);
          if (!project) {
            return undefined;
          }
          const client = clients.find((c) => c.uuid === project.clientId);
          if (!client) {
            return undefined;
          }
          return { task, project, client };
        })
        .filter((x) => x !== undefined),
    ),
    shareReplayOne(),
  );

  public data$ = combineLatest([
    this.taskHttpService.list({ tenantId: TenantService.tenantId, pageIndex: -1, pageSize: 0, select: 'uuid name color' }).pipe(map((r) => r.items)),
    this.recordHttpService.list({ tenantId: TenantService.tenantId, pageIndex: -1, pageSize: 0, select: 'uuid taskId start end' }).pipe(map((r) => r.items)),
  ]).pipe(
    map(([tasks, records]) => {
      if (records.length === 0) {
        return [];
      }

      const startOfFirstDay = records.reduce((acc, record) => (record.start < acc ? record.start : acc), records[0].start);
      const endOfLastDay = records.reduce((acc, record) => (record.end > acc ? record.end : acc), records[0].end);

      const days: Day[] = [];
      for (let startOfDay = startOfFirstDay; startOfDay <= endOfLastDay; startOfDay.setDate(startOfDay.getDate() + 1)) {
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(startOfDay.getDate() + 1);

        const day: Day = { sections: [] };

        const relevantRecords = records.filter((record) => record.start < endOfDay && record.end > startOfDay);

        const sorted = relevantRecords.sort((a, b) => a.end.getTime() - b.end.getTime());

        console.log(sorted);

        for (const record of sorted) {
          const recordDayStart = record.start < startOfDay ? startOfDay : record.start;
          const recordDayEnd = record.end > endOfDay ? endOfDay : record.end;

          const start = recordDayStart.getUTCHours() * 60 + recordDayStart.getUTCMinutes();
          const end = recordDayEnd.getUTCHours() * 60 + recordDayEnd.getUTCMinutes();
          const duration = `${Math.floor((end - start) / 60)
            .toString()
            .padStart(2, '0')}:${((end - start) % 60).toString().padStart(2, '0')} h`;

          const task = tasks.find((t) => t.uuid === record.taskId);
          if (task) {
            day.sections.push({ record, task, start, end, duration });
          }
        }

        days.push(day);
      }

      return days;
    }),
  );
}
