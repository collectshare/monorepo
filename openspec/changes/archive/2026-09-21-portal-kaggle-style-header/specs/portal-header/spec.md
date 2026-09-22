## ADDED Requirements

### Requirement: Persistent portal header
The system SHALL render a persistent header above every portal route (`/` and `/dataset/:formId`), showing the portal identity on the left and utility actions (sign-in links, theme switcher) on the right.

#### Scenario: Header visible on Home
- **WHEN** a visitor loads the portal at `/`
- **THEN** the header is rendered above the search page content

#### Scenario: Header visible on Dataset page
- **WHEN** a visitor navigates to `/dataset/:formId`
- **THEN** the same header is rendered above the dataset content, unchanged from the Home route

### Requirement: Environment sign-in links
The header SHALL show two sign-in links, one for the dev environment and one for the prod environment, each pointing at the CollectShare app login URL configured via `VITE_WEB_APP_URL_DEV` and `VITE_WEB_APP_URL_PROD` respectively.

#### Scenario: Both links open the correct environment in a new tab
- **WHEN** a visitor clicks the "Dev" sign-in link
- **THEN** a new browser tab opens at the URL from `VITE_WEB_APP_URL_DEV`
- **WHEN** a visitor clicks the "Prod" sign-in link
- **THEN** a new browser tab opens at the URL from `VITE_WEB_APP_URL_PROD`

#### Scenario: Missing environment URL hides that link
- **WHEN** `VITE_WEB_APP_URL_DEV` or `VITE_WEB_APP_URL_PROD` is empty or unset at build time
- **THEN** the corresponding sign-in link SHALL NOT be rendered, and the other link (if configured) still renders normally

### Requirement: Theme switcher
The header SHALL include a control that toggles the portal between light and dark themes, applying the `dark` class already defined by `@monorepo/ui`'s design tokens.

#### Scenario: Toggling theme updates the rendered page
- **WHEN** a visitor clicks the theme switcher while in light mode
- **THEN** the `dark` class is added to the document root and dark-mode tokens are applied
- **WHEN** a visitor clicks the theme switcher again while in dark mode
- **THEN** the `dark` class is removed and light-mode tokens are applied

#### Scenario: Theme choice persists across reloads
- **WHEN** a visitor selects a theme and reloads the portal
- **THEN** the previously selected theme is restored from `localStorage` without requiring another click

#### Scenario: First visit respects OS preference
- **WHEN** a visitor with no stored theme preference loads the portal on a device with a dark OS color scheme
- **THEN** the portal renders in dark mode by default
