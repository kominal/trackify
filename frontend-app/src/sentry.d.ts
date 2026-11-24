// Build-time constants for the usage statistics (Kominal Sentry, see main.ts). They live in a .d.ts
// file so that every compilation sees them.

/** Public write-only key of the organisation in Sentry. Empty unless the build sets it (CI does, with --define). */
declare const SENTRY_KEY: string;
/** Stage the build is for (`production`); reported as the environment. Empty unless the build sets it. */
declare const SENTRY_ENVIRONMENT: string;
