# trackify

Kominal Trackify: time tracking at **trackify.kominal.cloud**, plus a Windows desktop app that starts with Windows, reminds you to track and records which window is in focus, so tracked time can be compared with actual PC use.

Multi-app repo: NestJS backend (`backend-core/`), Angular web app (`frontend-app/`) and Electron desktop app (`desktop-app/`). Part of the `kominal/workspace` root; see the root [`CLAUDE.md`](../../CLAUDE.md) for shared tooling conventions.

The architecture follows `sentry`, which follows `flow`:

- `@kominal/common-nestjs` bootstrap;
- path-based multi-tenancy (`tenants/:tenantId/...`, called "Organisation" in the UI);
- Keycloak OIDC against the shared `kominal` realm, with the config served at `GET /frontend/configuration`;
- a generated Angular client via `ng-openapi-gen` (`frontend-app/src/app/api/backend-core`, ignored by lint);
- PrimeNG 22 + Tailwind 4, ngx-translate (German as fallback, English).

## Domain

- **Catalog.** `ClientEntity` → `ProjectEntity` → `TaskEntity`, maintained by members with `MANAGE_CATALOG`. Every member can track time.
  - Colours are palette keys (`Color` enum). The frontend maps them to fixed light/dark values in `constants/colors.ts`; never store hex values or CSS class names.
  - Tasks with tracked time cannot be deleted (409 `exception.inUse`); archive them instead.
- **Own data only.** `TimeEntryEntity` and `TrackingSessionEntity` always belong to one user. The userId comes from the token and is part of every query, so members never see each other's time.
- **`TrackingService` rules** (covered by specs):
  - At most one running session per user and tenant.
  - Starting a task stops the running one and stores it as a time entry, rounded to whole minutes.
  - Sessions under 5 minutes are dropped.
  - Returning to the same task within 5 minutes continues its last entry.
- **`ActivityEntity`.** Window activity (app, title, idle) reported by the desktop app.
  - It belongs to the user, not to a tenant, and is only readable by that user (`/me/activities`).
  - A TTL index deletes it after 180 days.
  - Consecutive segments of the same window are merged on upload.
- **`DashboardService`.** Computes everything the dashboard shows for the signed-in user, in the requested time zone:
  - totals, per day, per project/task, per app;
  - coverage (active PC time ∩ tracked time);
  - untracked gaps of at least 5 minutes.
  - `helpers/interval.helper.ts` and `helpers/time-zone.helper.ts` hold the interval and local-midnight math.
- **Permissions (`MembershipPermission`).** `MANAGE_TENANT`, `MANAGE_MEMBERSHIPS`, `MANAGE_CATALOG`, enforced by `@Permissions(...)` in `TenantGuard`. Admins are the Keycloak client role `administrator`.

## Desktop app (`desktop-app/`)

- **UI.** Electron loads the hosted web app (`https://trackify.kominal.cloud`), so login, UI and updates of the UI come from the normal deployment.
- **Main process** (`src/main.ts`):
  - tray and single instance;
  - autostart via `setLoginItemSettings`;
  - global shortcuts Ctrl+Alt+Up/Down;
  - native notifications;
  - electron-updater against GitHub Releases;
  - window sampling (`get-windows` every 5 s, idle from `powerMonitor`) into a queue on disk.
- **Upload.** The main process never holds a token: the web app drains the queue through the preload bridge (`window.trackifyNative`, typed in `frontend-app/src/app/models/native.model.ts`) and uploads it.
- **Desktop-only services.** `NativeService`, `ReminderService` and `ActivitySyncService` in the frontend do nothing in a plain browser.
- **Releases.** `.github/workflows/desktop-app.yml` builds the NSIS installer on Windows and publishes a GitHub Release when `desktop-app/package.json`'s version is new. Bump the version to release.

## Commands

- Lint/format from this directory: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`. These only work inside the `workspace` wrapper.
- Install: `npm install` (root), then `npm run install:all`.
- Backend tests: `npm --prefix backend-core test` (in-memory MongoDB via `mongodb-memory-server`).
- Regenerate the frontend API client after backend API changes: `npm --prefix backend-core run generate-swagger`.
- Frontend dev: `npm --prefix frontend-app run start:local` (proxies `/api/core` to `localhost:3000`). Agents use `start:local:agent` (port 4300).
- Desktop: `npm --prefix desktop-app run start` (Windows; `TRACKIFY_URL=http://localhost:4200` points it at a dev server), `npm --prefix desktop-app run dist`.

## Deployment

- **Stage.** Single stage: branch `production` → `trackify.kominal.cloud` (stack `trackify_production`), built against workspace `production`. Pushing `production` deploys.
- **Secrets.** GitHub environment `production` holds `OIDC_AUTHORITY` (`https://auth.kominal.com/realms/kominal`), `OIDC_CLIENT_ID` (`trackify_production`), `MONGODB_CONNECTION_STRING`, `MAIL_CONNECTION_STRING` and `DEPLOY_TOKEN`. The repo needs `WORKSPACE_READ_TOKEN`.
- **Keycloak client `trackify_production`** (realm `kominal`, created by hand):
  - public client, standard flow, PKCE S256;
  - redirect URI `https://trackify.kominal.cloud/*`, web origin `https://trackify.kominal.cloud`;
  - an audience mapper so the access token's `aud` is `trackify_production`;
  - client role `administrator`.
