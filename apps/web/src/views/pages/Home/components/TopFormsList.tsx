import { IForm } from '@monorepo/shared/types/IForm';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@monorepo/ui';
import { Link } from 'react-router-dom';

interface TopFormsListProps {
  title: string;
  forms: IForm[];
  metric: 'submissionCount' | 'clickCount';
  metricLabel: string;
}

export function TopFormsList({ title, forms, metric, metricLabel }: TopFormsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {forms.map((form) => (
            <li key={form.id}>
              <Link
                to={`/forms/dashboard/${form.id}`}
                className="flex items-center justify-between gap-2 py-2 hover:text-primary"
              >
                <span className="truncate">{form.title}</span>
                <Badge variant="secondary" className="shrink-0">
                  {form[metric] ?? 0} {metricLabel}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
