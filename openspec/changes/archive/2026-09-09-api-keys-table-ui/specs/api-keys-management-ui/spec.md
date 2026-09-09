## ADDED Requirements

### Requirement: API Keys list is presented as a data table
The API Keys screen SHALL render the user's API keys using the shared `DataTable` component (the same primitive used by the "Meus formulários" screen), including text filtering and pagination controls.

#### Scenario: Viewing existing keys
- **WHEN** the user navigates to the API Keys screen and has one or more API keys
- **THEN** the screen displays a table with columns for name, key prefix, scopes, and creation date, with filtering and pagination controls available

#### Scenario: No keys yet
- **WHEN** the user navigates to the API Keys screen and has zero API keys
- **THEN** the table renders in its empty state (no rows), without errors, matching the Forms screen's empty-state behavior

### Requirement: Creating an API key happens inside a modal
The API Keys screen SHALL provide an insert button above the table that opens a modal dialog containing the key-creation form; the form SHALL NOT be rendered inline on the page.

#### Scenario: Opening the create modal
- **WHEN** the user clicks the "Nova API Key" button above the table
- **THEN** a modal opens containing a form with a "Nome" field and a submit action, and the underlying page does not show an inline creation form

#### Scenario: Submitting the create form
- **WHEN** the user enters a valid name in the modal form and submits it
- **THEN** the API key is created via the existing creation mutation, the keys table is refreshed, and the modal displays the newly created secret key

#### Scenario: Validation error in the modal
- **WHEN** the user submits the modal form with an empty name
- **THEN** the modal displays a validation error next to the name field and does not submit the request

### Requirement: Newly created secret key is revealed once, inside the modal
After successful creation, the modal SHALL display the full secret key value exactly once, with a copy-to-clipboard action and an explicit acknowledgement control to close the modal; the secret SHALL NOT be shown again after the modal is closed.

#### Scenario: Copying the revealed key
- **WHEN** the user clicks the copy button next to the revealed secret key in the modal
- **THEN** the full key value is copied to the clipboard and a confirmation toast is shown

#### Scenario: Dismissing after reveal
- **WHEN** the user clicks the acknowledgement control ("Entendi, pode fechar") after the key is revealed
- **THEN** the modal closes and the newly created key list entry appears in the table without its secret value

### Requirement: Revoking an API key is a row-level action
Each row in the API keys table SHALL expose a revoke action through a row actions menu (matching the ellipsis dropdown pattern used in the Forms table), rather than a standalone always-visible icon button.

#### Scenario: Revoking a key
- **WHEN** the user opens a row's actions menu and selects "Revogar"
- **THEN** the key is revoked via the existing revoke mutation, the table refreshes to no longer show that key, and a confirmation toast is shown

#### Scenario: Revoke in progress
- **WHEN** a revoke request is in flight for a key
- **THEN** the corresponding row action is disabled until the request completes
