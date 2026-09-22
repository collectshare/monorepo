import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { IFormSubmission } from '@monorepo/shared/types/IFormSubmission';
import { IQuestion } from '@monorepo/shared/types/IQuestion';

import { FilterCondition, FilterState } from './types';

function toArray(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function matchesCondition(
  submission: IFormSubmission,
  condition: FilterCondition,
  questionsById: Map<string, IQuestion>,
): boolean {
  const question = questionsById.get(condition.questionId);
  const answer = submission.answers.find((a) => a.questionId === condition.questionId);

  if (!question || !answer?.value) {
    return false;
  }

  switch (question.questionType) {
    case QuestionType.STARS: {
      const answerValue = Number(Array.isArray(answer.value) ? answer.value[0] : answer.value);
      const target = Number(condition.value);

      if (Number.isNaN(answerValue) || Number.isNaN(target)) {
        return false;
      }

      if (condition.operator === 'eq') {return answerValue === target;}
      if (condition.operator === 'gte') {return answerValue >= target;}
      if (condition.operator === 'lte') {return answerValue <= target;}
      return false;
    }

    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.DROPDOWN: {
      if (condition.operator !== 'isOneOf') {
        return false;
      }

      const selected = toArray(condition.value as string | string[]);
      const answerValue = Array.isArray(answer.value) ? answer.value[0] : answer.value;
      return selected.includes(answerValue);
    }

    case QuestionType.CHECKBOX: {
      const selected = toArray(condition.value as string | string[]);
      const answerValues = toArray(answer.value);

      if (condition.operator === 'containsAny') {
        return selected.some((value) => answerValues.includes(value));
      }
      if (condition.operator === 'containsAll') {
        return selected.every((value) => answerValues.includes(value));
      }
      return false;
    }

    case QuestionType.TEXT: {
      if (condition.operator !== 'contains') {
        return false;
      }

      const answerValue = Array.isArray(answer.value) ? answer.value.join(' ') : answer.value;
      const target = String(condition.value ?? '').toLowerCase();
      return target.length > 0 && answerValue.toLowerCase().includes(target);
    }

    default:
      return false;
  }
}

export function applyFilters(
  responses: IFormSubmission[],
  filterState: FilterState,
  questions: IQuestion[],
): IFormSubmission[] {
  const activeGroups = filterState.groups.filter((group) => group.conditions.length > 0);

  if (activeGroups.length === 0) {
    return responses;
  }

  const questionsById = new Map(questions.map((question) => [question.id, question]));

  return responses.filter((submission) =>
    activeGroups.some((group) =>
      group.conditions.every((condition) => matchesCondition(submission, condition, questionsById)),
    ),
  );
}
