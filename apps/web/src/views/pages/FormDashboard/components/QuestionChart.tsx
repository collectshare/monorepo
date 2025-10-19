import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { IFormSubmission } from '@monorepo/shared/types/IFormSubmission';
import { IQuestion } from '@monorepo/shared/types/IQuestion';

import { Chart } from './Chart';
import { PieChart } from './PieChart';

interface QuestionChartProps {
  question: IQuestion;
  responses: IFormSubmission[];
}

interface IAnswer {
  questionId: string;
  value: string | string[];
}

interface IFormResponseWithAnswers extends IFormSubmission {
  answers: IAnswer[];
}

export function QuestionChart({ question, responses }: QuestionChartProps) {
  const data = (responses as IFormResponseWithAnswers[]).reduce((acc, response) => {
    const answer = response.answers.find((a) => a.questionId === question.id);

    if (!answer) {
      return acc;
    }

    if (Array.isArray(answer.value)) {
      answer.value.forEach((value: string) => {
        const existing = acc.find((item) => item.name === value);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: value, value: 1 });
        }
      });
    } else {
      const existing = acc.find((item) => item.name === answer.value);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: answer.value as string, value: 1 });
      }
    }

    return acc;
  }, [] as { name: string; value: number }[]);

  const renderChart = () => {
    switch (question.questionType) {
      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.CHECKBOX:
      case QuestionType.DROPDOWN:
        return <PieChart data={data} />;
      case QuestionType.TEXT:
        return (
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full table-auto">
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return <Chart data={data} />;
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{question.text}</h3>
      {renderChart()}
    </div>
  );
}
