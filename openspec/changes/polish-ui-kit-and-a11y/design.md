## Context

Mudanças pequenas e independentes, todas em componentes de base. O risco é regressão visual em muitos lugares, não complexidade.

## Goals / Non-Goals

**Goals:** comportamento padrão de diálogo (Esc/overlay/X), `Button` previsível, leitura correta em leitor de tela.

**Non-Goals:** auditoria a11y completa (WCAG); unificar tema entre apps.

## Decisions

- **Sync do editor por comparação de markdown:** `if (value !== editor.storage.markdown.getMarkdown()) editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false })`. Comparar evita loop com o `onUpdate`.
- **`asChild` + `isLoading`:** não renderizar o spinner (o `Slot` aceita um filho só); quem precisar de spinner num link usa `Button` normal.
- **Tema:** corrigir só o bug do `toggleTheme`; unificar `ThemeContext`/`useTheme` não traz ganho ao usuário hoje.

## Risks / Trade-offs

- [Modais que dependiam de não fechar por overlay (ex.: formulário com dados)] → passar `preventCloseOnOutside` só nesses casos se aparecerem na revisão manual.
