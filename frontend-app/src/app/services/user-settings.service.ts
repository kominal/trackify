import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserSettings } from '@api/models';
import { MeHttpService } from '@api/services';
import { background, shareReplayOne } from '@helpers/util';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap } from 'rxjs';

export const DEFAULT_SETTINGS: UserSettings = { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin', reminderMinutes: 30 };

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly meHttpService = inject(MeHttpService);
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  public readonly settings$ = this.reload$.pipe(
    switchMap(() => this.meHttpService.readSettings(background()).pipe(catchError(() => of(DEFAULT_SETTINGS)))),
    shareReplayOne(),
  );

  public readonly settings = toSignal(this.settings$, { initialValue: DEFAULT_SETTINGS });

  public update(settings: UserSettings): Observable<void> {
    return this.meHttpService.updateSettings({ body: settings }).pipe(tap(() => this.reload$.next()));
  }
}
