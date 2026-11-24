import { DATE_PIPE_DEFAULT_OPTIONS, DatePipe, registerLocaleData } from '@angular/common';
import { HttpContextToken, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { ApplicationConfig, DEFAULT_CURRENCY_CODE, importProvidersFrom, inject, InjectionToken, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy, Params, provideRouter, RouteReuseStrategy, TitleStrategy, withRouterConfig } from '@angular/router';
import { TranslateTitleStrategy } from '@helpers/title.strategy';
import { PRIMENG_LICENSE } from '@kominal/common-angular/license';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { definePreset, palette } from '@primeuix/themes';
import Preset from '@primeuix/themes/material';
import { LayoutService } from '@services/layout.service';
import { AbstractSecurityStorage, authInterceptor, AuthModule, DefaultLocalStorageService } from 'angular-auth-oidc-client';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { DialogService } from 'primeng/dynamicdialog';
import { finalize, map } from 'rxjs';
import { v4 } from 'uuid';
import { ApiModule } from './api/backend-core/api.module';
import { FrontendConfiguration } from './api/backend-core/models';
import { routes } from './app.routes';

registerLocaleData(localeDe, 'de-DE', localeDeExtra);

function parseDates(body: unknown): any {
  if (typeof body !== 'object') return body;
  const dateStringRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:.\d+)?(?:Z|(\+|-)([\d|:]*))?$/;
  return JSON.parse(JSON.stringify(body), (_, value) => (typeof value === 'string' && dateStringRegex.test(value) ? new Date(value) : value));
}

const dateInterceptorFn: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) =>
  next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body && typeof event.body === 'object' && event.headers.get('content-type')?.includes('application/json')) {
        return event.clone({ body: parseDates(event.body) });
      }
      return event;
    }),
  );

function sameParams(a: Params, b: Params): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return aKeys.length === bKeys.length && aKeys.every((key) => a[key] === b[key]);
}

export const BLOCKING = new HttpContextToken(() => true);

const loadingInterceptorFn: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const layoutService = inject(LayoutService);

  if (req.context.get(BLOCKING) && !req.url.includes('/openid-connect/')) {
    const requestId = `HTTP-${v4()}`;
    layoutService.startLoading(requestId);
    return next(req).pipe(finalize(() => layoutService.stopLoading(requestId)));
  }

  return next(req);
};

export const BASE_URL = new InjectionToken<string>('BASE_URL');
export const FRONTEND_CONFIGURATION = new InjectionToken<FrontendConfiguration>('FRONTEND_CONFIGURATION');
export function getAppConfig(baseUrl: string, frontendConfiguration: FrontendConfiguration): ApplicationConfig {
  const { oidc } = frontendConfiguration;
  const apiBaseUrl = `${baseUrl}/api`;
  return {
    providers: [
      { provide: BASE_URL, useValue: baseUrl },
      { provide: FRONTEND_CONFIGURATION, useValue: frontendConfiguration },
      importProvidersFrom(ApiModule.forRoot({ rootUrl: `${apiBaseUrl}/core` })),
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
      provideHttpClient(withXhr(), withInterceptors([loadingInterceptorFn, authInterceptor(), dateInterceptorFn])),
      providePrimeNG({
        license: PRIMENG_LICENSE,
        ripple: true,
        theme: {
          preset: definePreset(Preset, {
            semantic: { primary: palette('#4f46e5') },
          }),
          options: { darkModeSelector: '.dark' },
        },
      }),
      { provide: AbstractSecurityStorage, useClass: DefaultLocalStorageService },
      importProvidersFrom(
        AuthModule.forRoot({
          config: {
            ...oidc,
            renewTimeBeforeTokenExpiresInSeconds: 60,
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            scope: 'openid profile email',
            responseType: 'code',
            silentRenew: true,
            useRefreshToken: true,
            autoUserInfo: true,
            secureRoutes: [apiBaseUrl],
          },
        }),
      ),
      MessageService,
      ConfirmationService,
      DialogService,
      DatePipe,
      { provide: TitleStrategy, useClass: TranslateTitleStrategy },
      { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
      { provide: LOCALE_ID, useValue: 'de-DE' },
      { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { locale: 'de-DE', dateFormat: 'dd.MM.yyyy HH:mm' } },
      provideTranslateService({ fallbackLang: 'de', loader: provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }) }),
      {
        provide: RouteReuseStrategy,
        useClass: class extends BaseRouteReuseStrategy {
          public override shouldReuseRoute = (future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean => future.routeConfig === curr.routeConfig && (future.routeConfig?.data?.['reuse'] === true || sameParams(future.params, curr.params));
        },
      },
    ],
  };
}
