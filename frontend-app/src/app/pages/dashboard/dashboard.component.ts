import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { combineLatest, map } from 'rxjs';
import { Record } from '../../api/backend-core/models/record';
import { Task } from '../../api/backend-core/models/task';
import { RecordHttpService } from '../../api/backend-core/services';
import { TaskService } from '../../services/task.service';
import { TenantService } from '../../services/tenant.service';
import { TrackingService } from '../../services/tracking.service';

interface Section {
  task: Task;
  record: Record;
  start: Date;
  end: Date;
  startMinute: number;
  endMinute: number;
  duration: string;
}

interface Day {
  date: Date;
  sections: Section[];
}

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, NgClass, TooltipModule, DatePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  public trackingService = inject(TrackingService);
  private taskService = inject(TaskService);
  private recordHttpService = inject(RecordHttpService);

  public tasks$ = this.taskService.tasks$;

  public data$ = combineLatest([
    this.tasks$,
    this.recordHttpService.list({ tenantId: TenantService.tenantId, pageIndex: -1, pageSize: 0, select: 'uuid taskId start end' }).pipe(map((r) => r.items)),
  ]).pipe(
    map(([tasks, records]) => {
      if (records.length === 0) {
        return [];
      }

      const globalStart = new Date(records.reduce((acc, record) => (record.start < acc ? record.start : acc), records[0].start));
      globalStart.setHours(0, 0, 0, 0);
      const endOfLastDay = new Date(records.reduce((acc, record) => (record.end > acc ? record.end : acc), records[0].end));
      endOfLastDay.setHours(0, 0, 0, 0);
      endOfLastDay.setDate(endOfLastDay.getDate() + 1);

      const days: Day[] = [];
      for (let startOfDay = globalStart; startOfDay < endOfLastDay; startOfDay.setDate(startOfDay.getDate() + 1)) {
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        const day: Day = { date: new Date(startOfDay), sections: [] };

        const relevantRecords = records.filter((record) => record.start < endOfDay && record.end > startOfDay);

        const sorted = relevantRecords.sort((a, b) => a.end.getTime() - b.end.getTime());

        for (const record of sorted) {
          const start = record.start < startOfDay ? startOfDay : record.start;
          const end = record.end > endOfDay ? endOfDay : record.end;

          const startMinute = start.getHours() * 60 + start.getMinutes() - 1;
          const endMinute = end.getHours() * 60 + end.getMinutes();
          const duration = `${Math.floor((endMinute - startMinute) / 60)
            .toString()
            .padStart(2, '0')}:${((endMinute - startMinute) % 60).toString().padStart(2, '0')} h`;

          const task = tasks.find((t) => t.task.uuid === record.taskId);
          if (task) {
            day.sections.push({ record, task: task.task, start, end, startMinute, endMinute, duration });
          }
        }

        days.push(day);
      }

      return days.reverse();
    }),
  );
}
