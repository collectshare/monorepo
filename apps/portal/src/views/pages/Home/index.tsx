import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@monorepo/ui';
import { SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useHomeController } from './useHomeController';

export function Home() {
  const { query, setQuery, results, isLoading } = useHomeController();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Datasets</h1>
      <p className="text-muted-foreground mb-6">
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
        {results.map((result) => (
          <Link key={result.formId} to={`/dataset/${result.formId}`}>
            <Card className="h-full hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>{result.title}</CardTitle>
                {result.description && <CardDescription>{result.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1">
                  {result.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{result.accountName}</span>
                  <span>{result.submissionCount ?? 0} respostas</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
