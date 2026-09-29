import type { CommandModule } from "../cli/router.js";
import { API_KEY_PREFIX, isValidKeyShape, maskKey } from "../auth.js";
import { clearApiKey, configPath, loadConfig, setApiKey } from "../config.js";
import { apiRequest } from "../http/client.js";
import { UsageError } from "../output/errors.js";
import { helpBlock } from "../output/suggest.js";
import { emitKV, print } from "../output/toon.js";

// No self-service login exists yet (Cognito has no Hosted UI / device flow) —
// this is the documented manual bootstrap: log in on the web app, create a
// key, paste it here.
const WEB_APP_API_KEYS_URL = "https://app.collectshare.com.br/api-keys";

export const authSetKey: CommandModule = {
  spec: {
    name: "auth set-key",
    summary: "Store an API key for axi to use",
    args: [{ name: "key", required: true, description: "the cs_sk_... key created at /api-keys" }],
    flags: [
      {
        name: "base-url",
        type: "string",
        description: "API base URL to call, e.g. https://dev-api.collectshare.com.br",
      },
    ],
    examples: ["axi auth set-key cs_sk_abc123 --base-url https://dev-api.collectshare.com.br"],
  },
  run(parsed) {
    const key = parsed.positionals[0]!;
    if (!isValidKeyShape(key)) {
      throw new UsageError(
        `key must start with '${API_KEY_PREFIX}'`,
        "copy the exact value shown once when the key was created at /api-keys",
      );
    }
    const baseUrl = parsed.flags["base-url"] as string | undefined;
    setApiKey(key, baseUrl);

    const rows: Array<[string, unknown]> = [
      ["status", "key saved"],
      ["key", maskKey(key)],
      ["configPath", configPath()],
    ];
    if (baseUrl) rows.splice(2, 0, ["baseUrl", baseUrl]);
    print(emitKV(rows));
    print(helpBlock(["axi auth status", "axi forms list"]));
    return 0;
  },
};

export const authStatus: CommandModule = {
  spec: {
    name: "auth status",
    summary: "Show the configured API key and base URL",
    flags: [
      { name: "verify", type: "boolean", description: "make a live request to confirm the key is accepted" },
    ],
    examples: ["axi auth status", "axi auth status --verify"],
  },
  async run(parsed) {
    const config = loadConfig();
    const rows: Array<[string, unknown]> = [
      ["apiKey", config.apiKey ? maskKey(config.apiKey) : "(not set)"],
      ["apiKeySource", config.apiKeySource],
      ["baseUrl", config.baseUrl ?? "(not set)"],
      ["baseUrlSource", config.baseUrlSource],
      ["configPath", configPath()],
    ];

    if (parsed.flags["verify"]) {
      if (!config.apiKey || !config.baseUrl) {
        rows.push(["verified", "skipped (no key/base URL configured)"]);
      } else {
        try {
          await apiRequest("v1/forms", { requiredScope: "forms:read" });
          rows.push(["verified", "ok"]);
        } catch (err) {
          rows.push(["verified", `failed: ${err instanceof Error ? err.message : String(err)}`]);
        }
      }
    }

    print(emitKV(rows));
    if (!config.apiKey || !config.baseUrl) {
      print(helpBlock(["axi auth set-key <key> --base-url <url>", "axi auth open"]));
    }
    return 0;
  },
};

export const authLogout: CommandModule = {
  spec: {
    name: "auth logout",
    summary: "Remove the stored API key",
    flags: [],
    examples: ["axi auth logout"],
  },
  run() {
    clearApiKey();
    print(emitKV([["status", "key removed"], ["configPath", configPath()]]));
    return 0;
  },
};

export const authOpen: CommandModule = {
  spec: {
    name: "auth open",
    summary: "Print the API keys page URL and the follow-up set-key command",
    flags: [],
    examples: ["axi auth open"],
  },
  run() {
    print(emitKV([["url", WEB_APP_API_KEYS_URL]]));
    print(
      helpBlock([
        "1. log in and create a key with the scopes you need",
        "2. axi auth set-key <key> --base-url <url>",
      ]),
    );
    return 0;
  },
};
