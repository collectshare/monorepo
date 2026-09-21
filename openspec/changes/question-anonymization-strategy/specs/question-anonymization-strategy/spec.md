## ADDED Requirements

### Requirement: Per-question anonymization strategy (partial anonymization)
The system SHALL allow a form owner to set a `piiStrategy` (`pseudonymize` | `generalize` | `suppress` | `null`) on each question, and SHALL apply only the configured question's strategy to that question's values when serving the public portal data endpoint, leaving the rest of the submission row unaffected.

#### Scenario: Owner sets a pseudonymize strategy
- **WHEN** a question has `piiStrategy: 'pseudonymize'`
- **THEN** the public portal data endpoint returns an HMAC-SHA256 hash of that question's answer value (or of each element, for multi-value answers) instead of the raw value, and other questions in the same submission row are unaffected

#### Scenario: Owner sets a generalize strategy with valid config
- **WHEN** a question has `piiStrategy: 'generalize'` and a valid `generalizationConfig`
- **THEN** the public portal data endpoint returns the value transformed per the config's `type` (e.g. a date truncated to year, a number bucketed into a range) instead of the raw value

#### Scenario: Owner sets a suppress strategy
- **WHEN** a question has `piiStrategy: 'suppress'`
- **THEN** the public portal data endpoint returns `null` for that question's value in every submission row

#### Scenario: Owner sets no strategy and the question is not classifier-flagged
- **WHEN** a question has `piiStrategy: null` and `anonymizationSuggestion.needsAnonymization` is not `true`
- **THEN** the public portal data endpoint returns the raw answer value unchanged

### Requirement: Automatic anonymization fallback for classifier-flagged questions (total anonymization)
The system SHALL apply a default `pseudonymize` transform to a question's values when no explicit `piiStrategy` is configured but the question's `anonymizationSuggestion.needsAnonymization` is `true`, so a PII-flagged question is never served raw by the public portal data endpoint.

#### Scenario: Flagged question with no configured strategy
- **WHEN** a question has `piiStrategy: null` (or unset) and `anonymizationSuggestion.needsAnonymization === true`
- **THEN** the public portal data endpoint returns a pseudonymized (HMAC-SHA256) value for that question, not the raw value

#### Scenario: Explicit strategy takes precedence over the automatic fallback
- **WHEN** a question has both `anonymizationSuggestion.needsAnonymization === true` and an explicit `piiStrategy` other than `null`
- **THEN** the public portal data endpoint applies the explicit `piiStrategy`, not the automatic pseudonymize fallback

### Requirement: Fail-safe handling of misconfigured generalize strategy
The system SHALL treat a question with `piiStrategy: 'generalize'` but a missing or invalid `generalizationConfig` as requiring the automatic pseudonymize fallback, and SHALL reject persisting such a misconfigured question at write time.

#### Scenario: Question save rejects generalize without config
- **WHEN** a request to save a question sets `piiStrategy: 'generalize'` without a `generalizationConfig`
- **THEN** the system rejects the request with a validation error

#### Scenario: Read-time defense against a misconfigured question that already exists
- **WHEN** the public portal data endpoint resolves a question with `piiStrategy: 'generalize'` and no usable `generalizationConfig`
- **THEN** it applies the pseudonymize fallback to that question's values rather than returning the raw value

### Requirement: File-type questions remain excluded
The system SHALL continue to exclude `FILE`-type questions' answers entirely from the public portal data endpoint, independent of any configured `piiStrategy`.

#### Scenario: FILE question is never passed through the anonymization engine
- **WHEN** a form has a `FILE`-type question, regardless of its `piiStrategy`
- **THEN** the public portal data endpoint does not include that question's answers in the response
