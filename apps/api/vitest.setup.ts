import 'reflect-metadata';

const testEnv: Record<string, string> = {
  COGNITO_CLIENT_ID: 'test',
  COGNITO_CLIENT_SECRET: 'test',
  COGNITO_POOL_ID: 'test',
  MAIN_TABLE_NAME: 'test-table',
  MAIN_BUCKET: 'test-bucket',
  ALGOLIA_APP_ID: 'test',
  ALGOLIA_ADMIN_API_KEY: 'test',
  ALGOLIA_INDEX_NAME: 'test',
  MASTER_SECRET: 'test-master-secret',
  EXPORT_SECRET: 'test',
  GEMINI_API_KEY: 'test',
  OAUTH_ISSUER_URL: 'https://api.test',
  WEB_APP_URL: 'https://app.test',
};

for (const [key, value] of Object.entries(testEnv)) {
  process.env[key] ??= value;
}
