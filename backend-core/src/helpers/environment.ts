// Provided by the shared workspace library; re-exported so `@helpers/environment` imports work like in flow.
export { getOidcClientId } from '@kominal/common-nestjs';

// Trackify authenticates against the shared Kominal realm, like flow. Deployments set OIDC_AUTHORITY
// explicitly; this fallback is for local development.
export function getOidcAuthority(): string {
  return process.env.OIDC_AUTHORITY || 'https://auth.kominal.com/realms/kominal';
}

export type TenantCreation = 'USER' | 'ADMIN';

// Who may create organisations: every signed-in user (like flow, the default) or only global
// administrators (Keycloak client role `administrator`).
export function getTenantCreation(): TenantCreation {
  return process.env.TENANT_CREATION === 'ADMIN' ? 'ADMIN' : 'USER';
}

export function getBaseUrl(): string {
  return process.env.BASE_URL || 'localhost:4200';
}
