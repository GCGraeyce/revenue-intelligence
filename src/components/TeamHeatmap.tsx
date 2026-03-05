import { useMemo } from 'react';
import { pipelineDeals, type Deal } from '@/data/demo-data';
import { cn, fmt } from '@/lib/utils';
import { Grid3X3 } from 'lucide-react';

interface HeatmapCell {
  rep: string;
  stage: string;
  dealCount: number;
  totalACV: number;
  avgPQS: number;
}

function buildHeatmapData(deals: Deal[]): {
  cells: HeatmapCell[];
  reps: string[];
  stages: string[];
} {
  const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
  const repSet = new Set(deals.map((d) => d.rep));
  const reps = Array.from(repSet).sort();

  const cells: HeatmapCell[] = [];
  for (const rep of reps) {
    for (const stage of stages) {
      const stageDeals = deals.filter((d) => d.rep === rep && d.stage === stage);
      cells.push({
        rep,
        stage,
        dealCount: stageDeals.length,
        totalACV: stageDeals.reduce((s, d) => s + d.acv, 0),
        avgPQS:
          stageDeals.length > 0
            ? Math.round(stageDeals.reduce((s, d) => s + d.pqScore, 0) / stageDeals.length)
            : 0,
      });
    }
  }

  return { cells, reps, stages };
}

function cellColor(avgPQS: number, dealCount: number): string {
  if (dealCount === 0) return 'bg-muted/20';
  if (avgPQS >= 65) return 'bg-[hsl(var(--grade-a)/.15)]';
  if (avgPQS >= 50) return 'bg-[hsl(var(--grade-b)/.15)]';
  if (avgPQS >= 35) return 'bg-[hsl(var(--grade-c)/.15)]';
  return 'bg-[hsl(var(--grade-f)/.15)]';
}

function textColor(avgPQS: number): string {
  if (avgPQS >= 65) return 'text-[hsl(var(--grade-a))]';
  if (avgPQS >= 50) return 'text-[hsl(var(--grade-b))]';
  if (avgPQS >= 35) return 'text-[hsl(var(--grade-c))]';
  return 'text-[hsl(var(--grade-f))]';
}

export function TeamHeatmap() {
  const { cells, reps, stages } = useMemo(() => buildHeatmapData(pipelineDeals), []);

  const getCell = (rep: string, stage: string) =>
    cells.find((c) => c.rep === rep && c.stage === stage)!;

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="metric-label mb-4 flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <Grid3X3 className="w-3 h-3 text-primary" />
        </div>
        Team × Stage Heatmap
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium w-32">
                Rep
              </th>
              {stages.map((stage) => (
                <th
                  key={stage}
                  className="text-center p-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
                >
                  {stage}
                </th>
              ))}
              <th className="text-center p-2 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {reps.map((rep) => {
              const repDeals = pipelineDeals.filter((d) => d.rep === rep);
              const repAvgPQS =
                repDeals.length > 0
                  ? Math.round(repDeals.reduce((s, d) => s + d.pqScore, 0) / repDeals.length)
                  : 0;
              return (
                <tr key={rep} className="border-t border-border/20">
                  <td className="p-2 text-xs font-medium text-foreground truncate max-w-[120px]">
                    {rep}
                  </td>
                  {stages.map((stage) => {
                    const cell = getCell(rep, stage);
                    return (
                      <td key={stage} className="p-1">
                        <div
                          className={cn(
                            'rounded-md p-2 text-center transition-colors',
                            cellColor(cell.avgPQS, cell.dealCount)
                          )}
                        >
                          {cell.dealCount > 0 ? (
                            <>
                              <div
                                className={cn(
                                  'text-xs font-mono font-bold',
                                  textColor(cell.avgPQS)
                                )}
                              >
                                {cell.dealCount}
                              </div>
                              <div className="text-[9px] font-mono text-muted-foreground">
                                {fmt(cell.totalACV)}
                              </div>
                              <div className={cn('text-[8px] font-mono', textColor(cell.avgPQS))}>
                                PQS {cell.avgPQS}
                              </div>
                            </>
                          ) : (
                            <div className="text-[9px] text-muted-foreground/50">—</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-1">
                    <div className="rounded-md p-2 text-center bg-secondary/30">
                      <div className="text-xs font-mono font-bold text-foreground">
                        {repDeals.length}
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground">
                        {fmt(repDeals.reduce((s, d) => s + d.acv, 0))}
                      </div>
                      <div className={cn('text-[8px] font-mono', textColor(repAvgPQS))}>
                        PQS {repAvgPQS}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Stage totals */}
          <tfoot>
            <tr className="border-t border-border/50">
              <td className="p-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Total
              </td>
              {stages.map((stage) => {
                const stageDeals = pipelineDeals.filter((d) => d.stage === stage);
                return (
                  <td key={stage} className="p-2 text-center">
                    <div className="text-xs font-mono font-bold text-foreground">
                      {stageDeals.length}
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground">
                      {fmt(stageDeals.reduce((s, d) => s + d.acv, 0))}
                    </div>
                  </td>
                );
              })}
              <td className="p-2 text-center">
                <div className="text-xs font-mono font-bold text-foreground">
                  {pipelineDeals.length}
                </div>
                <div className="text-[9px] font-mono text-muted-foreground">
                  {fmt(pipelineDeals.reduce((s, d) => s + d.acv, 0))}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 justify-end">
        <span className="text-[9px] text-muted-foreground">Avg PQS:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[hsl(var(--grade-a)/.15)]" />
          <span className="text-[9px] text-muted-foreground">65+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[hsl(var(--grade-b)/.15)]" />
          <span className="text-[9px] text-muted-foreground">50-64</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[hsl(var(--grade-c)/.15)]" />
          <span className="text-[9px] text-muted-foreground">35-49</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[hsl(var(--grade-f)/.15)]" />
          <span className="text-[9px] text-muted-foreground">&lt;35</span>
        </div>
      </div>
    </div>
  );
}
