import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '@components/header/header';
import { ActivitySyncService } from '@services/activity-sync.service';
import { ReminderService } from '@services/reminder.service';

@Component({
  selector: 'app-shell',
  imports: [Header, RouterOutlet],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'flex flex-col h-full overflow-auto' },
})
export class Shell {
  public constructor() {
    // Desktop app only (both do nothing in a browser): reminders and the upload of window activity
    // run as long as the app is signed in.
    inject(ReminderService).start();
    inject(ActivitySyncService).start();
  }
}
