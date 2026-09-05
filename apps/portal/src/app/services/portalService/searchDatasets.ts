import { httpClient } from '../httpClient';

export type DatasetSearchResult = {
  formId: string;
  title: string;
  description?: string;
  tags?: string[];
  submissionCount?: number;
  accountName: string;
  createdAt: string;
};

export type SearchDatasetsResponse = {
  results: DatasetSearchResult[];
};

export async function searchDatasets(query: string): Promise<SearchDatasetsResponse> {
  const { data } = await httpClient.get<SearchDatasetsResponse>('/portal/search', {
    params: { q: query },
  });

  return data;
}
