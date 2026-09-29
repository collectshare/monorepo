// Deliberate local copies of literals/shapes from the private
// `@monorepo/shared` workspace package and from
// `apps/api/src/application/controllers/form/schemas/insertQuestionsInFormSchema.ts`.
// This package publishes to public npm and cannot depend on either — keep
// these in sync by hand when the source changes (see the drift-detection
// test in test/typesDrift.test.ts, which only runs inside this monorepo).

import { UsageError } from "./output/errors.js";

export enum ApiKeyScope {
  PORTAL_READ = "portal:read",
  FORMS_READ = "forms:read",
  FORMS_WRITE = "forms:write",
}

export enum QuestionType {
  TEXT = "TEXT",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  CHECKBOX = "CHECKBOX",
  DROPDOWN = "DROPDOWN",
  STARS = "STARS",
  FILE = "FILE",
}

export type PiiStrategy = "pseudonymize" | "generalize" | "suppress";

export type GeneralizationConfig =
  | { type: "date_truncate"; precision: "year" | "month" }
  | { type: "numeric_range"; step: number }
  | { type: "text_prefix"; chars: number }
  | { type: "cep_region"; precision: "state" | "ddd" };

export interface QuestionInsert {
  id?: string;
  text: string;
  questionType: QuestionType;
  order: number;
  options?: string[];
  max?: number;
  isRequired?: boolean;
  piiStrategy?: PiiStrategy | null;
  generalizationConfig?: GeneralizationConfig;
}

export interface QuestionsInsertPayload {
  questions: QuestionInsert[];
}

const QUESTION_TYPES = new Set<string>(Object.values(QuestionType));
const PII_STRATEGIES = new Set<string>(["pseudonymize", "generalize", "suppress"]);
const GENERALIZATION_TYPES = ["date_truncate", "numeric_range", "text_prefix", "cep_region"];

function fail(message: string): never {
  throw new UsageError(message, "fix the payload and re-run; see 'axi forms questions insert --help'");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateGeneralizationConfig(value: unknown, path: string): GeneralizationConfig {
  if (!isRecord(value)) fail(`${path} must be an object`);
  const type = value["type"];
  switch (type) {
    case "date_truncate": {
      const precision = value["precision"];
      if (precision !== "year" && precision !== "month") {
        fail(`${path}.precision must be 'year' or 'month'`);
      }
      return { type, precision };
    }
    case "numeric_range": {
      const step = value["step"];
      if (typeof step !== "number" || step <= 0) fail(`${path}.step must be a positive number`);
      return { type, step };
    }
    case "text_prefix": {
      const chars = value["chars"];
      if (!Number.isInteger(chars) || (chars as number) <= 0) {
        fail(`${path}.chars must be a positive integer`);
      }
      return { type, chars: chars as number };
    }
    case "cep_region": {
      const precision = value["precision"];
      if (precision !== "state" && precision !== "ddd") {
        fail(`${path}.precision must be 'state' or 'ddd'`);
      }
      return { type, precision };
    }
    default:
      fail(`${path}.type must be one of: ${GENERALIZATION_TYPES.join(", ")}`);
  }
}

function validateQuestion(value: unknown, index: number): QuestionInsert {
  const path = `questions[${index}]`;
  if (!isRecord(value)) fail(`${path} must be an object`);

  const text = value["text"];
  if (typeof text !== "string" || text.length < 1) {
    fail(`${path}.text is required and must be a non-empty string`);
  }

  const questionType = value["questionType"];
  if (typeof questionType !== "string" || !QUESTION_TYPES.has(questionType)) {
    fail(`${path}.questionType must be one of: ${[...QUESTION_TYPES].join(", ")}`);
  }

  const order = value["order"];
  if (!Number.isInteger(order) || (order as number) <= 0) {
    fail(`${path}.order must be a positive integer`);
  }

  const question: QuestionInsert = {
    text,
    questionType: questionType as QuestionType,
    order: order as number,
  };

  if (value["id"] !== undefined) {
    if (typeof value["id"] !== "string") fail(`${path}.id must be a string`);
    question.id = value["id"];
  }

  if (value["options"] !== undefined) {
    const options = value["options"];
    if (!Array.isArray(options) || !options.every((o) => typeof o === "string")) {
      fail(`${path}.options must be an array of strings`);
    }
    question.options = options;
  }

  if (value["max"] !== undefined) {
    const max = value["max"];
    if (!Number.isInteger(max) || (max as number) <= 0) {
      fail(`${path}.max must be a positive integer`);
    }
    question.max = max as number;
  }

  if (value["isRequired"] !== undefined) {
    if (typeof value["isRequired"] !== "boolean") fail(`${path}.isRequired must be a boolean`);
    question.isRequired = value["isRequired"];
  }

  const piiStrategy = value["piiStrategy"];
  if (piiStrategy !== undefined && piiStrategy !== null) {
    if (typeof piiStrategy !== "string" || !PII_STRATEGIES.has(piiStrategy)) {
      fail(`${path}.piiStrategy must be one of: ${[...PII_STRATEGIES].join(", ")}`);
    }
    question.piiStrategy = piiStrategy as PiiStrategy;
  }

  if (value["generalizationConfig"] !== undefined) {
    question.generalizationConfig = validateGeneralizationConfig(
      value["generalizationConfig"],
      `${path}.generalizationConfig`,
    );
  }

  if (question.piiStrategy === "generalize" && question.generalizationConfig === undefined) {
    fail(`${path}.generalizationConfig is required when ${path}.piiStrategy is 'generalize'`);
  }

  return question;
}

/**
 * Validates a `forms questions insert` payload before any network call.
 * Mirrors `insertQuestionsInFormSchema.ts` on the API, including the
 * piiStrategy/generalizationConfig cross-field rule. Throws `UsageError`
 * naming the first violated field.
 */
export function validateQuestionsPayload(payload: unknown): QuestionsInsertPayload {
  if (!isRecord(payload)) fail("payload must be a JSON object with a 'questions' array");
  const questions = payload["questions"];
  if (!Array.isArray(questions) || questions.length === 0) {
    fail("payload.questions must be a non-empty array");
  }
  return { questions: questions.map((q, i) => validateQuestion(q, i)) };
}
