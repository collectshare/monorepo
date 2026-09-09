import { Button, DataTable, DataTableContent, DataTablePagination, DataTableTextFilter } from '@monorepo/ui';
import { CirclePlusIcon } from 'lucide-react';
import { useMemo } from 'react';

import { useModal } from '@/app/hooks/useModal';
import type { ApiKeySummary } from '@/app/services/apiKeysService/listApiKeys';

import { CreateApiKeyModal } from '../CreateApiKeyModal';
import { createColumns } from './columns';

interface IApiKeysTableProps {
  isLoading: boolean;
  apiKeys: ApiKeySummary[];
  revoke: (keyId: string) => void;
  isRevoking: boolean;
}

export function ApiKeysTable({ isLoading, apiKeys, revoke, isRevoking }: IApiKeysTableProps) {
  const { open } = useModal();

  const columns = useMemo(() => createColumns({ revoke, isRevoking }), [revoke, isRevoking]);

  return (
    <DataTable
      data={apiKeys}
      columns={columns}
      pagination={{
        pageIndex: 0,
        pageSize: 25,
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <DataTableTextFilter
          className="max-w-[350px] w-[350px]"
          placeholder="Filtrar API keys..."
        />
        <Button type="button" onClick={() => open(<CreateApiKeyModal />)}>
          <CirclePlusIcon />
          Nova API Key
        </Button>
      </div>
      <DataTableContent
        isLoading={isLoading}
      />
      <div className="flex justify-end mt-4">
        <DataTablePagination />
      </div>
    </DataTable>
  );
}
