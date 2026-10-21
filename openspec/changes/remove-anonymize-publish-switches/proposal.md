## Why

Pela decisão de produto, todo formulário é anônimo e publicado no portal de dados abertos. Os dados pessoais já são tratados por pergunta (`piiStrategy` / `anonymizationSuggestion`). Hoje as flags `isAnonymous` e `isPublished` deixam o dono ou um integrador sair desse padrão, e espalham checagens por API, web e docs.

## What Changes

- **Web:** remover do `SaveFormDetailsModal` os switches "Anonimizar as respostas" e "Publicar no portal de dados abertos" e o texto de ajuda. Remover o card "Publicados / Rascunho" da Home e o filtro por `isPublished` em "sem respostas".
- **API:** remover `isAnonymous` e `isPublished` da entidade `Form`, do `FormItem`, dos schemas de create e update, dos use cases e da descrição do tool `update_form` (MCP).
- **Comportamento:**
  - As rotas `/portal/*` e `/v1/portal/*` passam a servir qualquer formulário existente.
  - `onFormChanged` sempre indexa no Algolia.
  - `SubmitFormUseCase` nunca grava `ip` nem `userAgent`.
- **BREAKING (contrato `/v1` e MCP):** os campos somem das respostas. Se um cliente ainda mandar os campos em create ou update, eles são ignorados (o zod descarta chaves desconhecidas) e não dão erro.
- **Dados:** o script `backfill:form-published` vira `cleanup:form-flags`. Ele remove os atributos antigos dos itens `Form`. O MODIFY no stream também reindexa no Algolia os formulários que estavam despublicados.
- **Docs:** `openapi.yaml`, `CLAUDE.md`, `README.md` e `README.en.md`.

## Capabilities

### New Capabilities
- `form-defaults`: todo formulário é anônimo e publicado, e nenhuma interface permite mudar isso.

### Modified Capabilities
<!-- api-openapi-docs: só muda o conteúdo do spec yaml, não os requisitos -->

## Impact

- `packages/shared/entities/Form.ts`
- `apps/api`:
  - `FormItem`
  - `createFormSchema` e `updateFormSchema`
  - `CreateFormUseCase` e `UpdateFormDetailsUseCase`
  - `SubmitFormUseCase` e `OnFormChangedUseCase`
  - `GetPublishedFormQuery`, `GetPublishedFormDataController`, `ExportPublishedFormDataController` e `ExternalGetPublishedFormDataController`
  - `UpdateFormTool`
  - testes relacionados
  - `scripts/` e `package.json`
- `apps/web`: `SaveFormDetailsModal` (view e controller), `formsService/save.ts` e Home (`useHomeController`, `HomeStats`, `index.tsx`).
- `apps/portal/public/openapi.yaml`, `CLAUDE.md` e READMEs.
- Não há dependência nova.
