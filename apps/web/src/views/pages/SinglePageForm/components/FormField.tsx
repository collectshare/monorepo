import { IQuestion } from '@monorepo/shared/types/IQuestion';
import { Controller, useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface FormFieldProps {
  question: IQuestion;
}

export function FormField({ question }: FormFieldProps) {
  const { control, register, formState: { errors } } = useFormContext();
  const error = errors[question.id]?.message as string | undefined;

  const renderField = () => {
    switch (question.questionType) {
      case 'TEXT':
        return <Input {...register(question.id)} className="text-center" />;
      case 'MULTIPLE_CHOICE':
        return (
          <Controller
            control={control}
            name={question.id}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="space-y-2"
              >
                {question.options?.map((option: string) => (
                  <Label
                    key={option}
                    className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                    <span>{option}</span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        );
      case 'CHECKBOX':
        return (
          <Controller
            control={control}
            name={question.id}
            defaultValue={[]}
            render={({ field }) => (
              <div className="space-y-2">
                {question.options?.map((option: string) => (
                  <Label
                    key={option}
                    className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary cursor-pointer"
                  >
                    <Checkbox
                      id={`${question.id}-${option}`}
                      checked={field.value?.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...field.value, option]);
                        } else {
                          field.onChange(
                            field.value.filter(
                              (value: string) => value !== option,
                            ),
                          );
                        }
                      }}
                    />
                    <span>{option}</span>
                  </Label>
                ))}
              </div>
            )}
          />
        );
      case 'DROPDOWN':
        return (
          <Controller
            control={control}
            name={question.id}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {question.options?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md text-center">
      <Label className="text-2xl font-semibold leading-relaxed">
        {question.text}
        {question.isRequired && <span className="text-destructive"> *</span>}
      </Label>
      <div className="mt-8 w-full text-left">
        {renderField()}
      </div>
      {error && <p className="text-sm font-medium text-destructive mt-2 text-center">{error}</p>}
    </div>
  );
}
