import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, Routes, UrlTree } from '@angular/router';
import { authGuardFn } from '@auth0/auth0-angular';
import { catchError, map, Observable, of } from 'rxjs';
import { ClientsComponent } from './pages/clients/clients.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ErrorComponent } from './pages/error/error.component';
import { HomeComponent } from './pages/home/home.component';
import { MembersComponent } from './pages/members/members.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { TenantService } from './services/tenant.service';
import { ShellComponent } from './shell/shell.component';

const tenantGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  inject(TenantService).setTenantId(route.params['tenantId']);
  const router = inject(Router);
  return inject(TenantService).saveTenant$.pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/']))),
  );
};

export const routes: Routes = [
  {
    path: 'home',
    component: ShellComponent,
    canActivate: [authGuardFn],
    resolve: { tenantId: (): void => inject(TenantService).setTenantId(undefined) },
    children: [{ path: '', component: HomeComponent }],
  },
  {
    path: ':tenantId',
    component: ShellComponent,
    canActivate: [authGuardFn, tenantGuard],
    resolve: { tenantId: (route: ActivatedRouteSnapshot): void => inject(TenantService).setTenantId(route.params['tenantId']) },
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'members', component: MembersComponent },
      { path: 'projects', component: ProjectsComponent },
      { path: 'tasks', component: TasksComponent },
      { path: '**', redirectTo: 'dashboard/assets' },
    ],
  },
  { path: 'error', component: ErrorComponent, resolve: { tenantId: (): void => inject(TenantService).setTenantId(undefined) } },
  { path: '**', redirectTo: 'home' },
];
