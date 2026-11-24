import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TenantHttpService } from '@api/services';
import { shareReplayOne } from '@helpers/util';
import { BehaviorSubject, catchError, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly tenantHttpService = inject(TenantHttpService);

  private readonly tenantIdSubject$ = new BehaviorSubject<string | undefined>(undefined);
  public readonly tenantId$ = this.tenantIdSubject$.asObservable();

  private readonly reloadTenant$ = new BehaviorSubject<void>(undefined);

  public saveTenantId$ = this.tenantId$.pipe(
    filter((tenantId): tenantId is string => !!tenantId),
    distinctUntilChanged(),
    shareReplayOne(),
  );

  public tenant$ = this.tenantId$.pipe(
    distinctUntilChanged(),
    switchMap((tenantId) => this.reloadTenant$.pipe(map(() => tenantId))),
    switchMap((tenantId) => (tenantId ? this.tenantHttpService.read({ tenantId }) : of(undefined))),
    catchError(() => of(undefined)),
    shareReplayOne(),
  );

  public tenant = toSignal(this.tenant$);

  public saveTenant$ = this.tenant$.pipe(
    filter((tenant) => !!tenant),
    shareReplayOne(),
  );

  public constructor() {
    this.tenant$.subscribe();
  }

  public setTenantId(tenantId: string): void {
    this.tenantIdSubject$.next(tenantId);
  }

  public refreshTenantId(): void {
    this.reloadTenant$.next();
  }

  public resetTenantId(): void {
    this.tenantIdSubject$.next(undefined);
  }
}
