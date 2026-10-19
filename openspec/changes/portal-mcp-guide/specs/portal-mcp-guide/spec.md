## ADDED Requirements

### Requirement: Página pública de conexão MCP
O portal SHALL expor a rota `/mcp`, acessível sem autenticação, dentro do `PortalLayout`, que ensina a conectar o servidor MCP do Collectshare a clientes de IA.

#### Scenario: Acesso direto sem login
- **WHEN** um visitante sem sessão abre `/mcp`
- **THEN** a página é exibida, sem redirecionamento nem chamada a endpoint da API

#### Scenario: Link no header
- **WHEN** um visitante está em qualquer página do portal
- **THEN** o header mostra um link "Conectar IA" que leva a `/mcp`

#### Scenario: Link a partir de "Como funciona"
- **WHEN** a aba "MCP" está selecionada no passo de leitura de `/sobre`
- **THEN** há um link para `/mcp`

### Requirement: URL do servidor copiável
A página SHALL mostrar a URL do servidor MCP, formada por `VITE_API_URL` + `/mcp`, com um botão que a copia para a área de transferência.

#### Scenario: Copiar URL
- **WHEN** o visitante clica em "Copiar"
- **THEN** a URL é copiada e o botão indica brevemente que copiou

#### Scenario: Pré-requisito de conta
- **WHEN** a página é exibida
- **THEN** ela informa que é preciso ter conta no Collectshare e oferece link para o app web (`VITE_WEB_APP_URL`)

### Requirement: Instruções por cliente
A página SHALL oferecer abas com instruções para **claude.ai / Claude Desktop**, **Claude Code** e **Cursor**. Cada aba SHALL listar os passos até o login e, quando houver comando ou configuração, exibi-los com botão de copiar.

#### Scenario: claude.ai
- **WHEN** a aba "claude.ai / Desktop" está selecionada
- **THEN** a página explica adicionar um conector personalizado nas configurações, colar a URL do servidor e clicar em conectar

#### Scenario: Claude Code
- **WHEN** a aba "Claude Code" está selecionada
- **THEN** a página mostra o comando `claude mcp add --transport http collectshare <url>/mcp` e explica rodar `/mcp` dentro do Claude Code para fazer login

#### Scenario: Cursor
- **WHEN** a aba "Cursor" está selecionada
- **THEN** a página mostra um trecho de `mcp.json` com `mcpServers.collectshare.url` apontando para a URL do servidor

### Requirement: Explicação do login e das ferramentas
A página SHALL explicar o consentimento OAuth (tela de autorização do app web, Autorizar/Cancelar, o agente age como a conta que autorizou) e SHALL listar as ferramentas disponíveis, indicando quais são somente leitura e quais são destrutivas, com exemplos de pedidos.

#### Scenario: Ferramentas destrutivas destacadas
- **WHEN** a lista de ferramentas é exibida
- **THEN** `update_form` e `insert_questions` aparecem marcadas como destrutivas, com a explicação de que substituem o conteúdo inteiro

### Requirement: Aviso de segurança
A página SHALL avisar que a conexão dá acesso total à conta, que dados de datasets e respostas são texto escrito por terceiros e não devem ser tratados como instruções, e que ainda não existe tela para revogar acessos.

#### Scenario: Aviso visível
- **WHEN** a página é exibida
- **THEN** o aviso de segurança aparece antes da lista de ferramentas

### Requirement: Acessibilidade e responsividade
A página SHALL funcionar em largura de celular sem rolagem horizontal (blocos de código rolam internamente), respeitar o tema claro e escuro e ser operável por teclado.

#### Scenario: Código em tela estreita
- **WHEN** a página é aberta em 360px de largura
- **THEN** a página não rola horizontalmente; só o bloco de código rola

#### Scenario: Abas por teclado
- **WHEN** o visitante navega com Tab e Enter/Espaço
- **THEN** consegue trocar de aba e copiar comandos, e as abas expõem `role="tab"` e `aria-selected`
