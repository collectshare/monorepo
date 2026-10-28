## ADDED Requirements

### Requirement: Opening a question menu never removes it
Clicking the question's menu button SHALL only open the menu; removal SHALL happen only through the "Excluir" item.

#### Scenario: Open menu
- **WHEN** the owner clicks the "…" button of a question
- **THEN** the menu opens and the question is still in the form

### Requirement: Questions can be reordered by drag and drop
Dragging a question SHALL change its position in the saved order.

#### Scenario: Move second question to the top
- **WHEN** the owner drags question 2 above question 1 and saves
- **THEN** the saved order is question 2, question 1

### Requirement: Options and clones keep the current edits
Editing options SHALL keep them as plain strings when saved, and cloning SHALL copy the question as currently edited.

#### Scenario: Clone after editing
- **WHEN** the owner renames a question and clones it
- **THEN** the clone has the new name and the same options

### Requirement: New form asks for a title before saving
On `/forms/builder` without an id, saving SHALL prompt for the form details and show validation errors instead of failing silently.

#### Scenario: Save without title
- **WHEN** the owner clicks Save on a new form
- **THEN** the details modal opens with the title field required

### Requirement: Respondent view handles missing forms and inputs
The respondent view SHALL show a not-found state for a missing form, accept dropped files in file questions, offer keyboard-accessible star ratings, and show the configured validation messages.

#### Scenario: Unknown form id
- **WHEN** a respondent opens `/forms/response/<unknown>`
- **THEN** the page shows "formulário não encontrado" and no runtime error

#### Scenario: Drop a file
- **WHEN** a respondent drops a file on the upload area
- **THEN** the file is selected and the browser does not navigate away
