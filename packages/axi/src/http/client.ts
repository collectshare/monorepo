// Thin fetch wrapper shared by every command that talks to Collectshare's
// /v1/* external API. Resolves the key/base URL, injects x-api-key, and
// maps well-known failure states to clear CLI errors before any command
// has to think about HTTP details.

import { loadConfig } from "../config.js";
import { AxiError, UsageError } from "../output/errors.js";

export class ApiError extends AxiError {
  status: number;

  constructor(status: number, message: string, suggestion?: string) {
    super(message, suggestion);
    this.status = status;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Scope required for this call, named in the 405 (missing-scope) error. */
  requiredScope?: string;
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions["query"]): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(path.replace(/^\//, ""), base);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function requireCredentials(): { apiKey: string; baseUrl: string } {
  const config = loadConfig();
  if (!config.apiKey) {
    throw new UsageError(
      "no API key configured",
      "run 'axi auth set-key <key>' (or set AXI_API_KEY) first",
    );
  }
  if (!config.baseUrl) {
    throw new UsageError(
      "no API base URL configured",
      "run 'axi auth set-key <key> --base-url <url>' (or set AXI_BASE_URL) first",
    );
  }
  return { apiKey: config.apiKey, baseUrl: config.baseUrl };
}

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `request failed with status ${response.status}`;
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && "message" in parsed) {
      const message = (parsed as { message: unknown }).message;
      return typeof message === "string" ? message : JSON.stringify(message);
    }
  } catch {
    // not JSON, fall through to the raw body
  }
  return text;
}

/**
 * Calls the external API and returns the parsed JSON body (or `undefined`
 * for a 204). Throws `UsageError` before any network call if credentials
 * are missing, `ApiError` for HTTP failures (401 -> invalid/revoked/expired
 * key, 405 -> missing scope, everything else verbatim from the server).
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { apiKey, baseUrl } = requireCredentials();
  const url = buildUrl(baseUrl, path, options.query);

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "x-api-key": apiKey,
      ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    throw new ApiError(
      401,
      "API key is invalid, revoked, or expired",
      "run 'axi auth set-key' with a fresh key",
    );
  }

  if (response.status === 405) {
    const scope = options.requiredScope;
    throw new ApiError(
      405,
      scope ? `not allowed: the configured key is missing the '${scope}' scope` : "not allowed",
      scope
        ? `create a new API key with the '${scope}' scope (there is no self-service scope edit)`
        : undefined,
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
