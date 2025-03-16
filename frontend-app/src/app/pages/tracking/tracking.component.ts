import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ClockComponent } from '../../components/clock/clock.component';
import { TaskPipe } from '../../pipes/task.pipe';
import { TaskService } from '../../services/task.service';
import { TrackingService } from '../../services/tracking.service';

@Component({
  selector: 'app-tracking',
  imports: [AsyncPipe, ClockComponent, TaskPipe, ButtonModule, TranslatePipe, NgClass],
  templateUrl: './tracking.component.html',
})
export class TrackingComponent {
  public trackingService = inject(TrackingService);
  private taskService = inject(TaskService);

  public tasks$ = this.taskService.tasks$;
}
