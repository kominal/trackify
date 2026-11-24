import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { interval } from 'rxjs';
import { CatalogService } from './catalog.service';
import { NativeService } from './native.service';
import { TenantService } from './tenant.service';
import { TrackingService } from './tracking.service';
import { UserSettingsService } from './user-settings.service';

const CHECK_MS = 60 * 1000;
// Without keyboard or mouse input for this long the PC counts as not in use: no "nothing tracked" reminder.
const AWAY_SECONDS = 5 * 60;

// Desktop app only: reminds when the tracked task has not changed for a while ("still working on X?")
// and when nothing is tracked although the PC is in use. Repeats every interval until something changes.
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly nativeService = inject(NativeService);
  private readonly trackingService = inject(TrackingService);
  private readonly catalogService = inject(CatalogService);
  private readonly tenantService = inject(TenantService);
  private readonly userSettingsService = inject(UserSettingsService);
  private readonly translateService = inject(TranslateService);
  private readonly router = inject(Router);

  private lastReminder = 0;
  // Start of the current stretch of PC use (reset whenever the user was away).
  private inUseSince = Date.now();
  private started = false;

  public start(): void {
    const api = this.nativeService.api;
    if (!api || this.started) {
      return;
    }
    this.started = true;

    api.onNotificationClick((tag) => {
      const tenantId = this.tenantService.tenant()?.uuid;
      if (tenantId && (tag === 'still-working' || tag === 'nothing-tracked')) {
        void this.router.navigate(['/tenants', tenantId, 'tracking']);
      }
    });

    interval(CHECK_MS).subscribe(() => void this.check());
  }

  private async check(): Promise<void> {
    const api = this.nativeService.api;
    if (!api || !this.tenantService.tenant()) {
      return;
    }

    const now = Date.now();
    const idleSeconds = await api.idleSeconds();
    if (idleSeconds >= AWAY_SECONDS) {
      // Away: nothing to remind of, and the next stretch of use starts fresh.
      this.inUseSince = now;
      return;
    }

    const intervalMs = this.userSettingsService.settings().reminderMinutes * 60 * 1000;
    if (now - this.lastReminder < intervalMs) {
      return;
    }

    const session = this.trackingService.session();
    const unchangedSince = Math.max(this.trackingService.lastChange().getTime(), this.inUseSince);

    if (now - unchangedSince < intervalMs) {
      return;
    }

    this.lastReminder = now;
    const minutes = Math.round((now - unchangedSince) / 60000);
    if (session) {
      const info = this.catalogService.catalog().taskInfo.get(session.taskId);
      await api.notify({
        title: this.translateService.instant('reminder.stillWorking.title', { task: info?.task.name ?? '' }),
        body: this.translateService.instant('reminder.stillWorking.body', { minutes, project: info?.project?.name ?? '' }),
        tag: 'still-working',
      });
    } else {
      await api.notify({
        title: this.translateService.instant('reminder.nothingTracked.title'),
        body: this.translateService.instant('reminder.nothingTracked.body', { minutes }),
        tag: 'nothing-tracked',
      });
    }
  }
}
