import { IFormInsert } from '@monorepo/shared/types/IForm';
import { Button, Input } from '@monorepo/ui';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { CircleAlertIcon } from 'lucide-react';
import { Controller } from 'react-hook-form';

import { useModal } from '@/app/hooks/useModal';
import { RichTextEditor } from '@/components/RichTextEditor';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { TagsInput, TagsInputInput, TagsInputItem, TagsInputList } from '@/components/ui/TagsInput';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

import { useSaveFormDetailsModalController } from './useSaveFormDetailsModalController';

interface SaveFormDetailsModalProps {
  form?: IFormInsert;
}

export function SaveFormDetailsModal({ form }: SaveFormDetailsModalProps) {
  const { close } = useModal();
  const {
    handleSubmit,
    register,
    errors,
    isLoading,
    control,
  } = useSaveFormDetailsModalController({ form });

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {form?.title
            ? <>Editar formulário <span className="font-bold italic">&quot;{form?.title}&quot;</span></>
            : <>Novo formulário</>
          }
        </DialogTitle>
      </DialogHeader>
      <form className="grid gap-4 py-2" id="saveFormDetails" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-2">
          <Label htmlFor="title">
            Título do formulário
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="ex: Pesquisa de Satisfação"
            disabled={isLoading}
            tabIndex={1}
            {...register('title')}
            error={errors.title?.message}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">
            Descrição
          </Label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Controller
                control={control}
                name="descriptionAlign"
                render={({ field: alignField }) => (
                  <RichTextEditor
                    id="description"
                    placeholder="Descrição do formulário"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    align={alignField.value}
                    onAlignChange={alignField.onChange}
                    disabled={isLoading}
                  />
                )}
              />
            )}
          />
          {errors.description?.message && (
            <div className="flex gap-2 items-center text-red-700 mt-1">
              <CrossCircledIcon />
              <span className="text-xs">
                {errors.description.message}
              </span>
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tags">Tags</Label>
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <TagsInput
                value={field.value ?? []}
                onValueChange={field.onChange}
                editable
                addOnPaste
                tabIndex={3}
              >
                <TagsInputList>
                  {(field.value ?? []).map((tag: string) => (
                    <TagsInputItem key={tag} value={tag}>
                      {tag}
                    </TagsInputItem>
                  ))}
                  <TagsInputInput placeholder="Adicionar tags..." />
                </TagsInputList>
              </TagsInput>
            )}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="onePage" className="flex items-center gap-1">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleAlertIcon className="w-4" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[500px]">
                  Ideal para formulários curtos e rápidos, como contato ou inscrição. Oferece uma experiência ágil, pois o usuário visualiza todas as perguntas de uma só vez.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            Formulário de página única
          </Label>
          <Controller
            control={control}
            name="onePage"
            render={({ field }) => (
              <Switch
                id="onePage"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
                tabIndex={4}
              />
            )}
          />
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit" form="saveFormDetails" isLoading={isLoading}>Salvar</Button>
      </DialogFooter>
    </>
  );
}
