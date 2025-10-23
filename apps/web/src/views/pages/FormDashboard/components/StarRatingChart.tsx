
import { Star } from 'lucide-react';

import { Chart } from './Chart';

interface StarRatingChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

export function StarRatingChart({ data }: StarRatingChartProps) {
  const totalResponses = data.reduce((acc, item) => acc + item.value, 0);
  const totalStars = data.reduce((acc, item) => acc + Number(item.name) * item.value, 0);
  const average = totalResponses > 0 ? (totalStars / totalResponses).toFixed(1) : 0;

  return (
    <div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <Star className="w-6 h-6 text-primary fill-primary" />
        <span className="text-2xl font-bold">{average}</span>
      </div>
      <Chart data={data} />
    </div>
  );
}
