## Why

O portal é público e todo formulário é publicado, então a classificação de PII é a única barreira entre um dado pessoal e a internet. Hoje ela falha nas duas direções: a heurística casa `rg`/`cep` como substring (`cargo`, `organização`, `percepção` viram PII com confiança 1) e o dono não tem como dizer "isto não é PII"; e o Gemini aponta para um modelo inexistente (`gemini-3.6-flash`), falha, devolve `null` e a pergunta sai em texto claro (fail-open). Achados 2.1, 2.2, 2.5(1,2,3,5) e 3.2 do Relatório Backend.

## What Changes

- **Heurística:** casar palavras-chave por palavra inteira (com `\b` sobre o texto normalizado) e incluir `nome`.
- **Opt-out explícito:** novo valor `piiStrategy = 'none'` ("publicar sem anonimização"), escolhido pelo dono no builder. `null` continua significando "sem escolha" e segue a sugestão.
- **Fail-closed:** se a classificação por IA falhar, a pergunta recebe sugestão `needsAnonymization: true` com `confidence: 0` e motivo "classificação indisponível" (não vai para o cache). Ela é pseudonimizada até o dono escolher.
- **Gemini:** nome do modelo vem de config (`GEMINI_MODEL`) com default válido; o prompt manda as perguntas como JSON delimitado e instrui a tratá-las como dados.
- **AnonymizationEngine:** `numeric_range` só aceita número inteiro/decimal completo e `step` inteiro ≥ 2; `cep_region` só generaliza CEP de 8 dígitos ou telefone de 10–11 dígitos, senão suprime; `''` e só-espaços não são hasheados.
- **Cache:** `QuestionClassificationCacheRepository` ignora itens expirados.
- **Exposição pública:** `GET /forms/{formId}` (público) deixa de devolver `accountId`, `anonymizationSuggestion`, `piiStrategy`, `generalizationConfig`; o builder passa a ler esses campos de uma rota privada nova `GET /forms/{formId}/questions`. `GET /v1/portal/datasets/{formId}/data` passa a excluir perguntas FILE, como as rotas `/portal`.
- **BREAKING (MCP `get_form` e rota pública):** os campos internos somem da resposta pública.

## Capabilities

### New Capabilities
- `pii-classification`: como uma pergunta é classificada e como o valor é transformado antes de qualquer leitura pública.
- `public-form-exposure`: o que as rotas públicas e `/v1/portal` podem devolver sobre um formulário.

### Modified Capabilities
<!-- api-openapi-docs: só o conteúdo do openapi.yaml muda (FILE excluído), sem mudança de requisito -->

## Impact

- `packages/shared`: `Question.piiStrategy` ganha `'none'`.
- `apps/api`: `PiiHeuristics`, `QuestionAnonymizationClassifier`, `InsertQuestionsInFormUseCase`, `AnonymizationEngine`, `QuestionClassificationCacheRepository`, `insertQuestionsInFormSchema` (`piiStrategy`, `step`), `GetFormController`, novo `GetFormQuestionsController` + `sls/functions/form.yml`, `ExternalGetPublishedFormDataController`, `sls/config/env.yml` (`GEMINI_MODEL`).
- `apps/web`: seletor de `piiStrategy` no builder (opção "Não anonimizar"), carregamento do builder pela rota privada.
- `apps/portal/public/openapi.yaml`, `CLAUDE.md`, `McpGuide/content.ts` (descrição de `get_form`).
- Dados: sugestões existentes com falso positivo continuam gravadas; o dono corrige com `'none'`. Reclassificar em massa fica fora.
