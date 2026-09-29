import type { FlagSpec } from "../cli/spec.js";
import type { CommandModule } from "../cli/router.js";
import { apiRequest } from "../http/client.js";
import { UsageError } from "../output/errors.js";
import { helpBlock } from "../output/suggest.js";
import { emitKV, emitList, print } from "../output/toon.js";

interface FormResponse {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  isAnonymous: boolean;
  onePage: boolean;
  isPublished: boolean;
  submissionCount?: number;
  clickCount?: number;
  downloadCount?: number;
  createdAt: string;
}

interface FormBody {
  title: string;
  description?: string;
  tags?: string[];
  isAnonymous: boolean;
  onePage: boolean;
  isPublished: boolean;
}

const FORM_FIELDS = [
  "id",
  "title",
  "description",
  "tags",
  "isAnonymous",
  "onePage",
  "isPublished",
  "submissionCount",
  "clickCount",
  "downloadCount",
  "createdAt",
];

const DEFAULT_FORM_FIELDS = "id,title,isPublished,submissionCount";

// The API defaults isAnonymous=true, onePage=false, isPublished=true — the
// CLI mirrors those defaults rather than reinterpreting them; --draft is the
// explicit, documented way to opt out of "published by default".
const CREATE_UPDATE_FLAGS: FlagSpec[] = [
  { name: "description", type: "string", description: "form description" },
  { name: "tags", type: "string", description: "comma-separated tags" },
  {
    name: "not-anonymous",
    type: "boolean",
    description: "require respondents to be identified (default: anonymous)",
  },
  {
    name: "one-page",
    type: "boolean",
    description: "render the form as a single page (default: multi-page)",
  },
  {
    name: "draft",
    type: "boolean",
    description: "keep the form unpublished (default: published)",
  },
];

function bodyFromFlags(flags: Record<string, string | boolean>, title: string): FormBody {
  const tags = flags["tags"];
  return {
    title,
    description: flags["description"] as string | undefined,
    tags: typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    isAnonymous: !flags["not-anonymous"],
    onePage: Boolean(flags["one-page"]),
    isPublished: !flags["draft"],
  };
}

export const formsCreate: CommandModule = {
  spec: {
    name: "forms create",
    summary: "Create a form",
    args: [{ name: "title", required: true, description: "form title" }],
    flags: CREATE_UPDATE_FLAGS,
    examples: ['axi forms create "Customer feedback"', 'axi forms create "Internal draft" --draft'],
  },
  async run(parsed) {
    const title = parsed.positionals[0]!;
    const body = bodyFromFlags(parsed.flags, title);
    const { formId } = await apiRequest<{ formId: string }>("v1/forms", {
      method: "POST",
      body,
      requiredScope: "forms:write",
    });
    print(emitKV([
      ["formId", formId],
      ["isPublished", body.isPublished],
    ]));
    print(
      helpBlock([
        `axi forms questions insert ${formId} --json '{"questions":[...]}'`,
        "axi forms list",
      ]),
    );
    return 0;
  },
};

export const formsUpdate: CommandModule = {
  spec: {
    name: "forms update",
    summary: "Update a form's details",
    args: [
      { name: "formId", required: true, description: "form id to update" },
      { name: "title", required: true, description: "form title" },
    ],
    flags: CREATE_UPDATE_FLAGS,
    examples: ['axi forms update <formId> "New title" --draft'],
  },
  async run(parsed) {
    const [formId, title] = parsed.positionals as [string, string];
    const body = bodyFromFlags(parsed.flags, title);
    await apiRequest<void>(`v1/forms/${encodeURIComponent(formId)}`, {
      method: "PUT",
      body,
      requiredScope: "forms:write",
    });
    print(emitKV([["status", "updated"], ["formId", formId]]));
    return 0;
  },
};

export const formsList: CommandModule = {
  spec: {
    name: "forms list",
    summary: "List your forms",
    flags: [
      {
        name: "fields",
        type: "string",
        default: DEFAULT_FORM_FIELDS,
        description: `comma-separated columns from: ${FORM_FIELDS.join(", ")}`,
      },
    ],
    examples: ["axi forms list", "axi forms list --fields id,title,isPublished"],
  },
  async run(parsed) {
    const fields = String(parsed.flags["fields"]).split(",").map((f) => f.trim());
    for (const f of fields) {
      if (!FORM_FIELDS.includes(f)) {
        throw new UsageError(`unknown field '${f}' for --fields`, `valid fields: ${FORM_FIELDS.join(", ")}`);
      }
    }

    const { forms } = await apiRequest<{ forms: FormResponse[] }>("v1/forms", {
      requiredScope: "forms:read",
    });

    if (forms.length === 0) {
      print("forms: 0 forms found");
      print(helpBlock(["axi forms create \"My form\""]));
      return 0;
    }

    print(emitList("forms", forms.map((f) => ({ ...f })), fields));
    print(helpBlock(["axi forms list --fields id,title,isPublished,submissionCount"]));
    return 0;
  },
};
