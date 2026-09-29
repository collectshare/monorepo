// Internal-only: guards against packages/axi/src/types.ts drifting from
// packages/shared's enums. Only meaningful (and only runs) inside this
// monorepo checkout — a consumer who installs @collectshare/axi never has
// packages/shared on disk, and this file is excluded from the published
// tarball (see package.json "files").

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ApiKeyScope, QuestionType } from "../src/types.js";

const sharedApiKeyScopePath = fileURLToPath(
  new URL("../../shared/enums/ApiKeyScope.ts", import.meta.url),
);
const sharedQuestionTypePath = fileURLToPath(
  new URL("../../shared/enums/QuestionType.ts", import.meta.url),
);
const inMonorepo = existsSync(sharedApiKeyScopePath) && existsSync(sharedQuestionTypePath);

function extractEnumValues(source: string): string[] {
  return [...source.matchAll(/=\s*'([^']+)'/g)].map((m) => m[1]!).sort();
}

describe.skipIf(!inMonorepo)("drift: local enum copies vs packages/shared (monorepo-only)", () => {
  it("ApiKeyScope matches packages/shared/enums/ApiKeyScope.ts", () => {
    const sharedValues = extractEnumValues(readFileSync(sharedApiKeyScopePath, "utf8"));
    const localValues = Object.values(ApiKeyScope).sort();
    expect(localValues).toEqual(sharedValues);
  });

  it("QuestionType matches packages/shared/enums/QuestionType.ts", () => {
    const sharedValues = extractEnumValues(readFileSync(sharedQuestionTypePath, "utf8"));
    const localValues = Object.values(QuestionType).sort();
    expect(localValues).toEqual(sharedValues);
  });
});
