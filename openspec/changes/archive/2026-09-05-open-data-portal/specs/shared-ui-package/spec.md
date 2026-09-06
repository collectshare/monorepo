## ADDED Requirements

### Requirement: Shared UI package exposes common design system components
A `packages/ui` package SHALL exist exporting, at minimum, `Button`, `Card`, `Badge`, `Input`, `Table`, and `DataTable`, along with the shared theme tokens, for consumption by both `apps/web` and `apps/portal`.

#### Scenario: Portal app consumes a shared component
- **WHEN** `apps/portal` imports `Button` from `@monorepo/ui`
- **THEN** the imported component renders with the same visual styling as the one used in `apps/web`

### Requirement: apps/web consumes shared components from the package
For each component covered by `packages/ui`, `apps/web` SHALL import it from `@monorepo/ui` instead of maintaining a separate local copy.

#### Scenario: No behavioral or visual regression after migration
- **WHEN** `apps/web` is built after migrating a covered component's imports to `@monorepo/ui`
- **THEN** the component renders identically to its previous local-copy behavior
