## Context

`SubmitFormUseCase` carrega `form` + `questions`, checa obrigatórias por `Set` de ids e grava `FormSubmission` + N `Answer` num `TransactWriteCommand`. A validação de tipo é só o `submitFormSchema` (union string | string[] | number | file), sem relação com a pergunta. O dashboard do dono assina como URL S3 qualquer `value` de pergunta FILE.

## Goals / Non-Goals

**Goals:** rejeitar cedo (400) tudo que não casa com a pergunta; nunca assinar chave fora do prefixo do form; não perder a estrutura de arrays.

**Non-Goals:** upload direto ao S3 por URL pré-assinada (troca de arquitetura, fica para depois); antivírus/inspeção de conteúdo; dividir a transação em várias (o limite de respostas resolve).

## Decisions

- **Validação no use case, não no schema zod.** O schema não conhece as perguntas. Uma função pura `validateAnswers(questions, answers)` no use case retorna a lista de erros por `questionId` e o use case lança `ValidationError` (mesmo formato de erro já usado pelo `lambdaHttpAdapter`). Função pura = teste fácil.
- **Matriz tipo × valor:** TEXT → string; MULTIPLE_CHOICE/DROPDOWN → string ∈ options; CHECKBOX → string[] ⊆ options, sem repetidos; STARS → inteiro 1..max (aceita string numérica por compatibilidade com o `FormRenderer`, normaliza para string); FILE → objeto file.
- **Vazio = ausente** para a checagem de obrigatória; resposta opcional vazia é descartada (não gravada).
- **Prefixo na leitura, não só na escrita.** Dados antigos podem já conter chaves forjadas; checar `startsWith(\`forms/${formId}/submissions/\`)` em `GetFormSubmissionsUseCase` protege o legado sem migração.
- **Tamanho do arquivo:** limite pelo tamanho do base64 (payload do API Gateway já corta em 10 MB; fixar 5 MB decodificados). MIME: gravar `type` só como `ContentType`, sem confiar nele.
- **Alternativa descartada:** `z.discriminatedUnion` por tipo no schema — exigiria o schema saber o tipo da pergunta, que só vem do banco.

## Risks / Trade-offs

- [Clientes `/v1`/MCP não enviam submissões, só o `FormRenderer`] → risco de quebra baixo; conferir que o `FormRenderer` manda CHECKBOX como array e STARS como número.
- [Respostas já gravadas como `'a,b'`] → ficam como estão; nenhuma migração (não dá para separar com segurança opções que contêm vírgula).

## Open Questions

- Limite de tamanho de arquivo: 5 MB é suficiente para o uso atual?
