import { Button, Input } from '@monorepo/ui';
import { ClipboardCopyIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import { useModal } from '@/app/hooks/useModal';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';

import { useApiKeysController } from '../../useApiKeysController';

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
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit" form="createApiKey" isLoading={isCreating}>Criar API Key</Button>
      </DialogFooter>
    </>
  );
}
