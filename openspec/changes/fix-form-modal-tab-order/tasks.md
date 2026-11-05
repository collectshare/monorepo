## 1. Correção

- [x] 1.1 Remover `tabIndex={1}`, `tabIndex={3}` e `tabIndex={4}` do `SaveFormDetailsModal/index.tsx`
- [x] 1.2 `pnpm --filter @monorepo/web typecheck` e `lint`

## 2. Verificação manual

- [ ] 2.1 No modal "Novo formulário": Tab do título cai na toolbar da descrição, depois no texto, depois nas tags, no switch, em Cancelar e em Salvar
- [ ] 2.2 Shift+Tab percorre a mesma ordem ao contrário
