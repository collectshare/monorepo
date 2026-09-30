import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

import { Controller } from '@application/contracts/Controller';
import { BadRequest } from '@application/errors/http/BadRequest';
import { errorResponse, JsonRpcErrorCode } from '@application/mcp/jsonRpc';
import { McpTokenAuthenticator } from '@application/oauth/McpTokenAuthenticator';
import { lambdaBodyParser } from '@main/utils/lambdaBodyParser';

type LambdaMcpAdapterOptions = {
  controller: Controller<'private', unknown>;
  authenticator: Pick<McpTokenAuthenticator, 'authenticate'>;
  /** Public base URL of the API; the OAuth discovery documents hang off it. */
  issuer: string;
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonRpcError(statusCode: number, code: number, message: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(errorResponse(null, code, message)),
  };
}

function extractBearerToken(event: APIGatewayProxyEventV2): string | null {
  const header = event.headers?.authorization ?? event.headers?.Authorization;
  const match = header?.match(/^Bearer\s+(\S+)\s*$/i);

  return match ? match[1] : null;
}

/**
 * Lambda adapter for `/mcp`. It authenticates inside the Lambda (instead of an API Gateway
 * authorizer) because HTTP API cannot add `WWW-Authenticate`, which MCP clients need to find
 * the OAuth discovery document. Only MCP access tokens are accepted — never `x-api-key`.
 */
export function lambdaMcpAdapter({ controller, authenticator, issuer }: LambdaMcpAdapterOptions) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    try {
      if (event.requestContext.http.method !== 'POST') {
        return { statusCode: 405, headers: { Allow: 'POST' } };
      }

      const token = extractBearerToken(event);
      const identity = await authenticator.authenticate(token);

      if (!identity) {
        const challenge = [`Bearer resource_metadata="${issuer}/.well-known/oauth-protected-resource/mcp"`];

        if (token) {
          challenge.push('error="invalid_token"');
        }

        return {
          statusCode: 401,
          headers: { 'WWW-Authenticate': challenge.join(', ') },
        };
      }

      let body: unknown;

      try {
        // Always JSON: the MCP transport never sends form bodies.
        body = lambdaBodyParser(event.body, { isBase64Encoded: event.isBase64Encoded });
      } catch (error) {
        if (error instanceof BadRequest) {
          return jsonRpcError(400, JsonRpcErrorCode.ParseError, 'Parse error: the body is not valid JSON.');
        }

        throw error;
      }

      const response = await controller.execute({
        body,
        params: {},
        queryParams: {},
        accountId: identity.accountId,
        ip: event.requestContext.http.sourceIp,
        userAgent: event.requestContext.http.userAgent,
      } as Controller.Request<'private'>);

      return {
        statusCode: response.statusCode,
        headers: response.body === undefined ? undefined : JSON_HEADERS,
        body: response.body === undefined ? undefined : JSON.stringify(response.body),
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);

      return jsonRpcError(500, JsonRpcErrorCode.InternalError, 'Internal server error.');
    }
  };
}
