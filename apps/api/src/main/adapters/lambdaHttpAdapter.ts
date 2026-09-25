import {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyEventV2WithLambdaAuthorizer,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { ZodError } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { ApplicationError } from '@application/errors/application/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';
import { HttpError } from '@application/errors/http/HttpError';
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
      const body = lambdaBodyParser(event.body);
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
      if (error instanceof ZodError) {
        return lambdaErrorResponse({
          statusCode: 400,
          code: ErrorCode.VALIDATION,
          message: error.issues.map(issue => ({
            field: issue.path.join('.'),
            error: issue.message,
          })),
        });
      }

      if (error instanceof HttpError) {
        return lambdaErrorResponse(error);
      }

      if (error instanceof ApplicationError) {
        return lambdaErrorResponse({
          statusCode: error.statusCode ?? 400,
          code: error.code,
          message: error.message,
        });
      }

      // eslint-disable-next-line no-console
      console.log(error);

      return lambdaErrorResponse({
        statusCode: 500,
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error.',
      });
    }
  };
}
