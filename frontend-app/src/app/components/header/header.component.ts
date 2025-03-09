import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { TenantService } from '../../services/tenant.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe, MenubarModule, MenuModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  public authService = inject(AuthService);
  public tenantService = inject(TenantService);
  private translateService = inject(TranslateService);

  public items$ = combineLatest([this.tenantService.tenant$, this.translateService.onLangChange.pipe(startWith(undefined))]).pipe(
    map(([tenant]): MenuItem[] => {
      if (!tenant) {
        return [];
      }

      return [
        {
          label: this.translateService.instant('simple.dashboard'),
          items: [
            { label: this.translateService.instant('simple.assets'), routerLink: 'dashboard/assets' },
            { label: this.translateService.instant('simple.analysis'), routerLink: 'dashboard/analysis' },
          ],
        },
        { label: this.translateService.instant('simple.assets'), routerLink: 'assets' },
        { label: this.translateService.instant('simple.learningHub'), routerLink: 'learning-hub' },
        { label: this.translateService.instant('simple.connectivityHub'), routerLink: 'connectivity-hub' },
        { label: this.translateService.instant('simple.wiki'), routerLink: 'wiki' },
      ];
    }),
  );

  public tenantMenuModel$: Observable<MenuItem[]> = this.translateService.onLangChange.pipe(
    startWith(undefined),
    map(() => [
      { label: this.translateService.instant('simple.home'), routerLink: '/', queryParams: { preventRedirect: true } },
      { label: this.translateService.instant('simple.settings'), routerLink: 'settings' },
      { label: this.translateService.instant('simple.access-tokens'), routerLink: 'access-tokens' },
      { label: this.translateService.instant('simple.members'), routerLink: 'members' },
    ]),
  );

  public userMenuModel$: Observable<MenuItem[]> = this.translateService.onLangChange.pipe(
    startWith(undefined),
    map(() => [
      {
        label: this.translateService.instant('simple.toggleLanguage'),
        command: (): void => {
          const newLang = this.translateService.currentLang === 'de' ? 'en' : 'de';
          localStorage.setItem('lang', newLang);
          this.translateService.use(newLang);
        },
      },
      { label: this.translateService.instant('simple.profile'), routerLink: 'profile' },
      { label: this.translateService.instant('simple.logout'), command: (): Observable<void> => this.authService.logout() },
    ]),
  );
}
