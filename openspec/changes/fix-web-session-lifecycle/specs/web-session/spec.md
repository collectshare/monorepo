## ADDED Requirements

### Requirement: Sign-out clears all cached data
Signing out SHALL remove every cached query, so the next account in the same tab never sees the previous account's data.

#### Scenario: Switch accounts in the same tab
- **WHEN** user A signs out and user B signs in
- **THEN** `/me` is fetched again and no form, submission or API key of A is shown

### Requirement: Expired access tokens are renewed
On a 401 from a private route, the web app SHALL refresh the tokens once, retry the request, and sign out if the refresh fails. Concurrent 401s SHALL share one refresh call.

#### Scenario: Token expired with the tab open
- **WHEN** the access token expired and the user opens My forms
- **THEN** the list loads after a transparent refresh

#### Scenario: Refresh token expired
- **WHEN** the refresh call fails
- **THEN** the user is signed out and sent to `/sign-in`

### Requirement: Passwords are never persisted in browser storage
The sign-up draft SHALL NOT store password fields in `sessionStorage` or `localStorage`.

#### Scenario: Leaving sign-up halfway
- **WHEN** the user types a password and leaves the page
- **THEN** `sessionStorage` contains no password

### Requirement: Auth errors are always reported
Sign-in, sign-up and password-reset screens SHALL show a message for any failed request, and SHALL navigate to `/sign-in` after a reset.

#### Scenario: E-mail already in use
- **WHEN** sign-up returns 409
- **THEN** the screen shows that the e-mail is already in use

### Requirement: OAuth consent identifies the account
The `/oauth/authorize` page SHALL show the signed-in e-mail with a way to switch accounts, keep `returnTo` through sign-up, not promise revocation, and follow `redirectTo` only for `http:` or `https:` URLs.

#### Scenario: New user during an MCP connection
- **WHEN** a visitor reaches the consent page, goes to sign-in and chooses "Cadastre-se"
- **THEN** after creating the account they return to the consent page
