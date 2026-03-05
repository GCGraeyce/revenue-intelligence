import { fmt } from '@/lib/utils';

interface Props {
  raw: number;
  adjusted: number;
  low: number;
  high: number;
}
export function ForecastBand({ raw, adjusted, low, high }: Props) {
  const range = high - low;
  const adjustedPct = range > 0 ? ((adjusted - low) / range) * 100 : 50;
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="metric-label mb-4">Quality-Adjusted Forecast</div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="metric-value text-foreground">{fmt(adjusted)}</span>
        <span className="text-sm font-mono text-muted-foreground">± {fmt((high - low) / 2)}</span>
      </div>
      <div className="text-xs text-muted-foreground mb-5 font-mono">
        Raw: {fmt(raw)} · Range: {fmt(low)} – {fmt(high)}
      </div>
      {/* Visual band */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary/15 rounded-full"
          style={{ left: '10%', width: '80%' }}
        />
        <div
          className="absolute h-full w-1.5 bg-primary rounded-full shadow-[0_0_8px_hsl(221_83%_53%/0.4)]"
          style={{ left: `${Math.min(90, Math.max(10, adjustedPct * 0.8 + 10))}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] font-mono text-muted-foreground">{fmt(low)}</span>
        <span className="text-[10px] font-mono text-primary font-semibold">Medium Confidence</span>
        <span className="text-[10px] font-mono text-muted-foreground">{fmt(high)}</span>
      </div>
    </div>
  );
}
