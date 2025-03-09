import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import { HttpClient, HttpContextToken, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { ApplicationConfig, DEFAULT_CURRENCY_CODE, importProvidersFrom, inject, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { authHttpInterceptorFn, provideAuth0 } from '@auth0/auth0-angular';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import Aura from '@primeng/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { DialogService } from 'primeng/dynamicdialog';
import { finalize, map } from 'rxjs';
import { v4 } from 'uuid';
import { ApiModule } from './api/backend-core/api.module';
import { routes } from './app.routes';
import { LayoutService } from './services/layout.service';

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

export const BLOCKING = new HttpContextToken(() => true);

const loadingInterceptorFn: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const layoutService = inject(LayoutService);

  if (req.context.get(BLOCKING)) {
    const requestId = `HTTP-${v4()}`;
    layoutService.startLoading(requestId);
    return next(req).pipe(finalize(() => layoutService.stopLoading(requestId)));
  }

  return next(req);
};

const BASE_URL = window.location.host === 'localhost:4200' ? 'app.trackify.kominal.cloud' : window.location.host;

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(ApiModule.forRoot({ rootUrl: `https://${BASE_URL}/api/core` })),
    provideHttpClient(withInterceptors([loadingInterceptorFn, authHttpInterceptorFn, dateInterceptorFn])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
        },
      },
    }),
    provideAuth0({
      domain: 'kominal.eu.auth0.com',
      clientId: '2keyZpo1IPv08F3nzmpoyCow10NUmaBh',
      authorizationParams: {
        redirect_uri: window.location.origin,
        scope: 'openid profile email',
        audience: 'trackify/api',
      },
      errorPath: '/error',
      httpInterceptor: {
        allowedList: [{ uri: `https://${BASE_URL}/api/core/*` }],
      },
    }),
    provideTranslateService({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './i18n/', '.json'),
        deps: [HttpClient],
      },
    }),
    ConfirmationService,
    MessageService,
    DialogService,
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
    { provide: LOCALE_ID, useValue: 'de-DE' },
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { locale: 'de-DE', dateFormat: 'dd.MM.yyyy HH:mm' } },
  ],
};
