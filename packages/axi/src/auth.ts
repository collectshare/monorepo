// Domain helpers for the axi API key itself (shape + display), separate
// from where it's stored (config.ts) and how it's sent (http/client.ts).

export const API_KEY_PREFIX = "cs_sk_";

export function isValidKeyShape(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX) && key.length > API_KEY_PREFIX.length;
}

/** Shows only the "cs_sk_" prefix plus the key's last 4 characters. */
export function maskKey(key: string): string {
  const last4 = key.slice(-4);
  return `${API_KEY_PREFIX}...${last4}`;
}
