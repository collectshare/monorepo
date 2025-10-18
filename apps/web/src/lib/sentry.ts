import * as Sentry from '@sentry/react';

Sentry.init({
  enabled: import.meta.env.PROD,
  dsn: import.meta.env.VITE_APP_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: [/^https:\/\/dev-api\.collectshare\.com\.br/],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});
