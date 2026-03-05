import { useMemo } from 'react';
import { Deal } from '@/data/demo-data';
import { Layers } from 'lucide-react';
import { fmt } from '@/lib/utils';

const STAGE_ORDER = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];

const STAGE_COLORS: Record<string, string> = {
  Discovery: 'hsl(var(--grade-c))',
  Qualification: 'hsl(var(--grade-b))',
  Proposal: 'hsl(var(--primary))',
  Negotiation: 'hsl(var(--grade-a))',
};

interface PipelineFunnelProps {
  deals: Deal[];
  activeStage?: string | null;
  onStageClick?: (stage: string | null) => void;
}

export function PipelineFunnel({ deals, activeStage, onStageClick }: PipelineFunnelProps) {
  const stageData = useMemo(() => {
    const map: Record<
      string,
      { count: number; acv: number; weighted: number; avgPQS: number; atRisk: number }
    > = {};
    STAGE_ORDER.forEach((s) => {
      map[s] = { count: 0, acv: 0, weighted: 0, avgPQS: 0, atRisk: 0 };
    });
    deals.forEach((d) => {
      if (!map[d.stage]) return;
      map[d.stage].count++;
      map[d.stage].acv += d.acv;
      map[d.stage].weighted += d.acv * d.probabilities.win;
      map[d.stage].avgPQS += d.pqScore;
      if (d.pqScore < 40) map[d.stage].atRisk++;
    });
    return STAGE_ORDER.map((stage) => {
      const s = map[stage];
      return {
        stage,
        count: s.count,
        acv: s.acv,
        weighted: s.weighted,
        avgPQS: s.count > 0 ? Math.round(s.avgPQS / s.count) : 0,
        atRisk: s.atRisk,
      };
    });
  }, [deals]);

  const maxACV = Math.max(...stageData.map((s) => s.acv), 1);

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="metric-label flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Pipeline by Stage
        </div>
        {activeStage && (
          <button
            onClick={() => onStageClick?.(null)}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/30 hover:border-border transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {stageData.map((s) => {
          const widthPct = (s.acv / maxACV) * 100;
          const isActive = activeStage === s.stage;
          const isDimmed = activeStage && !isActive;

          return (
            <button
              key={s.stage}
              onClick={() => onStageClick?.(isActive ? null : s.stage)}
              className={`w-full text-left group rounded-lg p-2.5 transition-all ${
                isActive
                  ? 'bg-primary/10 ring-1 ring-primary/30'
                  : isDimmed
                    ? 'opacity-40 hover:opacity-70'
                    : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{s.stage}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {s.count} deals
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {fmt(s.acv)}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    PQS {s.avgPQS}
                  </span>
                  {s.atRisk > 0 && (
                    <span className="text-[9px] font-mono text-grade-f bg-grade-f/10 px-1.5 py-0.5 rounded-full">
                      {s.atRisk} at risk
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: STAGE_COLORS[s.stage],
                    opacity: isDimmed ? 0.3 : 0.85,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Conversion rates between stages */}
      <div className="flex items-center justify-between mt-3 px-2">
        {stageData.slice(0, -1).map((s, i) => {
          const next = stageData[i + 1];
          const convRate = s.count > 0 ? Math.round((next.count / s.count) * 100) : 0;
          return (
            <div key={s.stage} className="text-center flex-1">
              <div className="text-[9px] font-mono text-muted-foreground">→ {convRate}%</div>
            </div>
          );
        })}
        <div className="flex-1" />
      </div>
    </div>
  );
}
