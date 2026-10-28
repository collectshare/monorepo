## 1. Modelo compartilhado

- [ ] 1.1 `packages/shared` `Question.piiStrategy`: adicionar `'none'`
- [ ] 1.2 `insertQuestionsInFormSchema`: aceitar `'none'`; `step` inteiro `>= 2`

## 2. Classificação

- [ ] 2.1 `PiiHeuristics`: regex com `\b` e keyword `nome`; testes com `cargo`, `organização`, `percepção`, `RG`, `e-mail`
- [ ] 2.2 `QuestionAnonymizationClassifier`: `GEMINI_MODEL` via config (`sls/config/env.yml`, `.env.example`) e prompt com payload JSON delimitado
- [ ] 2.3 `InsertQuestionsInFormUseCase`: falha das IAs → sugestão sintética fail-closed, sem cache
- [ ] 2.4 `QuestionClassificationCacheRepository`: ignorar `expiresAt` vencido

## 3. AnonymizationEngine

- [ ] 3.1 `resolve`: `'none'` devolve o valor cru
- [ ] 3.2 `numeric_range` estrito; `cep_region` valida CEP/telefone; formato inválido → `null`
- [ ] 3.3 `''`/só espaços preservados
- [ ] 3.4 Testes do engine para cada cenário da spec

## 4. Exposição pública

- [ ] 4.1 `GetFormController`: remover `accountId` e campos de PII da resposta (afeta MCP `get_form`)
- [ ] 4.2 Novo `GetFormQuestionsController` privado (dono) + função em `sls/functions/form.yml` (nome único)
- [ ] 4.3 `ExternalGetPublishedFormDataController`: excluir FILE, reaproveitando as perguntas do `GetPublishedFormDataQuery` em vez de buscar de novo

## 5. Web

- [ ] 5.1 Builder carrega PII pela rota privada nova
- [ ] 5.2 Seletor de estratégia: opção "Não anonimizar" (`'none'`); aviso em "pseudonimizar" sobre identificadores de baixa entropia; mostrar "classificação indisponível" quando `confidence = 0`

## 6. Docs e verificação

- [ ] 6.1 `openapi.yaml` (FILE excluído), `CLAUDE.md` (seção LGPD), `McpGuide/content.ts` (`get_form`)
- [ ] 6.2 `pnpm --filter @monorepo/api typecheck && pnpm --filter @monorepo/api test`; `pnpm --filter @monorepo/web typecheck`
- [ ] 6.3 Dev: confirmar que o modelo Gemini responde (log `QuestionAnonymizationClassifier usage`)
