import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MembershipPermission } from '@api/models';
import { now } from '@helpers/clock';
import { formatClock } from '@helpers/duration';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { CatalogService } from '@services/catalog.service';
import { TenantService } from '@services/tenant.service';
import { TrackingService } from '@services/tracking.service';
import { UserService } from '@services/user.service';
import { colorOf } from '@constants/colors';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { Ripple } from 'primeng/ripple';
import { combineLatest, map, startWith, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [MenubarModule, MenuModule, Ripple, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './header.html',
})
export class Header {
  protected readonly oidcSecurityService = inject(OidcSecurityService);
  protected readonly tenantService = inject(TenantService);
  protected readonly trackingService = inject(TrackingService);
  private readonly catalogService = inject(CatalogService);
  private readonly applicationStateService = inject(ApplicationStateService);
  private readonly translateService = inject(TranslateService);
  private readonly userService = inject(UserService);
  private readonly now = now();

  // The running task, always visible: clicking it leads to the tracking page.
  protected readonly running = computed(() => {
    const session = this.trackingService.session();
    if (!session) {
      return undefined;
    }
    const info = this.catalogService.catalog().taskInfo.get(session.taskId);
    return {
      name: info?.task.name ?? '…',
      color: colorOf(info?.task.color ?? info?.project?.color, !!this.applicationStateService.darkMode()),
      clock: formatClock(this.now().getTime() - session.start.getTime()),
    };
  });

  private readonly language$ = this.translateService.onLangChange.pipe(startWith(undefined));

  public items = toSignal(
    combineLatest([this.tenantService.tenant$, this.userService.membership$, this.language$]).pipe(
      map(([tenant, membership]): MenuItem[] => {
        if (!tenant || !membership) {
          return [];
        }
        const t = (key: string): string => this.translateService.instant(key);
        const items: MenuItem[] = [
          { label: t('simple.tracking'), icon: 'fas fa-stopwatch', routerLink: 'tracking' },
          { label: t('simple.dashboard'), icon: 'fas fa-chart-column', routerLink: 'dashboard' },
          { label: t('simple.entries'), icon: 'fas fa-list', routerLink: 'entries' },
        ];
        if (this.userService.hasPermission(membership, MembershipPermission.ManageCatalog)) {
          items.push({
            label: t('simple.catalog'),
            icon: 'fas fa-folder-tree',
            items: [
              { label: t('simple.clients'), icon: 'fas fa-building', routerLink: 'clients' },
              { label: t('simple.projects'), icon: 'fas fa-diagram-project', routerLink: 'projects' },
              { label: t('simple.tasks'), icon: 'fas fa-list-check', routerLink: 'tasks' },
            ],
          });
        }
        return items;
      }),
    ),
  );

  public tenantMenuModel = toSignal(
    combineLatest([this.tenantService.tenant$, this.userService.membership$, this.language$]).pipe(
      map(([tenant, membership]) => {
        if (!tenant || !membership) {
          return [];
        }

        const menuItems: MenuItem[] = [];

        if (this.userService.hasPermission(membership, MembershipPermission.ManageMemberships)) {
          menuItems.push({ label: this.translateService.instant('simple.memberships'), icon: 'fas fa-user', routerLink: 'memberships' });
        }
        if (this.userService.hasPermission(membership, MembershipPermission.ManageTenant)) {
          menuItems.push({ label: this.translateService.instant('simple.settings'), icon: 'fas fa-cog', routerLink: 'settings' });
        }
        if (menuItems.length > 0) {
          menuItems.push({ separator: true });
        }

        return [...menuItems, { label: this.translateService.instant('simple.tenants'), icon: 'fas fa-house', routerLink: '/start', queryParams: { stay: true } }];
      }),
    ),
  );

  public userMenuModel = toSignal(
    combineLatest([this.tenantService.tenant$, this.language$]).pipe(
      map(([tenant]): MenuItem[] => [
        ...(tenant ? [{ label: this.translateService.instant('simple.preferences'), icon: 'fas fa-sliders', routerLink: ['/tenants', tenant.uuid, 'preferences'] }] : []),
        { label: this.translateService.instant('simple.toggleLanguage'), icon: 'fas fa-language', command: (): void => this.applicationStateService.toggleLanguage() },
        { label: this.translateService.instant('simple.toggleTheme'), icon: 'fas fa-brush', command: (): void => this.applicationStateService.toggleTheme() },
        { label: this.translateService.instant('simple.toggleHelp'), icon: 'fas fa-question', command: (): void => this.applicationStateService.toggleHelp() },
        { label: this.translateService.instant('simple.logout'), icon: 'fas fa-sign-out-alt', command: (): Subscription => this.oidcSecurityService.logoff().subscribe() },
      ]),
    ),
  );
}
