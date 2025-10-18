import { CheckCircle } from 'lucide-react';

export function FormFinished() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4">
      <CheckCircle className="w-16 h-16 text-green-500" />
      <h1 className="text-2xl font-bold">Formulário enviado com sucesso!</h1>
      <p className="text-muted-foreground">Obrigado por sua resposta.</p>
    </div>
  );
}
