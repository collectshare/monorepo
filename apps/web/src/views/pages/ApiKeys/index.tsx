import { Button, Input } from '@monorepo/ui';
import { ClipboardCopyIcon, Trash2Icon } from 'lucide-react';
import toast from 'react-hot-toast';

import { Label } from '@/components/ui/Label';

import { useApiKeysController } from './useApiKeysController';

export default function ApiKeys() {
  const {
    apiKeys,
    isLoading,
    createdKey,
    setCreatedKey,
    register,
    handleSubmit,
    errors,
    isCreating,
    revoke,
    isRevoking,
  } = useApiKeysController();

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie chaves de acesso pessoal (PAT) da sua conta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
        <h2 className="font-semibold">Criar nova API Key</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Nome (ex: Integração CRM)</Label>
          <Input
            id="name"
            placeholder="Minha integração"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>
        <Button type="submit" isLoading={isCreating}>Criar API Key</Button>
      </form>

      {createdKey && (
        <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950 space-y-2">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Salve esta chave agora — ela não será exibida novamente.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white dark:bg-black border rounded p-2 break-all">
              {createdKey}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(createdKey)}
            >
              <ClipboardCopyIcon className="size-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCreatedKey(null)}>
            Entendi, pode fechar
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold">Chaves ativas</h2>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && apiKeys.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma API Key criada ainda.</p>
        )}
        {apiKeys.map(key => (
          <div key={key.id} className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="font-medium text-sm">{key.name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{key.keyPrefix}…</p>
              <p className="text-xs text-muted-foreground">
                Criada em {new Date(key.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              disabled={isRevoking}
              onClick={() => revoke(key.id)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
