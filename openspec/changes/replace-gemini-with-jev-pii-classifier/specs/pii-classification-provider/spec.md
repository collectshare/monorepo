## ADDED Requirements

### Requirement: Jev é o provedor primário de classificação de PII
O sistema SHALL usar o Jev (TypeSafe AI) como primeiro provedor de IA para classificar se uma pergunta de formulário coleta dado pessoal (PII) que deveria ser anonimizado. A entrada enviada ao Jev SHALL conter apenas o texto da pergunta e o seu `questionType`, sem texto de outras perguntas, dados do formulário ou qualquer valor de resposta de submissão. O sistema SHALL avaliar cada pergunta em uma chamada própria ao Jev.

#### Scenario: Pergunta que coleta dado pessoal
- **WHEN** uma pergunta com texto "Qual a sua religião?" é classificada e o Jev responde com probabilidade de PII de 0.93
- **THEN** o resultado tem `needsAnonymization: true`, `confidence` 0.93, um `reason` e `classifiedAt` preenchido

#### Scenario: Pergunta que não coleta dado pessoal
- **WHEN** uma pergunta com texto "Qual sua cor favorita?" é classificada e o Jev responde com probabilidade de PII de 0.04
- **THEN** o resultado tem `needsAnonymization: false` e `confidence` 0.96

#### Scenario: Entrada mínima enviada ao Jev
- **WHEN** o sistema monta a requisição ao Jev para uma pergunta
- **THEN** o `state` enviado contém apenas o texto e o `questionType` dessa pergunta, e não contém texto de outras perguntas do formulário nem valores de resposta

### Requirement: Mapeamento da resposta do Jev para a sugestão
O sistema SHALL converter a resposta do Jev em uma `AnonymizationSuggestion` com `needsAnonymization`, `confidence`, `reason` e `classifiedAt`. `needsAnonymization` SHALL ser verdadeiro quando a probabilidade de PII for maior ou igual a 0.5. `confidence` SHALL ser a probabilidade da decisão tomada, isto é, o maior valor entre a probabilidade de PII e o seu complemento. `reason` SHALL ser uma frase em português definida pelo sistema para a categoria de dado escolhida pelo Jev, já que o Jev não gera texto livre.

#### Scenario: Limite de decisão
- **WHEN** o Jev responde com probabilidade de PII exatamente 0.5
- **THEN** o resultado tem `needsAnonymization: true` e `confidence` 0.5

#### Scenario: Motivo derivado da categoria
- **WHEN** o Jev classifica a pergunta como PII da categoria "contato"
- **THEN** o `reason` do resultado é a frase em português definida para a categoria "contato"

#### Scenario: Categoria inconsistente com a decisão
- **WHEN** o Jev responde com probabilidade de PII de 0.05 e categoria diferente de "nenhum"
- **THEN** o resultado tem `needsAnonymization: false` e o `reason` é a frase genérica de que a pergunta não parece coletar dado pessoal

### Requirement: Gemini como fallback por pergunta
O sistema SHALL enviar ao Gemini apenas as perguntas para as quais o Jev não devolveu um resultado válido (erro, timeout, 429 esgotado ou resposta fora do formato esperado). O sistema SHALL NOT chamar o Gemini quando o Jev tiver classificado todas as perguntas. Uma pergunta que o Jev classificou SHALL NOT ser reenviada ao Gemini.

#### Scenario: Jev classifica todas as perguntas
- **WHEN** o Jev devolve resultado válido para todas as perguntas do lote
- **THEN** o Gemini não é chamado e todas as sugestões vêm do Jev

#### Scenario: Jev falha em parte das perguntas
- **WHEN** o Jev devolve resultado válido para 3 de 5 perguntas do lote
- **THEN** o Gemini é chamado apenas com as 2 perguntas restantes e as 5 sugestões são retornadas, misturando as duas origens

#### Scenario: Jev indisponível
- **WHEN** o Jev falha ou excede o tempo limite para todas as perguntas do lote
- **THEN** todas as perguntas são enviadas ao Gemini em um único batch

### Requirement: Falha dos provedores de IA não bloqueia salvamento
Se o Jev e o Gemini falharem para uma pergunta, o sistema SHALL devolver `null` para ela, e `InsertQuestionsInFormUseCase` SHALL salvar a pergunta normalmente com `anonymizationSuggestion` igual a `null`, sem propagar erro ao chamador. O tempo limite de cada provedor SHALL ser de 8 segundos.

#### Scenario: Ambos os provedores falham
- **WHEN** o Jev e o Gemini falham ao classificar uma pergunta
- **THEN** a pergunta é salva com `anonymizationSuggestion: null` e a operação de salvar o formulário é concluída com sucesso

#### Scenario: Timeout do Jev
- **WHEN** a chamada ao Jev excede 8 segundos
- **THEN** a pergunta segue para o fallback do Gemini e nenhum erro é propagado ao chamador

### Requirement: Configuração da chave do Jev
O sistema SHALL ler a chave de API do Jev da variável de ambiente `TYPESAFE_API_KEY`, validada no schema de ambiente da API como string não vazia, e exposta por `AppConfig`. A chave `GEMINI_API_KEY` SHALL continuar obrigatória enquanto o Gemini existir como fallback.

#### Scenario: Chave do Jev ausente
- **WHEN** a API inicia sem `TYPESAFE_API_KEY` definida
- **THEN** a validação do schema de ambiente falha e a inicialização é interrompida

### Requirement: Observabilidade da origem da classificação
O sistema SHALL registrar em log, a cada lote classificado, quantas perguntas foram resolvidas pelo Jev, quantas pelo Gemini e quantas ficaram sem resultado, sem incluir o texto das perguntas.

#### Scenario: Log de lote com fallback parcial
- **WHEN** um lote de 5 perguntas é classificado com 3 respostas do Jev e 1 do Gemini
- **THEN** o log registra 3 do Jev, 1 do Gemini e 1 sem resultado, sem o texto das perguntas
