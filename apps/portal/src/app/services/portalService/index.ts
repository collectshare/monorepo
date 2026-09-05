import { getDataset } from './getDataset';
import { getDatasetData } from './getDatasetData';
import { searchDatasets } from './searchDatasets';

export const portalService = {
  getDataset,
  getDatasetData,
  searchDatasets,
};

export * from './getDataset';
export * from './getDatasetData';
export * from './searchDatasets';
