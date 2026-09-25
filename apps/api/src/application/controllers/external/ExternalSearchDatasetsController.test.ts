import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { describe, expect, it, vi } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import type { AlgoliaGateway } from '@infra/gateways/AlgoliaGateway';

import { ExternalSearchDatasetsController } from './ExternalSearchDatasetsController';

function createController(options: {
  searchImpl?: () => Promise<AlgoliaGateway.DatasetRecord[]>;
}) {
  const algoliaGateway = {
    search: vi.fn(options.searchImpl ?? (() => Promise.resolve([]))),
  } as unknown as AlgoliaGateway;

  const controller = new ExternalSearchDatasetsController(algoliaGateway);

  return { controller, algoliaGateway };
}

function request(
  overrides: Partial<Controller.Request<'apiKey', any, Record<string, never>, ExternalSearchDatasetsController.QueryParams>> = {},
): Controller.Request<'apiKey', any, Record<string, never>, ExternalSearchDatasetsController.QueryParams> {
  return {
    body: {},
    params: {},
    queryParams: {},
    ip: null,
    userAgent: null,
    accountId: 'account-1',
    apiKeyId: 'key-1',
    scopes: [ApiKeyScope.PORTAL_READ],
    ...overrides,
  };
}

describe('ExternalSearchDatasetsController', () => {
  it('denies when the key lacks the portal:read scope', async () => {
    const { controller } = createController({});

    await expect(
      controller.execute(request({ scopes: [ApiKeyScope.DATA_READ] })),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it('searches with the given query and sort with a valid scope', async () => {
    const results = [{ formId: 'form-1' } as any];
    const { controller, algoliaGateway } = createController({
      searchImpl: () => Promise.resolve(results),
    });

    const response = await controller.execute(request({ queryParams: { q: 'rain', sort: 'relevance' } }));

    expect(response).toEqual({ statusCode: 200, body: { results } });
    expect(algoliaGateway.search).toHaveBeenCalledWith('rain', 'relevance');
  });

  it('defaults the query to an empty string when omitted', async () => {
    const { controller, algoliaGateway } = createController({});

    await controller.execute(request({ queryParams: {} }));

    expect(algoliaGateway.search).toHaveBeenCalledWith('', undefined);
  });
});
