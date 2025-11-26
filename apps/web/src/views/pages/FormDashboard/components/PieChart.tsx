import * as React from 'react';
import { Pie, PieChart as RechartsPieChart } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface PieChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export function PieChart({ data: originalData }: PieChartProps) {
  const data = originalData.map((item, i) => ({
    ...item,
    fill: COLORS[i % COLORS.length],
  }));

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.fill,
      };
    });
    return config;
  }, [data]);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[400px]"
    >
      <RechartsPieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="name" />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="name" payload={undefined} />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </RechartsPieChart>
    </ChartContainer>
  );
}
