
import { QuestionType } from '@monorepo/shared/enums/QuestionType';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

import { fieldTypes } from './fieldTypes';

interface ISidebarProps {
  addField: (type: QuestionType) => void;
}

export function Sidebar({ addField }: ISidebarProps) {
  return (
    <Card className="lg:sticky top-24 lg:h-[calc(100vh-7rem)] overflow-y-auto">
      <CardHeader className="sticky top-0 z-10 border-b bg-card">
        <CardTitle>Campos</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-4 pt-4">
        {fieldTypes.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            onClick={() => addField(type)}
            className="flex items-center justify-start gap-2"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
