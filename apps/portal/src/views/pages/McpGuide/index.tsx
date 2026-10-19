import { Badge, buttonVariants, Card, CardContent, CardHeader, CardTitle } from '@monorepo/ui';
import { CheckIcon, CopyIcon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';

import { type Client, CLIENTS, EXAMPLE_PROMPTS, MCP_URL, type Tool, TOOLS } from './content';

const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL;

const KIND_LABEL: Record<Tool['kind'], string> = {
  read: 'somente leitura',
  write: 'escrita',
  destructive: 'destrutiva',
};

function CopyBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-start gap-2 rounded-md bg-muted p-3">
      <pre className="flex-1 min-w-0 overflow-x-auto text-xs">{value}</pre>
      <button
        type="button"
        onClick={copy}
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
        aria-label={copied ? 'Copiado' : 'Copiar'}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
      </button>
    </div>
  );
}

function Clients() {
  const [clientId, setClientId] = useState<Client['id']>('claude-ai');
  const client = CLIENTS.find((c) => c.id === clientId)!;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Clientes de IA" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {CLIENTS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            id={`tab-${c.id}`}
            aria-selected={c.id === clientId}
            aria-controls="client-panel"
            className={buttonVariants({ variant: c.id === clientId ? 'default' : 'outline', size: 'sm' })}
            onClick={() => setClientId(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="client-panel" aria-labelledby={`tab-${client.id}`} className="flex flex-col gap-3">
        <ol className="list-decimal pl-5 flex flex-col gap-1 text-sm">
          {client.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
        {client.code && <CopyBlock value={client.code} />}
      </div>
    </div>
  );
}

export function McpGuide() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Use o Collectshare no Claude</h1>
        <p className="text-muted-foreground">
          Conecte sua conta a um assistente de IA (Claude, Claude Code, Cursor) pelo protocolo MCP e peça, em
          linguagem natural, para criar formulários, ler respostas ou explorar datasets públicos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Antes de começar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>Você precisa de uma conta no Collectshare. O assistente vai agir em nome dela.</p>
          {WEB_APP_URL && (
            <a
              href={WEB_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonVariants({ variant: 'outline', size: 'sm' })} self-start`}
            >
              Criar conta ou entrar
            </a>
          )}
          <p>Esta é a URL do servidor MCP, que você vai colar no seu cliente:</p>
          <CopyBlock value={MCP_URL} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Conecte o seu cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <Clients />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Autorize o acesso</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            Ao conectar, o cliente abre a tela de autorização do Collectshare. Se você não estiver logado, entre
            primeiro. Depois clique em <strong>Autorizar</strong> (ou <strong>Cancelar</strong> para desistir).
          </p>
          <p className="text-muted-foreground">
            A partir daí o assistente vê e altera o mesmo que você: seus formulários e respostas, e os datasets
            públicos do portal (sempre anonimizados). Sua senha nunca é compartilhada com o cliente.
          </p>
        </CardContent>
      </Card>

      <div role="note" className="flex gap-3 rounded-md border border-destructive/50 p-4 text-sm">
        <TriangleAlertIcon className="size-5 shrink-0 text-destructive" />
        <div className="flex flex-col gap-1">
          <p className="font-medium">Cuidados</p>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-muted-foreground">
            <li>A conexão dá acesso total à sua conta. Conecte só clientes em que você confia.</li>
            <li>
              Respostas e datasets são textos escritos por outras pessoas. Desconfie se o assistente começar a
              seguir “instruções” que vieram de dentro dos dados.
            </li>
            <li>Ferramentas destrutivas substituem o conteúdo inteiro: confira antes de confirmar.</li>
            <li>Ainda não existe uma tela para revogar acessos concedidos.</li>
          </ul>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>4. O que o assistente pode fazer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <ul className="flex flex-col gap-2">
            {TOOLS.map((t) => (
              <li key={t.name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <code className="font-mono text-xs">{t.name}</code>
                <Badge variant={t.kind === 'destructive' ? 'destructive' : 'outline'} className="self-start sm:self-auto">
                  {KIND_LABEL[t.kind]}
                </Badge>
                <span className="text-muted-foreground">{t.description}</span>
              </li>
            ))}
          </ul>
          <div>
            <p className="font-medium mb-1">Experimente pedir:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1 text-muted-foreground">
              {EXAMPLE_PROMPTS.map((p) => <li key={p}>“{p}”</li>)}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
