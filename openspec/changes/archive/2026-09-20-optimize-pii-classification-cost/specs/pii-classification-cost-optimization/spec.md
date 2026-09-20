## ADDED Requirements

### Requirement: Deterministic heuristic pre-filter
The system SHALL evaluate a question's normalized text against a fixed set of PII keywords before consulting the classification cache or calling the LLM classifier, and SHALL use the resulting match, when found, as the question's `AnonymizationSuggestion` without a cache lookup or LLM call.

#### Scenario: Text contains an obvious PII keyword
- **WHEN** a question's text (normalized: lowercased, trimmed, diacritics stripped) contains a configured PII keyword (e.g. "cpf", "e-mail", "telefone", "endereço")
- **THEN** the system resolves `needsAnonymization: true` for that question without calling the classification cache or the Gemini classifier

#### Scenario: Text has no keyword match
- **WHEN** a question's normalized text matches none of the configured PII keywords
- **THEN** the heuristic yields no result (does not assert `needsAnonymization: false`) and the system proceeds to the classification cache lookup

### Requirement: Content-hash classification cache
The system SHALL cache `AnonymizationSuggestion` results keyed by a hash of the question's type and normalized text, SHALL reuse a cache hit across any form or account with matching content, and SHALL persist new LLM-derived results into the cache after a successful classification.

#### Scenario: Cache hit reuses a prior classification
- **WHEN** a question requiring classification (not resolved by the heuristic) has the same `questionType` and normalized text as a previously LLM-classified question, and that cache entry has not expired
- **THEN** the system reuses the cached `AnonymizationSuggestion` for the new question without calling the Gemini classifier

#### Scenario: Cache miss falls through to classification
- **WHEN** no cache entry exists for a question's content hash
- **THEN** the system includes the question in the batch sent to the Gemini classifier and, on a successful (non-null) result, writes the result to the cache under that hash

#### Scenario: A failed classification is not cached
- **WHEN** the Gemini classifier returns `null` for a question (call failure, timeout, or malformed response)
- **THEN** the system does not write a cache entry for that question's content hash, so a subsequent save of an equivalent question retries classification

### Requirement: Cache entry expiry
The system SHALL expire classification cache entries via native DynamoDB TTL so stale entries are automatically removed without an explicit cleanup process.

#### Scenario: Entry expires after the retention window
- **WHEN** a classification cache entry's TTL attribute (`expiresAt`) timestamp has passed
- **THEN** DynamoDB removes the entry, and a subsequent lookup for that content hash SHALL be treated as a cache miss

### Requirement: Batched LLM classification per form save
The system SHALL group all questions requiring an LLM classification within a single `InsertQuestionsInFormUseCase` execution into one Gemini classifier call, rather than calling the classifier once per question.

#### Scenario: Multiple new questions in one form save
- **WHEN** a form save introduces or content-changes multiple questions, none of which are resolved by the heuristic or the cache
- **THEN** the system issues exactly one Gemini classifier call covering all of those questions and applies each returned result to its corresponding question by an explicit correlation key (not by array position)

#### Scenario: Partial batch response failure
- **WHEN** the batched Gemini call fails, times out, or returns a response missing an expected question's result
- **THEN** the system treats that question's `AnonymizationSuggestion` as `null` (classification failed) without discarding results successfully returned for other questions in the same batch, and does not cache the failed question's result

### Requirement: Classification source observability
The system SHALL log, for each question classified during a form save, which resolution path produced its result: heuristic, cache, or LLM.

#### Scenario: A question is logged with its resolution source
- **WHEN** a question's `AnonymizationSuggestion` is resolved during `InsertQuestionsInFormUseCase.execute`
- **THEN** the system emits an informational log entry identifying the question and whether the result came from the heuristic, the cache, or a live LLM call
