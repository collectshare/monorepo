## 1. Modelo de dados (packages/shared)

- [x] 1.1 Adicionar `isPublished: boolean` em `Form` e `Form.Attributes` (`packages/shared/entities/Form.ts`), default `true` no construtor
- [x] 1.2 Incluir `isPublished` em `packages/shared/types/IForm.ts` (já herda automaticamente de `InstanceType<typeof Form>`, nenhuma mudança de código necessária)

## 2. Backend — persistência de `isPublished` (apps/api)

- [x] 2.1 Adicionar `isPublished: z.boolean().default(true)` em `createFormSchema.ts` e `updateFormSchema.ts`
- [x] 2.2 Atualizar `UpdateFormDetailsUseCase` para receber e persistir `isPublished` (mesmo padrão de `title`/`tags`/`isAnonymous`) — corrigido também um bug pré-existente de tipagem (`isAnonymous?`) que já quebrava o typecheck
- [x] 2.3 Atualizar `CreateFormUseCase` (equivalente) para persistir `isPublished` na criação
- [x] 2.4 Atualizar `FormItem.toEntity`/`fromEntity` para incluir `isPublished`, tratando ausência do atributo como `true` na leitura (`formItem.isPublished ?? true`)
- [x] 2.5 Escrever script one-off de backfill (`apps/api/scripts/backfillFormIsPublished.ts`, `pnpm --filter @monorepo/api backfill:form-published`)
- [x] 2.6 Rodar `pnpm --filter @monorepo/api typecheck` (passa; únicos erros restantes são pré-existentes em `ProfileRepository.ts`, não relacionados a este change)

## 3. Backend — pipeline de sincronização com Algolia (apps/api)

- [x] 3.1 Adicionar `ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_API_KEY`, `ALGOLIA_INDEX_NAME` em `shared/config/env.ts` e `AppConfig.ts` (+ `sls/config/env.yml` via `${env:...}`)
- [x] 3.2 Criar `infra/gateways/AlgoliaGateway.ts` (wrapper do SDK `algoliasearch` v4, métodos `upsertRecord`/`deleteRecord`), seguindo o padrão de `StorageGateway`
- [x] 3.3 Criar `application/usecases/form/OnFormChangedUseCase.ts` (`implements IDynamoStreamConsumer`): filtra `INSERT`/`MODIFY` em itens `type === 'Form'`; se `isPublished === true` faz upsert no índice (via `ProfileRepository` para `accountName`); se `isPublished === false` remove o registro
- [x] 3.4 Criar `application/controllers/streams/OnFormChangedController.ts` (mesmo padrão de `OnFormSubmittedController`)
- [x] 3.5 Criar `main/functions/form/onFormChanged.ts` (adapter `lambdaDynamoAdapter`)
- [x] 3.6 Registrar a função `onFormChanged` em `sls/functions/form.yml` no stream trigger da `MainTable`, com `filterPatterns` para `type: [Form]` e `eventName: [INSERT, MODIFY]`
- [x] 3.7 Adicionar `algoliasearch` como dependência de `apps/api`
- [x] 3.8 Rodar `pnpm --filter @monorepo/api typecheck` (passa; erros restantes pré-existentes em `ProfileRepository.ts`)
- [x] 3.9 Adicionar método `search(query: string)` em `AlgoliaGateway` (usa o mesmo índice/config de escrita, `index.search()` do SDK v4), para suportar a busca proxied pelo backend (ver seção 5)

## 4. Backend — paginação e query pública de dados (apps/api)

- [x] 4.1 Adicionar método `findByFormIdPaginated(formId, { limit, cursor })` em `FormSubmissionRepository`, usando `Limit`/`ExclusiveStartKey` do `QueryCommand` e serializando `LastEvaluatedKey` em base64 como cursor
- [x] 4.2 Criar `application/queries/GetPublishedFormDataQuery.ts`: busca submissions paginadas + respostas, retorna apenas campos públicos (exclui `ip`/`userAgent`) e omite respostas de questões `QuestionType.FILE`
- [x] 4.3 Criar `application/queries/GetPublishedFormQuery.ts`: metadados do form + questions (também filtrando `FILE`), validando `isPublished`

