import type { ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';

import { cn } from '../lib/utils';

const ALLOWED_ELEMENTS = ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'];

export function safeUrl(url: string) {
  return /^(https?:|mailto:)/i.test(url.trim()) ? url : '';
}

const components: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground" />
  ),
};

// Modo texto: mesmo parser (entidades e escapes resolvidos), sem formatação,
// blocos separados por espaço. Para listagens de uma linha.
const spaced = ({ children }: { children?: ReactNode }) => <>{children} </>;
const plainComponents: Components = {
  p: spaced,
  li: spaced,
  br: () => ' ',
  a: ({ children }) => children,
  strong: ({ children }) => children,
  em: ({ children }) => children,
  ul: ({ children }) => children,
  ol: ({ children }) => children,
};

export type RichTextAlign = 'left' | 'center' | 'right';

export const richTextAlignClass: Record<RichTextAlign, string> = {
  left: 'text-left [&_ul]:pl-5 [&_ol]:pl-5',
  // Listas acompanham o texto: marcador dentro da linha, sem recuo. O <p> dentro
  // do <li> (editor e listas "soltas") fica inline, senão desce para a linha de baixo.
  center: 'text-center [&_ul]:list-inside [&_ol]:list-inside [&_li>p]:inline',
  right: 'text-right [&_ul]:list-inside [&_ol]:list-inside [&_li>p]:inline',
};

interface RichTextProps {
  children: string;
  className?: string;
  align?: RichTextAlign;
  plain?: boolean;
}

// Renderiza a descrição do formulário (Markdown). HTML cru nunca é interpretado
// (sem rehype-raw) e links só aceitam http(s)/mailto.
export function RichText({ children, className, align = 'left', plain }: RichTextProps) {
  if (plain) {
    return (
      <span className={className}>
        <Markdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed skipHtml components={plainComponents}>
          {children}
        </Markdown>
      </span>
    );
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-2 [overflow-wrap:anywhere] [&_ul]:list-disc [&_ol]:list-decimal', richTextAlignClass[align], className)}>
      <Markdown
        remarkPlugins={[remarkBreaks]}
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        skipHtml
        urlTransform={safeUrl}
        components={components}
      >
        {children}
      </Markdown>
    </div>
  );
}
