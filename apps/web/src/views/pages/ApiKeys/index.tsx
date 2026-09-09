import PageLayout from '../../layouts/PageLayout';
import { ApiKeysTable } from './components/ApiKeysTable';
import { useApiKeysController } from './useApiKeysController';

export default function ApiKeys() {
  const {
    apiKeys,
    isLoading,
    revoke,
    isRevoking,
  } = useApiKeysController();

  return (
    <PageLayout
      title="API Keys"
      subtitle="Gerencie chaves de acesso pessoal (PAT) da sua conta."
    >
      <ApiKeysTable
        isLoading={isLoading}
        apiKeys={apiKeys}
        revoke={revoke}
        isRevoking={isRevoking}
      />
    </PageLayout>
  );
}
