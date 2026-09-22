import { IForm } from '@monorepo/shared/types/IForm';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@monorepo/ui';
import { CopyIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface NoResponsesCalloutProps {
  forms: IForm[];
}

export function NoResponsesCallout({ forms }: NoResponsesCalloutProps) {
  function handleCopyLink(formId: string) {
    const url = `${window.location.origin}/forms/response/${formId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ainda sem respostas</CardTitle>
        <CardDescription>
          Esses formulários estão publicados, mas ainda não receberam nenhuma resposta. Compartilhe o link para começar a coletar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {forms.map((form) => (
            <li key={form.id} className="flex items-center justify-between gap-2 py-2">
              <span className="truncate">{form.title}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(form.id)}
              >
                <CopyIcon className="size-4" />
                Copiar link
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
