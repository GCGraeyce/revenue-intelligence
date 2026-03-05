import { useMemo } from 'react';
import { pipelineDeals, Deal } from '@/data/demo-data';
import { BUYER_PERSONAS, type BuyerPersona } from '@/data/evercam-context';
import { Users, AlertTriangle } from 'lucide-react';
import { Term } from './Glossary';
import { fmt } from '@/lib/utils';

interface PersonaStats {
  persona: BuyerPersona;
  coveredDeals: number;
  gappedDeals: number;
  gappedACV: number;
  coveragePct: number;
  stageBreakdown: Record<string, { covered: number; gapped: number }>;
}

function computePersonaStats(deals: Deal[]): PersonaStats[] {
  return BUYER_PERSONAS.map((persona) => {
    const gappedDeals = deals.filter((d) => d.personaGaps.some((g) => g.includes(persona.role)));
    const coveredDeals = deals.length - gappedDeals.length;
    const gappedACV = gappedDeals.reduce((s, d) => s + d.acv, 0);

    const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
    const stageBreakdown: Record<string, { covered: number; gapped: number }> = {};
    for (const stage of stages) {
      const stageDeals = deals.filter((d) => d.stage === stage);
      const stageGapped = stageDeals.filter((d) =>
        d.personaGaps.some((g) => g.includes(persona.role))
      ).length;
      stageBreakdown[stage] = {
        covered: stageDeals.length - stageGapped,
        gapped: stageGapped,
      };
    }

    return {
      persona,
      coveredDeals,
      gappedDeals: gappedDeals.length,
      gappedACV,
      coveragePct: deals.length > 0 ? Math.round((coveredDeals / deals.length) * 100) : 0,
      stageBreakdown,
    };
  });
}

function coverageColor(pct: number): string {
  if (pct >= 80) return 'text-grade-a';
  if (pct >= 60) return 'text-grade-b';
  if (pct >= 40) return 'text-grade-c';
  return 'text-grade-f';
}

function coverageBarColor(pct: number): string {
  if (pct >= 80) return 'bg-grade-a';
  if (pct >= 60) return 'bg-grade-b';
  if (pct >= 40) return 'bg-grade-c';
  return 'bg-grade-f';
}

export function PersonaCoverage({ deals }: { deals?: Deal[] }) {
  const targetDeals = deals || pipelineDeals;
  const stats = useMemo(() => computePersonaStats(targetDeals), [targetDeals]);

  const totalGappedACV = stats.reduce((s, st) => s + st.gappedACV, 0);
  const avgCoverage =
    stats.length > 0
      ? Math.round(stats.reduce((s, st) => s + st.coveragePct, 0) / stats.length)
      : 0;

  return (
    <div className="glass-card p-6 animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <Term term="Persona Coverage">Buying Committee Coverage</Term>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className={`text-lg font-mono font-bold ${coverageColor(avgCoverage)}`}>
              {avgCoverage}%
            </div>
            <div className="text-[9px] font-mono text-muted-foreground">avg coverage</div>
          </div>
          <div>
            <div className="text-lg font-mono font-bold text-grade-d">{fmt(totalGappedACV)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">at-risk ACV</div>
          </div>
        </div>
      </div>

      {/* Persona cards */}
      <div className="space-y-3">
        {stats.map((stat) => (
          <PersonaRow key={stat.persona.id} stat={stat} />
        ))}
      </div>

      {/* Stage heatmap */}
      <div className="border-t border-border/30 pt-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          Coverage by Stage
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="text-left py-1 pr-2 text-muted-foreground font-medium w-32">
                  Persona
                </th>
                {['Discovery', 'Qualification', 'Proposal', 'Negotiation'].map((s) => (
                  <th key={s} className="text-center py-1 px-2 text-muted-foreground font-medium">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.persona.id} className="border-t border-border/10">
                  <td className="py-1.5 pr-2 text-xs text-foreground font-medium truncate">
                    {stat.persona.role}
                  </td>
                  {['Discovery', 'Qualification', 'Proposal', 'Negotiation'].map((stage) => {
                    const data = stat.stageBreakdown[stage];
                    const total = data.covered + data.gapped;
                    const pct = total > 0 ? Math.round((data.covered / total) * 100) : 100;
                    const isRequired = stat.persona.activeStages.includes(stage);
                    return (
                      <td key={stage} className="text-center py-1.5 px-2">
                        <div
                          className={`inline-flex items-center justify-center w-10 h-6 rounded text-[10px] font-mono font-bold ${
                            !isRequired
                              ? 'bg-muted/20 text-muted-foreground/40'
                              : pct >= 80
                                ? 'bg-[hsl(var(--grade-a)/.1)] text-grade-a'
                                : pct >= 50
                                  ? 'bg-[hsl(var(--grade-c)/.1)] text-grade-c'
                                  : 'bg-[hsl(var(--grade-f)/.1)] text-grade-f'
                          }`}
                        >
                          {isRequired ? `${pct}%` : '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-2 justify-end text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-grade-a/60" /> ≥80%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-grade-c/60" /> 50-79%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-grade-f/60" /> &lt;50%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-muted/40" /> Not required
          </span>
        </div>
      </div>
    </div>
  );
}

function PersonaRow({ stat }: { stat: PersonaStats }) {
  return (
    <div className="rounded-lg border border-border/30 p-3 hover:border-border/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
              stat.persona.importance >= 5
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {stat.persona.importance}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{stat.persona.role}</div>
            <div className="text-[10px] font-mono text-muted-foreground">{stat.persona.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-sm font-mono font-bold ${coverageColor(stat.coveragePct)}`}>
              {stat.coveragePct}%
            </div>
            <div className="text-[9px] font-mono text-muted-foreground">covered</div>
          </div>
          {stat.gappedDeals > 0 && (
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-grade-d flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stat.gappedDeals}
              </div>
              <div className="text-[9px] font-mono text-muted-foreground">gaps</div>
            </div>
          )}
        </div>
      </div>
      {/* Coverage bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${coverageBarColor(stat.coveragePct)}`}
          style={{ width: `${stat.coveragePct}%` }}
        />
      </div>
      {/* Key priorities */}
      <div className="flex flex-wrap gap-1 mt-2">
        {stat.persona.priorities.slice(0, 2).map((p) => (
          <span
            key={p}
            className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground truncate max-w-[200px]"
          >
            {p}
          </span>
        ))}
        {stat.gappedACV > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(var(--grade-d)/.08)] text-grade-d font-mono">
            {fmt(stat.gappedACV)} at risk
          </span>
        )}
      </div>
    </div>
  );
}
