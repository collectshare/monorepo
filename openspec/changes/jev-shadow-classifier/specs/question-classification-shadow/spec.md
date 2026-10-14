## ADDED Requirements

### Requirement: Shadow classification runs alongside Gemini
When a question reaches the LLM classification path (no `PiiHeuristics` match and no classification cache hit) and `TYPESAFE_API_KEY` is configured, the system SHALL classify it with both Gemini and Jev (`jev-latest`), started in parallel.

#### Scenario: LLM-path question with shadow enabled
- **WHEN** a new question with no heuristic match and no cache entry is saved and `TYPESAFE_API_KEY` is set
- **THEN** the system calls Gemini for the batch and Jev once for that question, concurrently

#### Scenario: Heuristic or cache hit
- **WHEN** a question is resolved by `PiiHeuristics` or by the classification cache
- **THEN** the system SHALL NOT call Jev for that question

#### Scenario: Shadow disabled
- **WHEN** `TYPESAFE_API_KEY` is empty or unset
- **THEN** the system SHALL NOT call Jev and question saving behaves exactly as before this change

### Requirement: Gemini remains authoritative
The system SHALL persist only Gemini's result as the question's `anonymizationSuggestion` and as the classification cache entry. Jev's result SHALL NOT be persisted anywhere.

#### Scenario: Verdicts disagree
- **WHEN** Gemini returns `needsAnonymization: false` and Jev returns `true` for the same question
- **THEN** the saved `anonymizationSuggestion` is Gemini's (`needsAnonymization: false`) and the cache stores Gemini's result

#### Scenario: Gemini fails, Jev succeeds
- **WHEN** Gemini fails or times out and Jev returns a verdict
- **THEN** `anonymizationSuggestion` is `null` and nothing is cached, as today

### Requirement: Shadow failures never block saving
A Jev error, non-2xx response, unexpected response shape, or timeout SHALL NOT fail the request, delay it beyond the classification timeout (8s), or change the Gemini result.

#### Scenario: Jev times out
- **WHEN** the Jev call does not finish within 8 seconds
- **THEN** it is aborted, the questions are saved with Gemini's result, and the audit log records the Jev error

### Requirement: Per-question audit log
For every question classified on the LLM path with shadow enabled, the system SHALL emit one structured log entry containing: `formId`, `questionId`, the question content hash, Gemini's `needsAnonymization` and `confidence` (or `null`), Jev's `needsAnonymization`, `probability`, latency in ms, token usage and error message (or `null`), and `agree` (`true`/`false` when both verdicts exist, otherwise `null`). The entry SHALL NOT contain the question text.

#### Scenario: Both classifiers answer
- **WHEN** Gemini returns `needsAnonymization: true` and Jev returns `value: true` with probability `0.91`
- **THEN** the log entry has `gemini.needsAnonymization: true`, `jev.needsAnonymization: true`, `jev.probability: 0.91`, `agree: true`

#### Scenario: One side missing
- **WHEN** Jev errors for a question
- **THEN** the log entry has `jev.error` set and `agree: null`

### Requirement: Gemini usage logging
Each Gemini classification call SHALL log its latency and token usage (prompt, candidates and thoughts token counts) so per-question cost can be compared with Jev.

#### Scenario: Successful Gemini call
- **WHEN** Gemini classifies a batch of questions
- **THEN** one log entry records the batch size, latency in ms and `usageMetadata` token counts
