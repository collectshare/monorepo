import { Controller } from '@application/contracts/Controller';
import { CreateApiKeyUseCase } from '@application/usecases/apikeys/CreateApiKeyUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { z } from 'zod';

const createApiKeySchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.nativeEnum(ApiKeyScope)).min(1).default([ApiKeyScope.PORTAL_READ]),
});

type CreateApiKeyBody = z.infer<typeof createApiKeySchema>;

@Injectable()
@Schema(createApiKeySchema)
export class CreateApiKeyController extends Controller<'private', CreateApiKeyController.Response> {
  constructor(private readonly createApiKeyUseCase: CreateApiKeyUseCase) {
    super();
  }

  protected override async handle(
    { body, accountId }: Controller.Request<'private', CreateApiKeyBody>,
  ): Promise<Controller.Response<CreateApiKeyController.Response>> {
    const { apiKey, rawKey } = await this.createApiKeyUseCase.execute({
      accountId,
      name: body.name,
      scopes: body.scopes,
    });

    return {
      statusCode: 201,
      body: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        createdAt: apiKey.createdAt.toISOString(),
        key: rawKey,
      },
    };
  }
}

export namespace CreateApiKeyController {
  export type Response = {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: ApiKeyScope[];
    createdAt: string;
    key: string;
  };
}
