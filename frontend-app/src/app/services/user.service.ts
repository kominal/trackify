import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MembershipEntity, MembershipPermission } from '@api/models';
import { MembershipHttpService } from '@api/services';
import { shareReplayOne } from '@helpers/util';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private tenantService = inject(TenantService);
  private membershipHttpService = inject(MembershipHttpService);
  private oidcSecurityService = inject(OidcSecurityService);

  public membership$ = this.tenantService.tenantId$.pipe(
    switchMap((tenantId) => (tenantId ? this.membershipHttpService.readCurrentMembership({ tenantId }) : of(undefined))),
    catchError(() => of(undefined)),
    shareReplayOne(),
  );

  public saveMembership$ = this.membership$.pipe(
    filter((membership) => !!membership),
    shareReplayOne(),
  );

  public membership = toSignal(this.membership$);

  public permissions$ = this.saveMembership$.pipe(
    map((membership) => membership?.permissions || []),
    shareReplayOne(),
  );

  public userId$ = this.oidcSecurityService.userData$.pipe(
    map((userData) => (userData?.userData?.sub as string | undefined) ?? undefined),
    shareReplayOne(),
  );

  public userId = toSignal(this.userId$);

  // Global administrator = Keycloak `administrator` client role (matches `userContext.admin` in the backend).
  public isAdmin = toSignal(this.oidcSecurityService.getPayloadFromAccessToken().pipe(map((payload) => !!payload?.resource_access?.[payload?.azp]?.roles?.includes('administrator'))));

  public hasPermission$(...permission: MembershipPermission[]): Observable<boolean> {
    return this.permissions$.pipe(map((permissions) => permissions.some((p) => permission.includes(p))));
  }

  public hasPermission(membership: MembershipEntity, ...permission: MembershipPermission[]): boolean {
    return (membership.permissions || []).some((p) => permission.includes(p));
  }

  public constructor() {
    this.membership$.subscribe();
  }
}
