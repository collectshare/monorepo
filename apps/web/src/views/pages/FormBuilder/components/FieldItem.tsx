import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { IQuestionInsert } from '@monorepo/shared/types/IQuestion';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@monorepo/ui';
import { Reorder, useDragControls } from 'framer-motion';
import { CopyIcon, EllipsisIcon, GripVerticalIcon, ShieldAlertIcon, Trash2Icon } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';

import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

import { FormBuilderFormData } from '../useFormBuilderController';
import { FieldOptions } from './FieldOptions';
import { fieldTypes } from './fieldTypes';

const ANONYMIZATION_SUGGESTION_CONFIDENCE_THRESHOLD = 0.6;

interface IFieldItemProps {
  index: number;
  isDraggingActive: null | boolean;
  field: IQuestionInsert;
  onDragStart: () => void;
  onDragEnd: () => void;
  onRemove: () => void;
  onCloneField: (field: IQuestionInsert) => void;
}

export function FieldItem({
  field,
  index,
  isDraggingActive,
  onDragStart,
  onDragEnd,
  onRemove,
  onCloneField,
}: IFieldItemProps) {
  const form = useFormContext<FormBuilderFormData>();
  const controls = useDragControls();

  const questionType = form.watch(`fields.${index}.questionType`);

  const showOptions = [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.CHECKBOX,
    QuestionType.DROPDOWN,
  ].includes(questionType as any);

  const anonymizationSuggestion = field.anonymizationSuggestion;
  const showAnonymizationWarning =
    !!anonymizationSuggestion?.needsAnonymization &&
    anonymizationSuggestion.confidence >= ANONYMIZATION_SUGGESTION_CONFIDENCE_THRESHOLD;

  return (
    <Reorder.Item
      value={field}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="relative"
      dragListener={false}
      dragControls={controls}
    >
      <div
        className={cn(
          'flex gap-4 transition-opacity p-4 border rounded-md',
          isDraggingActive === false && 'opacity-50',
        )}
      >
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="link"
              onPointerDown={(e) => controls.start(e)}
              className="cursor-grab p-0"
            >
              <GripVerticalIcon className="size-4" />
            </Button>

            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {fieldTypes.find(field => field.type === questionType)?.label}
                  </span>
                  {showAnonymizationWarning && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ShieldAlertIcon className="size-4 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Esta pergunta pode coletar dado pessoal. {anonymizationSuggestion?.reason}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onRemove}
                      tabIndex={-1}
                    >
                      <EllipsisIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => onCloneField(field)}>
                      <CopyIcon className="size-4" /> Clonar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={onRemove}
                      className="text-destructive"
                    >
                      <Trash2Icon className="size-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Label htmlFor={`fields.${index}.text`}>Nome do campo</Label>
              <Input
                id={`fields.${index}.text`}
                {...form.register(`fields.${index}.text`)}
                error={form.formState.errors.fields?.[index]?.text?.message}
              />
              {questionType === QuestionType.STARS && (
                <div className="mt-2">
                  <Label>Quantidade de estrelas</Label>
                  <Controller
                    control={form.control}
                    name={`fields.${index}.max`}
                    render={({ field }) => (
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              {showOptions && <FieldOptions fieldIndex={index} />}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Controller
              control={form.control}
              name={`fields.${index}.isRequired`}
              render={({ field: { onChange, value } }) => (
                <div className="flex items-center gap-2">
                  <Label htmlFor={`fields.${index}.isRequired`}>Obrigatório</Label>
                  <Switch
                    id={`fields.${index}.isRequired`}
                    checked={value}
                    onCheckedChange={onChange}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}
