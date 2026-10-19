import { Badge, buttonVariants, Card, CardContent, CardHeader, CardTitle, cn } from '@monorepo/ui';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { type Door, DOORS, type SampleRow, STEPS } from './content';

function Row({ row }: { row: SampleRow }) {
  const fields: [string, string | null][] = [['Nome', row.nome], ['CPF', row.cpf], ['CEP', row.cep]];

  return (
    <dl className="grid sm:grid-cols-3 gap-2 rounded-md border bg-muted/50 p-3 font-mono text-sm">
      {fields.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground font-sans">{label}</dt>
          <dd className="break-words">{value ?? <span className="text-muted-foreground">(suprimido)</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

function HowTo({ howTo }: { howTo: Door['howTo'] }) {
  if (!howTo.href) { return null; }

  const className = buttonVariants({ variant: 'outline', size: 'sm' });
  return howTo.href.startsWith('/')
    ? <Link to={howTo.href} className={cn(className, 'self-start')}>{howTo.text}</Link>
    : <a href={howTo.href} target="_blank" rel="noopener noreferrer" className={cn(className, 'self-start')}>{howTo.text}</a>;
}

function Doors() {
  const [doorId, setDoorId] = useState<Door['id']>('OWNER');
  const door = DOORS.find((d) => d.id === doorId)!;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Portas de leitura" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {DOORS.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            id={`tab-${d.id}`}
            aria-selected={d.id === doorId}
            aria-controls="door-panel"
            className={buttonVariants({ variant: d.id === doorId ? 'default' : 'outline', size: 'sm' })}
            onClick={() => setDoorId(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="door-panel" aria-labelledby={`tab-${door.id}`} className="flex flex-col gap-3">
        <Badge variant="outline" className="self-start">{door.auth}</Badge>
        <Row row={door.row} />
        <p className="text-sm text-muted-foreground">{door.note}</p>
        <HowTo howTo={door.howTo} />
      </div>
    </div>
  );
}

export function About() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Como funciona</h1>
      <p className="text-muted-foreground mb-8">
        Siga uma resposta desde o envio até cada lugar de onde ela pode ser lida, e veja o que acontece com os
        dados pessoais no caminho.
      </p>

      <ol className="grid grid-cols-5 gap-2 mb-6">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              aria-current={i === index ? 'step' : undefined}
              onClick={() => setIndex(i)}
              className={cn(
                'w-full flex flex-col items-center gap-1 rounded-md p-2 text-xs transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                i === index ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border text-sm font-semibold',
                  i === index && 'bg-primary text-primary-foreground border-primary',
                  i < index && 'border-primary text-primary',
                )}
              >
                {i + 1}
              </span>
              <span className="hidden sm:block">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>{index + 1}. {step.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>{step.what}</p>
          <p className="text-sm">
            <span className="font-medium">Onde o dado está: </span>
            <span className="text-muted-foreground">{step.where}</span>
          </p>
          {step.row && <Row row={step.row} />}
          {step.id === 'ENGINE' && <Doors />}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-4">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <ArrowLeftIcon /> Anterior
        </button>
        <button
          type="button"
          disabled={index === STEPS.length - 1}
          onClick={() => setIndex(index + 1)}
          className={buttonVariants({ size: 'sm' })}
        >
          Próximo <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
