import { SearchIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Input } from '../ui/Input';
import { useDataTable } from './DataTableContext';

interface IDataTableTextFilterProps {
  column?: string;
  className?: string;
  placeholder?: string;
}

export function DataTableTextFilter({ column, className, placeholder }: IDataTableTextFilterProps) {
  const { table } = useDataTable();

  if (column) {
    const tableColumn = table.getColumn(column);
    const value = tableColumn?.getFilterValue() as string | undefined;

    return (
      <div className="relative">
        <SearchIcon className="absolute w-4 h-4 left-4 top-1/2 transform -translate-y-1/2" />
        <Input
          className={cn('indent-6', className)}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={event => tableColumn?.setFilterValue(event.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <SearchIcon className="absolute w-4 h-4 left-4 top-1/2 transform -translate-y-1/2" />
      <Input
        className={cn('indent-6', className)}
        placeholder={placeholder}
        onChange={event => table.setGlobalFilter(event.target.value)}
      />
    </div>
  );
}
