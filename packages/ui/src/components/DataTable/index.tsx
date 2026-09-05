import { ColumnDef, getCoreRowModel, getFacetedMinMaxValues, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, PaginationState, useReactTable, VisibilityState } from '@tanstack/react-table';
import { useEffect, useMemo, useRef } from 'react';

import { DataTableContext } from './DataTableContext';

interface IDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[],
  children: React.ReactNode;
  pagination?: PaginationState;
  columnVisibility?: VisibilityState;
  onSelectRow?: (selectedRows: TData[]) => void;
}

export function DataTable<TData>({ columns, data, children, pagination, columnVisibility, onSelectRow }: IDataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange',
    globalFilterFn: 'includesString',
    initialState: {
      pagination,
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = useMemo(() => (table.getSelectedRowModel().flatRows.map((row) => row.original))
    , [table.getSelectedRowModel().flatRows]);

  const memoOnSelectRow = useRef(onSelectRow);
  memoOnSelectRow.current = onSelectRow;

  useEffect(() => {
    memoOnSelectRow.current?.(selectedRows);
  }, [selectedRows]);

  return (
    <DataTableContext.Provider value={{ table }}>
      {children}
    </DataTableContext.Provider>
  );
}
