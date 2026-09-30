export const JSON_RPC_VERSION = '2.0';

export const JsonRpcErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const;

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: typeof JSON_RPC_VERSION;
  id: string | number;
  method: string;
  params?: unknown;
};

export type JsonRpcResponse =
  | { jsonrpc: typeof JSON_RPC_VERSION; id: JsonRpcId; result: unknown }
  | { jsonrpc: typeof JSON_RPC_VERSION; id: JsonRpcId; error: { code: number; message: string } };

export function successResponse(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: JSON_RPC_VERSION, id, result };
}

export function errorResponse(id: JsonRpcId, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: JSON_RPC_VERSION, id, error: { code, message } };
}

export type ClassifiedMessage =
  | { kind: 'request'; message: JsonRpcRequest }
  /** Notifications and client responses: nothing is sent back. */
  | { kind: 'ignore' }
  | { kind: 'batch' }
  | { kind: 'invalid'; id: JsonRpcId };

function isJsonRpcId(value: unknown): value is string | number {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

/** Tells apart the JSON-RPC message shapes a client may POST to the MCP endpoint. */
export function classifyMessage(raw: unknown): ClassifiedMessage {
  if (Array.isArray(raw)) {
    return { kind: 'batch' };
  }

  if (typeof raw !== 'object' || raw === null) {
    return { kind: 'invalid', id: null };
  }

  const message = raw as Record<string, unknown>;
  const id = isJsonRpcId(message.id) ? message.id : null;

  if (message.jsonrpc !== JSON_RPC_VERSION) {
    return { kind: 'invalid', id };
  }

  if (typeof message.method === 'string') {
    if (!('id' in message)) {
      return { kind: 'ignore' };
    }

    if (!isJsonRpcId(message.id)) {
      return { kind: 'invalid', id: null };
    }

    return { kind: 'request', message: message as unknown as JsonRpcRequest };
  }

  if (isJsonRpcId(message.id) && ('result' in message || 'error' in message)) {
    return { kind: 'ignore' };
  }

  return { kind: 'invalid', id };
}
