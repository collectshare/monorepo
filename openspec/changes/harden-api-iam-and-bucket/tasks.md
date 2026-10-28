## 1. Bucket

- [ ] 1.1 `MainBucket.yml`: `PublicAccessBlockConfiguration` + `BucketEncryption`
- [ ] 1.2 Deploy em dev e conferir upload/download de arquivo pelo dashboard

## 2. Mapeamento

- [ ] 2.1 Tabela função → ações AWS → segredos (a partir dos imports de cada handler)

## 3. Roles e env

- [ ] 3.1 Criar as 4 roles em `sls/resources/` e apontar `role:` em cada função
- [ ] 3.2 Mover segredos para `environment` por função; criar `ALGOLIA_SEARCH_API_KEY`
- [ ] 3.3 Remover a role e o env globais

## 4. Verificação

- [ ] 4.1 Dev: `verify:mcp-oauth`, `verify:mcp-server`, cadastro, builder, submissão com arquivo, portal, export CSV, `/v1` com API key
- [ ] 4.2 Atualizar `CLAUDE.md` (env por função)
