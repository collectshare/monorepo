import {
  Badge,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@monorepo/ui';

import { CodeBlock } from './CodeBlock';
import { EndpointCard } from './EndpointCard';
import { endpoints } from './endpoints';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.collectshare.com.br';
const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL;

export function ApiDocs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Documentação da API</h1>
        <p className="text-muted-foreground">
          Referência da API externa do CollectShare (<code className="font-mono text-sm">/v1/*</code>), usada para
          buscar datasets, ler dados publicados e ler os próprios formulários e respostas de uma conta.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 text-sm">
        <a href="#autenticacao" className="hover:underline">Autenticação</a>
        <span className="text-muted-foreground">·</span>
        <a href="#scopes" className="hover:underline">Scopes</a>
        <span className="text-muted-foreground">·</span>
        <a href="#endpoints" className="hover:underline">Endpoints</a>
        <span className="text-muted-foreground">·</span>
        <a href="#paginacao" className="hover:underline">Paginação</a>
        <span className="text-muted-foreground">·</span>
        <a href="#erros" className="hover:underline">Erros</a>
      </nav>

      <Card id="autenticacao">
        <CardHeader>
          <CardTitle>Autenticação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground">
            Toda rota <code className="font-mono text-sm">/v1/*</code> exige uma chave de API, enviada no header{' '}
            <code className="font-mono text-sm">x-api-key</code> ou como{' '}
            <code className="font-mono text-sm">Authorization: Bearer &lt;chave&gt;</code>. A chave sempre começa
            com o prefixo <code className="font-mono text-sm">cs_sk_</code>.
          </p>
          <CodeBlock>{`GET ${API_BASE_URL}/v1/forms
x-api-key: cs_sk_...`}</CodeBlock>
          <p className="text-muted-foreground">
            A requisição é rejeitada com <code className="font-mono text-sm">401 Unauthorized</code> quando a chave
            está ausente, mal formatada (sem o prefixo <code className="font-mono text-sm">cs_sk_</code>),
            desconhecida, revogada ou expirada.
          </p>
          {WEB_APP_URL && (
            <a
              href={`${WEB_APP_URL}/api-keys`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-fit' })}
            >
              Gerenciar chaves de API
            </a>
          )}
        </CardContent>
      </Card>

      <Card id="scopes">
        <CardHeader>
          <CardTitle>Scopes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground">
            Cada chave carrega um ou mais scopes, que liberam rotas de forma independente — ter um scope não implica
            no outro.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scope</TableHead>
                <TableHead>Libera</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Badge variant="outline">portal:read</Badge></TableCell>
                <TableCell className="text-muted-foreground">
                  <code className="font-mono text-sm">GET /v1/portal/search</code> e{' '}
                  <code className="font-mono text-sm">GET /v1/portal/datasets/{'{formId}'}/data</code>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell><Badge variant="outline">data:read</Badge></TableCell>
                <TableCell className="text-muted-foreground">
                  <code className="font-mono text-sm">GET /v1/forms</code> e{' '}
                  <code className="font-mono text-sm">GET /v1/submissions/{'{formId}'}</code>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div id="endpoints" className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Endpoints</h2>
        {endpoints.map((endpoint) => (
          <EndpointCard key={endpoint.id} endpoint={endpoint} />
        ))}
      </div>

      <Card id="paginacao">
        <CardHeader>
          <CardTitle>Paginação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground">
            <code className="font-mono text-sm">GET /v1/portal/datasets/{'{formId}'}/data</code> e{' '}
            <code className="font-mono text-sm">GET /v1/submissions/{'{formId}'}</code> usam paginação por cursor:
          </p>
          <ul className="list-disc list-inside text-muted-foreground flex flex-col gap-1">
            <li>
              <code className="font-mono text-sm">limit</code> define o tamanho da página. Quando omitido, é usado
              um valor padrão; valores acima de 1000 são reduzidos automaticamente para 1000 (a requisição não
              falha).
            </li>
            <li>
              <code className="font-mono text-sm">cursor</code> retoma a paginação a partir de onde a página
              anterior parou. Use o valor de <code className="font-mono text-sm">nextCursor</code> da resposta
              anterior.
            </li>
            <li>
              Quando a resposta não inclui <code className="font-mono text-sm">nextCursor</code>, não há mais
              páginas.
            </li>
          </ul>
          <CodeBlock>{`GET ${API_BASE_URL}/v1/submissions/{formId}?limit=100&cursor=<nextCursor da página anterior>`}</CodeBlock>
        </CardContent>
      </Card>

      <Card id="erros">
        <CardHeader>
          <CardTitle>Referência de erros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Quando ocorre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono whitespace-nowrap">401 Unauthorized</TableCell>
                <TableCell className="text-muted-foreground">
                  Chave ausente, mal formatada, desconhecida, revogada ou expirada.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono whitespace-nowrap">404 Not Found</TableCell>
                <TableCell className="text-muted-foreground">
                  O <code className="font-mono text-sm">formId</code> não existe ou, nos endpoints de{' '}
                  <code className="font-mono text-sm">portal/*</code>, o formulário existe mas não está publicado.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono whitespace-nowrap">405 Not Allowed</TableCell>
                <TableCell className="text-muted-foreground">
                  A chave é válida mas não possui o scope exigido pela rota, ou (em{' '}
                  <code className="font-mono text-sm">/v1/submissions/{'{formId}'}</code>) o formulário pertence a
                  outra conta.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
