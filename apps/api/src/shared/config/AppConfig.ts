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
    };

    this.secrets = {
      masterSecret: env.MASTER_SECRET,
    };

    this.gemini = {
      apiKey: env.GEMINI_API_KEY,
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
  };

  export type Secrets = {
    masterSecret: string;
  };

  export type Gemini = {
    apiKey: string;
  };

  // export type CDNs = {
  //   mealsCDN: string;
  // };

  // export type Queues = {
  //   mealsQueueUrl: string;
  // };
}
