// Resolves the API key and base URL axi uses to call Collectshare.
// Precedence: AXI_API_KEY / AXI_BASE_URL env vars > ~/.config/axi/config.json
// (respecting XDG_CONFIG_HOME). There is no built-in default base URL: if
// neither source has one, callers must fail loudly (see http/client.ts)
// rather than guess at a production domain.

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface StoredConfig {
  apiKey?: string;
  baseUrl?: string;
}

export type ConfigSource = "env" | "file" | "none";

export interface ResolvedConfig {
  apiKey?: string;
  baseUrl?: string;
  apiKeySource: ConfigSource;
  baseUrlSource: ConfigSource;
}

function configDir(): string {
  const xdg = process.env["XDG_CONFIG_HOME"];
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), ".config");
  return join(base, "axi");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

function readStoredConfig(): StoredConfig {
  const path = configPath();
  if (!existsSync(path)) return {};
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as StoredConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: StoredConfig): void {
  const path = configPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
  chmodSync(path, 0o600);
}

export function setApiKey(apiKey: string, baseUrl?: string): void {
  const current = readStoredConfig();
  saveConfig({ ...current, apiKey, ...(baseUrl !== undefined ? { baseUrl } : {}) });
}

export function clearApiKey(): void {
  const { apiKey: _apiKey, ...rest } = readStoredConfig();
  saveConfig(rest);
}

export function loadConfig(): ResolvedConfig {
  const file = readStoredConfig();
  const envApiKey = process.env["AXI_API_KEY"];
  const envBaseUrl = process.env["AXI_BASE_URL"];
  return {
    apiKey: envApiKey || file.apiKey,
    baseUrl: envBaseUrl || file.baseUrl,
    apiKeySource: envApiKey ? "env" : file.apiKey ? "file" : "none",
    baseUrlSource: envBaseUrl ? "env" : file.baseUrl ? "file" : "none",
  };
}
