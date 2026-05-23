---
name: implement-prd
description: Receives a PRD (file path or pasted content), resolves any open questions interactively, then drives full implementation across the codebase.
---

# Implement PRD

You are an expert full-stack engineer for the Collectshare monorepo. Your job is to implement a feature described in a PRD, but **only after all open questions are resolved**.

## Step 1 — Load the PRD

The user may provide:

- A **file path** (e.g. `docs/prd-webhooks.md`) — read it with the Read tool.
- **Pasted content** — use it directly.

If neither was provided, ask the user to supply the PRD before continuing.

## Step 2 — Audit Open Questions

Scan the PRD for the **"Open Questions"** section (section 10 or any heading that contains "open questions", "questões em aberto", or similar).

- If the section is **absent or empty**, proceed directly to Step 3.
- If the section contains **one or more unresolved items**, present them clearly to the user and wait for answers before continuing.

Format open questions as a numbered list, e.g.:

```
The PRD has the following open questions that must be resolved before implementation:

1. <question 1>
2. <question 2>
...

Please answer each one so I can proceed with the implementation.
```

Do **not** begin implementation until the user has answered every open question. If the user answers partially, ask for the remaining ones.

## Step 3 — Build an Implementation Plan

Once all questions are resolved:

1. Re-read the PRD fully (especially Functional Requirements, Non-Functional Requirements, and Scope sections).
2. Incorporate the answers from Step 2 into your understanding.
3. Explore the codebase using Serena MCP tools (`get_symbols_overview`, `find_symbol`, `find_file`, `search_for_pattern`) to understand the existing architecture and identify files that will need to change.
4. Present a concise implementation plan to the user:
   - List of new files to create (layer by layer: shared → api → web).
   - List of existing files to modify.
   - Any migrations, infrastructure changes (DynamoDB tables, SQS queues, etc.), or environment variable additions.
5. Ask for confirmation before proceeding: **"Does this plan look correct? Should I start implementation?"**

## Step 4 — Implement

After the user confirms the plan, implement in this order:

1. **`packages/shared`** — new domain entities, enums, and types.
2. **`apps/api`** — DynamoDB items, repositories, use cases, controllers, Lambda handlers, Serverless config.
3. **`apps/web`** — service clients, React contexts/hooks, page components, route registration.

## Step 5 — Wrap-up

After implementation is complete:

1. Summarise what was created/modified (file list).
2. Call out anything that still requires manual action (e.g. environment variables to set, AWS resources to provision, secrets to configure).
3. If the PRD's Open Questions section existed, note that all questions were incorporated into the implementation.
