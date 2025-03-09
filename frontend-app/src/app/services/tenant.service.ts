import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, of, switchMap } from 'rxjs';
import { TenantHttpService } from '../api/backend-core/services';
import { shareReplayOne } from '../helpers/util';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  public static tenantId: string = undefined as any;

  public tenantId$ = new BehaviorSubject<string>(undefined as any);

  public tenant$ = this.tenantId$.pipe(
    switchMap((tenantId) => (tenantId ? this.tenantHttpService.read({ tenantId }) : of(undefined))),
    catchError(() => of(undefined)),
    shareReplayOne(),
  );

  public saveTenant$ = this.tenant$.pipe(
    filter((tenant) => !!tenant),
    shareReplayOne(),
  );

  public constructor(private tenantHttpService: TenantHttpService) {}

  public setTenantId(tenantId: string | undefined): void {
    if (tenantId) {
      TenantService.tenantId = tenantId;
    }
    this.tenantId$.next(tenantId as any);
  }
}
