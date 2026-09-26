import {
  Badge,
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

import type { Endpoint } from './endpoints';

export function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <Card id={endpoint.id}>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{endpoint.method}</Badge>
          <CardTitle className="font-mono text-base font-medium">{endpoint.path}</CardTitle>
          <Badge variant="outline">{endpoint.scope}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{endpoint.summary}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {endpoint.params.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Parâmetros</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoint.params.map((param) => (
                  <TableRow key={param.name}>
                    <TableCell className="font-mono">{param.name}</TableCell>
                    <TableCell>{param.in}</TableCell>
                    <TableCell>{param.required ? 'Sim' : 'Não'}</TableCell>
                    <TableCell className="text-muted-foreground">{param.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {endpoint.body && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Corpo da requisição</h3>
            <p className="text-sm text-muted-foreground">{endpoint.body}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold mb-2">Resposta</h3>
          <p className="text-sm text-muted-foreground">{endpoint.response}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Erros</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Quando ocorre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoint.errors.map((error) => (
                <TableRow key={error.status}>
                  <TableCell className="font-mono whitespace-nowrap">{error.status}</TableCell>
                  <TableCell className="text-muted-foreground">{error.condition}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
