## Context

O `apps/api` segue Clean Architecture com um container de DI custom (`kernel/di/Registry`), Dynamo single-table (`MainTable`), stream consumers (`IDynamoStreamConsumer`) já usados para efeitos colaterais assíncronos (`OnFormSubmittedUseCase` incrementa `submissionCount`), e controllers `public`/`private` (`Controller<'public' | 'private', Response>`) mapeados 1:1 para funções Lambda declaradas em `sls/functions/*.yml`. O `apps/web` consome esses endpoints via `formsService` (axios) e usa TanStack Query.

Hoje `Form` (`packages/shared/entities/Form.ts`) não tem noção de visibilidade — todo formulário só é acessível por quem tem o link (`GET /forms/{formId}` já é público, mas não indexado nem descoberto). Este design adiciona um estado de publicação e um caminho de leitura pública dedicado, sem tocar no fluxo de submissão nem no armazenamento existente de `FormSubmission`/`Answer`.

## Goals / Non-Goals

**Goals:**
- Formulário marcável como publicado (`isPublished`, opt-out, default `true`), com toggle no FormBuilder.
- Metadados de formulários publicados pesquisáveis via Algolia, mantidos em sincronia por stream (sem escrita dupla explícita nos use cases de formulário).
- Dados de formulários publicados acessíveis publicamente via HTTP, paginados, sem vazar campos internos de submissão (`ip`, `userAgent`) nem respostas `FILE`.
- Novo app público `apps/portal` com Home (busca) e página de Dataset (tabela paginada), visualmente consistente com `apps/web` via `packages/ui` compartilhado.

**Non-Goals:**
- Anonimização/PII de respostas — dados saem crus nesta fase (decisão explícita do usuário; ver `feature/api` como follow-up).
- Export CSV / bulk download.
- Deploy/domínio/CDN do `apps/portal`.
- Migração completa de todos os componentes de `apps/web/src/components/ui` para `packages/ui` — só os necessários ao MVP do portal (`Button`, `Card`, `Badge`, `Input`, `Table`, `DataTable`, tokens de tema).

## Decisions

### 1. Sincronização via DynamoDB Stream consumer (não escrita dupla no use case)
Reaproveita o padrão existente (`OnFormSubmittedUseCase implements IDynamoStreamConsumer`). Um novo `OnFormChangedUseCase` reage a `INSERT`/`MODIFY` em itens `type === 'Form'` da `MainTable`, olha `isPublished` na `NewImage` e faz upsert ou delete no índice Algolia.
- **Alternativa considerada**: chamar o Algolia diretamente dentro de `UpdateFormDetailsUseCase`/`CreateFormUseCase`. Rejeitada — acopla o caminho de escrita principal a uma dependência externa (latência e falhas do Algolia não devem afetar salvar um formulário), e foge do padrão já estabelecido no repositório para efeitos colaterais pós-escrita.
- Trade-off aceito: sincronização é *eventually consistent* (delay do stream); aceitável para um índice de busca.

### 2. Gateway dedicado `AlgoliaGateway`, sem repositório
Segue o padrão de `StorageGateway` (wrapper fino sobre um SDK externo, injetável via `AppConfig`). Não é um "repositório" porque não modela uma entidade do domínio — é uma integração de infraestrutura com um serviço de busca de terceiros. Além de `upsertRecord`/`deleteRecord` (escrita, usados pelo `OnFormChangedUseCase`), o gateway ganha um método de busca (`search`) usado pelo endpoint público de busca (Decisão 8).

### 3. Query pública dedicada em vez de reaproveitar `GetFormSubmissionsQuery`
`GetPublishedFormDataQuery` é uma classe nova, não uma variação de `GetFormSubmissionsQuery`. Motivo: `GetFormSubmissionsQuery` retorna o objeto `FormSubmission` completo (que inclui `ip`/`userAgent` na entidade); qualquer refatoração futura que adicione um campo sensível à entidade vazaria automaticamente para o público se o path fosse compartilhado. A query pública seleciona explicitamente os campos permitidos e filtra respostas cujo `Question.type === QuestionType.FILE`.
- Isso é enforcement por design (allowlist de campos), não apenas um filtro de output — reduz o raio de um erro futuro de um dev que adiciona campo sensível à entidade `FormSubmission`.

### 4. Paginação por cursor sobre `QueryCommand` existente
`FormSubmissionItem` já é armazenado com `PK = FORM#{formId}` e `SK` prefixado `SUBMISSION#`, então a query por `formId` já é um `QueryCommand` de partição única — cursor-based pagination é apenas expor `Limit` e `ExclusiveStartKey`/`LastEvaluatedKey` do SDK (não precisa de novo índice). O cursor exposto na API é o `LastEvaluatedKey` serializado em base64.
- Implementado como um novo método `findByFormIdPaginated(formId, { limit, cursor })` em `FormSubmissionRepository` (reaproveita o repositório existente, só adiciona uma variante paginada) em vez de duplicar toda a classe.

### 5. `isPublished` ausente tratado como `true` na leitura
Durante a janela entre deploy e execução do backfill, itens `Form` antigos não têm o atributo no Dynamo. `FormItem.toEntity` usa `formItem.isPublished ?? true` para não quebrar formulários existentes (consistente com o default opt-out da decisão de produto). O backfill (script one-off, fora do runtime da API) depois torna o campo explícito em todos os itens.

