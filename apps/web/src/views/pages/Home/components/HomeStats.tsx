import { Card, CardContent, CardDescription, CardTitle } from '@monorepo/ui';

interface HomeStatsProps {
  totalForms: number;
  totalResponses: number;
  publishedCount: number;
  draftCount: number;
}

export function HomeStats({ totalForms, totalResponses, publishedCount, draftCount }: HomeStatsProps) {
  const stats = [
    { label: 'Total de formulários', value: totalForms },
    { label: 'Total de respostas', value: totalResponses },
    { label: 'Publicados / Rascunho', value: `${publishedCount} / ${draftCount}` },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent>
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="mt-1 text-3xl font-bold">{stat.value}</CardTitle>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
