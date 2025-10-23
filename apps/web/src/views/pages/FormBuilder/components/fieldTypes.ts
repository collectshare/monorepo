import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import {
  CheckSquareIcon,
  ChevronsUpDownIcon,
  CircleDotIcon,
  FileUpIcon,
  StarIcon,
  TypeIcon,
} from 'lucide-react';

export const fieldTypes = [
  {
    type: QuestionType.TEXT,
    label: 'Texto',
    icon: TypeIcon,
  },
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
  {
    type: QuestionType.STARS,
    label: 'Estrelas',
    icon: StarIcon,
  },
  {
    type: QuestionType.FILE,
    label: 'Arquivo',
    icon: FileUpIcon,
  },
];
