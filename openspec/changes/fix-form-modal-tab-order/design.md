## Context

`SaveFormDetailsModal` define `tabIndex={1}` no título, `tabIndex={3}` nas tags e `tabIndex={4}` no switch. O `RichTextEditor` (toolbar + Tiptap) não tem `tabIndex`, ou seja, fica com 0. O navegador visita primeiro todos os elementos com `tabIndex` positivo (1 → 3 → 4) e só depois os de valor 0, então a descrição vai para o fim da fila. O "2" da descrição se perdeu quando o textarea virou o editor rich text.

## Goals / Non-Goals

**Goals:** a ordem do Tab no modal acompanha a ordem visual.

**Non-Goals:** mexer nos `tabIndex` positivos de SignIn/NewPassword/ForgotPassword (lá a sequência está completa e a ordem funciona); transformar a toolbar do editor em uma única parada de Tab (toolbar ARIA com roving tabindex).

## Decisions

- **Remover os `tabIndex` positivos em vez de pôr `tabIndex={2}` no editor.** A ordem do DOM já é a ordem certa. Um `2` precisaria ir em cada botão da toolbar e no ProseMirror, e quebraria de novo no próximo campo novo.
- **A toolbar continua no caminho do Tab** (título → 8 botões → texto). Tirar os botões do Tab (`tabIndex={-1}`) deixaria link e alinhamento inacessíveis pelo teclado.

## Risks / Trade-offs

- [O Tab passa pelos 8 botões da toolbar antes de chegar ao texto] → Aceitável e acessível. Se incomodar, uma toolbar com roving tabindex reduz isso a 1 parada.
- [Tab dentro de um item de lista indenta (atalho do Tiptap) em vez de sair do editor] → Comportamento esperado do editor; fora de listas o Tab sai normalmente.
