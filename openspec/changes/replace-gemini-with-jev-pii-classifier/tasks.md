## 1. Dependência e configuração

- [x] 1.1 Adicionar `@typesafe-ai/sdk` em `apps/api` (`pnpm --filter api add @typesafe-ai/sdk`) e ler os `.d.ts` do pacote para confirmar `TypeSafeClient`, `systemOne`, `noul`, `choice` e o formato da resposta
- [x] 1.2 Adicionar `TYPESAFE_API_KEY: z.string().min(1)` em `apps/api/src/shared/config/env.ts`
- [x] 1.3 Expor `typesafe: { apiKey }` em `AppConfig` e criar o tipo `AppConfig.TypeSafe` (`apps/api/src/shared/config/AppConfig.ts`)
- [x] 1.4 Adicionar `TYPESAFE_API_KEY: ${env:TYPESAFE_API_KEY, 'changeme-typesafe-api-key'}` em `apps/api/sls/config/env.yml`
- [x] 1.5 Incluir `TYPESAFE_API_KEY: 'test'` no stub de env de `apps/api/src/main/functions/external/apiKeyAuthorizer.test.ts`

## 2. Providers

- [x] 2.1 Criar `GeminiAnonymizationProvider` (`@Injectable()`, em `apps/api/src/infra/services/anonymization/`) movendo o corpo atual de `QuestionAnonymizationClassifier.classify` (prompt, `responseSchema`, validação manual, timeout de 8s) sem mudar o comportamento
- [x] 2.2 Criar `JevAnonymizationProvider` (`@Injectable()`, recebe `AppConfig`) com uma chamada `systemOne` por pergunta em `Promise.all`, `state` contendo só texto e `questionType`, e as questões `pii` (`noul`) e `category` (`choice`)
- [x] 2.3 Implementar o mapeamento em `JevAnonymizationProvider`: `needsAnonymization` com corte em 0.5, `confidence = max(p, 1 - p)`, `reason` a partir de um mapa fixo em português por categoria (`identificador`, `contato`, `sensivel`, `financeiro`) e frase genérica quando não há PII ou a categoria é `nenhum`
- [x] 2.4 Aplicar o timeout de 8s com `AbortController` compartilhado e tratar erro, timeout e resposta fora do formato devolvendo `null` para a pergunta afetada, com `console.error` (sem o texto da pergunta)

## 3. Orquestrador

- [x] 3.1 Reescrever `QuestionAnonymizationClassifier` para injetar os dois providers e manter a assinatura `classify(items) → Map<id, AnonymizationSuggestion | null>` e o namespace `Item`
- [x] 3.2 Chamar o Jev com todos os itens e enviar ao Gemini, em um único batch, apenas os itens que voltaram `null`, mesclando os resultados
- [x] 3.3 Não chamar o Gemini quando o Jev resolveu todos os itens, e devolver `null` para o que nenhum dos dois resolveu, sem propagar erro
- [x] 3.4 Registrar um log por lote com as contagens de Jev, Gemini e sem resultado, sem o texto das perguntas

## 4. Testes

- [x] 4.1 Testes do `JevAnonymizationProvider` com o SDK mockado: mapeamento de `noul`/`choice`, limite exato em 0.5, categoria inconsistente com a decisão, entrada mínima do `state`, erro e timeout
- [x] 4.2 Testes do `QuestionAnonymizationClassifier` com os providers mockados: Jev resolve tudo (Gemini não é chamado), falha parcial (Gemini só com as restantes), Jev indisponível (batch completo no Gemini), ambos falham (`null`)
- [x] 4.3 Rodar os testes existentes de anonimização (`AnonymizationEngine.test.ts`, `ExternalGetPublishedFormDataController.test.ts`) e o de `apiKeyAuthorizer.test.ts` para confirmar que nada quebrou

## 5. Verificação

- [x] 5.1 Rodar `pnpm --filter api typecheck` sem erros
- [ ] 5.2 Com uma `TYPESAFE_API_KEY` real, classificar "Qual sua religião?", "Qual o seu e-mail?" e "Qual sua cor favorita?" pelo `JevAnonymizationProvider` e conferir `needsAnonymization`, `confidence` e `reason`
- [ ] 5.3 Forçar falha do Jev (chave inválida) e confirmar que o Gemini assume e que o log do lote mostra as perguntas resolvidas pelo Gemini
- [ ] 5.4 Definir `TYPESAFE_API_KEY` no ambiente de deploy antes do `pnpm deploy`
