import {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyEventV2WithLambdaAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { Controller } from '@application/contracts/Controller';
import { toErrorPayload } from '@application/errors/toErrorPayload';
import { ApiKeyAuthorizerContext } from '@main/functions/external/apiKeyAuthorizer';
import { lambdaBodyParser } from '@main/utils/lambdaBodyParser';
import { lambdaErrorResponse } from '@main/utils/lambdaErrorResponse';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';

type Event =
  | APIGatewayProxyEventV2
  | APIGatewayProxyEventV2WithJWTAuthorizer
  | APIGatewayProxyEventV2WithLambdaAuthorizer<ApiKeyAuthorizerContext>;

export function lambdaHttpAdapter(controller: Controller<any, unknown>) {
  return async (event: Event): Promise<APIGatewayProxyResultV2> => {
    try {
      const body = lambdaBodyParser(event.body, {
        contentType: event.headers?.['content-type'],
        isBase64Encoded: event.isBase64Encoded,
      });
      const params = event.pathParameters ?? {};
      const queryParams = event.queryStringParameters ?? {};

      let accountId: string | null = null;
      let apiKeyId: string | undefined;
      let scopes: ApiKeyScope[] | undefined;

      if ('authorizer' in event.requestContext) {
        const { authorizer } = event.requestContext;

        if ('jwt' in authorizer) {
          accountId = authorizer.jwt.claims.internalId as string;
        } else if ('lambda' in authorizer) {
          accountId = authorizer.lambda.accountId;
          apiKeyId = authorizer.lambda.apiKeyId;
          scopes = authorizer.lambda.scopes.split(',').filter(Boolean) as ApiKeyScope[];
        }
      }

      const ip = event.requestContext.http.sourceIp;
      const userAgent = event.requestContext.http.userAgent;

      const response = await controller.execute({
        body,
        params,
        queryParams,
        accountId,
        apiKeyId,
        scopes,
        ip,
        userAgent,
      } as Controller.Request<any>);

      return {
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body === undefined
          ? undefined
          : (response.isRawBody ? (response.body as unknown as string) : JSON.stringify(response.body)),
      };
    } catch (error) {
      return lambdaErrorResponse(toErrorPayload(error));
    }
  };
}
