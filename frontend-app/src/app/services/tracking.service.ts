import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom, switchMap } from 'rxjs';
import { Task } from '../api/backend-core/models/task';
import { TrackingSessionHttpService } from '../api/backend-core/services';
import { shareReplayOne } from '../helpers/util';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  private trackingSessionHttpService = inject(TrackingSessionHttpService);

  private refresh$ = new BehaviorSubject<void>(undefined);

  public constructor() {
    if ((window as any).electronAPI) {
      console.log('Electron API available');
      (window as any).electronAPI.onTrackingPrevious((value: number) => {
        console.log('Down:', value);
      });
      (window as any).electronAPI.onTrackingNext((value: number) => {
        console.log('Next:', value);
      });
    }
  }

  public trackingState$ = this.refresh$.pipe(
    switchMap(() => this.trackingSessionHttpService.readActive({ tenantId: TenantService.tenantId })),
    shareReplayOne(),
  );

  public async stopTracking(): Promise<void> {
    await lastValueFrom(this.trackingSessionHttpService.stopActive({ tenantId: TenantService.tenantId }));
    this.refresh$.next();
  }

  public async startTracking(task: Task): Promise<void> {
    await lastValueFrom(this.trackingSessionHttpService.updateActive({ tenantId: TenantService.tenantId, body: { taskId: task.uuid } }));
    this.refresh$.next();
  }
}
