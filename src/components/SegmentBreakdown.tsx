import { fmt } from '@/lib/utils';

interface SegmentData {
  segment: string;
  count: number;
  acv: number;
  avgPQS: number;
}

interface Props {
  data: SegmentData[];
  activeSegment?: string | null;
  onSegmentClick?: (segment: string | null) => void;
}

export function SegmentBreakdown({ data, activeSegment, onSegmentClick }: Props) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="metric-label">Segment Performance</div>
        {activeSegment && (
          <button
            onClick={() => onSegmentClick?.(null)}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/30 hover:border-border transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-4">
        {data.map((seg) => {
          const isActive = activeSegment === seg.segment;
          const isDimmed = activeSegment != null && !isActive;

          return (
            <button
              key={seg.segment}
              onClick={() => onSegmentClick?.(isActive ? null : seg.segment)}
              className={`w-full text-left flex items-center gap-3 rounded-lg p-1.5 -m-1.5 transition-all ${
                isActive
                  ? 'bg-primary/10 ring-1 ring-primary/30'
                  : isDimmed
                    ? 'opacity-30 hover:opacity-60'
                    : 'hover:bg-muted/30'
              }`}
            >
              <span className="text-xs font-semibold w-24 text-foreground">{seg.segment}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {seg.count} deals · {fmt(seg.acv)}
                  </span>
                  <span className="text-[10px] font-mono text-primary font-semibold">
                    PQS {seg.avgPQS}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-500"
                    style={{ width: `${seg.avgPQS}%`, opacity: isDimmed ? 0.3 : 1 }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
