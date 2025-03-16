import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, forkJoin, map, Observable, switchMap } from 'rxjs';
import { ClientHttpService, ProjectHttpService, TaskHttpService } from '../api/backend-core/services';
import { shareReplayOne } from '../helpers/util';
import { TaskWrapper } from '../models/task-wrapper.model';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private clientHttpService = inject(ClientHttpService);
  private projectHttpService = inject(ProjectHttpService);
  private taskHttpService = inject(TaskHttpService);
  private tenantService = inject(TenantService);

  private refresh$ = new BehaviorSubject<void>(undefined);

  public tasks$: Observable<TaskWrapper[]> = combineLatest([this.tenantService.saveTenant$, this.refresh$]).pipe(
    switchMap(([tenant]) =>
      forkJoin([
        this.clientHttpService.list({ tenantId: tenant.uuid, pageIndex: -1, pageSize: 0, select: 'uuid name' }).pipe(map((r) => r.items)),
        this.projectHttpService.list({ tenantId: tenant.uuid, pageIndex: -1, pageSize: 0, select: 'uuid name clientId' }).pipe(map((r) => r.items)),
        this.taskHttpService.list({ tenantId: tenant.uuid, pageIndex: -1, pageSize: 0, select: 'uuid name projectId priority color' }).pipe(map((r) => r.items)),
      ]),
    ),
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
        .filter((x) => x !== undefined)
        .sort((a, b) => (a.task.priority || 0) - (b.task.priority || 0)),
    ),
    shareReplayOne(),
  );

  public constructor() {
    this.tasks$.subscribe();
  }
}
