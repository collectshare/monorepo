
import { StarIcon } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface StarRatingProps {
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export function StarRating({ max, value, onChange }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <StarIcon
          key={star}
          className={cn(
            'w-8 h-8 cursor-pointer',
            star <= (hover || value) ? 'text-primary fill-primary' : 'text-primary',
          )}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        />
      ))}
    </div>
  );
}
