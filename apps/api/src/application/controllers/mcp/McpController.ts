import { Controller } from '@application/contracts/Controller';
import { JsonRpcErrorCode, JsonRpcResponse } from '@application/mcp/jsonRpc';
import { McpDispatcher } from '@application/mcp/McpDispatcher';
import { Injectable } from '@kernel/decorators/Injectable';

const MALFORMED_MESSAGE_CODES: number[] = [JsonRpcErrorCode.ParseError, JsonRpcErrorCode.InvalidRequest];

/**
 * MCP Streamable HTTP endpoint (stateless, JSON responses). Authentication happens in
 * `lambdaMcpAdapter`, which hands over the account the access token belongs to.
 */
@Injectable()
export class McpController extends Controller<'private', JsonRpcResponse | undefined> {
  constructor(private readonly mcpDispatcher: McpDispatcher) {
    super();
  }

  protected override async handle(
    { body, accountId, ip, userAgent }: Controller.Request<'private'>,
  ): Promise<Controller.Response<JsonRpcResponse | undefined>> {
    const response = await this.mcpDispatcher.handle(body, { accountId, ip, userAgent });

    if (response === null) {
      return { statusCode: 202 };
    }

    // Malformed messages are HTTP 400; protocol-level answers (including tool errors) are 200.
    const isMalformed = 'error' in response && MALFORMED_MESSAGE_CODES.includes(response.error.code);

    return {
      statusCode: isMalformed ? 400 : 200,
      body: response,
    };
  }
}
