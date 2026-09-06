## 1. Setup e configuração

- [x] 1.1 Adicionar dependência `@google/generative-ai` em `apps/api/package.json`
- [x] 1.2 Adicionar `GEMINI_API_KEY` a `apps/api/sls/config/env.yml` e aos secrets de deploy (dev)
- [x] 1.3 Adicionar leitura da nova env var na config resolvida via DI (padrão já usado para outras chaves/secrets)

## 2. Modelo de dados

- [x] 2.1 Adicionar tipo `AnonymizationSuggestion` (`{ needsAnonymization: boolean; confidence: number; reason: string; classifiedAt: string } | null`) em `packages/shared`
- [x] 2.2 Adicionar campo opcional `anonymizationSuggestion` à entidade `Question` (`packages/shared/entities/Question.ts`)
- [x] 2.3 Adicionar `anonymizationSuggestion` a `QuestionItem` (`apps/api/src/infra/database/dynamo/items/QuestionItem.ts`), incluindo `fromEntity`/`toEntity`

## 3. Motor de classificação (Gemini)

- [x] 3.1 Criar `QuestionAnonymizationClassifier` em `apps/api/src/infra/services/` com método `classify(text: string, questionType: QuestionType): Promise<AnonymizationSuggestion | null>`
- [x] 3.2 Montar prompt enxuto (apenas texto da pergunta + `questionType`) e `responseSchema` estruturado (`needsAnonymization`, `confidence`, `reason`)
- [x] 3.3 Usar o modelo "flash" (mais barato/rápido) do Gemini
- [x] 3.4 Implementar timeout curto (ex. 3s) na chamada
- [x] 3.5 Implementar fail-open: qualquer erro, timeout ou resposta fora do schema esperado retorna `null` (nunca lança exceção)
- [x] 3.6 Logar erros do provedor para observabilidade (sem expor a chave de API nos logs)
- [x] 3.7 Decorar a classe com `@Injectable()` para entrar no container de DI

## 4. Integração no fluxo de salvar perguntas

- [x] 4.1 Em `InsertQuestionsInFormUseCase`, para cada pergunta nova: chamar o classificador antes de incluir em `questionsToSave`
- [x] 4.2 Para pergunta existente: só chamar o classificador quando `text` ou `questionType` mudou em relação à versão persistida; caso contrário, preservar o `anonymizationSuggestion` já existente
- [x] 4.3 Persistir o resultado (ou `null`, em caso de falha) junto com a pergunta salva
- [x] 4.4 Garantir que uma falha do classificador não impede a conclusão de `InsertQuestionsInFormUseCase`

## 5. Exposição da sugestão

- [x] 5.1 Confirmar que `anonymizationSuggestion` é retornado nos endpoints que já expõem perguntas do formulário (ex. `GetFormController`, `ListFormsController` se aplicável), sem necessidade de novo endpoint — e excluí-lo explicitamente de `GetPublishedFormController` (portal de dados públicos), que não deve vazar o veredito da IA
- [x] 5.2 Atualizar tipos compartilhados usados pelo `apps/web` para o novo campo

## 6. Web: aviso no editor de perguntas

- [x] 6.1 Exibir um aviso visual na pergunta quando `anonymizationSuggestion?.needsAnonymization === true` (ex. tooltip com o `reason`)
- [x] 6.2 Definir e aplicar o limiar de `confidence` mínimo para exibir o aviso (ver Open Question do design)

## 7. Testes

- [ ] 7.1 (Pulado) Teste unitário do `QuestionAnonymizationClassifier` — `apps/api` não tem test runner configurado hoje; decisão do usuário foi não introduzir um agora como parte desta mudança
- [ ] 7.2 (Pulado) Teste unitário de `InsertQuestionsInFormUseCase` — mesma razão acima
- [x] 7.3 Rodar `pnpm typecheck` em `apps/api` e `apps/web` após as mudanças de tipos compartilhados — ambos passam (o único erro remanescente em `apps/api`, `ProfileRepository.ts`, é pré-existente e não relacionado a esta mudança)

## 8. Validação final

- [x] 8.1 Rodar `openspec validate detect-question-anonymization --strict` e corrigir eventuais problemas — válido
- [ ] 8.2 Deploy em `dev` (`pnpm deploy` em `apps/api`) e verificar manualmente a sugestão sendo gerada ao criar uma pergunta com texto sensível (ex. "Qual seu CPF?") e uma não sensível — requer `GEMINI_API_KEY` real e uma execução de deploy (ação com efeito em infraestrutura real); não executado automaticamente, aguardando o usuário rodar/aprovar
