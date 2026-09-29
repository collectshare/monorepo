import { toErrorPayload } from '@application/errors/toErrorPayload';

export type McpToolResult = {
  content: { type: 'text'; text: string }[];
  isError: boolean;
};

/** Hard ceiling for one tool result (characters). Larger payloads are refused, never cut mid-JSON. */
export const MAX_TOOL_RESULT_CHARS = 400_000;

export function toolSuccess(value: unknown): McpToolResult {
  const text = JSON.stringify(value);

  if (text.length > MAX_TOOL_RESULT_CHARS) {
    return toolFailure(
      `The result is too large (${text.length} characters). Narrow the request, for example with a smaller "limit" or by paginating with "cursor".`,
    );
  }

  return { content: [{ type: 'text', text }], isError: false };
}

export function toolFailure(text: string): McpToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}

/** Turns anything thrown while running a tool into a readable `isError` result. */
export function toolErrorFrom(error: unknown): McpToolResult {
  const { statusCode, code, message } = toErrorPayload(error);

  if (Array.isArray(message)) {
    const details = message
      .map(({ field, error: detail }: { field: string; error: string }) => (field ? `${field}: ${detail}` : detail))
      .join('; ');

    return toolFailure(`Invalid arguments — ${details}`);
  }

  if (statusCode >= 500) {
    return toolFailure(String(message));
  }

  return toolFailure(`${code}: ${String(message)}`);
}
