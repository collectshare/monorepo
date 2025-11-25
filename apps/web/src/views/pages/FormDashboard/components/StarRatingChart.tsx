
import { Star } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface StarRatingChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const chartConfig = {
  value: {
    label: 'Quantidade',
  },
} satisfies ChartConfig;

export function StarRatingChart({ data: originalData }: StarRatingChartProps) {
  const totalResponses = originalData.reduce((acc, item) => acc + item.value, 0);
  const totalStars = originalData.reduce(
    (acc, item) => acc + Number(item.name) * item.value,
    0,
  );
  const average =
    totalResponses > 0 ? (totalStars / totalResponses).toFixed(1) : 0;

  const data = originalData.map((item, i) => ({
    ...item,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <Star className="w-6 h-6 text-primary fill-primary" />
        <span className="text-2xl font-bold">{average}</span>
      </div>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => `${value} ★`}
          />
          <YAxis />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="value" radius={4}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
