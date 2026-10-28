## ADDED Requirements

### Requirement: Dialogs close the standard ways
Modals and sheets SHALL close on Escape, on overlay click and through a labeled close button.

#### Scenario: Escape
- **WHEN** a modal is open and the user presses Escape
- **THEN** the modal closes and the context state is updated

### Requirement: Button loading state is reliable
A `Button` with `isLoading` SHALL be disabled even when `disabled={false}` is passed, and SHALL render a single child when `asChild` is used.

#### Scenario: asChild while loading
- **WHEN** `<Button asChild isLoading><Link/></Button>` renders
- **THEN** no runtime error occurs and the element has `aria-busy="true"`

### Requirement: Plain rich text keeps line breaks and safe links
`RichText` in `plain` mode SHALL turn single line breaks into spaces and apply the same URL filter as the full mode.

#### Scenario: Single newline
- **WHEN** the description is `linha 1\nlinha 2`
- **THEN** the plain output is `linha 1 linha 2`

### Requirement: Rich text editor follows external value
The editor SHALL show the new `value` when it changes from outside (for example a form reset), without resetting while the user types.

#### Scenario: Form reset
- **WHEN** the description field is reset to another value
- **THEN** the editor shows that value

### Requirement: Controls have accessible names
Icon-only buttons (password visibility, pagination) SHALL have an `aria-label`, links styled as buttons SHALL be a single interactive element, and unavailable pagination buttons SHALL be disabled.

#### Scenario: First page
- **WHEN** the table is on the first page
- **THEN** the "first page" and "previous page" buttons are disabled
