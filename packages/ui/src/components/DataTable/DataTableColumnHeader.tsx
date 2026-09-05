import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';

import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';

interface IDataTableColumnHeaderProps {
  column: Column<any>;
  title: React.ReactNode;
}

export function DataTableColumnHeader({ column, title }:IDataTableColumnHeaderProps) {
  if (!column.getCanSort()) {
    return title;
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 data-[state=open]:bg-accent"
          >
            {title}
            {!column.getIsSorted() && <ChevronsUpDown />}
            {column.getIsSorted() === 'asc' && <ArrowUp />}
            {column.getIsSorted() === 'desc' && <ArrowDown />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
            <ArrowUp className="text-muted-foreground size-3" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
            <ArrowDown className="text-muted-foreground size-3" />
            Desc
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
                <EyeOff className="text-muted-foreground size-3" />
                Esconder
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
