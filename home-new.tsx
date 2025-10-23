import { DollarSign, FileText,PlusCircle, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';

// Mock Data
const metrics = {
  totalForms: 125,
  totalSubmissions: 10532,
  averageResponseRate: 85.2,
};

const recentForms = [
  { id: 'form-001', name: 'Pesquisa de Satisfação do Cliente', submissions: 1203, status: 'Active' },
  { id: 'form-002', name: 'Formulário de Inscrição para Webinar', submissions: 850, status: 'Active' },
  { id: 'form-003', name: 'Pesquisa de Mercado - Novo Produto', submissions: 2540, status: 'Active' },
  { id: 'form-004', name: 'Feedback do Funcionário', submissions: 430, status: 'Closed' },
  { id: 'form-005', name: 'Relatório de Bug', submissions: 50, status: 'Active' },
];

const chartData = [
  { name: 'Seg', submissions: 400 },
  { name: 'Ter', submissions: 300 },
  { name: 'Qua', submissions: 600 },
  { name: 'Qui', submissions: 800 },
  { name: 'Sex', submissions: 700 },
  { name: 'Sáb', submissions: 900 },
  { name: 'Dom', submissions: 1100 },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel de Controle</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Aqui está uma visão geral de seus formulários e atividades.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Novo Formulário
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Formulários
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalForms}</div>
            <p className="text-xs text-muted-foreground">
              +5 desde o último mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Respostas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{metrics.totalSubmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15% desde o último mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta Média</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResponseRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% desde o último mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade de Respostas</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submissions" fill="#8884d8" name="Respostas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Formulários Recentes</CardTitle>
            <CardDescription>
              Seus formulários mais recentemente atualizados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Respostas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell className="text-right">{form.submissions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
