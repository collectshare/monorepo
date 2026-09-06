## Why

Quando um formulário é publicado (dados exportados/expostos externamente), perguntas que coletam PII (CPF, e-mail, nome completo, endereço, etc.) precisam ser sinalizadas para anonimização antes da publicação, por exigência de LGPD. Hoje essa marcação depende inteiramente de o criador do formulário lembrar de marcar cada pergunta manualmente — não há nenhuma ajuda automática nem no `main` atual. Um motor de identificação automática, usando um LLM (Gemini) com um prompt enxuto (apenas o texto da pergunta, sem contexto extra), reduz esse risco de esquecimento sem exigir uma re-arquitetura da anonimização completa.

## What Changes

- Novo serviço `QuestionAnonymizationClassifier` que chama a API do Gemini com um prompt mínimo (texto da pergunta + tipo, nada de dados de resposta) e retorna um veredito: `needsAnonymization: boolean` + `confidence: number` (0-1) + `reason` curto.
- O veredito é **apenas uma sugestão** — nunca aplicado automaticamente a dados publicados. A decisão final de anonimizar continua sendo humana.
- Novo campo `anonymizationSuggestion` no item `Question` (independente do `piiStrategy`/`AnonymizationEngine` que só existe na branch `feature/api`, não mergeada em `main`): `{ needsAnonymization: boolean, confidence: number, reason: string, classifiedAt: string } | null`.
- Classificação disparada de forma incremental em `InsertQuestionsInFormUseCase`: ao criar uma pergunta nova ou alterar o texto/tipo de uma existente, o motor roda antes de salvar e a sugestão é persistida junto com a pergunta.
- Falha ou timeout do Gemini não bloqueia o salvamento da pergunta — `anonymizationSuggestion` fica `null` e a pergunta é salva normalmente (fail-open, sem quebrar o fluxo de edição de formulário).
- Endpoint/exposição da sugestão para o web app poder mostrar um aviso ("Esta pergunta parece coletar dado pessoal — considere marcar para anonimização") no editor de perguntas.

## Capabilities

### New Capabilities
- `question-anonymization-detection`: Motor que classifica, via LLM, se o texto de uma pergunta de formulário indica coleta de dado pessoal (PII) que deveria ser anonimizado na publicação dos dados; expõe o resultado como sugestão não vinculante.

### Modified Capabilities
(nenhuma — não existem specs anteriores em `openspec/specs/`)

## Impact

- **apps/api**: novo serviço em `infra/services` (cliente Gemini + prompt), integração em `application/usecases/form/InsertQuestionsInFormUseCase.ts`, novo campo em `QuestionItem`/entidade `Question` (`packages/shared`), nova env var de API key do Gemini, dependência nova (SDK do Gemini, ex. `@google/generative-ai`).
- **apps/web**: consumo do novo campo `anonymizationSuggestion` no editor de perguntas do formulário (aviso visual, sem bloquear o fluxo).
- **packages/shared**: `Question` entity ganha o campo opcional `anonymizationSuggestion`.
- **Custo/operação**: cada chamada ao Gemini é síncrona ao salvar uma pergunta alterada — prompt enxuto (poucas dezenas de tokens) para manter custo baixo; não há reclassificação de perguntas que não mudaram.
- **Não depende** do trabalho de `piiStrategy`/`AnonymizationEngine`/`GeneralizationConfig` da branch `feature/api` — construído de forma independente sobre `main`.
