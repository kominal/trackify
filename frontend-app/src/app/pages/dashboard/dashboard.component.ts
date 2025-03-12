import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { ClientHttpService, ProjectHttpService, TaskHttpService } from '../../api/backend-core/services';
import { shareReplayOne } from '../../helpers/util';
import { TenantService } from '../../services/tenant.service';
import { TrackingService } from '../../services/tracking.service';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  public trackingService = inject(TrackingService);
  private clientHttpService = inject(ClientHttpService);
  private projectHttpService = inject(ProjectHttpService);
  private taskHttpService = inject(TaskHttpService);

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
}
