## ADDED Requirements

### Requirement: Classificação automática de pergunta via LLM
O sistema SHALL classificar, usando um modelo de linguagem (Gemini), se o texto de uma pergunta de formulário indica coleta de dado pessoal (PII) que deveria ser anonimizado na publicação dos dados. A classificação SHALL usar como entrada apenas o texto da pergunta e o seu tipo (`questionType`), sem incluir dados de outras perguntas, dados do formulário ou qualquer resposta de submissão.

#### Scenario: Pergunta que coleta dado pessoal
- **WHEN** uma pergunta com texto "Qual o seu CPF?" é classificada
- **THEN** o motor retorna `needsAnonymization: true` com um `confidence` e um `reason` explicando a classificação

#### Scenario: Pergunta que não coleta dado pessoal
- **WHEN** uma pergunta com texto "Qual sua cor favorita?" é classificada
- **THEN** o motor retorna `needsAnonymization: false` com um `confidence` e um `reason`

#### Scenario: Entrada mínima enviada ao provedor
- **WHEN** o motor monta a requisição ao Gemini para uma pergunta
- **THEN** o payload enviado contém apenas o texto da pergunta e o `questionType`, e não contém texto de outras perguntas do formulário nem qualquer valor de resposta de submissão

### Requirement: Disparo incremental ao salvar perguntas do formulário
O sistema SHALL disparar a classificação automaticamente ao processar `InsertQuestionsInFormUseCase`, apenas para perguntas novas ou perguntas existentes cujo `text` ou `questionType` tenha mudado em relação à versão persistida. O sistema SHALL NOT reclassificar perguntas cujo `text` e `questionType` permaneceram inalterados.

#### Scenario: Pergunta nova é classificada
- **WHEN** uma pergunta nova é incluída em uma chamada a `InsertQuestionsInFormUseCase`
- **THEN** o motor de classificação é chamado para essa pergunta antes de ela ser persistida

#### Scenario: Pergunta existente sem alteração de texto não é reclassificada
- **WHEN** uma pergunta existente é reenviada em `InsertQuestionsInFormUseCase` com o mesmo `text` e `questionType` de antes (mesmo que outros campos, como `order`, tenham mudado)
- **THEN** o motor de classificação NÃO é chamado novamente para essa pergunta e a `anonymizationSuggestion` anterior é preservada

#### Scenario: Pergunta existente com texto alterado é reclassificada
- **WHEN** uma pergunta existente é reenviada em `InsertQuestionsInFormUseCase` com `text` ou `questionType` diferente do persistido
- **THEN** o motor de classificação é chamado novamente para essa pergunta antes de salvar a nova versão

### Requirement: Resultado é sugestão não vinculante
O resultado da classificação SHALL ser armazenado como uma sugestão informativa (`anonymizationSuggestion`) na pergunta, e o sistema SHALL NOT alterar automaticamente qualquer configuração de anonimização de dados de resposta com base nesse resultado. A decisão final sobre anonimizar ou não uma pergunta permanece uma ação manual de quem edita o formulário.

#### Scenario: Sugestão não altera comportamento de exportação
- **WHEN** uma pergunta recebe `anonymizationSuggestion.needsAnonymization: true`
- **THEN** nenhuma configuração de anonimização de respostas dessa pergunta é alterada automaticamente pelo sistema

#### Scenario: Sugestão fica disponível para o editor do formulário
- **WHEN** uma pergunta possui `anonymizationSuggestion` preenchido
- **THEN** essa informação é retornada pela API ao consultar a pergunta, para que o editor do formulário possa exibir um aviso a quem está editando

### Requirement: Falha do provedor de IA não bloqueia salvamento
Se a chamada ao provedor de IA falhar, exceder o tempo limite configurado, ou retornar uma resposta que não corresponda ao formato esperado, o sistema SHALL salvar a pergunta normalmente com `anonymizationSuggestion` igual a `null`, sem propagar erro ao chamador de `InsertQuestionsInFormUseCase`.

#### Scenario: Timeout do provedor de IA
- **WHEN** a chamada ao Gemini para classificar uma pergunta excede o tempo limite configurado
- **THEN** a pergunta é salva com `anonymizationSuggestion: null` e a operação de salvar o formulário é concluída com sucesso

#### Scenario: Resposta malformada do provedor de IA
- **WHEN** o Gemini retorna uma resposta que não corresponde ao schema esperado (`needsAnonymization`, `confidence`, `reason`)
- **THEN** a pergunta é salva com `anonymizationSuggestion: null` e a operação de salvar o formulário é concluída com sucesso
