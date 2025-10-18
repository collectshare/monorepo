export interface IForm {
  id: string;
  accountId: string;
  title: string;
  description?: string;
  onePage: boolean;
  tags?: string[];
  isAnonymous: boolean;
  submissionCount?: number;
  createdAt: string;
}

export type IFormInsert = Omit<IForm, 'id' | 'accountId' | 'createdAt'> & {
  id?: string;
};
