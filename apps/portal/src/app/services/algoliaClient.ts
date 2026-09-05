import algoliasearch from 'algoliasearch/lite';

export const algoliaIndexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME;

const algoliaClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY,
);

export const algoliaIndex = algoliaClient.initIndex(algoliaIndexName);

export type DatasetSearchHit = {
  objectID: string;
  title: string;
  description?: string;
  tags?: string[];
  submissionCount?: number;
  accountName: string;
  createdAt: string;
};
