import { createHash } from 'node:crypto';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';

export function normalizeQuestionText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function hashQuestionContent(questionType: QuestionType, text: string): string {
  const normalizedText = normalizeQuestionText(text);

  return createHash('sha256')
    .update(`${questionType}\u0000${normalizedText}`)
    .digest('hex');
}
