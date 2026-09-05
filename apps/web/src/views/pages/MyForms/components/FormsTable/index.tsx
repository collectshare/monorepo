import { IForm } from '@monorepo/shared/types/IForm';
import { Button, DataTable, DataTableContent, DataTablePagination, DataTableTextFilter } from '@monorepo/ui';
import { CirclePlusIcon } from 'lucide-react';

import { useModal } from '@/app/hooks/useModal';
import { SaveFormDetailsModal } from '@/views/pages/FormBuilder/components/SaveFormDetailsModal';

import { columns } from './columns';

interface IFormsTableProps {
  isLoading: boolean;
  forms: IForm[];
}

export function FormsTable({ isLoading, forms }: IFormsTableProps) {
  const { open } = useModal();

  return (
    <DataTable
      data={forms}
      columns={columns}
      pagination={{
        pageIndex: 0,
        pageSize: 25,
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <DataTableTextFilter
          className="max-w-[350px] w-[350px]"
          placeholder="Filtrar formulários..."
        />
        <Button type="button" onClick={() => open(<SaveFormDetailsModal />)}>
          <CirclePlusIcon />
          Novo formulário
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
