import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { IFormSubmission } from '@monorepo/shared/types/IFormSubmission';
import { IQuestion } from '@monorepo/shared/types/IQuestion';
import { Button } from '@monorepo/ui';
import { ChartColumnIcon, TableIcon } from 'lucide-react';
import { useState } from 'react';

import { AnswersTable } from './AnswersTable';
import { Chart } from './Chart';
import { PieChart } from './PieChart';
import { StarRatingChart } from './StarRatingChart';

const CHARTABLE_QUESTION_TYPES = [
  QuestionType.CHECKBOX,
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.DROPDOWN,
  QuestionType.STARS,
];

interface QuestionChartProps {
  question: IQuestion;
  responses: IFormSubmission[];
}

export function QuestionChart({ question, responses }: QuestionChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const canToggleView = CHARTABLE_QUESTION_TYPES.includes(question.questionType);

  const data = responses.reduce((acc, response) => {
    const answer = response.answers.find((a) => a.questionId === question.id);

    if (!answer?.value) {
      return acc;
    }

    let currentAnswerValues = answer.value;

    if (
      question.questionType === QuestionType.CHECKBOX &&
      typeof currentAnswerValues === 'string'
    ) {
      currentAnswerValues = currentAnswerValues.split(',').map((s) => s.trim());
    }

    if (Array.isArray(currentAnswerValues)) {
      currentAnswerValues.forEach((value: string) => {
        const existing = acc.find((item) => item.name === value);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: value, value: 1 });
        }
      });
    } else {
      const value = String(currentAnswerValues);
      const existing = acc.find((item) => item.name === value);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: value, value: 1 });
      }
    }

    return acc;
  }, [] as { name: string; value: number }[]);

  const renderChart = () => {
    if (canToggleView && viewMode === 'table') {
      return <AnswersTable question={question} responses={responses} />;
    }

    switch (question.questionType) {
      case QuestionType.CHECKBOX:
        return <Chart data={data} label="Quantidade" />;
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.DROPDOWN:
        return <PieChart data={data} />;
      case QuestionType.TEXT:
        return <AnswersTable question={question} responses={responses} />;
      case QuestionType.FILE:
        return (
          <AnswersTable
            question={question}
            responses={responses}
            valueColumnTitle="Arquivo"
            renderValue={(value) => (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Baixar arquivo
              </a>
            )}
          />
        );
      case QuestionType.STARS:
        return <StarRatingChart data={data} />;
      default:
        return <Chart data={data} />;
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{question.text}</h3>
        {canToggleView && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewMode((mode) => (mode === 'chart' ? 'table' : 'chart'))}
          >
            {viewMode === 'chart' ? (
              <>
                <TableIcon className="size-4" /> Ver tabela
              </>
            ) : (
              <>
                <ChartColumnIcon className="size-4" /> Ver gráfico
              </>
            )}
          </Button>
        )}
      </div>
      {renderChart()}
    </div>
  );
}
