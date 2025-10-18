import { CrossCircledIcon } from '@radix-ui/react-icons';
import { CircleAlertIcon } from 'lucide-react';
import { Controller } from 'react-hook-form';

import { IFormInsert } from '@/app/entities/IForm';
import { useModal } from '@/app/hooks/useModal';
import { Button } from '@/components/ui/Button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { TagsInput, TagsInputInput, TagsInputItem, TagsInputList } from '@/components/ui/TagsInput';
import { Textarea } from '@/components/ui/Textarea';
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
          <Textarea
            id="description"
            placeholder="ex: Uma breve descrição sobre o objetivo deste formulário."
            disabled={isLoading}
            tabIndex={2}
            {...register('description')}
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
          <Label htmlFor="isAnonymous" className="flex items-center gap-1">
            Anonimizar as respostas
          </Label>
          <Controller
            control={control}
            name="isAnonymous"
            render={({ field }) => (
              <Switch
                id="isAnonymous"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
                tabIndex={4}
              />
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
                tabIndex={5}
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
