import { RichText } from '@monorepo/ui';
import { MarkdownManager } from '@tiptap/markdown';
import { flattenExtensions } from '@tiptap/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { richTextExtensions } from '.';

const markdown = new MarkdownManager({
  markedOptions: { breaks: true },
  extensions: flattenExtensions(richTextExtensions),
});

const html = (md: string) => renderToStaticMarkup(<RichText>{md}</RichText>);
// Carrega no editor e salva de volta, como o RichTextEditor faz.
const roundTrip = (md: string) => markdown.serialize(markdown.parse(md));

describe('descrição em rich text', () => {
  it('quebra de linha simples vira <br>', () => {
    expect(html('Linha 1\nLinha 2')).toContain('Linha 1<br/>');
  });

  it.each([
    'Linha 1\nLinha 2',
    'Parágrafo 1\n\nParágrafo 2\nmesma seção',
    'Texto **forte** e *leve* com [link](https://exemplo.com)',
    '- um\n- dois\n\n1. três\n2. quatro',
  ])('descrição antiga abre e salva no editor sem mudar a exibição: %j', (md) => {
    expect(html(roundTrip(md))).toBe(html(md));
  });

  it('não interpreta HTML cru', () => {
    const out = html('<script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/<script|<img|onerror=/);
  });

  it('descarta links que não são http(s)/mailto e abre os externos em nova aba', () => {
    expect(html('[x](javascript:alert(1))')).not.toContain('javascript:');
    expect(html('[x](https://a.com)')).toContain('target="_blank" rel="noopener noreferrer"');
  });

  it('modo plain mostra só o texto, com entidades e escapes resolvidos', () => {
    const plain = (md: string) => renderToStaticMarkup(<RichText plain>{md}</RichText>).replace(/<\/?span>/g, '').replace(/\s+/g, ' ');
    expect(plain('**Pesquisa** de [satisfação](https://x.com)\n\n- item 1\n- item 2').trim()).toBe('Pesquisa de satisfação item 1 item 2');
    // o que o editor salva para "A & <b> \_x\_" (& e < viram entidades, _ é escapado)
    expect(plain(roundTrip('A &amp; &lt;b&gt; \\_x\\_')).trim()).toBe('A &amp; &lt;b&gt; _x_');
  });

  it('listas acompanham o alinhamento', () => {
    expect(renderToStaticMarkup(<RichText align="center">{'- a'}</RichText>)).toContain('list-inside');
    expect(renderToStaticMarkup(<RichText align="right">{'- a\n\n- b'}</RichText>)).toContain('[&amp;_li&gt;p]:inline');
    expect(renderToStaticMarkup(<RichText>{'- a'}</RichText>)).not.toContain('list-inside');
  });

  it('o editor não oferece títulos nem blocos de código', () => {
    const names = flattenExtensions(richTextExtensions).map((e) => e.name);
    expect(names).not.toContain('heading');
    expect(names).not.toContain('codeBlock');
  });
});
