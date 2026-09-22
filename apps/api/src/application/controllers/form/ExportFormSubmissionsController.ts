import { Controller } from '@application/contracts/Controller';
import { GetFormSubmissionsUseCase } from '@application/usecases/form/GetFormSubmissionsUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { slugify } from '@shared/utils/slugify';
import { toCsv } from '@shared/utils/toCsv';

const MAX_EXPORT_ROWS = 20_000;

@Injectable()
export class ExportFormSubmissionsController extends Controller<'private', string> {
  constructor(private readonly getFormSubmissionsUseCase: GetFormSubmissionsUseCase) {
    super();
  }

  protected override async handle(
    { params, accountId }: Controller.Request<'private', any, ExportFormSubmissionsController.Params>,
  ): Promise<Controller.Response<string>> {
    const { form, questions, submissions } = await this.getFormSubmissionsUseCase.execute({
      formId: params.formId,
      accountId,
      limit: MAX_EXPORT_ROWS,
    });

    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
    const headers = ['Enviado em', ...sortedQuestions.map((question) => question.text)];

    const csvRows = submissions.map((submission) => {
      const answerByQuestionId = new Map(submission.answers.map((answer) => [answer.questionId, answer.value]));

      return [
        submission.submittedAt.toISOString(),
        ...sortedQuestions.map((question) => {
          const value = answerByQuestionId.get(question.id);

          return Array.isArray(value) ? value.join(', ') : (value ?? '');
        }),
      ];
    });

    const filename = slugify(form.title) || form.id;

    return {
      statusCode: 200,
      isRawBody: true,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
      body: toCsv(headers, csvRows),
    };
  }
}

export namespace ExportFormSubmissionsController {
  export type Params = {
    formId: string;
  };
}
