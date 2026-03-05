import { cn } from '@/lib/utils';

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  showEndDot?: boolean;
  color?: 'primary' | 'grade-a' | 'grade-b' | 'grade-c' | 'grade-d' | 'grade-f';
}

/**
 * Minimal inline sparkline rendered with SVG.
 * Pass any array of numbers to visualize a trend.
 */
export function TrendSparkline({
  data,
  width = 60,
  height = 20,
  className,
  showEndDot = true,
  color = 'primary',
}: TrendSparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const lastPoint = points[points.length - 1].split(',');
  const strokeColor = `hsl(var(--${color}))`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('inline-block', className)}
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showEndDot && (
        <circle
          cx={parseFloat(lastPoint[0])}
          cy={parseFloat(lastPoint[1])}
          r="2"
          fill={strokeColor}
        />
      )}
    </svg>
  );
}

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Produces deterministic sequences so sparklines don't change on re-render.
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate simulated weekly trend data for a deal metric.
 * Uses a deterministic seed based on the value so sparklines stay stable across re-renders.
 */
export function generateTrendData(
  currentValue: number,
  weeks: number = 8,
  volatility: number = 0.15
): number[] {
  const data: number[] = [];
  const rand = seededRandom(Math.round(currentValue * 1000));
  // Work backwards from current value
  let val = currentValue;
  for (let i = 0; i < weeks; i++) {
    data.unshift(Math.max(0, Math.round(val)));
    // Perturb backwards with slight downward bias (things tend to improve)
    val = val * (1 - (rand() * volatility * 2 - volatility * 0.5));
  }
  return data;
}
