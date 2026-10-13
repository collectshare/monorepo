import algoliasearch from 'algoliasearch';

// Makes the trending index a standard replica of the primary index, sorted by
// clickCount (most clicked first). Without this the trending index is a
// standalone, empty index and `sort=trending` searches always return nothing.
// Idempotent: re-running only re-applies the same settings.

const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME } = process.env;
const trendingIndexName = process.env.ALGOLIA_TRENDING_INDEX_NAME || `${ALGOLIA_INDEX_NAME}_trending`;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  throw new Error('ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY and ALGOLIA_INDEX_NAME must be set');
}

const DEFAULT_RANKING = ['typo', 'geo', 'words', 'filters', 'proximity', 'attribute', 'exact', 'custom'];

async function configureAlgoliaReplicas(): Promise<void> {
  const client = algoliasearch(ALGOLIA_APP_ID!, ALGOLIA_ADMIN_API_KEY!);
  const primary = client.initIndex(ALGOLIA_INDEX_NAME!);
  const trending = client.initIndex(trendingIndexName);

  const { replicas = [] } = await primary.getSettings();
  if (!replicas.includes(trendingIndexName)) {
    await primary.setSettings({ replicas: [...replicas, trendingIndexName] }).wait();
  }

  // Standard replica: exhaustive sort, so the most clicked dataset comes first
  // for any query (including the empty one used by the portal home).
  await trending.setSettings({ ranking: ['desc(clickCount)', ...DEFAULT_RANKING] }).wait();

  const { nbHits } = await trending.search('');
  console.log(`${ALGOLIA_INDEX_NAME} → replica ${trendingIndexName} sorted by clickCount desc (${nbHits} records).`);
}

configureAlgoliaReplicas().catch((error) => {
  console.error('Algolia replica configuration failed', error);
  process.exit(1);
});
