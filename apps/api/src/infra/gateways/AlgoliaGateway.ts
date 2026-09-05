import algoliasearch, { SearchIndex } from 'algoliasearch';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

@Injectable()
export class AlgoliaGateway {
  private readonly index: SearchIndex;

  constructor(private readonly appConfig: AppConfig) {
    const client = algoliasearch(this.appConfig.algolia.appId, this.appConfig.algolia.adminApiKey);
    this.index = client.initIndex(this.appConfig.algolia.indexName);
  }

  async upsertRecord(record: AlgoliaGateway.DatasetRecord): Promise<void> {
    await this.index.saveObject({
      objectID: record.formId,
      title: record.title,
      description: record.description,
      tags: record.tags,
      submissionCount: record.submissionCount,
      accountName: record.accountName,
      createdAt: record.createdAt,
    });
  }

  async deleteRecord(formId: string): Promise<void> {
    await this.index.deleteObject(formId);
  }

  async search(query: string): Promise<AlgoliaGateway.DatasetRecord[]> {
    const { hits } = await this.index.search<AlgoliaGateway.DatasetRecord & { objectID: string }>(query);

    return hits.map(hit => ({
      formId: hit.objectID,
      title: hit.title,
      description: hit.description,
      tags: hit.tags,
      submissionCount: hit.submissionCount,
      accountName: hit.accountName,
      createdAt: hit.createdAt,
    }));
  }
}

export namespace AlgoliaGateway {
  export type DatasetRecord = {
    formId: string;
    title: string;
    description?: string;
    tags?: string[];
    submissionCount?: number;
    accountName: string;
    createdAt: string;
  };
}
