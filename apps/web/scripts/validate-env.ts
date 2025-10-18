import z from 'zod';

const schema = z.object({
  VITE_API_URL: z.string().min(1),
  VITE_APP_CLARITY_ID: z.string().min(1),
  VITE_APP_SENTRY_DSN: z.string().min(1),
  SENTRY_AUTH_TOKEN: z.string().min(1),
  SENTRY_ORG: z.string().min(1),
  SENTRY_PROJECT: z.string().min(1),
});

schema.parse(process.env);
