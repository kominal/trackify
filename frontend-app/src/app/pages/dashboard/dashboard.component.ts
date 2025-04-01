import { AsyncPipe, DatePipe, NgClass, NgStyle } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { combineLatest, map } from 'rxjs';
import { Project } from '../../api/backend-core/models/project';
import { Record } from '../../api/backend-core/models/record';
import { Task } from '../../api/backend-core/models/task';
import { RecordHttpService } from '../../api/backend-core/services';
import { groupBy } from '../../helpers/util';
import { TaskService } from '../../services/task.service';
import { TenantService } from '../../services/tenant.service';
import { TrackingService } from '../../services/tracking.service';

interface Section {
  projectId?: string;
  project?: Project;
  task: Task;
  record: Record;
  start: Date;
  end: Date;
  startMinute: number;
  endMinute: number;
  duration: string;
  active: boolean;
}

interface Summary {
  project: Project;
  duration: string;
  totalBreak: string;
  sections: Section[];
  active: boolean;
}

interface Day {
  date: Date;
  sections: Section[];
  expanded: boolean;
  summaries: Summary[];
}

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe, NgClass, NgStyle, TooltipModule, DatePipe, ButtonModule],
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
    this.trackingService.trackingState$,
  ]).pipe(
    map(([tasks, records, trackingState]) => {
      let displayableRecords: (Record & { active?: boolean })[] = records;
      if (trackingState) {
        displayableRecords = displayableRecords.filter((record) => record.start.getTime() !== trackingState.start.getTime());
        displayableRecords = [...displayableRecords, { start: trackingState.start, end: new Date(), taskId: trackingState.taskId, active: true } as Record & { active?: boolean }];
      }

      if (displayableRecords.length === 0) {
        return [];
      }

      const globalStart = new Date(displayableRecords.reduce((acc, record) => (record.start < acc ? record.start : acc), displayableRecords[0].start));
      globalStart.setHours(0, 0, 0, 0);
      const endOfLastDay = new Date(displayableRecords.reduce((acc, record) => (record.end > acc ? record.end : acc), displayableRecords[0].end));
      endOfLastDay.setHours(0, 0, 0, 0);
      endOfLastDay.setDate(endOfLastDay.getDate() + 1);

      const days: Day[] = [];
      for (let startOfDay = globalStart; startOfDay < endOfLastDay; startOfDay.setDate(startOfDay.getDate() + 1)) {
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        const day: Day = { date: new Date(startOfDay), sections: [], expanded: false, summaries: [] };

        const relevantRecords = displayableRecords.filter((record) => record.start < endOfDay && record.end > startOfDay);

        const sorted = relevantRecords.sort((a, b) => a.end.getTime() - b.end.getTime());

        for (const record of sorted) {
          const start = new Date(record.start < startOfDay ? startOfDay : record.start);
          const end = new Date(record.end > endOfDay ? endOfDay : record.end);

          const startMinute = start.getHours() * 60 + start.getMinutes() - 1;
          const endMinute = end.getHours() * 60 + end.getMinutes();
          const duration = `${Math.floor((endMinute - startMinute) / 60)
            .toString()
            .padStart(2, '0')}:${((endMinute - startMinute) % 60).toString().padStart(2, '0')}h`;

          const task = tasks.find((t) => t.task.uuid === record.taskId);
          if (task) {
            day.sections.push({
              record,
              projectId: task.project?.uuid,
              project: task.project,
              task: task.task,
              start,
              end,
              startMinute,
              endMinute,
              duration,
              active: record.active || false,
            });
          }
        }

        day.summaries = Object.values(groupBy(day.sections, 'projectId')).map((sections): Summary => {
          const project = sections[0].project as Project;
          const duration = sections.reduce((acc, section) => {
            const startMinute = section.start.getHours() * 60 + section.start.getMinutes() - 1;
            const endMinute = section.end.getHours() * 60 + section.end.getMinutes();
            console.log(section.start.getDate(), 'startMinute', startMinute, 'endMinute', endMinute, project.name, endMinute - startMinute);
            return acc + (endMinute - startMinute);
          }, 0);
          const start = sections.reduce((acc, section) => (section.start < acc ? section.start : acc), sections[0].start);
          const end = sections.reduce((acc, section) => (section.end > acc ? section.end : acc), sections[0].end);
          const startMinute = start.getHours() * 60 + start.getMinutes() - 1;
          const endMinute = end.getHours() * 60 + end.getMinutes();
          const totalBreak = endMinute - startMinute - duration;

          const durationString = `${Math.floor(duration / 60)
            .toString()
            .padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}h`;
          const totalBreakString = `${Math.floor(totalBreak / 60)
            .toString()
            .padStart(2, '0')}:${(totalBreak % 60).toString().padStart(2, '0')}h`;
          return {
            project,
            duration: durationString,
            totalBreak: totalBreakString,
            sections,
            active: sections.some((section) => section.active),
          };
        });

        days.push(day);
      }

      days.reverse();

      if (days.length > 0) {
        days[0].expanded = true;
      }

      return days;
    }),
  );
}
