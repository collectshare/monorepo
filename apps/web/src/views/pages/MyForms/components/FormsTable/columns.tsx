import type { ColumnDef } from '@tanstack/react-table';
import { CalendarIcon, ChartPieIcon, CopyIcon, Edit2, Ellipsis, SettingsIcon, SigmaIcon, TextIcon, TypeIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { IForm } from '@monorepo/shared/types/IForm';
import { useModal } from '@/app/hooks/useModal';
import { formatDate } from '@/app/utils/formatDate';
import { DataTableColumnHeader } from '@/components/DataTable/DataTableColumnHeader';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { SaveFormDetailsModal } from '@/views/pages/FormBuilder/components/SaveFormDetailsModal';

const titleHeader = () => (
  <div className="flex items-center gap-1">
    <TypeIcon className="size-4" /> Título
  </div>
);

const descriptionHeader = () => (
  <div className="flex items-center gap-1">
    <TextIcon className="size-4" /> Descrição
  </div>
);

const countHeader = () => (
  <div className="flex items-center gap-1">
    <SigmaIcon className="size-4" /> Qtd. de respostas
  </div>
);

const dateAddedHeader = () => (
  <div className="flex items-center gap-1">
    <CalendarIcon className="size-4" /> Data de cadastro
  </div>
);

export const columns: ColumnDef<IForm>[] = [
  {
    accessorKey: 'title',
    enableResizing: false,
    enableHiding: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title={titleHeader()} />,
    meta: {
      nameInFilters: 'Título',
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title={descriptionHeader()} />,
    enableResizing: false,
    enableHiding: false,
    meta: {
      nameInFilters: 'Descrição',
    },
  },
   {
    accessorKey: 'submissionCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title={countHeader()} />,
    cell: ({ row }) => row.original?.submissionCount ?? '-',
    enableResizing: false,
    enableHiding: false,
    meta: {
      nameInFilters: 'Qtd. de respostas',
    },
  },
  {
    accessorKey: 'dateAdded',
    header: ({ column }) => <DataTableColumnHeader column={column} title={dateAddedHeader()} />,
    cell: ({ row }) => formatDate(row.original.createdAt),
    enableResizing: false,
    enableHiding: false,
    meta: {
      nameInFilters: 'Data de cadastro',
    },
  },
  {
    id: 'actions',
    size: 20,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    enableHiding: false,
    enableMultiSort: false,
    enableResizing: false,
    enableSorting: false,
    cell: ({ row }) => {
      const { open } = useModal();
      const navigate = useNavigate();
      const form = row.original;

      function handleShare() {
        const url = `${window.location.origin}/forms/response/${form.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência');
      }

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="ghost">
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-50">
              <DropdownMenuItem onSelect={() => navigate(`/forms/dashboard/${form.id}`)}>
                <ChartPieIcon className="size-4" /> Resultados
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleShare}>
                <CopyIcon className="size-4" /> Copiar link
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate(`/forms/builder/${form.id}`)}>
                <SettingsIcon className="size-4" /> Configurar perguntas
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => open(<SaveFormDetailsModal form={form} />)}>
                <Edit2 className="size-4" /> Editar atributos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
