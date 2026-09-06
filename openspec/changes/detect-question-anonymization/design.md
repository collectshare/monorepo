## Context

Formulários (`apps/api/src/application/usecases/form/*`) coletam perguntas (`Question`, single-table DynamoDB via `QuestionItem`). Hoje não existe nenhum sinal — manual ou automático — de que uma pergunta coleta PII. Uma branch separada (`feature/api`, não mergeada e 26 commits atrás de `main`) já explorou um campo `piiStrategy` + `AnonymizationEngine` para aplicar anonimização a **valores de resposta** no export externo; esta mudança é independente disso e ataca um problema anterior: identificar, a partir do **texto da pergunta**, se ela provavelmente coleta PII, para orientar quem edita o formulário.

Não há nenhuma integração com LLM no monorepo hoje (nenhum SDK de IA generativa em `apps/api/package.json`). Este é o primeiro uso de um provedor de IA generativa na API.

## Goals / Non-Goals

**Goals:**
- Classificar automaticamente, via Gemini, se o texto de uma pergunta indica coleta de PII.
- Manter o prompt e o payload de entrada mínimos (somente texto da pergunta + tipo) para reduzir tokens/custo e latência.
- Rodar de forma incremental — apenas quando uma pergunta é criada ou seu texto/tipo muda — nunca reclassificar sem necessidade.
- Nunca bloquear ou quebrar o salvamento de um formulário por causa de falha/latência do Gemini (fail-open).
- Expor a sugestão como informação **não vinculante** para o editor do formulário decidir.

**Non-Goals:**
- Não aplica nenhuma estratégia de anonimização automaticamente aos dados de resposta (isso é escopo do `piiStrategy`/`AnonymizationEngine` de `feature/api`, fora deste change).
- Não reclassifica em lote perguntas já existentes (fica como extensão futura, citada no proposal como fora de escopo por decisão do usuário).
- Não decide sozinho qual estratégia de anonimização usar (pseudonimizar, generalizar, suprimir) — apenas sinaliza "parece PII, sim/não".
- Não persiste nem envia ao Gemini nenhum dado de resposta (nunca há dado pessoal real no prompt, só o texto da pergunta, que é metadado do formulário).

## Decisions

### 1. Gemini SDK e modelo
Usar `@google/generative-ai` (SDK oficial) com o modelo mais barato/rápido disponível (linha "flash") — não precisa do modelo mais capaz para uma classificação binária simples. Alternativa considerada: chamar a REST API diretamente via `fetch` para evitar dependência nova — rejeitada porque o SDK já cuida de parsing de erro e formatação de `responseSchema`, e o ganho de não ter a dependência é marginal.

### 2. Prompt enxuto e saída estruturada
O prompt envia **apenas**: texto da pergunta + `questionType` (ex.: TEXT, NUMBER, CHOICE). Não envia contexto do formulário inteiro, nem outras perguntas, nem qualquer resposta. Usa `responseSchema` do Gemini (structured output) para forçar retorno em JSON `{ needsAnonymization: boolean, confidence: number, reason: string }` — evita gastar tokens com instruções elaborada de formatação e evita parsing frágil de texto livre.
Alternativa considerada: few-shot prompt com exemplos — rejeitada para esta primeira versão por aumentar tokens de entrada; pode ser revisitado se a precisão do zero-shot for insuficiente.

### 3. Ponto de disparo: síncrono em `InsertQuestionsInFormUseCase`
A classificação roda de forma síncrona, pergunta a pergunta, apenas para perguntas novas ou cujo `text`/`questionType` mudou em relação à versão existente (reaproveita a lógica de diff que já existe no use case para decidir o que salvar). Alternativa considerada: disparar via evento assíncrono (ex. stream do DynamoDB, como `OnFormChangedUseCase` já faz para outras reações) — mais resiliente a latência do Gemini, mas foi descartada porque o requisito é a sugestão aparecer o quanto antes no editor, e o modelo "flash" tem latência baixa o suficiente (chamada síncrona, com timeout curto).

### 4. Fail-open com timeout curto
Timeout agressivo (ex. 3s) na chamada ao Gemini. Qualquer erro (timeout, rate limit, resposta malformada) resulta em `anonymizationSuggestion: null` e a pergunta é salva normalmente — nunca lança exceção que impeça `InsertQuestionsInFormUseCase` de completar. Log de erro para observabilidade, sem retry síncrono (para não aumentar a latência percebida pelo usuário).

### 5. Novo campo isolado em vez de reaproveitar `piiStrategy`
Por decisão explícita (ver proposal), este change não depende da branch `feature/api`. Cria-se `anonymizationSuggestion` como campo próprio e independente em `Question`/`QuestionItem`. Quando/se `feature/api` for mergeada, uma migração futura poderá usar `anonymizationSuggestion.needsAnonymization` para pré-popular `piiStrategy` — isso fica fora do escopo atual e é citado aqui só como caminho de evolução.

### 6. API key do Gemini
Nova env var (`GEMINI_API_KEY`) seguindo o padrão de secrets já usado no projeto (`sls/config/env.yml`), lida via `kernel/di` como as demais configs, nunca hardcoded.

## Risks / Trade-offs

- **[Risco] Falso negativo** (motor diz que não é PII, mas é) → Mitigação: é só uma sugestão; a responsabilidade final de marcar a pergunta continua sendo humana; `reason` retornado ajuda a pessoa a entender o veredito e discordar.
- **[Risco] Custo/latência do Gemini no caminho síncrono de salvar formulário** → Mitigação: prompt mínimo, modelo "flash", timeout curto de poucos segundos, e só roda quando o texto/tipo da pergunta muda (não a cada salvamento do formulário inteiro).
- **[Risco] Indisponibilidade da API do Gemini** → Mitigação: fail-open (campo fica `null`, formulário salva normalmente); nenhuma funcionalidade existente depende deste campo.
- **[Trade-off] Sem reclassificação em lote nesta versão** → perguntas criadas antes deste change nunca recebem sugestão automaticamente; aceito porque o usuário priorizou o caso incremental agora.
- **[Risco] Vazamento de dado sensível no prompt** → Mitigação: o prompt só contém o texto da pergunta (metadado do formulário, não resposta de usuário); nunca envia valores de submissão ao Gemini.

## Migration Plan

1. Adicionar `GEMINI_API_KEY` ao `sls/config/env.yml` e a variáveis de ambiente de deploy (dev primeiro).
2. Adicionar o campo opcional `anonymizationSuggestion` a `Question`/`QuestionItem` — campo opcional, sem exigir migração de dados existentes (perguntas antigas simplesmente não têm o campo, tratado como `null`/ausente).
3. Deploy do serviço classificador + integração no use case atrás do fluxo normal de salvar perguntas.
4. Web app passa a exibir o aviso quando `anonymizationSuggestion.needsAnonymization === true`.
5. Rollback: reverter a chamada no use case (feature isolada, sem dependências de schema obrigatórias) — o campo extra em itens já salvos é inofensivo se ignorado.

## Open Questions

- Qual o limiar de `confidence` a partir do qual vale a pena mostrar o aviso no editor (ex. só mostrar se `confidence >= 0.6`)? Fica a critério da UI/produto na implementação; motor sempre retorna o valor bruto.
- Se no futuro `feature/api` for mergeada, decidir se `anonymizationSuggestion` deve migrar para dentro do fluxo de `piiStrategy` ou continuar como campo informativo separado.
