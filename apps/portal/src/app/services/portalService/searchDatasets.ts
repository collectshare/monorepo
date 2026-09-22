import { httpClient } from '../httpClient';

export type DatasetSort = 'relevance' | 'trending';

export type DatasetSearchResult = {
  formId: string;
  title: string;
  description?: string;
  tags?: string[];
  submissionCount?: number;
  clickCount?: number;
  accountName: string;
  createdAt: string;
};

export type SearchDatasetsResponse = {
  results: DatasetSearchResult[];
};

export async function searchDatasets(query: string, sort?: DatasetSort): Promise<SearchDatasetsResponse> {
  const { data } = await httpClient.get<SearchDatasetsResponse>('/portal/search', {
    params: { q: query, sort },
  });

  return data;
}
