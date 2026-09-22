import algoliasearch, { SearchIndex } from 'algoliasearch';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

@Injectable()
export class AlgoliaGateway {
  private readonly index: SearchIndex;

  private readonly trendingIndex: SearchIndex;

  constructor(private readonly appConfig: AppConfig) {
    const client = algoliasearch(this.appConfig.algolia.appId, this.appConfig.algolia.adminApiKey);
    this.index = client.initIndex(this.appConfig.algolia.indexName);
    this.trendingIndex = client.initIndex(this.appConfig.algolia.trendingIndexName);
  }

  async upsertRecord(record: AlgoliaGateway.DatasetRecord): Promise<void> {
    await this.index.saveObject({
      objectID: record.formId,
      title: record.title,
      description: record.description,
      tags: record.tags,
      submissionCount: record.submissionCount,
      clickCount: record.clickCount,
      downloadCount: record.downloadCount,
      accountName: record.accountName,
      createdAt: record.createdAt,
    });
  }

  async deleteRecord(formId: string): Promise<void> {
    await this.index.deleteObject(formId);
  }

  async search(query: string, sort?: AlgoliaGateway.Sort): Promise<AlgoliaGateway.DatasetRecord[]> {
    const index = sort === 'trending' ? this.trendingIndex : this.index;

    const { hits } = await index.search<AlgoliaGateway.DatasetRecord & { objectID: string }>(query);

    return hits.map(hit => ({
      formId: hit.objectID,
      title: hit.title,
      description: hit.description,
      tags: hit.tags,
      submissionCount: hit.submissionCount,
      clickCount: hit.clickCount,
      downloadCount: hit.downloadCount,
      accountName: hit.accountName,
      createdAt: hit.createdAt,
    }));
  }
}

export namespace AlgoliaGateway {
  export type Sort = 'relevance' | 'trending';

  export type DatasetRecord = {
    formId: string;
    title: string;
    description?: string;
    tags?: string[];
    submissionCount?: number;
    clickCount?: number;
    downloadCount?: number;
    accountName: string;
    createdAt: string;
  };
}
