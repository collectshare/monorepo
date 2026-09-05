import { useEffect, useState } from 'react';

import { algoliaIndex, DatasetSearchHit } from '@/app/services/algoliaClient';

export function useHomeController() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DatasetSearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const timeout = setTimeout(async () => {
      const { hits } = await algoliaIndex.search<DatasetSearchHit>(query);

      if (!isCancelled) {
        setResults(hits);
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
