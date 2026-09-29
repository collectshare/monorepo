import { describe, expect, it, vi } from 'vitest';

import { CreateFormController } from '@application/controllers/form/CreateFormController';
import { GetFormController } from '@application/controllers/form/GetFormController';
import { GetFormSubmissionsController } from '@application/controllers/form/GetFormSubmissionsController';
import { InsertQuestionsInFormController } from '@application/controllers/form/InsertQuestionsInFormController';
import { ListFormsController } from '@application/controllers/form/ListFormsController';
import { UpdateFormDetailsController } from '@application/controllers/form/UpdateFormDetailsController';
import { GetPublishedFormDataController } from '@application/controllers/portal/GetPublishedFormDataController';
import { SearchDatasetsController } from '@application/controllers/portal/SearchDatasetsController';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';

import { McpDispatcher } from '../McpDispatcher';
import { McpToolContext } from '../McpTool';
import { ToolRegistry } from '../ToolRegistry';
import { CreateFormTool } from './CreateFormTool';
import { GetDatasetDataTool } from './GetDatasetDataTool';
import { GetFormSubmissionsTool } from './GetFormSubmissionsTool';
import { GetFormTool } from './GetFormTool';
import { InsertQuestionsTool } from './InsertQuestionsTool';
import { ListFormsTool } from './ListFormsTool';
import { SearchDatasetsTool } from './SearchDatasetsTool';
import { UpdateFormTool } from './UpdateFormTool';

const context: McpToolContext = { accountId: 'account-1', ip: '1.2.3.4', userAgent: 'agent' };

function stub<T>(body?: unknown, statusCode = 200) {
  return { execute: vi.fn().mockResolvedValue({ statusCode, body }) } as unknown as T & { execute: ReturnType<typeof vi.fn> };
}

function createTools(overrides: Partial<Record<string, unknown>> = {}) {
  const controllers = {
    list: stub<ListFormsController>({ forms: [] }),
    get: stub<GetFormController>({ form: { id: 'f1' }, questions: [] }),
    create: stub<CreateFormController>({ formId: 'f1' }, 201),
    update: stub<UpdateFormDetailsController>(undefined, 204),
    insert: stub<InsertQuestionsInFormController>(undefined, 204),
    submissions: stub<GetFormSubmissionsController>({ submissions: [], questions: [] }),
    search: stub<SearchDatasetsController>({ results: [] }),
    dataset: stub<GetPublishedFormDataController>({ rows: [] }),
    ...overrides,
  };

  const tools = {
    list: new ListFormsTool(controllers.list),
    get: new GetFormTool(controllers.get),
    create: new CreateFormTool(controllers.create),
    update: new UpdateFormTool(controllers.update),
    insert: new InsertQuestionsTool(controllers.insert),
    submissions: new GetFormSubmissionsTool(controllers.submissions),
    search: new SearchDatasetsTool(controllers.search),
    dataset: new GetDatasetDataTool(controllers.dataset),
  };

  const registry = new ToolRegistry(
    tools.list, tools.get, tools.create, tools.update, tools.insert, tools.submissions, tools.search, tools.dataset,
  );

  return { controllers, tools, registry };
}

