import { bootstrapApplication } from '@angular/platform-browser';
import { loadSentry } from '@kominal/common-angular/sentry';
import { FrontendConfiguration } from './app/api/backend-core/models';
import { AppComponent } from './app/app.component';
import { getAppConfig } from './app/app.config';

const baseUrl = window.location.origin;

function showBootstrapError(): void {
  const root = document.querySelector('app-root');
  if (!root) {
    return;
  }
  // The app shell is otherwise blank until Angular boots; show a recoverable message instead of a white screen.
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;gap:16px;text-align:center;padding:24px;">
      <h1 style="font-size:1.25rem;margin:0;">We couldn't load the application</h1>
      <p style="margin:0;color:#666;max-width:420px;">This is usually a temporary connection problem. Please check your connection and try again.</p>
      <button onclick="window.location.reload()" style="padding:8px 20px;border:none;border-radius:6px;background:#1c5cab;color:#fff;font-size:1rem;cursor:pointer;">Retry</button>
    </div>`;
}

fetch(`${baseUrl}/api/core/frontend/configuration`)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Configuration request failed: ${response.status}`);
    }
    return response.json() as Promise<FrontendConfiguration>;
  })
  .then((frontendConfiguration) => {
    // Usage statistics of this app go to Kominal Sentry (organisation Kominal): page views only,
    // because labels here can be names of projects. Local builds carry no key and report nothing.
    loadSentry({ key: SENTRY_KEY, environment: SENTRY_ENVIRONMENT, project: 'trackify', service: 'frontend-app', pageViewsOnly: true, internalHosts: [frontendConfiguration.oidc.authority] });
    return bootstrapApplication(AppComponent, getAppConfig(baseUrl, frontendConfiguration));
  })
  .catch((err: unknown) => {
    console.error(err);
    showBootstrapError();
  });
