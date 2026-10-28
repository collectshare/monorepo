## Context

Serverless Framework com uma role global (`role.yml`) e env global (`env.yml`). ~40 funções.

## Goals / Non-Goals

**Goals:** rotas públicas não conseguem apagar dados nem ler segredos que não usam; bucket privado por configuração explícita.

**Non-Goals:** uma role por função (manutenção alta para o tamanho do projeto); Secrets Manager/SSM em runtime (custo e latência; avaliar depois).

## Decisions

- **4 grupos de role** equilibram privilégio mínimo e manutenção. A tabela única impede restringir por item de forma útil; restringir por ação já tira `Delete*`/`BatchWrite` das públicas.
- **Bucket primeiro, IAM depois**, em entregas separadas: o bucket é trivial e sem risco; o IAM precisa de validação cuidadosa.
- **Segredos por função:** o `MASTER_SECRET` fica só no authorizer, rotas de API key, OAuth e `/mcp`; `EXPORT_SECRET` só nas leituras públicas/terceiros de dados; `ALGOLIA_ADMIN_API_KEY` só no `onFormChanged` (a busca usa uma search key nova `ALGOLIA_SEARCH_API_KEY`).

## Risks / Trade-offs

- [AccessDenied escondido em caminho pouco usado] → mapear ações por função com `grep` dos clients usados por cada handler antes de escrever as políticas; deploy em dev e verificar scripts + fluxo manual.

## Open Questions

- Criar a search key do Algolia restrita ao índice é aceitável operacionalmente?