describe('tool catalog', () => {
  it('lists exactly the eight tools', () => {
    const { registry } = createTools();

    expect(registry.list().map(tool => tool.name).sort()).toEqual([
      'create_form',
      'get_dataset_data',
      'get_form',
      'get_form_submissions',
      'insert_questions',
      'list_forms',
      'search_datasets',
      'update_form',
    ]);
  });

  it('describes every tool with an object inputSchema, a description and annotations', () => {
    const { registry } = createTools();

    for (const tool of registry.list()) {
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.inputSchema).toMatchObject({ type: 'object' });
      expect(tool.inputSchema).not.toHaveProperty('$schema');
      expect(tool.annotations).toHaveProperty('readOnlyHint');
    }
  });

  it('never exposes an accountId property', () => {
    const { registry } = createTools();

    for (const tool of registry.list()) {
      expect(JSON.stringify(tool.inputSchema)).not.toContain('accountId');
    }
  });

  it('flags read-only, write and destructive tools as specified', () => {
    const byName = Object.fromEntries(createTools().registry.list().map(tool => [tool.name, tool.annotations]));

    for (const name of ['list_forms', 'get_form', 'get_form_submissions', 'search_datasets', 'get_dataset_data']) {
      expect(byName[name]).toMatchObject({ readOnlyHint: true });
    }

    expect(byName.create_form).toMatchObject({ readOnlyHint: false, destructiveHint: false });
    expect(byName.update_form).toMatchObject({ readOnlyHint: false, destructiveHint: true, idempotentHint: true });
    expect(byName.insert_questions).toMatchObject({ readOnlyHint: false, destructiveHint: true, idempotentHint: true });
  });

  it('derives input schemas from the controller Zod schemas', () => {
    const { registry } = createTools();
    const schemas = Object.fromEntries(registry.list().map(tool => [tool.name, tool.inputSchema as any]));

    expect(schemas.create_form.required).toEqual(['title']);
    expect(schemas.create_form.properties).toHaveProperty('isPublished');
    expect(schemas.update_form.required).toEqual(expect.arrayContaining(['formId', 'title']));
    expect(schemas.insert_questions.required).toEqual(expect.arrayContaining(['formId', 'questions']));
    expect(schemas.insert_questions.properties.questions.type).toBe('array');
    expect(schemas.get_dataset_data.required).toEqual(['formId']);
    expect(schemas.list_forms.properties ?? {}).toEqual({});
  });

  it('accepts a representative valid call for every body-based schema', async () => {
    const { tools } = createTools();

    await expect(tools.create.execute({ title: 'T' }, context)).resolves.toBeDefined();
    await expect(tools.update.execute({ formId: 'f1', title: 'T' }, context)).resolves.toBeDefined();
    await expect(tools.insert.execute({
      formId: 'f1',
      questions: [{ text: 'Nome?', questionType: 'TEXT', order: 1 }],
    }, context)).resolves.toBeDefined();
  });
});

