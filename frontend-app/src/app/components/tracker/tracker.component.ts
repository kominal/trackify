import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TrackingService } from '../../services/tracking.service';
import { ClockComponent } from '../clock/clock.component';

@Component({
  selector: 'app-tracker',
  imports: [ButtonModule, ClockComponent],
  templateUrl: './tracker.component.html',
  host: { class: 'flex items-center gap-2' },
})
export class TrackerComponent {
  public isTracking = false;

  public trackingService = inject(TrackingService);
}
