import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@monorepo/ui';
import { SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useHomeController } from './useHomeController';

export function Home() {
  const { query, setQuery, results, isLoading } = useHomeController();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Portal de Dados Abertos</h1>
      <p className="text-muted-foreground text-center mb-8">
        Explore datasets públicos publicados por formulários do CollectShare.
      </p>

      <div className="relative mb-8">
        <SearchIcon className="absolute w-4 h-4 left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="indent-6 h-12"
          placeholder="Buscar por título ou tag..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {isLoading && <p className="text-center text-muted-foreground">Buscando...</p>}

      {!isLoading && results.length === 0 && (
        <p className="text-center text-muted-foreground">Nenhum dataset encontrado.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((hit) => (
          <Link key={hit.objectID} to={`/dataset/${hit.objectID}`}>
            <Card className="h-full hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>{hit.title}</CardTitle>
                {hit.description && <CardDescription>{hit.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1">
                  {hit.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{hit.accountName}</span>
                  <span>{hit.submissionCount ?? 0} respostas</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
