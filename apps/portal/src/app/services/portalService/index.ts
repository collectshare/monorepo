import { getDataset } from './getDataset';
import { getDatasetData } from './getDatasetData';
import { getDatasetExportUrl } from './getDatasetExportUrl';
import { searchDatasets } from './searchDatasets';

export const portalService = {
  getDataset,
  getDatasetData,
  getDatasetExportUrl,
  searchDatasets,
};

export * from './getDataset';
export * from './getDatasetData';
export * from './getDatasetExportUrl';
export * from './searchDatasets';
