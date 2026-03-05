import { Deal } from '@/data/demo-data';
import { cn } from '@/lib/utils';

interface Dimension {
  label: string;
  shortLabel: string;
  value: number; // 0-100
  weight: number; // configured weight
  color: string;
}

function computeDimensions(deal: Deal): Dimension[] {
  const personaScore = Math.max(0, 100 - deal.personaGaps.length * 25);
  const processScore = Math.max(0, 100 - deal.missingSteps.length * 20);
  const engagementTotal = deal.activities.calls + deal.activities.emails + deal.activities.meetings;
  const engagementScore = Math.min(100, engagementTotal * 4);

  return [
    {
      label: 'Outcome Probability',
      shortLabel: 'Outcome',
      value: Math.round(deal.probabilities.win * 100),
      weight: 0.30,
      color: 'grade-a',
    },
    {
      label: 'ICP Fit',
      shortLabel: 'ICP',
      value: deal.icpScore,
      weight: 0.20,
      color: 'grade-b',
    },
    {
      label: 'Persona Coverage',
      shortLabel: 'Personas',
      value: personaScore,
      weight: 0.15,
      color: 'grade-c',
    },
    {
      label: 'Process Adherence',
      shortLabel: 'Process',
      value: processScore,
      weight: 0.15,
      color: 'grade-d',
    },
    {
      label: 'Engagement Velocity',
      shortLabel: 'Engagement',
      value: engagementScore,
      weight: 0.10,
      color: 'grade-a',
    },
    {
      label: 'Price Risk (Inverted)',
      shortLabel: 'Pricing',
      value: Math.round((1 - deal.priceRisk) * 100),
      weight: 0.05,
      color: 'grade-b',
    },
    {
      label: 'Stage Progression',
      shortLabel: 'Velocity',
      value: Math.max(0, Math.min(100, 100 - (deal.daysInStage - 10) * 3)),
      weight: 0.05,
      color: 'grade-c',
    },
  ];
}

function gradeColor(val: number): string {
  if (val >= 70) return 'grade-a';
  if (val >= 50) return 'grade-c';
  return 'grade-f';
}

export function ScoreRadar({ deal }: { deal: Deal }) {
  const dimensions = computeDimensions(deal);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          PQS Dimension Breakdown
        </span>
        <span className="text-sm font-mono font-bold text-foreground">
          PQS {deal.pqScore}
        </span>
      </div>

      {/* Bar-style radar */}
      <div className="space-y-2">
        {dimensions.map(dim => {
          const gc = gradeColor(dim.value);
          return (
            <div key={dim.label} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground">{dim.label}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{Math.round(dim.weight * 100)}%w</span>
                </div>
                <span className={cn('text-xs font-mono font-bold', `text-[hsl(var(--${gc}))]`)}>
                  {dim.value}
                </span>
              </div>
              <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', `bg-[hsl(var(--${gc}))]`)}
                  style={{ width: `${dim.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Weakest dimension callout */}
      {(() => {
        const weakest = [...dimensions]
          .filter(d => d.weight >= 0.10)
          .sort((a, b) => a.value - b.value)[0];
        if (weakest && weakest.value < 50) {
          return (
            <div className="bg-[hsl(var(--grade-f)/.05)] border border-[hsl(var(--grade-f)/.2)] rounded-lg p-2.5">
              <div className="text-[10px] font-semibold text-[hsl(var(--grade-f))] mb-0.5">
                Weakest Dimension: {weakest.label}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Score {weakest.value}/100 with {Math.round(weakest.weight * 100)}% weight — addressing this would have the highest PQS impact.
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
