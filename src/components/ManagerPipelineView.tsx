import { useMemo, useState } from 'react';
import {
  pipelineDeals,
  SALES_MANAGERS,
  getManagerTargetSummary,
  generateTargetRecommendations,
  type ManagerTargetSummary,
  type Grade,
} from '@/data/demo-data';
import { useSalesTargets } from '@/contexts/SalesTargetContext';
import { GradeBadge } from './GradeBadge';
import { Target, ChevronDown, ChevronRight, Lightbulb, Users } from 'lucide-react';
import { fmt } from '@/lib/utils';

function scoreToGrade(s: number): Grade {
  if (s >= 80) return 'A';
  if (s >= 65) return 'B';
  if (s >= 50) return 'C';
  if (s >= 35) return 'D';
  return 'F';
}

function attainmentColor(pct: number): string {
  if (pct >= 90) return 'text-grade-a';
  if (pct >= 70) return 'text-grade-b';
  if (pct >= 50) return 'text-grade-c';
  if (pct >= 30) return 'text-grade-d';
  return 'text-grade-f';
}

function attainmentBarColor(pct: number): string {
  if (pct >= 90) return 'bg-grade-a';
  if (pct >= 70) return 'bg-grade-b';
  if (pct >= 50) return 'bg-grade-c';
  if (pct >= 30) return 'bg-grade-d';
  return 'bg-grade-f';
}

export function ManagerPipelineView() {
  const { targets } = useSalesTargets();

  const managerSummaries = useMemo(
    () =>
      SALES_MANAGERS.map((mgr) => ({
        summary: getManagerTargetSummary(pipelineDeals, mgr, targets),
        recommendations: [] as string[],
      })).map((item) => ({
        ...item,
        recommendations: generateTargetRecommendations(pipelineDeals, item.summary),
      })),
    [targets]
  );

  // Org-wide totals
  const orgWeighted = managerSummaries.reduce((s, m) => s + m.summary.weightedPipeline, 0);
  const orgTarget = managerSummaries.reduce((s, m) => s + m.summary.teamTarget, 0);
  const orgAttainment = orgTarget > 0 ? Math.round((orgWeighted / orgTarget) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Org-wide summary bar */}
      <div className="glass-card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="metric-label flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Organisation Target Attainment
          </div>
          <div className="text-right">
            <div className={`text-2xl font-mono font-bold ${attainmentColor(orgAttainment)}`}>
              {orgAttainment}%
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              {fmt(orgWeighted)} of {fmt(orgTarget)}
            </div>
          </div>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${attainmentBarColor(orgAttainment)}`}
            style={{ width: `${Math.min(100, orgAttainment)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-mono text-muted-foreground">0%</span>
          <span className="text-[10px] font-mono text-muted-foreground">50%</span>
          <span className="text-[10px] font-mono text-muted-foreground">100%</span>
        </div>
      </div>

      {/* Per-manager cards */}
      {managerSummaries.map(({ summary, recommendations }) => (
        <ManagerCard key={summary.manager.id} summary={summary} recommendations={recommendations} />
      ))}
    </div>
  );
}

