import { httpClient } from '../httpClient';

export async function exportSubmissions(formId: string): Promise<{ blob: Blob; filename: string }> {
  const response = await httpClient.get(`/forms/${formId}/submissions/export`, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? 'export.csv';

  return { blob: response.data, filename };
}
