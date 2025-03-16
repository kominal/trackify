import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, first, lastValueFrom, switchMap } from 'rxjs';
import { Task } from '../api/backend-core/models/task';
import { TrackingSessionHttpService } from '../api/backend-core/services';
import { shareReplayOne } from '../helpers/util';
import { TaskService } from './task.service';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  private trackingSessionHttpService = inject(TrackingSessionHttpService);
  private taskService = inject(TaskService);

  private refresh$ = new BehaviorSubject<void>(undefined);

  private lastNotification: Notification | undefined;

  public constructor() {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onTrackingPrevious((value: number) => {
        this.goToTask(-1);
      });
      (window as any).electronAPI.onTrackingNext((value: number) => {
        this.goToTask(1);
      });
    }
  }

  public async goToTask(direction: number): Promise<void> {
    const tasks = await lastValueFrom(this.taskService.tasks$.pipe(first()));

    if (tasks.length === 0) {
      return;
    }

    const trackingSession = await lastValueFrom(this.trackingState$.pipe(first()));

    if (!trackingSession) {
      await this.startTracking(tasks[0].task, true);
    }

    const currentTask = tasks.findIndex((t) => t.task.uuid === trackingSession?.taskId);
    const nextTask = (currentTask + direction + tasks.length) % tasks.length;
    const next = tasks[nextTask];
    await this.startTracking(next.task, true);
  }

  public trackingState$ = this.refresh$.pipe(
    switchMap(() => this.trackingSessionHttpService.readActive({ tenantId: TenantService.tenantId })),
    shareReplayOne(),
  );

  public async stopTracking(): Promise<void> {
    await lastValueFrom(this.trackingSessionHttpService.stopActive({ tenantId: TenantService.tenantId }));
    this.refresh$.next();
  }

  public async startTracking(task: Task, notify = false): Promise<void> {
    if (notify) {
      if ((window as any).electronAPI) {
        if (this.lastNotification) {
          this.lastNotification.close();
        }
        this.lastNotification = new Notification('Tracking', {
          icon: 'logo.png',
          body: task.name,
          silent: true,
        });
      }
    }
    await lastValueFrom(this.trackingSessionHttpService.updateActive({ tenantId: TenantService.tenantId, body: { taskId: task.uuid } }));
    this.refresh$.next();
  }
}
