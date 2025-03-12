import { inject, Injectable } from '@angular/core';
import { fromEvent } from 'rxjs';
import { Task } from '../api/backend-core/models/task';
import { RecordHttpService } from '../api/backend-core/services';
import { TrackingState } from '../models/tracking-state.model';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  private recordHttpService = inject(RecordHttpService);

  public tracking = false;

  private trackingState: TrackingState | undefined;

  public constructor() {
    this.loadTrackingState();
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe()
      .subscribe((event) => {
        if (event.key === 'ArrowUp' && event.ctrlKey && event.altKey) {
          this.tracking = !this.tracking;

          if (this.permission === 'granted') {
            if (this.lastNotification) {
              this.lastNotification.close();
            }
            this.lastNotification = new Notification('Tracking', {
              icon: 'logo.png',
              body: this.tracking ? 'Enabled' : 'Disabled',
              silent: true,
            });
          }
        }
        if (event.key === 'ArrowDown' && event.ctrlKey && event.altKey) {
          this.tracking = !this.tracking;

          if (this.permission === 'granted') {
            if (this.lastNotification) {
              this.lastNotification.close();
            }
            this.lastNotification = new Notification('Tracking', {
              icon: 'logo.png',
              body: this.tracking ? 'Enabled' : 'Disabled',
              silent: true,
            });
          }
        }
      });
  }

  private permission: NotificationPermission | undefined = undefined;
  private lastNotification: Notification | undefined = undefined;

  public toggle(): void {
    this.tracking = !this.tracking;

    Notification.requestPermission().then((permission) => {
      console.log(permission);
      this.permission = permission;
    });
  }

  private loadTrackingState(): void {
    const state = localStorage.getItem('TRACKING_STATE');
    if (state) {
      this.trackingState = JSON.parse(state);
    }
  }

  private saveTrackingState(): void {
    if (this.trackingState) {
      localStorage.setItem('TRACKING_STATE', JSON.stringify(this.trackingState));
    } else {
      localStorage.removeItem('TRACKING_STATE');
    }
  }

  private updateTrackingState(trackingState: TrackingState | undefined): void {
    this.trackingState = trackingState;
    this.saveTrackingState();
  }

  public stopTracking() {
    if (this.trackingState) {
      const duration = new Date().getTime() - this.trackingState.start.getTime();
      if (duration > 60000) {
        this.recordHttpService.create({
          tenantId: TenantService.tenantId,
          body: {
            taskId: this.trackingState.taskId,
            duration,
            name: 'Tracking',
          },
        });
        this.updateTrackingState(undefined);
      }
    }
  }

  public startTracking(task: Task) {
    this.stopTracking();
    this.updateTrackingState({ taskId: task.uuid, start: new Date() });
  }
}
