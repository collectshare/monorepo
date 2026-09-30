import { Injectable } from '@kernel/decorators/Injectable';
import { env } from './env';

@Injectable()
export class AppConfig {
  readonly auth: AppConfig.Auth;

  readonly db: AppConfig.Database;

  readonly storage: AppConfig.Storage;

  readonly algolia: AppConfig.Algolia;

  readonly secrets: AppConfig.Secrets;

  readonly gemini: AppConfig.Gemini;

  readonly oauth: AppConfig.OAuth;

  constructor() {
    this.auth = {
      cognito: {
        client: {
          id: env.COGNITO_CLIENT_ID,
          secret: env.COGNITO_CLIENT_SECRET,
        },
        pool: {
          id: env.COGNITO_POOL_ID,
        },
      },
    };

    this.db = {
      dynamodb: {
        mainTable: env.MAIN_TABLE_NAME,
      },
    };

    this.storage = {
      mainBucket: env.MAIN_BUCKET,
    };

    this.algolia = {
      appId: env.ALGOLIA_APP_ID,
      adminApiKey: env.ALGOLIA_ADMIN_API_KEY,
      indexName: env.ALGOLIA_INDEX_NAME,
      trendingIndexName: env.ALGOLIA_TRENDING_INDEX_NAME || `${env.ALGOLIA_INDEX_NAME}_trending`,
    };

    this.secrets = {
      masterSecret: env.MASTER_SECRET,
      exportSecret: env.EXPORT_SECRET,
    };

    this.gemini = {
      apiKey: env.GEMINI_API_KEY,
    };

    this.oauth = {
      issuer: env.OAUTH_ISSUER_URL.replace(/\/+$/, ''),
      webAppUrl: env.WEB_APP_URL.replace(/\/+$/, ''),
      extraRedirectUris: (env.MCP_OAUTH_EXTRA_REDIRECT_URIS ?? '')
        .split(',')
        .map(uri => uri.trim())
        .filter(Boolean),
    };
  }
}

export namespace AppConfig {
  export type Auth = {
    cognito: {
      client: {
        id: string;
        secret: string;
      };
      pool: {
        id: string;
      };
    };
  };

  export type Database = {
    dynamodb: {
      mainTable: string;
    };
  };

  export type Storage = {
    mainBucket: string;
  };

  export type Algolia = {
    appId: string;
    adminApiKey: string;
    indexName: string;
    trendingIndexName: string;
  };

  export type Secrets = {
    masterSecret: string;
    exportSecret: string;
  };

  export type Gemini = {
    apiKey: string;
  };

  export type OAuth = {
    /** Public base URL of this API (custom domain or execute-api URL), no trailing slash. */
    issuer: string;
    /** Public base URL of apps/web (hosts the OAuth consent page), no trailing slash. */
    webAppUrl: string;
    /** Redirect URIs allowed in addition to the built-in claude.ai/claude.com callbacks and loopback. */
    extraRedirectUris: string[];
  };

  // export type CDNs = {
  //   mealsCDN: string;
  // };

  // export type Queues = {
  //   mealsQueueUrl: string;
  // };
}
