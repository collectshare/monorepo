## ADDED Requirements

### Requirement: Public API documentation page in the portal
The portal SHALL expose a public, unauthenticated page at `/api-docs` documenting the `/v1/*` external API, reachable without login like every other portal route.

#### Scenario: Visiting the docs page directly
- **WHEN** a visitor navigates to `/api-docs` without any authentication
- **THEN** the page renders the API documentation content, with no redirect to a login flow

### Requirement: Docs page covers authentication and scopes
The page SHALL document how to authenticate `/v1/*` requests: the `x-api-key` header (and equivalent `Authorization: Bearer <key>` form), the `cs_sk_` key prefix, and the two scopes (`portal:read`, `data:read`) and which routes each gates.

#### Scenario: Reading the auth section
- **WHEN** a developer reads the authentication section of `/api-docs`
- **THEN** they can determine which header to send, the expected key format, and which scope their intended endpoint requires

### Requirement: Docs page covers every `/v1/*` endpoint
The page SHALL document, for each of the four `/v1/*` endpoints (`GET /v1/portal/search`, `GET /v1/portal/datasets/{formId}/data`, `GET /v1/forms`, `GET /v1/submissions/{formId}`): HTTP method and path, required scope, path/query parameters, a description of the response body shape, and the error responses a caller can receive (401 unauthorized, 404 not found, 405 forbidden-by-scope-or-ownership) with the condition that triggers each.

#### Scenario: Looking up an endpoint's contract
- **WHEN** a developer looks up `GET /v1/portal/datasets/{formId}/data` on the docs page
- **THEN** they find its required scope (`portal:read`), its `limit`/`cursor` query parameters, that its response includes `rows`, `questions`, and `nextCursor`, and the conditions under which it returns 401/404

#### Scenario: Looking up own-data endpoints
- **WHEN** a developer looks up `GET /v1/forms` or `GET /v1/submissions/{formId}` on the docs page
- **THEN** they find the `data:read` scope requirement and, for `GET /v1/submissions/{formId}`, the ownership rule that a form belonging to a different account yields an error even if it exists

### Requirement: Docs page covers pagination
The page SHALL document the cursor-based pagination contract shared by `GET /v1/portal/datasets/{formId}/data` and `GET /v1/submissions/{formId}`: the `limit` and `cursor` query parameters, the default page size, the 1000-row ceiling applied when a larger `limit` is requested, and how to use a response's `nextCursor` to fetch the next page.

#### Scenario: Implementing pagination from the docs
- **WHEN** a developer reads the pagination section
- **THEN** they can implement fetching all pages of a dataset using `limit` and `cursor` without consulting the API source code

### Requirement: API docs link in the portal topbar
`PortalLayout`'s header SHALL render a link to `/api-docs`, positioned alongside the existing `ThemeSwitcher` control, visible on every portal page.

#### Scenario: Navigating from any portal page
- **WHEN** a visitor is on any portal page (e.g. `/` or `/dataset/:formId`)
- **THEN** the header shows a link to the API docs page next to the theme switcher, and activating it navigates to `/api-docs`
