import type { CommandModule } from "../cli/router.js";
import { ApiError, apiRequest } from "../http/client.js";
import { AxiError } from "../output/errors.js";
import { helpBlock } from "../output/suggest.js";
import { emitBlock, emitKV, print } from "../output/toon.js";

interface DatasetDataResponse {
  questions: unknown[];
  rows: unknown[];
  nextCursor?: string;
}

export const datasetsData: CommandModule = {
  spec: {
    name: "datasets data",
    summary: "Get paginated raw data for a published dataset",
    args: [{ name: "formId", required: true, description: "form id of a published dataset" }],
    flags: [
      { name: "cursor", type: "string", description: "pagination cursor from a previous call's nextCursor" },
      { name: "limit", type: "string", description: "max rows to return (default 20, max 1000)" },
    ],
    examples: ["axi datasets data <formId>", "axi datasets data <formId> --cursor <cursor>"],
  },
  async run(parsed) {
    const formId = parsed.positionals[0]!;
    const cursor = parsed.flags["cursor"] as string | undefined;
    const limit = parsed.flags["limit"] as string | undefined;

    let response: DatasetDataResponse;
    try {
      response = await apiRequest<DatasetDataResponse>(
        `v1/portal/datasets/${encodeURIComponent(formId)}/data`,
        { query: { cursor, limit }, requiredScope: "portal:read" },
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        throw new AxiError(
          `dataset not found or not published: ${formId}`,
          "the formId must belong to a form with isPublished=true",
        );
      }
      throw err;
    }

    const { questions, rows, nextCursor } = response;
    if (rows.length === 0) {
      print(`datasets: 0 rows found for form ${formId}`);
      return 0;
    }

    print(emitKV([
      ["count", rows.length],
      ["nextCursor", nextCursor ?? ""],
    ]));
    print(emitBlock("questions", questions.map((q) => JSON.stringify(q))));
    print(emitBlock("rows", rows.map((r) => JSON.stringify(r))));
    if (nextCursor) {
      print(helpBlock([`axi datasets data ${formId} --cursor ${nextCursor}`]));
    }
    return 0;
  },
};
