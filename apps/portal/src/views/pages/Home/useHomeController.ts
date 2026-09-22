import { useEffect, useState } from 'react';

import { DatasetSearchResult, DatasetSort, portalService } from '@/app/services/portalService';

export function useHomeController() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DatasetSort>('relevance');
  const [results, setResults] = useState<DatasetSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const timeout = setTimeout(async () => {
      const { results: searchResults } = await portalService.searchDatasets(query, sort);

      if (!isCancelled) {
        setResults(searchResults);
        setIsLoading(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [query, sort]);

  return {
    query,
    setQuery,
    sort,
    setSort,
    results,
    isLoading,
  };
}
