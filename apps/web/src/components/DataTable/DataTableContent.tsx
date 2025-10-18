import { Loader2Icon } from 'lucide-react';
import { useMemo } from 'react';

import { Table } from '../ui/Table';
import { DataTableBody, MemoizedDataTableBody } from './DataTableBody';
import { useDataTable } from './DataTableContext';
import { DataTableHeader } from './DataTableHeader';

interface IDataTableContentProps {
  isLoading: boolean;
}

export function DataTableContent({ isLoading }: IDataTableContentProps) {
  const { table } = useDataTable();
  const { columnSizingInfo, columnSizing } = table.getState();
  const quantityRows = table.getRowModel().rows.length;
  const quantityColumns = table.getVisibleFlatColumns().length;

  const colSizeVariables = useMemo(() => (
    table.getFlatHeaders().reduce<Record<string, number> >((acc, header) => ({
      ...acc,
      [`--header-${header.id}-size`]: header.getSize(),
      [`--col-${header.column.id}-size`]: header.column.getSize(),
    }), {})
  ), [columnSizingInfo, columnSizing, table.getFlatHeaders]);

  return (
    <Table style={colSizeVariables}>
      <DataTableHeader />
      {isLoading && (
        <tbody>
          <tr>
            <td colSpan={quantityColumns}>
              <br />
              <Loader2Icon className="animate-spin mx-auto" />
            </td>
          </tr>
        </tbody>
      )}
      {quantityRows === 0 && !isLoading && (
        <tbody>
          <tr>
            <td colSpan={quantityColumns} className="text-muted-foreground text-center text-md">
              <br />
              Nenhum registro encontrado.
            </td>
          </tr>
        </tbody>
      )}
      {!isLoading && quantityRows > 0 && columnSizingInfo.isResizingColumn && <MemoizedDataTableBody />}
      {!isLoading && quantityRows > 0 && !columnSizingInfo.isResizingColumn && <DataTableBody />}
    </Table>
  );
}
