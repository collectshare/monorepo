## Why

O CollectShare hoje só permite que o dono de um formulário veja suas próprias respostas. Não existe forma de tornar dados coletados publicamente acessíveis ou descobríveis. Este change abre a primeira fatia executável de um portal público de dados abertos (estilo Kaggle simplificado): formulários podem ser marcados como publicados, seus metadados ficam pesquisáveis via busca semântica (Algolia), e os dados publicados ficam disponíveis através de um novo app público (`apps/portal`) que reaproveita a identidade visual do produto já existente.

## What Changes

- Adiciona `isPublished: boolean` (default `true`, modelo opt-out) à entidade `Form` e ao schema de update/create no `apps/api`, com switch correspondente no FormBuilder (`apps/web`).
- Backfill one-off no DynamoDB para setar `isPublished = true` nos itens `Form` existentes que ainda não têm o atributo.
- Novo pipeline de sincronização `Form` → Algolia via DynamoDB stream consumer (`OnFormChangedUseCase` + `AlgoliaGateway`): upsert quando `isPublished === true`, remoção do índice quando `isPublished === false`.
- Novos endpoints públicos (`GET /portal/datasets/{formId}`, `GET /portal/datasets/{formId}/data`) que servem metadados e dados paginados (cursor-based) apenas de formulários publicados. Respostas do tipo `FILE` são omitidas do payload público nesta iteração.
- Novo app `apps/portal` (Vite + React + TS, público, sem auth): página Home com busca semântica via um endpoint público do `apps/api` que faz proxy para o Algolia (o Algolia nunca é chamado diretamente do browser) e página de Dataset com tabela paginada dos dados brutos.
- Novo pacote `packages/ui` com os componentes de design system compartilhados entre `apps/web` e `apps/portal` (`Button`, `Card`, `Badge`, `Input`, `Table`, `DataTable`, tokens de tema). `apps/web` passa a importar desses componentes em vez de manter cópias locais — refatoração mecânica, sem mudança de comportamento visual.
- **Fora de escopo desta iteração**: anonimização/PII (o branch `feature/api` com `AnonymizationEngine`/`piiStrategy`/`consentGiven` é follow-up futuro, não dependência), export CSV/bulk download, e infraestrutura de deploy/domínio do `apps/portal`.

Os dados publicados saem **sem anonimização** (mesmo shape das respostas) — decisão explícita e assumida para esta fase; o dono do formulário é avisado disso na UI antes de publicar.

## Capabilities

### New Capabilities
- `form-publication`: formulário ganha um estado de publicação (`isPublished`) controlável pelo dono, que determina se o formulário é elegível para aparecer no portal público e na busca.
- `dataset-search`: sincronização de metadados de formulários publicados para um índice de busca (Algolia) e a experiência de busca semântica no portal público.
- `public-dataset-access`: endpoints públicos e não autenticados para consultar metadados e dados paginados de um formulário publicado, com exclusão de campos sensíveis (`ip`, `userAgent`) e de respostas do tipo `FILE`.
- `portal-app`: novo app público `apps/portal` (Home com busca + página de Dataset com tabela paginada), sem autenticação.
- `shared-ui-package`: novo pacote `packages/ui` extraindo componentes de design system reutilizáveis entre `apps/web` e `apps/portal`.

### Modified Capabilities
(nenhuma — não há specs existentes em `openspec/specs/` para os fluxos de formulário/submissão sendo tocados; os requisitos novos entram como capabilities novas acima.)

## Impact

- **`packages/shared`**: `entities/Form.ts`, `types/IForm.ts` — novo campo `isPublished`.
- **`apps/api`**:
  - `application/controllers/form/schemas/{createFormSchema,updateFormSchema}.ts` — novo campo com default.
  - `application/usecases/form/UpdateFormDetailsUseCase.ts` — persistir `isPublished`.
  - Novo `application/usecases/form/OnFormChangedUseCase.ts`, `application/controllers/streams/OnFormChangedController.ts`, `main/functions/form/onFormChanged.ts`.
  - Novo `infra/gateways/AlgoliaGateway.ts` (agora com método de busca além de upsert/delete), novas env vars em `shared/config/env.ts` / `AppConfig.ts`.
  - Novos `application/controllers/portal/{GetPublishedFormController,GetPublishedFormDataController,SearchDatasetsController}.ts`, `application/queries/GetPublishedFormDataQuery.ts`, `main/functions/portal/*.ts`, `sls/functions/portal.yml` — inclui endpoint público de busca (`GET /portal/search`) que faz proxy para o Algolia.
  - `infra/database/dynamo/repositories/FormSubmissionRepository.ts` — novo método de paginação por cursor (ou repositório dedicado para o path público).
  - Script one-off de backfill (fora do runtime normal da API).
- **`apps/web`**: `views/pages/FormBuilder/components/schema.ts`, `SaveFormDetailsModal/useSaveFormDetailsModalController.ts`, `app/services/formsService/*` — novo campo `isPublished`; migração de imports de `components/ui/*` e `components/DataTable` para `@monorepo/ui`.
- **Novo `apps/portal`**: app completo (rotas, services, `httpClient`, `portalService` — busca via backend, sem SDK do Algolia no bundle).
- **Novo `packages/ui`**: pacote de componentes compartilhados.
- **Infra**: nova tabela de stream trigger no `serverless.yml`/`sls/functions/form.yml`, novas variáveis de ambiente (Algolia, só no `apps/api`), novo conjunto de rotas HTTP públicas (incluindo busca).
- **Dependências novas**: `algoliasearch` (SDK) em `apps/api` apenas — o `apps/portal` não depende do SDK nem expõe credenciais do Algolia no bundle.
