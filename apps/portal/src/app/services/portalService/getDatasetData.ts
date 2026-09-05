import { httpClient } from '../httpClient';

export type DatasetRow = {
  submissionId: string;
  submittedAt: string;
  answers: Array<{
    questionId: string;
    value: string | string[];
  }>;
};

export type GetDatasetDataResponse = {
  rows: DatasetRow[];
  nextCursor?: string;
};

export type GetDatasetDataParams = {
  formId: string;
  cursor?: string;
  limit?: number;
};

export async function getDatasetData({ formId, cursor, limit }: GetDatasetDataParams): Promise<GetDatasetDataResponse> {
  const { data } = await httpClient.get<GetDatasetDataResponse>(`/portal/datasets/${formId}/data`, {
    params: { cursor, limit },
  });

  return data;
}
