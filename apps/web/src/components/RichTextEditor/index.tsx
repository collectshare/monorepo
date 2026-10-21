import { Button, cn, Input, Popover, PopoverContent, PopoverTrigger, type RichTextAlign, richTextAlignClass, safeUrl } from '@monorepo/ui';
import { Markdown } from '@tiptap/markdown';
import { type Editor, EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

// Só o que o RichText (packages/ui) sabe exibir: negrito, itálico, link, listas.
export const richTextExtensions = [
  StarterKit.configure({
    heading: false,
    code: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: {
      openOnClick: false,
      autolink: true,
      protocols: ['mailto'],
      isAllowedUri: (url) => safeUrl(url) !== '',
    },
  }),
  // breaks: "\n" simples vira quebra de linha, igual ao remark-breaks do RichText,
  // então descrições antigas em texto puro abrem com as mesmas linhas.
  Markdown.configure({ markedOptions: { breaks: true } }),
];

export function toMarkdown(editor: Editor) {
  return editor.isEmpty ? '' : editor.getMarkdown();
}

const alignTools = [
  { value: 'left', label: 'Alinhar à esquerda', icon: AlignLeftIcon },
  { value: 'center', label: 'Centralizar', icon: AlignCenterIcon },
  { value: 'right', label: 'Alinhar à direita', icon: AlignRightIcon },
] as const;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  align: RichTextAlign;
  onAlignChange: (align: RichTextAlign) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

export function RichTextEditor({ value, onChange, align, onAlignChange, disabled, placeholder, id }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: richTextExtensions,
    content: value,
    contentType: 'markdown',
    editable: !disabled,
    editorProps: {
      attributes: {
        ...(id && { id }),
        'aria-label': placeholder ?? 'Descrição',
        class: 'min-h-[80px] max-h-64 overflow-y-auto px-3 py-2 text-sm [overflow-wrap:anywhere] focus:outline-none [&_p]:my-1 [&_ul]:list-disc [&_ol]:list-decimal [&_a]:underline',
      },
    },
    onUpdate: ({ editor }) => onChange(toMarkdown(editor)),
  });

  useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
    }),
  });

  const tools = [
    { label: 'Negrito', icon: BoldIcon, isActive: active.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Itálico', icon: ItalicIcon, isActive: active.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Lista', icon: ListIcon, isActive: active.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Lista numerada', icon: ListOrderedIcon, isActive: active.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
  ];

  return (
    <div className={cn('min-w-0 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2', disabled && 'cursor-not-allowed opacity-50')}>
      <div className="flex flex-wrap gap-1 border-b border-input p-1">
        {tools.map(({ label, icon: Icon, isActive, run }) => (
          <ToolButton key={label} label={label} isActive={isActive} disabled={disabled} onClick={run}>
            <Icon className="size-4" />
          </ToolButton>
        ))}
        <LinkTool editor={editor} disabled={disabled} />
        <div className="mx-1 w-px self-stretch bg-border" />
        {alignTools.map(({ value: alignValue, label, icon: Icon }) => (
          <ToolButton key={alignValue} label={label} isActive={align === alignValue} disabled={disabled} onClick={() => onAlignChange(alignValue)}>
            <Icon className="size-4" />
          </ToolButton>
        ))}
      </div>
      <EditorContent editor={editor} className={richTextAlignClass[align]} />
    </div>
  );
}

interface ToolButtonProps extends React.ComponentProps<typeof Button> {
  label: string;
  isActive: boolean;
}

function ToolButton({ label, isActive, ...props }: ToolButtonProps) {
  return (
    <Button
      type="button"
      variant={isActive ? 'secondary' : 'ghost'}
      size="iconSm"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      {...props}
    />
  );
}

function LinkTool({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const isActive = useEditorState({ editor, selector: ({ editor }) => editor.isActive('link') });

  function handleOpenChange(next: boolean) {
    if (next) {
      setUrl((editor.getAttributes('link').href as string | undefined) ?? '');
      setError('');
    }
    setOpen(next);
  }

  function handleSubmit(event: FormEvent) {
    // O form do modal está em volta: não deixa o Enter salvar o formulário inteiro.
    event.preventDefault();
    event.stopPropagation();

    const href = url.trim();
    if (!href) {
      handleRemove();
      return;
    }
    if (!safeUrl(href)) {
      setError('Use um link http://, https:// ou mailto:');
      return;
    }

    const chain = editor.chain().focus().extendMarkRange('link');
    if (editor.state.selection.empty && !editor.isActive('link')) {
      chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
    } else {
      chain.setLink({ href }).run();
    }
    setOpen(false);
  }

  function handleRemove() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <ToolButton label="Link" isActive={isActive} disabled={disabled}>
          <LinkIcon className="size-4" />
        </ToolButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <form className="grid gap-2" onSubmit={handleSubmit}>
          <Input
            autoFocus
            placeholder="https://exemplo.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            error={error || undefined}
          />
          <div className="flex justify-end gap-2">
            {isActive && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>Remover</Button>
            )}
            <Button type="submit" size="sm">Aplicar</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
