import { z } from 'zod';

const schema = z.object({
  // Cognito
  COGNITO_CLIENT_ID: z.string().min(1),
  COGNITO_CLIENT_SECRET: z.string().min(1),
  COGNITO_POOL_ID: z.string().min(1),

  // Database
  MAIN_TABLE_NAME: z.string().min(1),

  // Buckets
  MAIN_BUCKET: z.string().min(1),

  // Algolia
  ALGOLIA_APP_ID: z.string().min(1),
  ALGOLIA_ADMIN_API_KEY: z.string().min(1),
  ALGOLIA_INDEX_NAME: z.string().min(1),
  ALGOLIA_TRENDING_INDEX_NAME: z.string().optional(),

  // Secrets
  MASTER_SECRET: z.string().min(1),
  EXPORT_SECRET: z.string().min(1),

  // Gemini
  GEMINI_API_KEY: z.string().min(1),

  // TypeSafe Jev (shadow classifier; empty = disabled)
  TYPESAFE_API_KEY: z.string().optional(),

  // OAuth (MCP)
  OAUTH_ISSUER_URL: z.string().url(),
  WEB_APP_URL: z.string().url(),
  MCP_OAUTH_EXTRA_REDIRECT_URIS: z.string().optional(),
});

export const env = schema.parse(process.env);
