import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { TrackingSessionEntity } from '@api/models';
import { TrackingHttpService } from '@api/services';
import { background } from '@helpers/util';
import { catchError, EMPTY, fromEvent, interval, merge, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { CatalogService } from './catalog.service';
import { NativeService } from './native.service';
import { TenantService } from './tenant.service';
import { UtilService } from './util.service';

// Polling keeps two windows (the desktop app and a browser tab) in step.
const POLL_MS = 30 * 1000;

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly trackingHttpService = inject(TrackingHttpService);
  private readonly tenantService = inject(TenantService);
  private readonly catalogService = inject(CatalogService);
  private readonly nativeService = inject(NativeService);
  private readonly utilService = inject(UtilService);

  private readonly refresh$ = new Subject<void>();
  private tenantId: string | undefined;

  public readonly session = signal<TrackingSessionEntity | undefined>(undefined);
  // When the tracked task last changed (or tracking stopped); drives the reminders.
  public readonly lastChange = signal(new Date());
  // Increments on every start/stop, so pages showing time entries can reload.
  public readonly changes = signal(0);

  public constructor() {
    this.tenantService.tenantId$
      .pipe(
        tap((tenantId) => {
          this.tenantId = tenantId;
          this.session.set(undefined);
        }),
        switchMap((tenantId) => (tenantId ? merge(interval(POLL_MS), fromEvent(window, 'focus'), this.refresh$).pipe(startWith(undefined)) : EMPTY)),
        switchMap(() => this.load()),
      )
      .subscribe((session) => this.applySession(session ?? undefined));

    toObservable(this.session).subscribe(() => this.updateTray());
    toObservable(this.catalogService.catalog).subscribe(() => this.updateTray());

    this.nativeService.api?.onTrayStop(() => this.stop());
    this.nativeService.api?.onShortcut((shortcut) => this.cycle(shortcut === 'next-task' ? 1 : -1));
  }

  public start(taskId: string): void {
    if (!this.tenantId || this.session()?.taskId === taskId) {
      return;
    }
    this.trackingHttpService
      .start({ tenantId: this.tenantId, body: { taskId } }, background())
      .pipe(this.utilService.handleError())
      .subscribe((session) => this.applySession(session, true));
  }

  public stop(): void {
    if (!this.tenantId || !this.session()) {
      return;
    }
    this.trackingHttpService
      .stop({ tenantId: this.tenantId }, background())
      .pipe(this.utilService.handleError())
      .subscribe(() => this.applySession(undefined, true));
  }

  public refresh(): void {
    this.refresh$.next();
  }

  // Ctrl+Alt+Up/Down in the desktop app: previous/next task in the order of the tracking page.
  private cycle(direction: 1 | -1): void {
    const tasks = this.catalogService.catalog().taskInfos.filter(({ task, project }) => !task.archived && !project?.archived);
    if (tasks.length === 0) {
      return;
    }
    const index = tasks.findIndex(({ task }) => task.uuid === this.session()?.taskId);
    const next = index === -1 ? (direction === 1 ? 0 : tasks.length - 1) : (index + direction + tasks.length) % tasks.length;
    const info = tasks[next];
    this.start(info.task.uuid);
    void this.nativeService.api?.notify({ title: info.task.name, body: info.project?.name ?? '', tag: 'switched' });
  }

  private load(): Observable<TrackingSessionEntity | null> {
    if (!this.tenantId) {
      return of(null);
    }
    return this.trackingHttpService.read({ tenantId: this.tenantId }, background()).pipe(catchError(() => EMPTY));
  }

  private applySession(session: TrackingSessionEntity | undefined, local = false): void {
    const previous = this.session();
    // A session read back from the server may have started earlier than locally known (resumed entry).
    if (previous?.taskId !== session?.taskId || previous?.start?.getTime() !== session?.start?.getTime()) {
      this.session.set(session ?? undefined);
      if (local || previous?.taskId !== session?.taskId) {
        this.lastChange.set(new Date());
        this.changes.update((value) => value + 1);
      }
    }
  }

  private updateTray(): void {
    const session = this.session();
    const info = session ? this.catalogService.catalog().taskInfo.get(session.taskId) : undefined;
    this.nativeService.api?.setTrackingState({ taskName: info?.task.name, projectName: info?.project?.name, since: session?.start.toISOString() });
  }
}
