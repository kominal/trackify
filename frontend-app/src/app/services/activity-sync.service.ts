import { inject, Injectable } from '@angular/core';
import { MeHttpService } from '@api/services';
import { background } from '@helpers/util';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom, interval, startWith } from 'rxjs';
import { NativeService } from './native.service';

const UPLOAD_MS = 60 * 1000;
const BATCH_SIZE = 1000;

// Desktop app only: uploads the window activity the main process recorded. The main process never
// sees a token; it only queues segments, this service sends them with the user's session.
@Injectable({ providedIn: 'root' })
export class ActivitySyncService {
  private readonly nativeService = inject(NativeService);
  private readonly meHttpService = inject(MeHttpService);
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private started = false;
  private running = false;

  public start(): void {
    if (!this.nativeService.api || this.started) {
      return;
    }
    this.started = true;
    interval(UPLOAD_MS)
      .pipe(startWith(0))
      .subscribe(() => void this.upload());
  }

  private async upload(): Promise<void> {
    const api = this.nativeService.api;
    if (!api || this.running || !(await firstValueFrom(this.oidcSecurityService.isAuthenticated$)).isAuthenticated) {
      return;
    }
    this.running = true;
    const segments = await api.drainActivity();
    let sent = 0;
    try {
      while (sent < segments.length) {
        const batch = segments.slice(sent, sent + BATCH_SIZE);
        await firstValueFrom(this.meHttpService.uploadActivities({ body: { segments: batch.map((segment) => ({ ...segment, start: new Date(segment.start), end: new Date(segment.end) })) } }, background()));
        sent += batch.length;
      }
    } catch {
      // Offline or signed out: keep everything that was not sent for the next attempt.
      await api.restoreActivity(segments.slice(sent));
    } finally {
      this.running = false;
    }
  }
}
