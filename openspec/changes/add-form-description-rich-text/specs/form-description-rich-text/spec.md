## ADDED Requirements

### Requirement: Descrição do formulário aceita Markdown
O sistema SHALL armazenar a descrição do formulário como string e interpretá-la como Markdown (parágrafos, quebras de linha, negrito, itálico, links e listas) nas telas de exibição completa: resposta do formulário e página do dataset no portal.

#### Scenario: Quebra de linha preservada
- **WHEN** o dono salva a descrição "Linha 1\nLinha 2"
- **THEN** a tela de resposta exibe "Linha 1" e "Linha 2" em linhas separadas

#### Scenario: Parágrafos e formatação
- **WHEN** a descrição contém "**Importante**\n\nLeia o [termo](https://exemplo.com)"
- **THEN** "Importante" aparece em negrito, em um parágrafo separado de um link clicável para https://exemplo.com

#### Scenario: Descrição antiga em texto puro
- **WHEN** um formulário criado antes desta mudança tem descrição sem sintaxe Markdown
- **THEN** ela é exibida com o mesmo texto, sem erro

### Requirement: Renderização segura
O renderizador SHALL ignorar HTML cru, SHALL aceitar apenas links `http`, `https` e `mailto`, e SHALL abrir links em nova aba com `rel="noopener noreferrer"`.

#### Scenario: HTML injetado
- **WHEN** a descrição contém `<script>alert(1)</script>` ou `<img src=x onerror=alert(1)>`
- **THEN** nenhum elemento HTML é criado a partir desse trecho e nenhum script executa

#### Scenario: Link javascript
- **WHEN** a descrição contém `[clique](javascript:alert(1))`
- **THEN** o link não é renderizado com esse `href`

#### Scenario: Link externo
- **WHEN** a descrição contém um link `https://`
- **THEN** o `<a>` tem `target="_blank"` e `rel="noopener noreferrer"`

### Requirement: Texto puro em listagens compactas
Listagens compactas (tabela "Meus formulários" e cabeçalho de uma linha do builder no web, cards de resultado de busca no portal) SHALL exibir a descrição sem sintaxe Markdown visível.

#### Scenario: Card de busca
- **WHEN** um dataset com descrição "**Pesquisa** de [satisfação](https://x.com)" aparece na busca do portal
- **THEN** o card mostra "Pesquisa de satisfação"

#### Scenario: Caracteres especiais
- **WHEN** a descrição salva pelo editor contém `A &amp; B` ou `\_x\_`
- **THEN** a listagem mostra `A & B` e `_x_`

### Requirement: Alinhamento da descrição
O dono SHALL escolher o alinhamento da descrição inteira (esquerda, centro, direita) no editor. A tela de resposta SHALL aplicá-lo ao texto e às listas. Sem escolha, a descrição SHALL ser centralizada.

#### Scenario: Descrição à esquerda com lista
- **WHEN** o dono escolhe "Alinhar à esquerda" e a descrição tem um parágrafo e uma lista
- **THEN** na tela de resposta parágrafo e lista ficam alinhados à esquerda

#### Scenario: Centralizada com lista
- **WHEN** o alinhamento é centro e a descrição tem uma lista
- **THEN** os itens da lista ficam centralizados junto com o texto

#### Scenario: Form antigo
- **WHEN** um formulário não tem alinhamento salvo
- **THEN** a descrição é exibida centralizada

#### Scenario: Update sem o campo
- **WHEN** um `PUT` de detalhes omite `descriptionAlign`
- **THEN** o alinhamento atual é mantido

### Requirement: Editor visual na autoria
O modal de detalhes do formulário SHALL editar a descrição com um editor visual (Tiptap) com negrito, itálico, link, lista com marcadores e lista numerada, e SHALL salvar o conteúdo como Markdown.

#### Scenario: Formatar sem saber Markdown
- **WHEN** o dono seleciona um trecho e clica em "Negrito"
- **THEN** o trecho aparece em negrito no editor e é salvo como `**trecho**`

#### Scenario: Abrir descrição antiga
- **WHEN** o dono edita um formulário cuja descrição é texto puro "Linha 1\nLinha 2"
- **THEN** o editor mostra "Linha 1" e "Linha 2" em linhas separadas, sem perda de texto
- **AND** salvar sem alterações mantém as duas linhas separadas na exibição

#### Scenario: Link inseguro no editor
- **WHEN** o dono tenta inserir um link `javascript:alert(1)`
- **THEN** o link não é criado e o campo mostra que só http(s)/mailto são aceitos

#### Scenario: Inserir link
- **WHEN** o dono seleciona um trecho, clica em "Link", digita a URL no popover e confirma
- **THEN** o trecho vira link, sem diálogo do navegador e sem salvar o modal