### 6. Novo pacote `packages/ui` com superfície mínima
Extrai só `Button`, `Card`, `Badge`, `Input`, `Table`, `DataTable/*` e os tokens de tema (`index.css`, `components.json`) de `apps/web/src/components`. `apps/web` importa esses componentes de `@monorepo/ui`; os demais componentes de `apps/web/src/components/ui` (não usados pelo portal) permanecem locais.
- **Alternativa considerada**: mover todo `components/ui` para o pacote de uma vez. Rejeitada por ser refatoração ampla e desnecessária para o MVP — a superfície mínima reduz o diff e o risco de regressão visual nesta iteração.

### 7. `apps/portal` como app irmão, sem `AuthGuard`
Reaproveita a estrutura de pastas de `apps/web` (`views/pages`, `app/services`) mas sem `AuthContext`/`AuthGuard`/interceptor de `Authorization` — toda rota é pública. `httpClient` do portal é uma cópia simplificada do de `apps/web` (axios puro, sem token).

### 8. Busca proxied pelo backend (`apps/api`), não client-side
**Revisado**: a versão original desta decisão propunha o `apps/portal` chamar o Algolia diretamente do browser com uma search-only API key. O usuário optou por manter toda a integração com o Algolia no backend — nenhuma credencial ou detalhe do provedor de busca deve ser exposto no bundle do portal.

Novo endpoint público `GET /portal/search?q=` (`SearchDatasetsController`, `Controller<'public', ...>`, sem `authorizer`) recebe o termo de busca e delega ao `AlgoliaGateway.search()`, que consulta o índice usando a mesma configuração (`AppConfig.algolia`) já usada para escrita. O `apps/portal` chama esse endpoint via `portalService` (mesmo padrão axios de `getDataset`/`getDatasetData`), e não depende do SDK `algoliasearch` nem de `VITE_ALGOLIA_*` no bundle.
- **Alternativa considerada (rejeitada)**: busca client-side com search-only key — reduz uma chamada de rede (search direto no Algolia) e é o padrão mais comum recomendado pelo Algolia, mas expõe app ID/key no bundle público. Rejeitada por decisão explícita do usuário de manter toda a superfície do Algolia no backend, mesmo com a search-only key sendo desenhada para ser pública.
- Trade-off aceito: a busca agora depende da disponibilidade do `apps/api` (antes era uma chamada direta ao Algolia, independente do backend); latência adicional de um hop a mais (browser → `apps/api` → Algolia).

## Risks / Trade-offs

- **[Risco] Dados publicados sem anonimização podem expor PII em respostas de texto livre.** → Mitigação: aceito como decisão explícita do usuário para esta fase; UI do FormBuilder deixa isso explícito no copy do switch de publicação antes de ativar `isPublished`.
- **[Risco] Divergência entre Algolia e Dynamo se o stream falhar silenciosamente (ex.: erro de rede para o Algolia dentro do consumer).** → Mitigação: o consumer deve deixar o erro propagar para que o Lambda/stream reprocesse o batch (mesmo comportamento de falha que `OnFormSubmittedUseCase` já assume implicitamente); nenhuma lógica de retry customizada nesta iteração.
- **[Risco] `GetPublishedFormDataController` pode ser usado para enumerar/raspar todos os formulários publicados em massa.** → Mitigação: fora de escopo mitigar nesta iteração (sem rate limiting dedicado); aceito como risco conhecido, mesmo padrão de exposição pública que `GET /forms/{formId}` já tem hoje.
- **[Risco] Busca agora depende do `apps/api` estar no ar (antes seria uma chamada direta browser → Algolia).** → Mitigação: aceito — mesma disponibilidade que os demais endpoints públicos do portal já exigem; o endpoint de busca (`SearchDatasetsController`) não faz nenhuma escrita, só repassa a query ao Algolia, então tem o mesmo perfil de risco dos outros GETs públicos.
- **[Risco] Backfill via scan completo da `MainTable` é custoso/lento em tabelas grandes.** → Mitigação: aceitável por ser execução única (documento de origem já assume isso); rodar fora de horário de pico, sem necessidade de otimização adicional para o volume atual.
- **[Trade-off] `packages/ui` com superfície mínima pode divergir de novo se `apps/web` continuar evoluindo componentes fora dele.** → Aceito: escopo deliberadamente pequeno para não bloquear o MVP; expansão do pacote é iteração futura natural.

## Migration Plan

1. Deploy de `packages/shared` (novo campo `isPublished`) e `apps/api` (schemas, use case, `AlgoliaGateway`, stream consumer, endpoints públicos) — `isPublished` tratado como `true` quando ausente, então nenhum formulário existente muda de comportamento antes do backfill.
2. Rodar o script de backfill one-off (scan + `UpdateCommand` setando `isPublished = true` nos itens `Form` sem o atributo). Isso dispara o stream e popula o índice Algolia para todos os formulários existentes.
3. Deploy de `apps/web` (switch de publicação + migração de imports para `@monorepo/ui`).
4. Deploy/publicação de `apps/portal` (fora do escopo de infra detalhado aqui, mas depende dos passos 1–2 já estarem em produção).
- **Rollback**: reverter deploy do `apps/api`/`apps/web` é seguro (campo `isPublished` é aditivo); o índice Algolia pode ser limpo/recriado sem impacto no Dynamo, que continua sendo a fonte de verdade.

## Open Questions

- Nenhuma pendente para esta fatia — a única questão em aberto do documento original (omitir respostas `FILE` do endpoint público) foi resolvida como decisão: **omitir `FILE`** nesta iteração.
