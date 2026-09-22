import { Controller } from '@application/contracts/Controller';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { ExportPublishedFormDataQuery } from '@application/queries/ExportPublishedFormDataQuery';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { Injectable } from '@kernel/decorators/Injectable';
import { slugify } from '@shared/utils/slugify';
import { toCsv } from '@shared/utils/toCsv';

@Injectable()
export class ExportPublishedFormDataController extends Controller<'public', string> {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly exportPublishedFormDataQuery: ExportPublishedFormDataQuery,
  ) {
    super();
  }

  protected override async handle(
    { params }: Controller.Request<'public', any, ExportPublishedFormDataController.Params>,
  ): Promise<Controller.Response<string>> {
    const form = await this.formRepository.findById(params.formId);

    if (!form || !form.isPublished) {
      throw new ResourceNotFound('Dataset not found');
    }

    const { questions, rows } = await this.exportPublishedFormDataQuery.execute(params.formId);

    const headers = ['Enviado em', ...questions.map(question => question.text)];

    const csvRows = rows.map((row) => {
      const answerByQuestionId = new Map(row.answers.map(answer => [answer.questionId, answer.value]));

      return [
        row.submittedAt.toISOString(),
        ...questions.map((question) => {
          const value = answerByQuestionId.get(question.id);

          return Array.isArray(value) ? value.join(', ') : (value ?? '');
        }),
      ];
    });

    const filename = slugify(form.title) || form.id;

    await this.formRepository.incrementDownloadCount(form.id).catch(() => undefined);

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

export namespace ExportPublishedFormDataController {
  export type Params = {
    formId: string;
  };
}
