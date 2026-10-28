## 1. Validação da submissão (API)

- [ ] 1.1 Criar `validateAnswers(questions, answers)` (função pura) com a matriz tipo × valor do design, checagem de `questionId` estrangeiro/duplicado e vazio = ausente
- [ ] 1.2 Usar em `SubmitFormUseCase` antes de montar as `Answer`; descartar respostas opcionais vazias
- [ ] 1.3 Remover `String(answerData.value)`: gravar string ou `string[]`; STARS normalizado para string do inteiro
- [ ] 1.4 `submitFormSchema`: `answers` sem `.min(1)` e `.max(98)` (1 submission + 1 update do contador do form + 98 answers, ver `fix-dynamo-write-integrity`)
- [ ] 1.5 Testes de `validateAnswers` cobrindo cada cenário da spec

## 2. Arquivos

- [ ] 2.1 Sanitizar `file.name` (basename, remover `/`, `\`, `..`, caracteres de controle; fallback `file`)
- [ ] 2.2 Rejeitar conteúdo decodificado acima de 5 MB
- [ ] 2.3 `GetFormSubmissionsUseCase`: assinar só chaves com prefixo `forms/{formId}/submissions/`, senão `null`

## 3. Web

- [ ] 3.1 `AllResponsesTable` e `QuestionChart`: renderizar link de FILE só se `safeUrl(value)` aceitar
- [ ] 3.2 Conferir que o `FormRenderer` envia CHECKBOX como array e STARS como número

## 4. Verificação

- [ ] 4.1 `pnpm --filter @monorepo/api typecheck && pnpm --filter @monorepo/api test`
- [ ] 4.2 Manual em dev: submeter form com CHECKBOX, obrigatória vazia, string em FILE e ver 400/resultado correto no dashboard
