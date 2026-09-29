import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@monorepo/ui';
import { Link } from 'react-router-dom';

import { useOAuthAuthorizeController } from './useOAuthAuthorizeController';

export default function OAuthAuthorize() {
  const {
    isFramed,
    clientName,
    redirectHost,
    isLoading,
    errorMessage,
    isSubmitting,
    pendingDecision,
    canDecide,
    approve,
    deny,
  } = useOAuthAuthorizeController();

  if (isFramed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Página indisponível aqui</CardTitle>
          <CardDescription>
            Por segurança, esta página não pode ser exibida dentro de outro site. Abra o pedido de
            autorização diretamente no navegador.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Autorizar acesso</CardTitle>
          <CardDescription>Validando o pedido...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canDecide) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedido de autorização inválido</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/" className="text-sm underline underline-offset-4">
            Voltar ao início
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autorizar acesso</CardTitle>
        <CardDescription>
          <strong className="text-foreground">{clientName}</strong> quer acessar sua conta no Collectshare.
          Depois de decidir, você será enviado para <strong className="text-foreground">{redirectHost}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="text-sm">
          <p className="mb-2">Este aplicativo poderá, em seu nome:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>listar, criar e editar seus formulários e perguntas;</li>
            <li>ver as respostas recebidas pelos seus formulários;</li>
            <li>pesquisar e ler conjuntos de dados publicados.</li>
          </ul>
        </div>

        <p className="text-sm text-muted-foreground">
          Autorize apenas se você iniciou esta conexão e confia no aplicativo. Você pode revogar o
          acesso a qualquer momento.
        </p>

        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={deny}
            isLoading={isSubmitting && pendingDecision === 'deny'}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={approve}
            isLoading={isSubmitting && pendingDecision === 'approve'}
            disabled={isSubmitting}
          >
            Autorizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
