import { cn } from '@/lib/utils';

/* ─── Types ─── */
interface FieldQuality {
  name: string;
  status: 'current' | 'stale' | 'missing';
  lastUpdated?: string;
}

export interface DealDataQuality {
  overallScore: number;
  fields: FieldQuality[];
}

/* ─── Mock data generator ─── */
const STANDARD_FIELDS: Array<{ name: string; staleProbability: number; missingProbability: number }> = [
  { name: 'Close Date', staleProbability: 0.15, missingProbability: 0.05 },
  { name: 'ACV', staleProbability: 0.1, missingProbability: 0.02 },
  { name: 'Stage', staleProbability: 0.08, missingProbability: 0.01 },
  { name: 'Primary Contact', staleProbability: 0.2, missingProbability: 0.1 },
  { name: 'Economic Buyer', staleProbability: 0.3, missingProbability: 0.25 },
  { name: 'Last Activity', staleProbability: 0.25, missingProbability: 0.05 },
  { name: 'Competitor Info', staleProbability: 0.35, missingProbability: 0.4 },
  { name: 'Next Step', staleProbability: 0.15, missingProbability: 0.1 },
];

function generateMockQuality(seed?: number): DealDataQuality {
  // Use a simple deterministic-ish approach based on seed
  const s = seed ?? Math.random() * 1000;
  const fields: FieldQuality[] = STANDARD_FIELDS.map((f, i) => {
    const roll = ((s * (i + 1) * 7) % 100) / 100;
    if (roll < f.missingProbability) {
      return { name: f.name, status: 'missing' as const };
    }
    if (roll < f.missingProbability + f.staleProbability) {
      return { name: f.name, status: 'stale' as const, lastUpdated: `${Math.round(roll * 14 + 3)}d ago` };
    }
    return { name: f.name, status: 'current' as const, lastUpdated: `${Math.round(roll * 24 + 1)}h ago` };
  });

  const currentCount = fields.filter(f => f.status === 'current').length;
  const staleCount = fields.filter(f => f.status === 'stale').length;
  const overallScore = Math.round(((currentCount + staleCount * 0.5) / fields.length) * 100);

  return { overallScore, fields };
}

/* ─── Status icons ─── */
function StatusIcon({ status }: { status: 'current' | 'stale' | 'missing' }) {
  const icons = {
    current: (
      <svg className="w-3 h-3 text-[hsl(var(--grade-a))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    stale: (
      <svg className="w-3 h-3 text-[hsl(var(--grade-c))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    missing: (
      <svg className="w-3 h-3 text-[hsl(var(--grade-f))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  };
  return icons[status];
}

/* ─── Main Component ─── */
export function DataQualityIndicator({ quality: externalQuality }: { quality?: DealDataQuality }) {
  const quality = externalQuality ?? generateMockQuality();

  const dotColor =
    quality.overallScore > 80 ? 'bg-[hsl(var(--grade-a))]' :
    quality.overallScore > 60 ? 'bg-[hsl(var(--grade-c))]' :
    'bg-[hsl(var(--grade-f))]';

  const staleCount = quality.fields.filter(f => f.status === 'stale').length;
  const missingCount = quality.fields.filter(f => f.status === 'missing').length;

  return (
    <div className="group relative inline-flex items-center">
      {/* The dot */}
      <span className={cn('inline-block w-2.5 h-2.5 rounded-full cursor-default', dotColor)} />

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-56">
        <div className="bg-card border border-border/60 rounded-lg shadow-lg p-3 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Data Quality</span>
            <span className={cn(
              'text-xs font-mono font-bold',
              quality.overallScore > 80 ? 'text-[hsl(var(--grade-a))]' :
              quality.overallScore > 60 ? 'text-[hsl(var(--grade-c))]' :
              'text-[hsl(var(--grade-f))]'
            )}>
              {quality.overallScore}%
            </span>
          </div>

          {/* Summary line */}
          <div className="text-[10px] text-muted-foreground font-mono">
            {staleCount > 0 && `${staleCount} field${staleCount > 1 ? 's' : ''} stale`}
            {staleCount > 0 && missingCount > 0 && ', '}
            {missingCount > 0 && `${missingCount} missing`}
            {staleCount === 0 && missingCount === 0 && 'All fields current'}
          </div>

          {/* Field breakdown */}
          <div className="space-y-1 border-t border-border/30 pt-2">
            {quality.fields.map(field => (
              <div key={field.name} className="flex items-center gap-2">
                <StatusIcon status={field.status} />
                <span className="text-[10px] text-foreground flex-1">{field.name}</span>
                {field.lastUpdated && (
                  <span className="text-[9px] font-mono text-muted-foreground">{field.lastUpdated}</span>
                )}
                {field.status === 'missing' && (
                  <span className="text-[9px] font-mono text-[hsl(var(--grade-f))]">N/A</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="w-2 h-2 bg-card border-r border-b border-border/60 rotate-45 -translate-y-1" />
        </div>
      </div>
    </div>
  );
}
