---
name: axi
description: "Drives Collectshare's /v1/* external API — forms, questions, submissions, published datasets, and portal search — for AI agents and automation."
---

# axi

Drives Collectshare's /v1/* external API — forms, questions, submissions, published datasets, and portal search — for AI agents and automation. (built against AXI spec axi/1.0-2026-07). Run the commands below with npx — no install needed.

No self-service key issuance exists yet: log in on the Collectshare web app, create a key at /api-keys (pick the scopes you need — portal:read, forms:read, forms:write), then run `axi auth set-key`.

```
commands[10]{command,summary}:
  auth open,print the /api-keys URL and the set-key follow-up
  auth set-key <key> [--base-url],store an API key
  auth status [--verify],show the configured key/base URL
  forms create <title> [--draft],create a form (published by default)
  forms list,list your forms
  forms update <formId> <title>,update a form's details
  forms questions insert <formId> --file|--json,insert questions into a form
  submissions get <formId>,read your form's raw submissions
  datasets data <formId>,read a published dataset's rows
  portal search [--q] [--sort],search published datasets
help[3]:
  npx -y @collectshare/axi auth open
  npx -y @collectshare/axi forms list
  npx -y @collectshare/axi <command> --help
```

Every command supports `--help`. Exit codes: 0 success/no-op, 1 error, 2 usage error. All output is TOON on stdout.
