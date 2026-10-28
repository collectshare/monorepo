## Why

`POST /forms/{formId}/submissions` é público e confia no corpo enviado. Hoje uma resposta CHECKBOX vira `'a,b'` (`String(value)`), perguntas obrigatórias aceitam `''`/`[]`, respostas de outro formulário são gravadas, um `questionId` repetido derruba a transação (500) e, pior, uma **string** numa pergunta FILE vira uma chave S3 arbitrária que o dono depois recebe como URL pré-assinada (oráculo de leitura do bucket). Achados 4.1, 2.3, 1.5(1,3) e 3.3 (`answers.min(1)`) do Relatório Backend; 3.2(2) do Relatório Frontend.

## What Changes

- Validar cada resposta contra as perguntas do formulário antes de gravar: `questionId` precisa existir no form, sem duplicatas, tipo de valor compatível com `questionType`, valor dentro de `options` (MULTIPLE_CHOICE/DROPDOWN/CHECKBOX) e de `1..max` (STARS).
- Resposta obrigatória vazia (`''`, só espaços, `[]`) conta como ausente.
- Preservar `string[]` nas respostas CHECKBOX (sem `String()`).
- Pergunta FILE só aceita o objeto `{ name, type, content }`; string é rejeitada (400). Nome do arquivo sanitizado (basename, sem `/`, `..`, controle) e tamanho máximo do conteúdo.
- `GetFormSubmissionsUseCase` só assina chaves com prefixo `forms/{formId}/submissions/`; o resto volta como `null`.
- Web: `<a href>` de respostas FILE passa por `safeUrl`.
- `answers` pode ser vazio quando nenhuma pergunta é obrigatória.
- Limite de respostas por submissão abaixo do teto do `TransactWriteCommand` (100 itens = 1 submission + 1 contador + 98 answers).

## Capabilities

### New Capabilities
- `form-submission-validation`: regras de aceitação de uma submissão pública e de leitura segura de respostas FILE.

### Modified Capabilities
<!-- nenhuma spec existente cobre submissões -->

## Impact

- `apps/api`: `SubmitFormUseCase`, `submitFormSchema`, `GetFormSubmissionsUseCase`, testes novos de `SubmitFormUseCase`.
- `apps/web`: `FormDashboard/components/AllResponsesTable.tsx`, `QuestionChart.tsx` (usar `safeUrl` já exportado pelo `RichText` ou um helper equivalente em `@monorepo/ui`).
- Contrato: submissões antes aceitas com dados inválidos passam a responder 400 (`VALIDATION`). Respondentes legítimos via `FormRenderer` não são afetados.
- Nenhuma dependência nova.
