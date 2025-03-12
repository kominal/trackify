import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { TenantService } from '../../services/tenant.service';
import { TrackerComponent } from '../tracker/tracker.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe, MenubarModule, MenuModule, TrackerComponent],
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
        { label: this.translateService.instant('simple.dashboard'), routerLink: 'dashboard' },
        { label: this.translateService.instant('simple.records'), routerLink: 'records' },
        { label: this.translateService.instant('simple.tasks'), routerLink: 'tasks' },
        { label: this.translateService.instant('simple.projects'), routerLink: 'projects' },
        { label: this.translateService.instant('simple.clients'), routerLink: 'clients' },
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