## 5. Backend — endpoints públicos do portal (apps/api)

- [x] 5.1 Criar `application/controllers/portal/GetPublishedFormController.ts` (`Controller<'public', ...>`): `GET /portal/datasets/{formId}`, retorna 404 se `!form.isPublished`
- [x] 5.2 Criar `application/controllers/portal/GetPublishedFormDataController.ts` (`Controller<'public', ...>`): `GET /portal/datasets/{formId}/data?cursor=&limit=`, retorna 404 se `!form.isPublished`
- [x] 5.3 Criar `main/functions/portal/{getPublishedForm,getPublishedFormData}.ts`
- [x] 5.4 Criar `sls/functions/portal.yml` com as duas rotas (sem `authorizer`)
- [x] 5.5 Compor `sls/functions/portal.yml` no `serverless.yml` principal (+ CORS `localhost:5174` para o dev local do portal)
- [x] 5.6 Rodar `pnpm --filter @monorepo/api typecheck` (passa; erros restantes pré-existentes em `ProfileRepository.ts`)
- [x] 5.7 **[Revisado — busca movida para o backend]** Criar `application/controllers/portal/SearchDatasetsController.ts` (`Controller<'public', ...>`): `GET /portal/search?q=`, chama `AlgoliaGateway.search()` e retorna os hits
- [x] 5.8 Criar `main/functions/portal/searchDatasets.ts` (adapter `lambdaHttpAdapter`)
- [x] 5.9 Adicionar a rota `GET /portal/search` em `sls/functions/portal.yml` (sem `authorizer`)
- [x] 5.10 Rodar `pnpm --filter @monorepo/api typecheck` após os itens 3.9/5.7–5.9 (passa; erros restantes pré-existentes em `ProfileRepository.ts`)

## 6. Frontend — form builder (apps/web)

- [x] 6.1 Adicionar `isPublished` ao schema (o campo de configuração vive no schema local de `useSaveFormDetailsModalController.ts`, não em `FormBuilder/components/schema.ts` — esse cobre apenas as perguntas; ajustado no arquivo correto)
- [x] 6.2 Adicionar campo `isPublished` controlado por `Switch` (`components/ui/Switch.tsx`) em `SaveFormDetailsModal`/`useSaveFormDetailsModalController.ts`, default `true`
- [x] 6.3 Adicionar copy explicando que dados publicados não passam por anonimização nesta fase
- [x] 6.4 Incluir `isPublished` nos tipos de request/response de `formsService` (`save.ts`; `getForm.ts` já herda via `IForm`) — `pnpm --filter @monorepo/web typecheck` passa

## 7. Pacote compartilhado `packages/ui`

- [x] 7.1 Criar `packages/ui` (`@monorepo/ui`) com `package.json`, `tsconfig.json` (pacote não-buildado, consumido como fonte TS pelos apps, seguindo o padrão de pacotes shadcn em monorepo)
- [x] 7.2 Mover `Button`, `Card`, `Badge`, `Input`, `Table` de `apps/web/src/components/ui` para `packages/ui` — além do previsto, também foi necessário mover `DropdownMenu`, `Select`, `Command` (sem `CommandDialog`, não usado), `Popover` e `Separator`, que são dependências transitivas do `DataTable` (não estava explícito no design original)
- [x] 7.3 Mover `components/DataTable/*` para `packages/ui`, incluindo o `table.d.ts` (augmentation de `ColumnMeta.nameInFilters` do `@tanstack/react-table`, recriado em `packages/ui/src/types/tanstack-table.d.ts` e ligado via `/// <reference>` em `index.ts` — um `import` normal quebrava o build do Vite por não haver JS correspondente ao `.d.ts`)
- [x] 7.4 Mover os tokens de tema (`@theme`, `:root`, `.dark`) para `packages/ui/src/styles.css`; `apps/web/src/index.css` agora importa `@monorepo/ui/styles.css` e usa `@source` para o Tailwind escanear as classes do pacote
- [x] 7.5 Atualizar `apps/web` para importar esses componentes de `@monorepo/ui` em vez das cópias locais, removendo os arquivos duplicados (todos os ~30 arquivos consumidores atualizados e imports reordenados via `eslint --fix`)
- [x] 7.6 Rodar `pnpm --filter @monorepo/web lint` (limpo, só warnings pré-existentes de `console`) e typecheck real via `tsc -b` (o script `typecheck` do `apps/web` é um no-op pré-existente — root `tsconfig.json` só tem `references`, sem `-b` isso checa 0 arquivos; usei `tsc -b --noEmit` para verificação real, que passou limpo). `pnpm --filter @monorepo/ui typecheck` também passa.

