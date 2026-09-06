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

  // Secrets
  MASTER_SECRET: z.string().min(1),

  // Gemini
  GEMINI_API_KEY: z.string().min(1),
});

export const env = schema.parse(process.env);
