export const QuestionType = {
  TEXT: 'TEXT',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  CHECKBOX: 'CHECKBOX',
  DROPDOWN: 'DROPDOWN',
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

export interface IQuestion {
  id: string;
  formId: string;
  text: string;
  questionType: QuestionType;
  order: number;
  options?: string[];
  createdAt: Date;
}

export type IQuestionInsert = Omit<IQuestion, 'id' | 'formId' | 'order' | 'createdAt'>;
