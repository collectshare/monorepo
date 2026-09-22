import { QuestionType } from '@monorepo/shared/enums/QuestionType';

export type FilterOperator = 'eq' | 'gte' | 'lte' | 'isOneOf' | 'containsAny' | 'containsAll' | 'contains';

export type FilterCondition = {
  id: string;
  questionId: string;
  operator: FilterOperator;
  value: string | string[] | number;
};

export type FilterGroup = {
  id: string;
  conditions: FilterCondition[];
};

export type FilterState = {
  groups: FilterGroup[];
};

export const EMPTY_FILTER_STATE: FilterState = { groups: [] };

export const OPERATORS_BY_QUESTION_TYPE: Partial<Record<QuestionType, { value: FilterOperator; label: string }[]>> = {
  [QuestionType.STARS]: [
    { value: 'eq', label: 'é igual a' },
    { value: 'gte', label: 'é maior ou igual a' },
    { value: 'lte', label: 'é menor ou igual a' },
  ],
  [QuestionType.MULTIPLE_CHOICE]: [{ value: 'isOneOf', label: 'é um de' }],
  [QuestionType.DROPDOWN]: [{ value: 'isOneOf', label: 'é um de' }],
  [QuestionType.CHECKBOX]: [
    { value: 'containsAny', label: 'contém qualquer um de' },
    { value: 'containsAll', label: 'contém todos' },
  ],
  [QuestionType.TEXT]: [{ value: 'contains', label: 'contém o texto' }],
};

export const FILTERABLE_QUESTION_TYPES = Object.keys(OPERATORS_BY_QUESTION_TYPE) as QuestionType[];
