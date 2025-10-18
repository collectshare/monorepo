import { CrossCircledIcon } from '@radix-ui/react-icons';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVerticalIcon, PlusCircleIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';

interface IOptionItemProps {
  fieldIndex: number;
  optionIndex: number;
  option: { id: string };
  onRemove: () => void;
  append: (value: string, options?: { shouldFocus?: boolean }) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDraggingActive: boolean | null;
}

function OptionItem({
  fieldIndex,
  optionIndex,
  option,
  onRemove,
  append,
  onDragStart,
  onDragEnd,
  isDraggingActive,
}: IOptionItemProps) {
  const form = useFormContext();
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={option}
      dragListener={false}
      dragControls={controls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          isDraggingActive === false && 'opacity-50',
        )}
      >
        <Button
          type="button"
          variant="link"
          onPointerDown={(e) => {
            e.stopPropagation();
            controls.start(e);
          }}
          tabIndex={-1}
          className="cursor-grab p-0"
        >
          <GripVerticalIcon className="size-4" />
        </Button>
        <Input
          {...form.register(`fields.${fieldIndex}.options.${optionIndex}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              append('', { shouldFocus: true });
            }
          }}
        />
        <Button
          type="button"
          variant="outlineDestructive"
          size="iconSm"
          onClick={onRemove}
          tabIndex={-1}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}

interface IFieldOptionsProps {
  fieldIndex: number;
}

export function FieldOptions({ fieldIndex }: IFieldOptionsProps) {
  const form = useFormContext();
  const [draggingIndex, setDraggingIndex] = useState<null | number>(null);

  const {
    fields: options,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: `fields.${fieldIndex}.options`,
  });

  function handleReorder(newOrder: typeof options) {
    if (draggingIndex === null) {
      return;
    }
    const optionToMove = options[draggingIndex];
    const newPosition = newOrder.findIndex((o) => o.id === optionToMove.id);
    if (newPosition !== -1) {
      move(draggingIndex, newPosition);
      setDraggingIndex(newPosition);
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <Label>Opções</Label>

      <Reorder.Group
        as="div"
        axis="y"
        values={options}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {options.map((option, optionIndex) => (
          <OptionItem
            key={option.id}
            option={option}
            fieldIndex={fieldIndex}
            optionIndex={optionIndex}
            onRemove={() => remove(optionIndex)}
            append={append}
            onDragStart={() => setDraggingIndex(optionIndex)}
            onDragEnd={() => {
              setDraggingIndex(null);
            }}
            isDraggingActive={
              draggingIndex === null ? null : draggingIndex === optionIndex
            }
          />
        ))}
      </Reorder.Group>

      <Button
        type="button"
        variant="link"
        onClick={() => append('', { shouldFocus: true })}
      >
        <PlusCircleIcon className="size-4" />
        Adicionar opção
      </Button>
      {(form.formState.errors.fields as any)?.[fieldIndex]?.options?.root
        ?.message && (
        <div className="flex gap-2 items-center text-red-700">
          <CrossCircledIcon />
          <span className="text-xs">
            {
              (form.formState.errors.fields as any)?.[fieldIndex]?.options
                ?.root?.message
            }
          </span>
        </div>
      )}
    </div>
  );
}
