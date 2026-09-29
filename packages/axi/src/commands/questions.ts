import { readFileSync } from "node:fs";
import type { CommandModule } from "../cli/router.js";
import { apiRequest } from "../http/client.js";
import { UsageError } from "../output/errors.js";
import { helpBlock } from "../output/suggest.js";
import { emitKV, print } from "../output/toon.js";
import { validateQuestionsPayload } from "../types.js";

export const questionsInsert: CommandModule = {
  spec: {
    name: "forms questions insert",
    summary: "Insert questions into a form",
    args: [{ name: "formId", required: true, description: "form id to insert questions into" }],
    flags: [
      { name: "file", type: "string", description: "path to a JSON file with a { questions: [...] } payload" },
      { name: "json", type: "string", description: "inline JSON string with a { questions: [...] } payload" },
    ],
    examples: [
      "axi forms questions insert <formId> --file questions.json",
      'axi forms questions insert <formId> --json \'{"questions":[{"text":"Q1","questionType":"TEXT","order":1}]}\'',
    ],
  },
  async run(parsed) {
    const formId = parsed.positionals[0]!;
    const file = parsed.flags["file"] as string | undefined;
    const json = parsed.flags["json"] as string | undefined;

    if (file && json) {
      throw new UsageError("--file and --json are mutually exclusive", "pass exactly one of --file or --json");
    }
    if (!file && !json) {
      throw new UsageError("one of --file or --json is required", "run 'axi forms questions insert --help'");
    }

    let raw: string;
    if (file) {
      try {
        raw = readFileSync(file, "utf8");
      } catch (err) {
        throw new UsageError(
          `could not read --file '${file}': ${err instanceof Error ? err.message : String(err)}`,
          "check the path and try again",
        );
      }
    } else {
      raw = json as string;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch (err) {
      throw new UsageError(
        `invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
        "the payload must be valid JSON with a top-level 'questions' array",
      );
    }

    const payload = validateQuestionsPayload(parsedJson);

    await apiRequest<void>(`v1/forms/${encodeURIComponent(formId)}/questions`, {
      method: "PUT",
      body: payload,
      requiredScope: "forms:write",
    });

    print(emitKV([
      ["status", "inserted"],
      ["formId", formId],
      ["count", payload.questions.length],
    ]));
    print(helpBlock([`axi submissions get ${formId}`]));
    return 0;
  },
};
