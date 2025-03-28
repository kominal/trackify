import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TrackingService } from '../../services/tracking.service';
import { ClockComponent } from '../clock/clock.component';

@Component({
  selector: 'app-tracker',
  imports: [ButtonModule, ClockComponent, AsyncPipe],
  templateUrl: './tracker.component.html',
  host: { class: 'flex items-center gap-2' },
})
export class TrackerComponent {
  public trackingService = inject(TrackingService);
}
