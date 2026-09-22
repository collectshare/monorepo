## MODIFIED Requirements

### Requirement: Per-question anonymization strategy (partial anonymization)
The system SHALL allow a form owner to set a `piiStrategy` (`pseudonymize` | `generalize` | `suppress` | `null`) on each question, and SHALL apply only the configured question's strategy to that question's values when serving the public portal data endpoint, leaving the rest of the submission row unaffected.

#### Scenario: Owner sets a pseudonymize strategy
- **WHEN** a question has `piiStrategy: 'pseudonymize'`
- **THEN** the public portal data endpoint returns an HMAC-SHA256 hash of that question's answer value (or of each element, for multi-value answers), derived using a key scoped to that question's `formId` so the same raw value hashes to a different pseudonym in a different form, instead of the raw value, and other questions in the same submission row are unaffected

#### Scenario: Owner sets a generalize strategy with valid config
- **WHEN** a question has `piiStrategy: 'generalize'` and a valid `generalizationConfig`
- **THEN** the public portal data endpoint returns the value transformed per the config's `type` (e.g. a date truncated to year, a number bucketed into a range) instead of the raw value

#### Scenario: Owner sets a suppress strategy
- **WHEN** a question has `piiStrategy: 'suppress'`
- **THEN** the public portal data endpoint returns `null` for that question's value in every submission row

#### Scenario: Owner sets no strategy and the question is not classifier-flagged
- **WHEN** a question has `piiStrategy: null` and `anonymizationSuggestion.needsAnonymization` is not `true`
- **THEN** the public portal data endpoint returns the raw answer value unchanged

#### Scenario: Identical raw value pseudonymized in two different forms
- **WHEN** the same raw PII value (e.g. the same CPF) is submitted as the answer to a `pseudonymize`-strategy question in form A and to a `pseudonymize`-strategy question in form B
- **THEN** the public portal data endpoint returns a different hash for form A's dataset than for form B's dataset, so the two datasets cannot be joined on that pseudonym

#### Scenario: Identical raw value pseudonymized consistently within one form
- **WHEN** the same raw PII value is submitted as the answer to a `pseudonymize`-strategy question in two different submissions of the same form
- **THEN** the public portal data endpoint returns the same hash for both submissions within that form's dataset

### Requirement: Automatic anonymization fallback for classifier-flagged questions (total anonymization)
The system SHALL apply a default `pseudonymize` transform to a question's values when no explicit `piiStrategy` is configured but the question's `anonymizationSuggestion.needsAnonymization` is `true`, so a PII-flagged question is never served raw by the public portal data endpoint.

#### Scenario: Flagged question with no configured strategy
- **WHEN** a question has `piiStrategy: null` (or unset) and `anonymizationSuggestion.needsAnonymization === true`
- **THEN** the public portal data endpoint returns a pseudonymized (HMAC-SHA256, form-scoped per the pseudonymize requirement above) value for that question, not the raw value

#### Scenario: Explicit strategy takes precedence over the automatic fallback
- **WHEN** a question has both `anonymizationSuggestion.needsAnonymization === true` and an explicit `piiStrategy` other than `null`
- **THEN** the public portal data endpoint applies the explicit `piiStrategy`, not the automatic pseudonymize fallback