## 8. Novo app `apps/portal`

- [x] 8.1 Scaffold `apps/portal` (Vite + React + TS), `package.json` como `@monorepo/portal`, porta dev 5174 (para não colidir com `apps/web`)
- [x] 8.2 Configurar `app/services/httpClient.ts` (axios sem interceptor de `Authorization`)
- [x] 8.3 **[Revisado — busca movida para o backend]** Removido `app/services/algoliaClient.ts` e a dependência `algoliasearch` do `apps/portal` (o SDK e as credenciais do Algolia não existem mais no bundle do frontend)
- [x] 8.4 Criado `app/services/portalService/{getDataset,getDatasetData,searchDatasets}.ts` — `searchDatasets` chama `GET /portal/search?q=` via `httpClient` (mesmo padrão dos demais métodos do `portalService`)
- [x] 8.5 Atualizado `views/pages/Home`: busca via `portalService.searchDatasets` (debounce mantido), cards de resultado (título, descrição, tags, `submissionCount`, autor) — sem nenhuma chamada direta ao Algolia
- [x] 8.6 Criar `views/pages/Dataset/:formId`: metadados do dataset + `DataTable` paginada (TanStack Query `useInfiniteQuery`, cursor/"carregar mais") consumindo `GET /portal/datasets/{formId}/data`; colunas geradas dinamicamente a partir das perguntas do formulário (excluindo `FILE`)
- [x] 8.7 Configurar rotas do app sem `AuthGuard` (`BrowserRouter` simples com `/` e `/dataset/:formId`)
- [x] 8.8 Removido `VITE_ALGOLIA_APP_ID`/`VITE_ALGOLIA_SEARCH_KEY`/`VITE_ALGOLIA_INDEX_NAME` de `.env-exemple`; `pnpm --filter @monorepo/portal build` e typecheck (`tsc -b`) passam limpos sem o SDK do Algolia (bundle caiu de 532KB para 517KB)

## 9. Verificação end-to-end

- [ ] 9.1 Marcar/desmarcar `isPublished` no FormBuilder e confirmar persistência via `PATCH`/`POST /forms/{formId}` — **requer deploy real na AWS (`pnpm --filter @monorepo/api deploy`) e uso manual no browser; não executado neste ambiente**
- [ ] 9.2 Confirmar disparo do `OnFormChangedUseCase` e o upsert/remoção correspondente no índice Algolia — **requer credenciais reais do Algolia (`ALGOLIA_APP_ID`/`ALGOLIA_ADMIN_API_KEY`/`ALGOLIA_INDEX_NAME`) e stack deployada; não executado neste ambiente**
- [x] 9.3 (parcial) Rodei `pnpm --filter @monorepo/portal dev` e validei via `curl` que o servidor sobe, os módulos transformam sem erro e o CSS gerado contém os tokens de tema e as classes utilitárias vindas de `@monorepo/ui` (confirma que a integração Tailwind cross-package funciona). **Não pude abrir num browser real** (sem ferramenta de browser disponível neste ambiente) nem testar a busca Algolia de ponta a ponta (sem credenciais reais) — fluxo de busca/paginação por dataset publicado segue não verificado visualmente.
- [x] 9.4 (parcial) `pnpm --filter @monorepo/web build` e `tsc -b --noEmit` passam limpos após a migração para `@monorepo/ui`; CSS de produção contém as mesmas classes/tokens de antes. **Não confirmei visualmente ausência de regressão num browser** — mesma limitação de ferramenta acima.
- [x] 9.5 `pnpm build` e `pnpm lint` na raiz — ambos passam limpos (corrigido um gap pré-existente: os `eslint.config.mjs` de `apps/web`/`apps/portal` não ignoravam `dist/`, o que gerava ruído massivo de lint sobre artefatos de build)
