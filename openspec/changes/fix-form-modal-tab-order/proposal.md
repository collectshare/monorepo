## Why

No modal de criar/editar formulário (`SaveFormDetailsModal`), apertar Tab no título pula a descrição e vai direto para as tags. O usuário de teclado não consegue chegar ao editor de descrição na ordem natural.

## What Changes

- Remover os `tabIndex` positivos (1, 3, 4) do título, das tags e do switch "página única" no `SaveFormDetailsModal`, voltando à ordem do DOM: título → descrição (barra de ferramentas e texto) → tags → página única → Cancelar/Salvar.

## Capabilities

### New Capabilities
- `form-details-modal`: navegação por teclado no modal de detalhes do formulário.

### Modified Capabilities
<!-- nenhuma -->

## Impact

- `apps/web/src/views/pages/FormBuilder/components/SaveFormDetailsModal/index.tsx` (só remove props).
- Sem impacto em API, dados ou dependências.
