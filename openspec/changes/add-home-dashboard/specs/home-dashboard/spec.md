## ADDED Requirements

### Requirement: Create-form call to action
The Home page SHALL display a prominent, primary "Novo formulário" call-to-action that navigates the user to `/forms/builder`. It SHALL be visible regardless of whether the account has any existing forms.

#### Scenario: User starts a new form from Home
- **WHEN** an authenticated user on `/` clicks "Novo formulário"
- **THEN** the app navigates to `/forms/builder`

### Requirement: Account form summary stats
When the account has at least one form, the Home page SHALL display aggregate stat tiles computed from the account's forms: total de formulários, total de respostas (sum of `submissionCount` across all forms), and count of formulários publicados vs. em rascunho (by `isPublished`).

#### Scenario: Stats reflect the account's forms
- **WHEN** the account has forms with a combined `submissionCount` sum and a mix of `isPublished` values
- **THEN** the Home page shows the correct total form count, the correct summed response count, and the correct published/draft breakdown

### Requirement: Recently created forms list
The Home page SHALL display up to 5 of the account's most recently created forms, ordered by `createdAt` descending, each linking to that form's results page (`/forms/dashboard/:formId`).

#### Scenario: More than 5 forms exist
- **WHEN** the account has more than 5 forms
- **THEN** the Home page shows only the 5 most recently created, with a link to view all forms on `/my-forms`

#### Scenario: Opening a recent form's results
- **WHEN** the user clicks a form in the recently-created list
- **THEN** the app navigates to `/forms/dashboard/:formId` for that form

### Requirement: Most-responded forms ranking
The Home page SHALL display up to 5 forms ranked by `submissionCount` descending, when the account has at least one form with `submissionCount > 0`.

#### Scenario: Ranking by response volume
- **WHEN** the account has forms with varying `submissionCount` values
- **THEN** the Home page lists the top 5 by `submissionCount` descending

#### Scenario: No form has received responses yet
- **WHEN** every form in the account has `submissionCount` of 0
- **THEN** the most-responded ranking section is not shown

### Requirement: Most-accessed-on-portal forms ranking
The Home page SHALL display up to 5 forms ranked by `clickCount` descending, labeled as portal views, only when the account has at least one form with `clickCount > 0`. It SHALL NOT be shown when no form has portal views, since `clickCount` only increments for published forms viewed through the public portal.

#### Scenario: Ranking by portal views
- **WHEN** the account has published forms with varying `clickCount` values
- **THEN** the Home page lists the top 5 by `clickCount` descending, distinct from the most-responded ranking

#### Scenario: No portal views recorded
- **WHEN** every form in the account has `clickCount` of 0 (e.g., none are published)
- **THEN** the most-accessed-on-portal section is not shown

### Requirement: No-responses-yet callout
The Home page SHALL surface a callout listing up to 5 published forms with `submissionCount` of 0, ordered by `createdAt` descending, to prompt the user to share them.

#### Scenario: A published form has zero responses
- **WHEN** the account has a published form with `submissionCount` of 0
- **THEN** that form appears in the no-responses-yet callout

#### Scenario: All published forms have responses
- **WHEN** every published form in the account has `submissionCount > 0`
- **THEN** the no-responses-yet callout is not shown

### Requirement: Empty state for accounts with no forms
When the account has zero forms, the Home page SHALL show an empty state explaining what a form is for and emphasizing the "Novo formulário" call-to-action, instead of stat tiles, rankings, or the no-responses callout.

#### Scenario: Brand-new account with no forms
- **WHEN** an authenticated user with zero forms visits `/`
- **THEN** the Home page shows the empty state and CTA, and none of the stats/lists/callout sections render
