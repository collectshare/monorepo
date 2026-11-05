## ADDED Requirements

### Requirement: Ordem de Tab segue a ordem visual
O modal de detalhes do formulário SHALL mover o foco com Tab na mesma ordem em que os campos aparecem: título, descrição, tags, "Formulário de página única", Cancelar, Salvar. Nenhum campo do modal SHALL usar `tabIndex` positivo.

#### Scenario: Tab do título vai para a descrição
- **WHEN** o foco está no campo título e o usuário aperta Tab
- **THEN** o foco vai para a área da descrição (primeiro botão da barra de ferramentas do editor) e não para as tags

#### Scenario: Tab sai da descrição para as tags
- **WHEN** o foco está no texto da descrição (fora de uma lista) e o usuário aperta Tab
- **THEN** o foco vai para o campo de tags

#### Scenario: Shift+Tab volta na ordem inversa
- **WHEN** o foco está nas tags e o usuário aperta Shift+Tab
- **THEN** o foco volta para o texto da descrição
