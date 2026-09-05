import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableContent,
} from '@monorepo/ui';
import { Link } from 'react-router-dom';

import { useDatasetController } from './useDatasetController';

export function Dataset() {
  const {
    dataset,
    isLoadingDataset,
    rows,
    columns,
    isLoadingData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDatasetController();

  if (isLoadingDataset) {
    return <p className="text-center py-12 text-muted-foreground">Carregando dataset...</p>;
  }

  if (!dataset) {
    return <p className="text-center py-12 text-muted-foreground">Dataset não encontrado.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col gap-6">
      <Link to="/" className="text-sm text-muted-foreground hover:underline w-fit">
        ← Voltar para a busca
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{dataset.form.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {dataset.form.description && <p className="text-muted-foreground">{dataset.form.description}</p>}
          <div className="flex flex-wrap gap-1">
            {dataset.form.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {dataset.form.submissionCount ?? 0} respostas
          </span>
        </CardContent>
      </Card>

      <div className="border rounded-md">
        <DataTable columns={columns} data={rows}>
          <DataTableContent isLoading={isLoadingData} />
        </DataTable>
      </div>

      {hasNextPage && (
        <Button
          variant="outline"
          onClick={() => fetchNextPage()}
          isLoading={isFetchingNextPage}
          className="w-fit mx-auto"
        >
          Carregar mais
        </Button>
      )}
    </div>
  );
}
