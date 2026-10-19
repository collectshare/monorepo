## ADDED Requirements

### Requirement: Página pública "Como funciona"
O portal SHALL expor a rota `/sobre`, acessível sem autenticação, que renderiza a página "Siga um dado" dentro do `PortalLayout`.

#### Scenario: Acesso direto sem login
- **WHEN** um visitante sem sessão abre `/sobre`
- **THEN** a página é exibida, sem redirecionamento nem chamada a endpoint autenticado

#### Scenario: Link no header
- **WHEN** um visitante está em qualquer página do portal
- **THEN** o header mostra um link "Como funciona" que leva a `/sobre`

### Requirement: Percurso do dado em cinco passos
A página SHALL apresentar o percurso de uma resposta em cinco passos, na ordem: envio pelo respondente, API (Lambda com validação), armazenamento no DynamoDB, eventos do DynamoDB Streams e leitura. Cada passo SHALL informar o que acontece, onde o dado está e como ele está, usando sempre a mesma resposta de exemplo (`Maria Silva`, `CPF 123.456.789-00`, `CEP 89010-000`).

#### Scenario: Navegar entre passos
- **WHEN** o visitante seleciona um passo no stepper ou usa os botões "Anterior"/"Próximo"
- **THEN** o conteúdo daquele passo é exibido e o passo fica marcado como atual

#### Scenario: Primeiro acesso
- **WHEN** a página é aberta
- **THEN** o passo ① está selecionado e "Anterior" está desabilitado

#### Scenario: Armazenamento único do dado bruto
- **WHEN** o passo ③ está selecionado
- **THEN** a página informa que o dado bruto fica apenas no DynamoDB

#### Scenario: Busca sem respostas
- **WHEN** o passo ④ está selecionado
- **THEN** a página informa que o Algolia recebe apenas metadados do formulário (título, descrição, tags, contadores) e nunca as respostas

### Requirement: Quatro portas de leitura
O passo de leitura SHALL oferecer quatro abas (Dono, Portal, API `/v1` e MCP). Cada aba SHALL mostrar a autenticação exigida, a linha de exemplo como aquela porta a devolve (bruta ou anonimizada) e um "como acessar".

#### Scenario: Porta do dono
- **WHEN** a aba "Dono" está selecionada
- **THEN** a linha aparece bruta e a autenticação indicada é o login (Cognito) no app web

#### Scenario: Porta pública
- **WHEN** a aba "Portal" está selecionada
- **THEN** a linha aparece anonimizada (nome pseudonimizado, CPF suprimido, CEP generalizado para UF), com indicação de que nenhum login é exigido e de que a transformação é feita pelo `AnonymizationEngine`

#### Scenario: Porta da API
- **WHEN** a aba "API /v1" está selecionada
- **THEN** a página indica autenticação por `x-api-key` com escopo, explica que `/v1/portal/...` devolve dados anonimizados e `/v1/submissions/{formId}` devolve os dados brutos dos próprios formulários, e traz um link para `/api-docs`

#### Scenario: Porta do MCP
- **WHEN** a aba "MCP" está selecionada
- **THEN** a página indica autenticação OAuth 2.1 com consentimento do dono, explica que o agente vê o mesmo que o dono que autorizou, e mostra o comando `claude mcp add --transport http collectshare <url>/mcp`

### Requirement: Acessibilidade e responsividade
A página SHALL funcionar em largura de celular sem rolagem horizontal, respeitar o tema claro e escuro do portal e ser operável por teclado.

#### Scenario: Tema escuro
- **WHEN** o visitante ativa o tema escuro no header
- **THEN** a página usa os tokens do tema, sem cores fixas que fiquem ilegíveis

#### Scenario: Navegação por teclado
- **WHEN** o visitante navega com Tab e Enter/Espaço
- **THEN** os passos e as abas recebem foco visível e podem ser ativados, e o item atual é anunciado (`aria-current` nos passos, `aria-selected` nas abas)
