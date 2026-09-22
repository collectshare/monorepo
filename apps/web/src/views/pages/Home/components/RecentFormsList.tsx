import { IForm } from '@monorepo/shared/types/IForm';
import { Card, CardContent, CardHeader, CardTitle } from '@monorepo/ui';
import { CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { formatDateWithoutHour } from '@/app/utils/formatDate';

interface RecentFormsListProps {
  forms: IForm[];
}

export function RecentFormsList({ forms }: RecentFormsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Criados recentemente</CardTitle>
          <Link to="/my-forms" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>
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
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="size-3" />
                  {formatDateWithoutHour(form.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
