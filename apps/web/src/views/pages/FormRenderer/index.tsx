import { lazy } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';

import { useFormRendererController } from './useFormRendererController';

const SinglePageForm = lazy(() => import('@/views/pages/SinglePageForm'));
const FormResponse = lazy(() => import('@/views/pages/FormResponse'));

export default function FormRenderer() {
  const { formEntity, isLoading } = useFormRendererController();

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-3xl p-6 space-y-4">
          <Skeleton className="h-7 w-1/2 mx-auto" />
          <Skeleton className="h-5 w-full mt-2" />
          <div className="flex items-center gap-4 mt-6">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-5 w-1/4 mx-auto mt-2" />

          <div className="pt-8 text-center">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <div className="mt-8 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (formEntity?.form.onePage) {
    return <SinglePageForm formEntity={formEntity as any} />;
  }

  return <FormResponse formEntity={formEntity as any} />;
}
