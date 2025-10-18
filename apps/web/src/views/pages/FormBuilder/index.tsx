
import { Reorder } from 'framer-motion';
import { ChevronLeftIcon, Edit2Icon, SaveIcon, SettingsIcon } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { useModal } from '@/app/hooks/useModal';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';

import { FieldItem } from './components/FieldItem';
import { FieldItemSkeleton } from './components/FieldItemSkeleton';
import { SaveFormDetailsModal } from './components/SaveFormDetailsModal';
import { Sidebar } from './components/Sidebar';
import { useFormBuilderController } from './useFormBuilderController';

export default function FormBuilder() {
  const {
    form,
    formEntity,
    fields,
    draggingIndex,
    isLoading,
    isLoadingForm,
    handleSubmit,
    handleDragStart,
    handleDragEnd,
    handleReorder,
    addField,
    cloneField,
  } = useFormBuilderController();
  const { open: openModal } = useModal();

  function handleOpenSaveDetailsModal() {
    openModal(<SaveFormDetailsModal form={formEntity} />);
  }

  return (
    <FormProvider {...form}>
      <form id="saveForm" onSubmit={handleSubmit}>
        <header className="py-4 pt-0 sticky flex flex-wrap items-center justify-between gap-4">
          <div>
            {isLoadingForm && (
              <>
                <Skeleton className="h-7 w-50" />
                <Skeleton className="h-5 w-100 mt-1" />
              </>
            )}
            {!isLoadingForm && (
              <>
                <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                  {formEntity?.title}
                  <Button
                    type="button"
                    className="flex items-center gap-2"
                    variant="outline"
                    size="icon"
                    disabled={isLoading}
                    onClick={handleOpenSaveDetailsModal}
                  >
                    <Edit2Icon className="size-4" />
                  </Button>
                </h1>
                <p className="truncate text-sm text-muted-foreground max-w-[30em] lg:max-w-[50em] text-ellipsis overflow-hidden mt-1">
                  {formEntity?.description ?? '-'}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/my-forms"
              className={buttonVariants({ variant: 'outline', className: 'flex items-center gap-2' })}
            >
              <ChevronLeftIcon className="size-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <Button type="submit" className="flex items-center gap-2" disabled={isLoading}>
              <SaveIcon className="size-4" />
              <span className="hidden sm:inline">Salvar</span>
            </Button>
          </div>
        </header>
        <Separator orientation="horizontal" className="mb-4" />
        <div className="w-full flex flex-col-reverse lg:flex-row gap-4">
          <div className="w-full lg:flex-1">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col gap-4">
                {isLoadingForm && (
                  <>
                    <FieldItemSkeleton />
                    <FieldItemSkeleton />
                    <FieldItemSkeleton />
                  </>
                )}
                {!isLoadingForm && !!fields.fields.length && (
                  <Reorder.Group
                    axis="y"
                    values={fields.fields}
                    onReorder={handleReorder}
                    className="space-y-4"
                  >
                    {fields.fields.map((field, index) => (
                      <FieldItem
                        key={field.id}
                        field={field}
                        index={index}
                        isDraggingActive={draggingIndex === null ? null : draggingIndex === index}
                        onDragStart={() => handleDragStart(index)}
                        onDragEnd={handleDragEnd}
                        onRemove={() => fields.remove(index)}
                        onCloneField={cloneField}
                      />
                    ))}
                  </Reorder.Group>
                )}
                {!isLoadingForm &&!fields.fields.length && (
                  <Card>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <SettingsIcon className="w-8 h-8 text-builder-accent" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        Comece criando seu formulário
                      </h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Adicione campos da barra lateral para começar a construir seu formulário personalizado
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-[320px]">
            <Sidebar addField={addField} />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

