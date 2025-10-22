import { EllipsisIcon, GripVerticalIcon } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export function FieldItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 border rounded-md">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <Button
            type="button"
            variant="link"
            className="cursor-grab p-0"
            disabled
          >
            <GripVerticalIcon className="size-4" />
          </Button>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Skeleton className="h-6 w-32" />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled
              >
                <EllipsisIcon className="size-4" />
              </Button>
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
