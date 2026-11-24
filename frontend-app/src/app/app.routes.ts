import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, ResolveFn, Router, Routes } from '@angular/router';
import { TenantEntity } from '@api/models';
import { ClientsPage } from '@pages/clients/clients.page';
import { DashboardPage } from '@pages/dashboard/dashboard.page';
import { EntriesPage } from '@pages/entries/entries.page';
import { MembershipsPage } from '@pages/memberships/memberships.page';
import { PreferencesPage } from '@pages/preferences/preferences.page';
import { ProjectsPage } from '@pages/projects/projects.page';
import { SettingsPage } from '@pages/settings/settings.page';
import { TasksPage } from '@pages/tasks/tasks.page';
import { TenantsPage } from '@pages/tenants/tenants.page';
import { TrackingPage } from '@pages/tracking/tracking.page';
import { ApplicationStateService } from '@services/application-state.service';
import { TenantService } from '@services/tenant.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { catchError, filter, map, Observable, of } from 'rxjs';
import { Shell } from './shells/shell/shell';

function param(route: ActivatedRouteSnapshot, key: string): string {
  return route.paramMap.get(key) ?? '';
}

const authenticatedGuard: CanActivateFn = (): Observable<boolean> => {
  const oidcSecurityService = inject(OidcSecurityService);
  const router = inject(Router);
  return oidcSecurityService.checkAuth().pipe(
    catchError(() => of({ isAuthenticated: false })),
    map(({ isAuthenticated }) => {
      if (!isAuthenticated) {
        sessionStorage.setItem('postLoginRedirect', window.location.pathname);
        oidcSecurityService.authorize();
        return false;
      }
      const postLoginRedirect = sessionStorage.getItem('postLoginRedirect');
      if (postLoginRedirect) {
        sessionStorage.removeItem('postLoginRedirect');
        void router.navigateByUrl(postLoginRedirect);
      }
      return true;
    }),
  );
};

const tenantGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const tenantService = inject(TenantService);
  const applicationStateService = inject(ApplicationStateService);
  const tenantId = param(route, 'tenantId');
  tenantService.setTenantId(tenantId);
  return tenantService.saveTenant$.pipe(
    filter((tenant) => tenant.uuid === tenantId),
    map(() => {
      applicationStateService.formElement.patchValue({ previousTenantId: tenantId });
      return true;
    }),
    catchError(() => of(router.createUrlTree(['/start']))),
  );
};

const resetTenantGuard: CanActivateFn = (): boolean => {
  inject(TenantService).resetTenantId();
  return true;
};

const tenant: ResolveFn<TenantEntity> = () => inject(TenantService).saveTenant$;

export const routes: Routes = [
  {
    path: 'tenants/:tenantId',
    component: Shell,
    canActivate: [authenticatedGuard, tenantGuard],
    children: [
      { path: 'tracking', component: TrackingPage, title: 'simple.tracking' },
      { path: 'dashboard', component: DashboardPage, title: 'simple.dashboard' },
      { path: 'entries', component: EntriesPage, title: 'simple.entries' },
      { path: 'clients', component: ClientsPage, title: 'simple.clients' },
      { path: 'projects', component: ProjectsPage, title: 'simple.projects' },
      { path: 'tasks', component: TasksPage, title: 'simple.tasks' },
      { path: 'memberships', component: MembershipsPage, title: 'simple.memberships' },
      { path: 'settings', component: SettingsPage, resolve: { entity: tenant }, title: 'simple.settings' },
      { path: 'preferences', component: PreferencesPage, title: 'simple.preferences' },
      { path: '**', redirectTo: 'tracking' },
    ],
  },
  {
    path: '',
    component: Shell,
    canActivate: [authenticatedGuard, resetTenantGuard],
    children: [
      { path: 'start', component: TenantsPage, title: 'simple.tenants' },
      { path: '**', redirectTo: 'start' },
    ],
  },
  { path: '**', redirectTo: '' },
];
