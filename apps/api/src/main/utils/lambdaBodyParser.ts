import { APIGatewayProxyEventV2 } from 'aws-lambda';

import { BadRequest } from '@application/errors/http/BadRequest';

type LambdaBodyParserOptions = {
  contentType?: string;
  isBase64Encoded?: boolean;
};

export function lambdaBodyParser(
  body: APIGatewayProxyEventV2['body'],
  { contentType, isBase64Encoded }: LambdaBodyParserOptions = {},
) {
  try {
    if (!body) {
      return {};
    }

    const rawBody = isBase64Encoded ? Buffer.from(body, 'base64').toString('utf-8') : body;

    if (contentType?.toLowerCase().includes('application/x-www-form-urlencoded')) {
      return Object.fromEntries(new URLSearchParams(rawBody));
    }

    return JSON.parse(rawBody);
  } catch {
    throw new BadRequest('Malformed body.');
  }
}
