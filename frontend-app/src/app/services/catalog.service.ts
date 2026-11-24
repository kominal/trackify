import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClientEntity, ProjectEntity, TaskEntity } from '@api/models';
import { ClientHttpService, ProjectHttpService, TaskHttpService } from '@api/services';
import { background, shareReplayOne } from '@helpers/util';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { TenantService } from './tenant.service';

export interface TaskInfo {
  task: TaskEntity;
  project?: ProjectEntity;
  client?: ClientEntity;
}

export interface Catalog {
  clients: ClientEntity[];
  projects: ProjectEntity[];
  tasks: TaskEntity[];
  // Every task with its project and client, ordered by project name and task priority.
  taskInfos: TaskInfo[];
  taskInfo: Map<string, TaskInfo>;
  project: Map<string, ProjectEntity>;
}

const EMPTY_CATALOG: Catalog = { clients: [], projects: [], tasks: [], taskInfos: [], taskInfo: new Map(), project: new Map() };

// Clients, projects and tasks of the current organisation, loaded once and shared by every page.
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly tenantService = inject(TenantService);
  private readonly clientHttpService = inject(ClientHttpService);
  private readonly projectHttpService = inject(ProjectHttpService);
  private readonly taskHttpService = inject(TaskHttpService);

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  public readonly catalog$ = combineLatest([this.tenantService.tenantId$, this.reload$]).pipe(
    switchMap(([tenantId]) => {
      if (!tenantId) {
        return of(EMPTY_CATALOG);
      }
      const context = background();
      return combineLatest([this.clientHttpService.list({ tenantId }, context), this.projectHttpService.list({ tenantId }, context), this.taskHttpService.list({ tenantId }, context)]).pipe(
        map(([clients, projects, tasks]) => this.build(clients.items, projects.items, tasks.items)),
        catchError(() => of(EMPTY_CATALOG)),
      );
    }),
    shareReplayOne(),
  );

  public readonly catalog = toSignal(this.catalog$, { initialValue: EMPTY_CATALOG });

  public reload(): void {
    this.reload$.next();
  }

  private build(clients: ClientEntity[], projects: ProjectEntity[], tasks: TaskEntity[]): Catalog {
    const client = new Map(clients.map((entity) => [entity.uuid, entity]));
    const project = new Map(projects.map((entity) => [entity.uuid, entity]));
    const taskInfos = tasks
      .map((task): TaskInfo => {
        const taskProject = project.get(task.projectId);
        return { task, project: taskProject, client: taskProject?.clientId ? client.get(taskProject.clientId) : undefined };
      })
      .sort((a, b) => (a.project?.name ?? '').localeCompare(b.project?.name ?? '') || a.task.priority - b.task.priority || a.task.name.localeCompare(b.task.name));
    return { clients, projects, tasks, taskInfos, taskInfo: new Map(taskInfos.map((info) => [info.task.uuid, info])), project };
  }
}
