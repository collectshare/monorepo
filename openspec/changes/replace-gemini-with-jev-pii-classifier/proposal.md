## Why

A classificação de PII em perguntas de formulário (`QuestionAnonymizationClassifier`) depende só do Gemini, um LLM generativo. A tarefa é uma classificação binária com categoria, e o Jev (TypeSafe AI) é um modelo "System One" feito para isso: devolve decisões tipadas com probabilidade, em 70 a 500 ms e a um custo bem menor. Queremos migrar para o Jev sem perder resiliência, então o Gemini continua como fallback.

## What Changes

- Adicionar a dependência `@typesafe-ai/sdk` e a variável de ambiente `TYPESAFE_API_KEY` (env schema, `AppConfig`, `sls/config/env.yml`).
- Criar `JevAnonymizationProvider`: uma chamada `systemOne` por pergunta, em paralelo, com uma questão `noul` (probabilidade de coletar PII) e uma `choice` (categoria do dado). O `reason` da sugestão é montado a partir de um mapa fixo em português por categoria, já que o Jev não gera texto livre.
- Extrair a lógica atual do Gemini para `GeminiAnonymizationProvider`, sem mudar o comportamento.
- Transformar `QuestionAnonymizationClassifier` em orquestrador com a mesma assinatura pública: tenta o Jev e reenvia ao Gemini apenas as perguntas que voltaram `null`. Registra em log qual provedor respondeu.
- Manter `@google/generative-ai` e `GEMINI_API_KEY` (fallback).
- Sem mudança em `InsertQuestionsInFormUseCase`, no cache DynamoDB, no tipo `AnonymizationSuggestion`, na API ou na UI web.

## Capabilities

### New Capabilities
- `pii-classification-provider`: define como o motor de classificação de PII escolhe o provedor de IA (Jev primeiro, Gemini como fallback), qual entrada mínima é enviada, como a resposta do Jev é mapeada para `AnonymizationSuggestion` e como falhas são tratadas (fail-open).

### Modified Capabilities
<!-- Nenhuma: `openspec/specs/` está vazio. A change arquivada `2026-09-05-detect-question-anonymization` nunca foi sincronizada com as specs principais, então os requisitos de provedor ficam numa capability nova. -->

## Impact

- **Código (`apps/api`)**: `src/infra/services/QuestionAnonymizationClassifier.ts` (vira orquestrador), novos `JevAnonymizationProvider.ts` e `GeminiAnonymizationProvider.ts`, `src/shared/config/env.ts`, `src/shared/config/AppConfig.ts`, `sls/config/env.yml`, `main/functions/external/apiKeyAuthorizer.test.ts` (stub de env).
- **Dependências**: nova `@typesafe-ai/sdk`. `@google/generative-ai` é mantida.
- **Configuração e deploy**: novo secret `TYPESAFE_API_KEY` precisa existir no ambiente de deploy (o `env.ts` exige `min(1)`).
- **Sistemas externos**: API do TypeSafe AI (limites de 1.200 req/min e 250k tokens/s, com 429 tratado pelo backoff do SDK).
- **Sem impacto** em contratos HTTP, frontend, `packages/shared` e no schema do DynamoDB.
