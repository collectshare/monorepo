import { Button, Card, CardContent } from '@monorepo/ui';
import { CirclePlusIcon, FileTextIcon } from 'lucide-react';

interface HomeEmptyStateProps {
  onCreateForm: () => void;
}

export function HomeEmptyState({ onCreateForm }: HomeEmptyStateProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <FileTextIcon className="size-8 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-medium">Você ainda não tem formulários</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Crie seu primeiro formulário para começar a coletar e compartilhar respostas.
            </p>
          </div>
          <Button type="button" size="lg" onClick={onCreateForm}>
            <CirclePlusIcon />
            Novo formulário
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
