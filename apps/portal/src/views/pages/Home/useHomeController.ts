import { useEffect, useState } from 'react';

import { DatasetSearchResult, portalService } from '@/app/services/portalService';

export function useHomeController() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DatasetSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const timeout = setTimeout(async () => {
      const { results: searchResults } = await portalService.searchDatasets(query);

      if (!isCancelled) {
        setResults(searchResults);
        setIsLoading(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return {
    query,
    setQuery,
    results,
    isLoading,
  };
}
