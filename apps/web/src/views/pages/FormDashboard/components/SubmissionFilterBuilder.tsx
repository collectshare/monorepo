import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { IQuestion } from '@monorepo/shared/types/IQuestion';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@monorepo/ui';
import { PlusIcon, XIcon } from 'lucide-react';

import {
  FILTERABLE_QUESTION_TYPES,
  FilterCondition,
  FilterGroup,
  FilterState,
  OPERATORS_BY_QUESTION_TYPE,
} from '../filters/types';

interface SubmissionFilterBuilderProps {
  questions: IQuestion[];
  filterState: FilterState;
  onChange: (next: FilterState) => void;
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultValueFor(question: IQuestion): FilterCondition['value'] {
  if (question.questionType === QuestionType.STARS) {return 1;}
  if (question.questionType === QuestionType.TEXT) {return '';}
  return [];
}

function createCondition(question: IQuestion): FilterCondition {
  const operators = OPERATORS_BY_QUESTION_TYPE[question.questionType] ?? [];

  return {
    id: createId(),
    questionId: question.id,
    operator: operators[0]?.value ?? 'contains',
    value: defaultValueFor(question),
  };
}

export function SubmissionFilterBuilder({ questions, filterState, onChange }: SubmissionFilterBuilderProps) {
  const filterableQuestions = questions.filter((question) =>
    FILTERABLE_QUESTION_TYPES.includes(question.questionType),
  );

  if (filterableQuestions.length === 0) {
    return null;
  }

  function updateGroup(groupId: string, updater: (group: FilterGroup) => FilterGroup) {
    onChange({
      groups: filterState.groups.map((group) => (group.id === groupId ? updater(group) : group)),
    });
  }

  function addGroup() {
    const firstQuestion = filterableQuestions[0];
    onChange({
      groups: [
        ...filterState.groups,
        { id: createId(), conditions: firstQuestion ? [createCondition(firstQuestion)] : [] },
      ],
    });
  }

  function removeGroup(groupId: string) {
    onChange({ groups: filterState.groups.filter((group) => group.id !== groupId) });
  }

  function addCondition(groupId: string) {
    const firstQuestion = filterableQuestions[0];
    if (!firstQuestion) {return;}

    updateGroup(groupId, (group) => ({
      ...group,
      conditions: [...group.conditions, createCondition(firstQuestion)],
    }));
  }

  function removeCondition(groupId: string, conditionId: string) {
    updateGroup(groupId, (group) => ({
      ...group,
      conditions: group.conditions.filter((condition) => condition.id !== conditionId),
    }));
  }

  function updateCondition(groupId: string, conditionId: string, updater: (condition: FilterCondition) => FilterCondition) {
    updateGroup(groupId, (group) => ({
      ...group,
      conditions: group.conditions.map((condition) =>
        condition.id === conditionId ? updater(condition) : condition,
      ),
    }));
  }

  function handleQuestionChange(groupId: string, conditionId: string, questionId: string) {
    const question = filterableQuestions.find((q) => q.id === questionId);
    if (!question) {return;}

    updateCondition(groupId, conditionId, () => ({ ...createCondition(question), id: conditionId }));
  }

  return (
    <div className="flex flex-col gap-3">
      {filterState.groups.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum filtro ainda. Adicione um grupo para começar.
        </p>
      )}

      {filterState.groups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 && (
            <div className="my-2 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase text-muted-foreground">Ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          <Card>
            <CardContent className="flex flex-col gap-3">
              {group.conditions.map((condition, conditionIndex) => {
                const question = filterableQuestions.find((q) => q.id === condition.questionId);
                const operators = question ? OPERATORS_BY_QUESTION_TYPE[question.questionType] ?? [] : [];

                return (
                  <div key={condition.id} className="flex flex-wrap items-center gap-2">
                    {conditionIndex > 0 && (
                      <span className="text-xs font-semibold uppercase text-muted-foreground">E</span>
                    )}

                    <Select
                      value={condition.questionId}
                      onValueChange={(questionId) => handleQuestionChange(group.id, condition.id, questionId)}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Selecione uma pergunta" />
                      </SelectTrigger>
                      <SelectContent>
                        {filterableQuestions.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(operator) =>
                        updateCondition(group.id, condition.id, (current) => ({
                          ...current,
                          operator: operator as FilterCondition['operator'],
                        }))
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Operador" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <ConditionValueInput
                      question={question}
                      condition={condition}
                      onChange={(value) =>
                        updateCondition(group.id, condition.id, (current) => ({ ...current, value }))
                      }
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(group.id, condition.id)}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                );
              })}

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" size="sm" onClick={() => addCondition(group.id)}>
                  <PlusIcon className="size-4" /> Adicionar condição (E)
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeGroup(group.id)}>
                  Remover grupo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="self-start" onClick={addGroup}>
        <PlusIcon className="size-4" /> Adicionar grupo (Ou)
      </Button>
    </div>
  );
}

interface ConditionValueInputProps {
  question: IQuestion | undefined;
  condition: FilterCondition;
  onChange: (value: FilterCondition['value']) => void;
}

function ConditionValueInput({ question, condition, onChange }: ConditionValueInputProps) {
  if (!question) {
    return null;
  }

  if (question.questionType === QuestionType.STARS) {
    return (
      <Select value={String(condition.value)} onValueChange={(value) => onChange(Number(value))}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Nota" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: question.max ?? 5 }, (_, index) => index + 1).map((star) => (
            <SelectItem key={star} value={String(star)}>
              {star} {star === 1 ? 'estrela' : 'estrelas'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (question.questionType === QuestionType.TEXT) {
    return (
      <Input
        className="w-[220px]"
        placeholder="Texto..."
        value={String(condition.value ?? '')}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  const options = question.options ?? [];
  const selected = Array.isArray(condition.value) ? condition.value : [];

  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Badge
            key={option}
            variant={isSelected ? 'default' : 'outline'}
            className="cursor-pointer select-none"
            onClick={() =>
              onChange(
                isSelected ? selected.filter((value) => value !== option) : [...selected, option],
              )
            }
          >
            {option}
          </Badge>
        );
      })}
    </div>
  );
}
