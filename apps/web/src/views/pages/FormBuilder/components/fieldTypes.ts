import { CheckSquareIcon, ChevronsUpDownIcon, CircleDotIcon, TypeIcon } from 'lucide-react';

import { QuestionType } from '@/app/entities/IQuestion';

export const fieldTypes = [
  {
    type: QuestionType.TEXT,
    label: 'Texto',
    icon: TypeIcon },
  {
    type: QuestionType.MULTIPLE_CHOICE,
    label: 'Múltipla escolha',
    icon: CircleDotIcon,
  },
  {
    type: QuestionType.CHECKBOX,
    label: 'Caixa de seleção',
    icon: CheckSquareIcon,
  },
  {
    type: QuestionType.DROPDOWN,
    label: 'Dropdown',
    icon: ChevronsUpDownIcon,
  },
];
