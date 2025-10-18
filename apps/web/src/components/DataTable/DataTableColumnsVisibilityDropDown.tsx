import { Settings2 } from 'lucide-react';

import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { useDataTable } from './DataTableContext';

export function DataTableColumnsVisibilityDropDown() {
  const { table } = useDataTable();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline">
          <Settings2 /> Visualizar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table.getAllColumns().map(column => (
          !column.getCanHide()
            ? null
            : (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={column.toggleVisibility}
                disabled={!column.getCanHide()}
              >
                {column.columnDef.meta?.nameInFilters}
              </DropdownMenuCheckboxItem>
            )
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
