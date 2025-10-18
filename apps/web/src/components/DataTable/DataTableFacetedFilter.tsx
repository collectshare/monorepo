import { Check, PlusCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Separator } from '../ui/Separator';
import { useDataTable } from './DataTableContext';

interface IDataTableFacetedFilterProps {
  column: string;
  emptyLabel: string;
  title?: string
  mapFunction?: (value: string) => string;
}

export function DataTableFacetedFilter({
  column,
  title,
  emptyLabel,
  mapFunction,
}: IDataTableFacetedFilterProps) {
  const { table } = useDataTable();
  const tableColumn = table.getColumn(column);
  const facets = tableColumn?.getFacetedUniqueValues();
  const selectedValues = new Set(tableColumn?.getFilterValue() as string[]);
  const options = facets
    ? Array.from(facets.entries())
      .sort((a, b) => b[1] - a[1])
      .map((option) => option[0])
    : [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <PlusCircle />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selecionados
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option))
                    .map((option, index) => (
                      <Badge
                        variant="secondary"
                        key={`${option}_${index}`}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option ? (mapFunction ? mapFunction(option) : option) : emptyLabel}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option, index) => {
                const isSelected = selectedValues.has(option);
                return (
                  <CommandItem
                    key={`${option}_${index}`}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option);
                      } else {
                        selectedValues.add(option);
                      }
                      const filterValues = Array.from(selectedValues);
                      tableColumn?.setFilterValue(
                        filterValues.length ? filterValues : undefined,
                      );
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-foreground',
                        isSelected
                          ? 'bg-foreground text-background'
                          : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <Check />
                    </div>
                    {option?.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option ? (mapFunction ? mapFunction(option) : option) : emptyLabel}</span>
                    {facets?.get(option) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => tableColumn?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Limpar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
