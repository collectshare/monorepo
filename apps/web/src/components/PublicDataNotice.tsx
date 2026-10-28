import { Globe } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/Alert';

// Todo formulário é publicado no portal (form-defaults): quem responde precisa
// saber disso antes de enviar (LGPD, art. 9º).
export function PublicDataNotice() {
  return (
    <Alert className="mt-6 text-left">
      <Globe className="h-4 w-4" />
      <AlertDescription className="text-muted-foreground">
        Suas respostas serão publicadas no portal de dados abertos do Collectshare.
        As perguntas que coletam dados pessoais são protegidas antes da publicação,
        e o IP e o navegador de quem responde não são registrados. Evite escrever
        informações pessoais nas respostas de texto livre.
      </AlertDescription>
    </Alert>
  );
}