describe('account-owned tools', () => {
  it('list_forms runs the private controller as the token account', async () => {
    const { tools, controllers } = createTools();

    await expect(tools.list.execute({}, context)).resolves.toEqual({ forms: [] });
    expect(controllers.list.execute).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'account-1', ip: '1.2.3.4', userAgent: 'agent',
    }));
  });

  it('create_form forwards the body and the token account only', async () => {
    const { tools, controllers } = createTools();

    await expect(tools.create.execute({ title: 'Pesquisa', accountId: 'victim' }, context)).resolves.toEqual({ formId: 'f1' });

    const request = controllers.create.execute.mock.calls[0][0];
    expect(request.accountId).toBe('account-1');
    expect(request.body).toMatchObject({ title: 'Pesquisa', isPublished: true });
    expect(request.body).not.toHaveProperty('accountId');
  });

  it('update_form splits formId (path) from the body and acknowledges 204', async () => {
    const { tools, controllers } = createTools();

    await expect(tools.update.execute({ formId: 'f1', title: 'Novo' }, context)).resolves.toEqual({ ok: true });

    const request = controllers.update.execute.mock.calls[0][0];
    expect(request.params).toEqual({ formId: 'f1' });
    expect(request.body).toMatchObject({ title: 'Novo' });
    expect(request.body).not.toHaveProperty('formId');
    expect(request.accountId).toBe('account-1');
  });

  it('insert_questions splits formId from the questions body', async () => {
    const { tools, controllers } = createTools();
    const questions = [{ text: 'Q?', questionType: 'TEXT', order: 1 }];

    await expect(tools.insert.execute({ formId: 'f1', questions }, context)).resolves.toEqual({ ok: true });

    const request = controllers.insert.execute.mock.calls[0][0];
    expect(request.params).toEqual({ formId: 'f1' });
    expect(request.body).toEqual({ questions });
    expect(request.accountId).toBe('account-1');
  });

  it('requires formId for path-based tools', async () => {
    const { tools } = createTools();

    await expect(tools.update.execute({ title: 'x' }, context)).rejects.toThrow();
    await expect(tools.submissions.execute({}, context)).rejects.toThrow();
    await expect(tools.get.execute({}, context)).rejects.toThrow();
  });

  it('get_form_submissions truncates to the default limit and reports totals', async () => {
    const submissions = Array.from({ length: 120 }, (_, index) => ({ id: `s${index}` }));
    const { tools } = createTools({ submissions: stub<GetFormSubmissionsController>({ submissions, questions: [{ id: 'q1' }] }) });

    const result = await tools.submissions.execute({ formId: 'f1' }, context) as any;

    expect(result.submissions).toHaveLength(50);
    expect(result).toMatchObject({ total: 120, truncated: true, questions: [{ id: 'q1' }] });
  });

  it('get_form_submissions clamps limit to 200 and does not truncate small forms', async () => {
    const submissions = Array.from({ length: 250 }, (_, index) => ({ id: `s${index}` }));
    const big = createTools({ submissions: stub<GetFormSubmissionsController>({ submissions, questions: [] }) });

    const clamped = await big.tools.submissions.execute({ formId: 'f1', limit: 1000 }, context) as any;
    expect(clamped.submissions).toHaveLength(200);
    expect(clamped.truncated).toBe(true);

    const small = createTools({ submissions: stub<GetFormSubmissionsController>({ submissions: [{ id: 's1' }], questions: [] }) });
    const whole = await small.tools.submissions.execute({ formId: 'f1', limit: 10 }, context) as any;
    expect(whole).toMatchObject({ total: 1, truncated: false });
  });

  it('surfaces ownership rejections as isError results through the dispatcher', async () => {
    const rejecting = { execute: vi.fn().mockRejectedValue(new NotAllowedError()) } as unknown as UpdateFormDetailsController;
    const { registry } = createTools({ update: rejecting });
    const dispatcher = new McpDispatcher(registry);

    const response = await dispatcher.handle({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'update_form', arguments: { formId: 'other-account-form', title: 'x' } },
    }, context) as any;

    expect(response.result.isError).toBe(true);
    expect(response.result.content[0].text).toContain('NOT_ALLOWED');
  });
});

describe('public dataset tools', () => {
  it('get_form runs the public controller without an account', async () => {
    const { tools, controllers } = createTools();

    await tools.get.execute({ formId: 'f1' }, context);

    expect(controllers.get.execute).toHaveBeenCalledWith(expect.objectContaining({
      accountId: null, params: { formId: 'f1' },
    }));
  });

  it('search_datasets forwards q and sort', async () => {
    const { tools, controllers } = createTools();

    await tools.search.execute({ q: 'saúde', sort: 'trending' }, context);

    expect(controllers.search.execute.mock.calls[0][0].queryParams).toEqual({ q: 'saúde', sort: 'trending' });
  });

  it('search_datasets rejects an unknown sort', async () => {
    const { tools } = createTools();

    await expect(tools.search.execute({ sort: 'random' }, context)).rejects.toThrow();
  });

  it('get_dataset_data defaults the limit to 20 and passes the cursor through', async () => {
    const { tools, controllers } = createTools({ dataset: stub<GetPublishedFormDataController>({ rows: [{ a: 1 }], nextCursor: 'n1' }) });

    const result = await tools.dataset.execute({ formId: 'f1', cursor: 'c0' }, context);

    expect(result).toEqual({ rows: [{ a: 1 }], nextCursor: 'n1' });
    expect(controllers.dataset.execute.mock.calls[0][0]).toMatchObject({
      accountId: null,
      params: { formId: 'f1' },
      queryParams: { cursor: 'c0', limit: '20' },
    });
  });

  it('get_dataset_data clamps limit to 100', async () => {
    const { tools, controllers } = createTools();

    await tools.dataset.execute({ formId: 'f1', limit: 1000 }, context);

    expect(controllers.dataset.execute.mock.calls[0][0].queryParams.limit).toBe('100');
  });
});
