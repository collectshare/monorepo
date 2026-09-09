import { Badge, Button, DataTableColumnHeader, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@monorepo/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { CalendarIcon, EllipsisIcon, KeyRoundIcon, ShieldIcon, Trash2Icon, TypeIcon } from 'lucide-react';

import type { ApiKeySummary } from '@/app/services/apiKeysService/listApiKeys';
import { formatDate } from '@/app/utils/formatDate';

const nameHeader = () => (
  <div className="flex items-center gap-1">
    <TypeIcon className="size-4" /> Nome
  </div>
);

const keyPrefixHeader = () => (
  <div className="flex items-center gap-1">
    <KeyRoundIcon className="size-4" /> Chave
  </div>
);

const scopesHeader = () => (
  <div className="flex items-center gap-1">
    <ShieldIcon className="size-4" /> Escopos
  </div>
);

const dateAddedHeader = () => (
  <div className="flex items-center gap-1">
    <CalendarIcon className="size-4" /> Criada em
  </div>
);

interface ICreateColumnsParams {
  revoke: (keyId: string) => void;
  isRevoking: boolean;
}

export function createColumns({ revoke, isRevoking }: ICreateColumnsParams): ColumnDef<ApiKeySummary>[] {
  return [
    {
      accessorKey: 'name',
      enableResizing: false,
      enableHiding: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title={nameHeader()} />,
      meta: {
        nameInFilters: 'Nome',
      },
    },
    {
      accessorKey: 'keyPrefix',
      enableResizing: false,
      enableHiding: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title={keyPrefixHeader()} />,
      cell: ({ row }) => <code className="text-xs font-mono">{row.original.keyPrefix}…</code>,
      meta: {
        nameInFilters: 'Chave',
      },
    },
    {
      accessorKey: 'scopes',
      enableResizing: false,
      enableHiding: false,
      enableSorting: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title={scopesHeader()} />,
      cell: ({ row }) => {
        const scopes = row.original.scopes;

        if (!scopes || scopes.length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {scopes.map(scope => (
              <Badge key={scope} variant="secondary">{scope}</Badge>
            ))}
          </div>
        );
      },
      meta: {
        nameInFilters: 'Escopos',
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={dateAddedHeader()} />,
      cell: ({ row }) => formatDate(row.original.createdAt),
      enableResizing: false,
      enableHiding: false,
      meta: {
        nameInFilters: 'Criada em',
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
        const apiKey = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" variant="ghost">
                  <EllipsisIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuItem
                  className="text-destructive"
                  disabled={isRevoking}
                  onSelect={() => revoke(apiKey.id)}
                >
                  <Trash2Icon className="size-4" /> Revogar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