function ManagerCard({
  summary,
  recommendations,
}: {
  summary: ManagerTargetSummary;
  recommendations: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Manager header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{summary.manager.name}</div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {summary.manager.title} · {summary.manager.team.length} reps · {summary.totalDeals}{' '}
            deals
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div
              className={`text-lg font-mono font-bold ${attainmentColor(summary.attainmentPct)}`}
            >
              {summary.attainmentPct}%
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">attainment</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono font-bold text-foreground">
              {fmt(summary.weightedPipeline)}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              of {fmt(summary.teamTarget)}
            </div>
          </div>
          {summary.gap > 0 && (
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-grade-d">{fmt(summary.gap)}</div>
              <div className="text-[10px] font-mono text-muted-foreground">gap</div>
            </div>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Attainment bar */}
      <div className="px-5 pb-3">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${attainmentBarColor(summary.attainmentPct)}`}
            style={{ width: `${Math.min(100, summary.attainmentPct)}%` }}
          />
        </div>
      </div>

      {/* Expanded: Rep breakdown + recommendations */}
      {expanded && (
        <div className="border-t border-border/30">
          {/* Rep table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  {[
                    'Rep',
                    'Deals',
                    'Pipeline',
                    'Weighted',
                    'Target',
                    'Attainment',
                    'Gap',
                    'PQS',
                    'At Risk',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.repSummaries.map((r, i) => (
                  <tr
                    key={r.rep}
                    className={`border-b border-border/20 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                  >
                    <td className="p-3 font-medium text-foreground">{r.rep}</td>
                    <td className="p-3 data-cell">{r.dealCount}</td>
                    <td className="p-3 data-cell">{fmt(r.totalACV)}</td>
                    <td className="p-3 data-cell font-semibold">{fmt(r.weightedPipeline)}</td>
                    <td className="p-3 data-cell text-muted-foreground">{fmt(r.target)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${attainmentBarColor(r.attainmentPct)}`}
                            style={{ width: `${Math.min(100, r.attainmentPct)}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-mono font-bold ${attainmentColor(r.attainmentPct)}`}
                        >
                          {r.attainmentPct}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {r.gap > 0 ? (
                        <span className="text-xs font-mono text-grade-d">{fmt(r.gap)}</span>
                      ) : (
                        <span className="text-xs font-mono text-grade-a">On track</span>
                      )}
                    </td>
                    <td className="p-3">
                      <GradeBadge grade={scoreToGrade(r.avgPQS)} />
                    </td>
                    <td className="p-3">
                      {r.atRisk > 0 && (
                        <span className="text-xs font-mono font-bold text-grade-d bg-[hsl(var(--grade-d)/.08)] px-1.5 py-0.5 rounded-full">
                          {r.atRisk}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stage distribution mini-chart per rep */}
          <div className="p-5 border-t border-border/30">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
              Stage Distribution
            </div>
            <div className="space-y-2">
              {summary.repSummaries.map((r) => {
                const total = Object.values(r.byStage).reduce((s, n) => s + n, 0) || 1;
                return (
                  <div key={r.rep} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 truncate">{r.rep}</span>
                    <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-muted/30">
                      {['Discovery', 'Qualification', 'Proposal', 'Negotiation'].map((stage, i) => {
                        const count = r.byStage[stage] || 0;
                        const pct = (count / total) * 100;
                        const colors = [
                          'bg-grade-d/60',
                          'bg-grade-c/60',
                          'bg-primary/60',
                          'bg-grade-a/60',
                        ];
                        return pct > 0 ? (
                          <div
                            key={stage}
                            className={`h-full ${colors[i]}`}
                            style={{ width: `${pct}%` }}
                          />
                        ) : null;
                      })}
                    </div>
                    <div className="flex gap-1 text-[9px] font-mono text-muted-foreground w-24 justify-end">
                      <span>{r.byStage.Discovery || 0}D</span>
                      <span>{r.byStage.Qualification || 0}Q</span>
                      <span>{r.byStage.Proposal || 0}P</span>
                      <span>{r.byStage.Negotiation || 0}N</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-2 justify-end">
              {[
                { label: 'Discovery', color: 'bg-grade-d/60' },
                { label: 'Qualification', color: 'bg-grade-c/60' },
                { label: 'Proposal', color: 'bg-primary/60' },
                { label: 'Negotiation', color: 'bg-grade-a/60' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-sm ${l.color}`} />
                  <span className="text-[9px] text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-5 border-t border-border/30 bg-primary/[0.02]">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                  AI Recommendations to Hit Target
                </span>
              </div>
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-foreground leading-relaxed p-2.5 rounded-lg bg-card/50 border border-border/20"
                  >
                    <span className="text-[10px] font-mono text-primary font-bold mt-0.5 flex-shrink-0">
                      {i + 1}.
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
