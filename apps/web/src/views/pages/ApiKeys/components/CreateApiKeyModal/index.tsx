import { Button, Input } from '@monorepo/ui';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { ClipboardCopyIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import { useModal } from '@/app/hooks/useModal';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';

import { useApiKeysController } from '../../useApiKeysController';

const scopeOptions = [
  {
    value: ApiKeyScope.PORTAL_READ,
    label: 'Leitura do portal',
    description: 'Lê dados de datasets publicados, anonimizados — o mesmo que o portal público expõe.',
  },
  {
    value: ApiKeyScope.FORMS_READ,
    label: 'Meus dados',
    description: 'Lê os dados brutos (sem anonimização) dos seus próprios formulários, publicados ou não.',
  },
  {
    value: ApiKeyScope.FORMS_WRITE,
    label: 'Gerenciar formulários',
    description: 'Cria e atualiza formulários e perguntas dos seus próprios formulários.',
  },
];

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copiado!');
}

export function CreateApiKeyModal() {
  const { close } = useModal();
  const {
    createdKey,
    setCreatedKey,
    register,
    handleSubmit,
    errors,
    isCreating,
  } = useApiKeysController();

  function handleClose() {
    setCreatedKey(null);
    close();
  }

  if (createdKey) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>API Key criada com sucesso</DialogTitle>
        </DialogHeader>
        <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950 space-y-2">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Salve esta chave agora — ela não será exibida novamente.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white dark:bg-black border rounded p-2 break-all">
              {createdKey}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(createdKey)}
            >
              <ClipboardCopyIcon className="size-4" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleClose}>
            Entendi, pode fechar
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova API Key</DialogTitle>
      </DialogHeader>
      <form className="grid gap-4 py-2" id="createApiKey" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-2">
          <Label htmlFor="name">Nome (ex: Integração CRM)</Label>
          <Input
            id="name"
            placeholder="Minha integração"
            disabled={isCreating}
            {...register('name')}
            error={errors.name?.message}
          />
        </div>
        <div className="grid gap-2">
          <Label>Escopos</Label>
          {scopeOptions.map(option => (
            <label key={option.value} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                value={option.value}
                disabled={isCreating}
                {...register('scopes')}
              />
              <span>
                <span className="font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}
          {errors.scopes?.message && (
            <span className="text-xs text-destructive">{errors.scopes.message}</span>
          )}
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit" form="createApiKey" isLoading={isCreating}>Criar API Key</Button>
      </DialogFooter>
    </>
  );
}
