## Context

`InsertQuestionsInFormUseCase.classifyQuestions` resolve a `anonymizationSuggestion` de cada pergunta nova ou alterada em três etapas: `PiiHeuristics` (determinístico), `QuestionClassificationCacheRepository` (DynamoDB com TTL) e, para o que sobrar, `QuestionAnonymizationClassifier.classify(items)`. Hoje esse classificador chama o Gemini (`gemini-3.6-flash`) em um único batch, com `responseSchema` JSON e timeout de 8s. Ele é fail-open: qualquer erro devolve `null` para todas as perguntas.

O Jev (`@typesafe-ai/sdk`) não gera texto. Ele recebe um `state` e perguntas tipadas (`noul`, `choice`, `score`) e devolve probabilidades, respondendo a todas em uma passada. Um `state` por chamada, sem batch de estados diferentes.

O detalhe do SDK (`TypeSafeClient`, `systemOne`, `noul`, `choice`, `TYPESAFE_API_KEY`) vem de um guia da comunidade. A documentação oficial (`docs.typesafe.ai`) não foi conferida.

## Goals / Non-Goals

**Goals:**
- Usar o Jev como classificador primário de PII.
- Manter o Gemini como fallback, para perguntas em que o Jev falhar.
- Manter intacta a assinatura `classify(items) → Map<id, AnonymizationSuggestion | null>`, para não tocar no use case, no cache e na UI.
- Preservar o comportamento fail-open e o timeout de 8s.

**Non-Goals:**
- Validar a qualidade da pergunta (ambígua, tendenciosa etc.). Isso não existe hoje e ficou fora do escopo.
- Mudar `PiiHeuristics`, o cache, `AnonymizationSuggestion` ou qualquer contrato HTTP.
- Remover o Gemini ou a `GEMINI_API_KEY`.
- Extrair uma interface genérica de provedor de IA para uso em outras features.

## Decisions

### 1. Orquestrador com dois providers concretos, sem interface nova
`QuestionAnonymizationClassifier` continua sendo a classe injetada no use case. Passa a receber `JevAnonymizationProvider` e `GeminiAnonymizationProvider` (ambos `@Injectable()`, resolvidos pelo `Registry`). Cada provider tem o mesmo método `classify(items)` e devolve `Map<id, AnonymizationSuggestion | null>`.

- **Por quê**: mantém o use case e os testes existentes intactos, e segue o padrão atual do repo (classes concretas `@Injectable`, sem gateway/contrato para esse serviço).
- **Alternativa descartada**: interface `PiiClassifierProvider` com um token de DI. É mais formal, mas o Registry resolve por classe (`reflect-metadata`), e com só dois providers a interface só adiciona indireção.

### 2. Fallback por pergunta, não por batch
O orquestrador chama o Jev para todos os itens e depois manda ao Gemini só os itens cujo resultado foi `null`.

- **Por quê**: uma falha parcial do Jev (por exemplo, 429 em algumas chamadas) não deve pagar o batch inteiro no Gemini, e o fallback fica barato.
- **Alternativa descartada**: fallback só quando o Jev falha por completo. Deixaria perguntas sem sugestão sem necessidade.

### 3. Uma chamada `systemOne` por pergunta, em paralelo
Cada pergunta vira um `state` (`{ pergunta, tipo }`) e recebe duas questões: `pii` (`noul`) e `category` (`choice`). As N chamadas rodam em `Promise.all` e compartilham um único `AbortController` de 8s.

- **Por quê**: o Jev avalia um estado por chamada, e a latência de 70 a 500 ms com custo de ~US$ 0,0004 por classificação torna N chamadas viáveis. O estado carrega só texto e tipo da pergunta, a mesma entrada mínima exigida hoje para o Gemini.
- **Alternativa descartada**: colocar todas as perguntas em um único `state` (array) e usar N questões. Mistura o contexto de perguntas diferentes, o que contradiz o requisito de enviar apenas a pergunta avaliada.

### 4. Mapeamento da resposta do Jev para `AnonymizationSuggestion`
- `needsAnonymization = answers.pii.noul >= 0.5`.
- `confidence = max(noul, 1 - noul)`. Assim a confiança é sempre a da decisão tomada, e o limiar de 0.6 usado em `FieldItem.tsx` continua fazendo sentido.
- `reason`: como o Jev não gera texto, sai de um mapa fixo em português por categoria: `identificador`, `contato`, `sensivel`, `financeiro` e `nenhum`. Quando `needsAnonymization` é `false`, usa uma frase genérica de "não parece coletar dado pessoal".
- `classifiedAt = new Date().toISOString()`.

As categorias e o corte de 0.5 ficam como constantes no provider, ajustáveis depois de medir com perguntas reais.

- **Alternativa descartada**: pedir só o `noul` e usar um `reason` genérico. Perde a informação de categoria que a UI mostra ao editor ("Esta pergunta pode coletar dado pessoal. {reason}").

### 5. Configuração
`TYPESAFE_API_KEY` entra em `env.ts` (`z.string().min(1)`), em `AppConfig.typesafe.apiKey` e em `sls/config/env.yml` com o mesmo padrão do Gemini (`${env:TYPESAFE_API_KEY, 'changeme-typesafe-api-key'}`). O stub de env de `apiKeyAuthorizer.test.ts` ganha a nova variável, senão o `schema.parse` quebra os testes.

### 6. Observabilidade
O orquestrador registra um log por lote com a contagem de perguntas resolvidas por `jev`, por `gemini` e sem resultado. Serve para medir a taxa de fallback. O log do use case (`source: 'llm'`) não muda.

## Risks / Trade-offs

- **[A API do SDK diverge do guia da comunidade]** → Depois do `pnpm add`, ler os `.d.ts` do pacote e a documentação oficial antes de escrever o provider. Ajustar nomes sem mudar o desenho.
- **[Qualidade do Jev em PT-BR e em perguntas curtas é desconhecida]** → Testar com um conjunto de perguntas reais antes do deploy e comparar com o Gemini. O fallback só cobre falha do Jev, não uma classificação errada dele.
- **[N chamadas por formulário estouram o limite de 1.200 req/min]** → Só chegam ao Jev as perguntas que passaram pela heurística e pelo cache. O SDK faz backoff em 429, e uma pergunta que falhar cai no Gemini.
- **[O `reason` perde riqueza em relação ao texto livre do Gemini]** → Aceito. O mapa por categoria cobre o uso da UI, e o cache continua guardando o `reason` gerado.
- **[Sugestões antigas do Gemini ficam no cache até o TTL]** → Sem migração: elas continuam válidas e expiram sozinhas.
- **[Duas chaves de API para manter]** → Consequência de manter o fallback. A remoção do Gemini fica para uma change futura, se a taxa de fallback for perto de zero.
- **[`TYPESAFE_API_KEY` ausente quebra o cold start das Lambdas, porque o `env.ts` exige `min(1)`]** → Definir o secret no ambiente de deploy antes do `pnpm deploy`. O default `changeme-...` do `env.yml` evita a falha de parse, mas a chamada ao Jev falharia e o fallback assumiria.
