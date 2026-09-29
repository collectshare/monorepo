import type { CommandModule } from "../cli/router.js";
import { apiRequest } from "../http/client.js";
import { helpBlock } from "../output/suggest.js";
import { emitBlock, emitKV, print } from "../output/toon.js";

interface SubmissionsResponse {
  submissions: unknown[];
  questions: unknown[];
  nextCursor?: string;
}

export const submissionsGet: CommandModule = {
  spec: {
    name: "submissions get",
    summary: "Get raw submissions for one of your own forms",
    args: [{ name: "formId", required: true, description: "form id" }],
    flags: [
      { name: "cursor", type: "string", description: "pagination cursor from a previous call's nextCursor" },
      { name: "limit", type: "string", description: "max rows to return (default 20, max 1000)" },
    ],
    examples: ["axi submissions get <formId>", "axi submissions get <formId> --limit 50"],
  },
  async run(parsed) {
    const formId = parsed.positionals[0]!;
    const cursor = parsed.flags["cursor"] as string | undefined;
    const limit = parsed.flags["limit"] as string | undefined;

    const { submissions, questions, nextCursor } = await apiRequest<SubmissionsResponse>(
      `v1/submissions/${encodeURIComponent(formId)}`,
      { query: { cursor, limit }, requiredScope: "forms:read" },
    );

    if (submissions.length === 0) {
      print(`submissions: 0 submissions found for form ${formId}`);
      return 0;
    }

    print(emitKV([
      ["count", submissions.length],
      ["nextCursor", nextCursor ?? ""],
    ]));
    print(emitBlock("questions", questions.map((q) => JSON.stringify(q))));
    print(emitBlock("submissions", submissions.map((s) => JSON.stringify(s))));
    if (nextCursor) {
      print(helpBlock([`axi submissions get ${formId} --cursor ${nextCursor}`]));
    }
    return 0;
  },
};
