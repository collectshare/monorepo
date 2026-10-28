## Context

Tabela única; contadores vivem no item `FORM#<id>`. Dois consumers de stream (`onFormSubmitted`, `onFormChanged`) com `batchSize: 10`, filtrados por tipo. Sem `ReportBatchItemFailures`, um handler que não lança = lote inteiro confirmado.

## Goals / Non-Goals

**Goals:** nenhuma escrita bem-sucedida apaga outra; evento com erro é reprocessado; salvar perguntas nunca deixa o form sem perguntas.

**Non-Goals:** paginação de leitura (ver `harden-api-reads-and-input`); TTL de `ApiKeyItem` — o `apiKeyAuthorizer` já nega chaves com `expiresAt` vencido; o TTL ignorar o atributo ISO só mantém a chave no histórico do dono. Sem risco de segurança; documentar no item.

## Decisions

- **Contador na transação** em vez de stream idempotente (tabela de dedupe por `submissionId`): uma escrita a menos, zero infra nova, e a contagem fica exata. Custo: 1 item da transação.
- **Stream em série** (`for…of`) dentro do lote: preserva a ordem por shard, que é por chave; o throughput do `onFormChanged` é baixo. Parar no primeiro erro e reportar dele em diante é o que a AWS recomenda para manter ordem.
- **Ordem do InsertQuestions:** `classify → saveMany(novas/alteradas) → deleteMany(ids ausentes)`. Falha antes do delete deixa perguntas a mais (recuperável salvando de novo), nunca a menos. Transação não cabe (até 100 itens e as perguntas podem passar disso com o delete).
- **Retry de UnprocessedItems:** até 5 tentativas com backoff exponencial curto; depois lança erro.

## Risks / Trade-offs

- [Remover `onFormSubmitted` com eventos em voo] → deploy na mesma release; eventos ainda não processados no momento do deploy são perdidos para o contador → rodar uma recontagem one-off (`Count` das submissions por form) após o deploy.
- [`removeUndefinedValues` esconder bug de mapper] → aceitável; é o comportamento esperado pelos mappers que espalham opcionais.

## Migration Plan

Deploy da API; executar `pnpm recount:submissions` (script novo, one-off). Rollback: reverter o deploy; o contador pode ficar desalinhado e a recontagem corrige.
