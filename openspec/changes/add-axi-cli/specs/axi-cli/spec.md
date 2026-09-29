## ADDED Requirements

### Requirement: Form management commands
The CLI SHALL provide `forms create`, `forms update`, and `forms list` commands that call `POST /v1/forms`, `PUT /v1/forms/{formId}`, and `GET /v1/forms` respectively, passing `title`, `description`, `tags`, `isAnonymous`, `onePage`, and `isPublished` through with the same defaults as the underlying API (in particular `isPublished` defaults to `true` unless `--draft` is passed).

#### Scenario: Create a form with defaults
- **WHEN** the user runs `axi forms create "My Form"` with no other flags
- **THEN** the CLI calls `POST /v1/forms` with `title: "My Form"` and the API's default field values (including `isPublished: true`), and prints the returned `formId`

#### Scenario: Create a draft form
- **WHEN** the user runs `axi forms create "My Form" --draft`
- **THEN** the CLI sends `isPublished: false` in the request body

#### Scenario: List forms
- **WHEN** the user runs `axi forms list`
- **THEN** the CLI calls `GET /v1/forms` and prints the returned forms as a TOON table, or a definitive empty state if the list is empty

### Requirement: Question insertion with local payload validation
The CLI SHALL provide a `forms questions insert <formId> --file <path> | --json <inline>` command that validates the questions payload locally — including the `piiStrategy`/`generalizationConfig` discriminated union and its cross-field rule (`generalizationConfig` required when `piiStrategy` is `"generalize"`) — before calling `PUT /v1/forms/{formId}/questions`, and SHALL reject invalid payloads with a `UsageError` before making any network call.

#### Scenario: Valid payload is sent
- **WHEN** the user runs `axi forms questions insert <formId> --json '{"questions":[{"text":"Q1","questionType":"TEXT","order":1}]}'`
- **THEN** the CLI calls `PUT /v1/forms/{formId}/questions` with that body and reports success on `204`

#### Scenario: Missing generalizationConfig is rejected locally
- **WHEN** the user submits a question with `piiStrategy: "generalize"` and no `generalizationConfig`
- **THEN** the CLI raises a `UsageError` naming the missing `generalizationConfig` requirement and does not call the API

#### Scenario: --file and --json are mutually exclusive
- **WHEN** the user passes both `--file` and `--json`
- **THEN** the CLI raises a `UsageError` before reading either input

### Requirement: Submission and dataset read commands
The CLI SHALL provide `submissions get <formId>` (calling `GET /v1/submissions/{formId}`) and `datasets data <formId>` (calling `GET /v1/portal/datasets/{formId}/data`), both accepting `--cursor` and `--limit`, and printing any `nextCursor` from the response so the caller can page manually.

#### Scenario: Paginated submissions read
- **WHEN** the user runs `axi submissions get <formId> --limit 50`
- **THEN** the CLI calls `GET /v1/submissions/{formId}?limit=50` and, if the response includes `nextCursor`, prints it alongside the results

#### Scenario: Dataset not published
- **WHEN** `axi datasets data <formId>` receives a `404` from `GET /v1/portal/datasets/{formId}/data`
- **THEN** the CLI prints a clear error stating the dataset was not found or is not published, rather than a raw HTTP error

### Requirement: Portal search command
The CLI SHALL provide `portal search [--q] [--sort relevance|trending]` calling `GET /v1/portal/search`, validating `--sort` against the two accepted values before sending the request.

#### Scenario: Search with default sort
- **WHEN** the user runs `axi portal search --q "census"`
- **THEN** the CLI calls `GET /v1/portal/search?q=census` and prints the results

#### Scenario: Invalid sort value
- **WHEN** the user runs `axi portal search --sort newest`
- **THEN** the CLI raises a `UsageError` listing the valid `--sort` values before making a request

### Requirement: Local API key configuration
The CLI SHALL provide `auth set-key <key> [--base-url]`, `auth status [--verify]`, `auth logout`, and `auth open` commands that manage a config file at `~/.config/axi/config.json` (respecting `XDG_CONFIG_HOME`), written with `0600` permissions, and SHALL resolve credentials with precedence: `AXI_API_KEY`/`AXI_BASE_URL` environment variables, then the config file.

#### Scenario: Set a key
- **WHEN** the user runs `axi auth set-key cs_sk_abc123 --base-url https://dev-api.collectshare.com.br`
- **THEN** the CLI validates the `cs_sk_` prefix, writes the config file with mode `0600`, and never echoes the full key back

#### Scenario: Status shows a masked key
- **WHEN** the user runs `axi auth status`
- **THEN** the CLI prints the configured base URL, config file path, and the key masked to `cs_sk_` plus its last 4 characters, without ever printing the full key

#### Scenario: Verify flag makes a live call
- **WHEN** the user runs `axi auth status --verify`
- **THEN** the CLI additionally calls `GET /v1/forms` and reports whether the configured key is currently accepted

#### Scenario: Logout clears the key
- **WHEN** the user runs `axi auth logout`
- **THEN** the CLI removes the stored key from the config file

### Requirement: Fail-fast credential and base URL resolution
Every command that calls the external API SHALL check for a configured API key and base URL before making any network request, and SHALL raise a `UsageError` (exit code 2) pointing at `axi auth set-key` when either is missing, rather than attempting a request with an incomplete configuration or falling back to a hardcoded default base URL.

#### Scenario: No key configured
- **WHEN** the user runs any network-calling command (e.g. `axi forms list`) with no `AXI_API_KEY` env var and no config file
- **THEN** the CLI raises a `UsageError` pointing at `axi auth set-key` and makes no HTTP request

#### Scenario: Key configured but no base URL
- **WHEN** `AXI_API_KEY` is set but neither `AXI_BASE_URL` nor a config-file base URL is present
- **THEN** the CLI raises a `UsageError` pointing at `axi auth set-key --base-url` or `AXI_BASE_URL`, and makes no HTTP request

### Requirement: Server error mapping
The CLI SHALL map `401` responses to an "invalid/revoked/expired key" error, `405` responses (the API's `NotAllowedError`, thrown by every external controller when the resolved scopes don't include the one it requires) to a "missing scope" error naming the required scope, and SHALL pass through other server error bodies verbatim via the existing structured-error renderer.

#### Scenario: Unauthorized key
- **WHEN** the API responds `401` to any request
- **THEN** the CLI prints an error indicating the key is invalid, revoked, or expired, with a suggestion to run `axi auth set-key` with a fresh key

#### Scenario: Missing scope
- **WHEN** the API responds `405` to a `forms create` call because the configured key lacks `forms:write`
- **THEN** the CLI prints an error naming the `forms:write` scope and suggests creating a new key with that scope

### Requirement: Publish-ready package metadata
`packages/axi/package.json` SHALL be named `@collectshare/axi`, licensed MIT, declare a `repository` with `directory: "packages/axi"`, set `publishConfig.access` to `"public"`, and SHALL NOT declare a dependency on `@monorepo/shared` or any other unpublished private workspace package.

#### Scenario: Package has no private workspace dependency
- **WHEN** `packages/axi/package.json` is inspected
- **THEN** it lists no dependency resolving to an unpublished `@monorepo/*` package

#### Scenario: Package is scoped for public publish
- **WHEN** `npm pack` is run inside `packages/axi`
- **THEN** the resulting tarball's `package.json` has `name: "@collectshare/axi"`, `license: "MIT"`, and `publishConfig.access: "public"`
