import { useMemo, useState } from 'react';
import { pipelineDeals, Deal } from '@/data/demo-data';
import {
  ICP_PROFILES,
  SALES_PLAYBOOK,
  BUYER_PERSONAS,
  type ICPProfile,
} from '@/data/evercam-context';
import {
  Fingerprint,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Term } from './Glossary';
import { fmt } from '@/lib/utils';

/** Match a deal to an ICP profile based on segment and ACV range */
function matchDealToICP(deal: Deal): ICPProfile | null {
  // Match by segment + ACV heuristic
  const segment = deal.segment;
  const acv = deal.acv;

  if (segment === 'Enterprise' && acv >= 200000) {
    // Large infra or property dev
    return deal.projectType?.includes('Data Center') || deal.projectType?.includes('Pharma')
      ? ICP_PROFILES.find((p) => p.id === 'ICP-TIER2-SPECIALITY') || ICP_PROFILES[0]
      : acv >= 400000
        ? ICP_PROFILES[0] // Tier 1 Infra
        : ICP_PROFILES[1]; // Tier 1 Property Dev
  }
  if (segment === 'Mid-Market') {
    return deal.projectType?.includes('Data Center') || deal.projectType?.includes('Pharma')
      ? ICP_PROFILES.find((p) => p.id === 'ICP-TIER2-SPECIALITY') || ICP_PROFILES[2]
      : ICP_PROFILES[2]; // Tier 2 General Contractor
  }
  if (segment === 'SMB') {
    return ICP_PROFILES[4]; // SMB Builder
  }
  // Fallback by ACV
  if (acv >= 200000) return ICP_PROFILES[0];
  if (acv >= 50000) return ICP_PROFILES[2];
  return ICP_PROFILES[4];
}

interface ICPGroupStats {
  profile: ICPProfile;
  deals: Deal[];
  totalACV: number;
  avgPQS: number;
  avgIcpScore: number;
  winProbAvg: number;
  atRisk: number;
  fitSignalMatches: number;
}

function computeICPStats(deals: Deal[]): ICPGroupStats[] {
  const groups = new Map<string, Deal[]>();

  for (const deal of deals) {
    const icp = matchDealToICP(deal);
    if (icp) {
      const existing = groups.get(icp.id) || [];
      existing.push(deal);
      groups.set(icp.id, existing);
    }
  }

  return ICP_PROFILES.map((profile) => {
    const profileDeals = groups.get(profile.id) || [];
    const totalACV = profileDeals.reduce((s, d) => s + d.acv, 0);
    const avgPQS =
      profileDeals.length > 0
        ? Math.round(profileDeals.reduce((s, d) => s + d.pqScore, 0) / profileDeals.length)
        : 0;
    const avgIcpScore =
      profileDeals.length > 0
        ? Math.round(profileDeals.reduce((s, d) => s + d.icpScore, 0) / profileDeals.length)
        : 0;
    const winProbAvg =
      profileDeals.length > 0
        ? Math.round(
            (profileDeals.reduce((s, d) => s + d.probabilities.win, 0) / profileDeals.length) * 100
          )
        : 0;

    return {
      profile,
      deals: profileDeals,
      totalACV,
      avgPQS,
      avgIcpScore,
      winProbAvg,
      atRisk: profileDeals.filter((d) => d.pqScore < 40).length,
      fitSignalMatches: Math.round(profile.fitWeight * 100),
    };
  });
}

function fitColor(weight: number): string {
  if (weight >= 0.9) return 'text-grade-a';
  if (weight >= 0.75) return 'text-grade-b';
  if (weight >= 0.6) return 'text-grade-c';
  return 'text-grade-d';
}

function fitBarColor(weight: number): string {
  if (weight >= 0.9) return 'bg-grade-a';
  if (weight >= 0.75) return 'bg-grade-b';
  if (weight >= 0.6) return 'bg-grade-c';
  return 'bg-grade-d';
}

export function ICPProfiler({ deals }: { deals?: Deal[] }) {
  const targetDeals = deals || pipelineDeals;
  const stats = useMemo(() => computeICPStats(targetDeals), [targetDeals]);

  const totalPipeline = targetDeals.reduce((s, d) => s + d.acv, 0);

  return (
    <div className="glass-card p-6 animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-primary" />
          <Term term="ICP Fit">ICP Profile Distribution</Term>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono font-bold text-foreground">{fmt(totalPipeline)}</div>
          <div className="text-[9px] font-mono text-muted-foreground">total pipeline</div>
        </div>
      </div>

      {/* Pipeline by ICP — visual bar chart */}
      <div className="space-y-1.5">
        {stats
          .filter((s) => s.deals.length > 0)
          .map((stat) => {
            const pipelinePct = totalPipeline > 0 ? (stat.totalACV / totalPipeline) * 100 : 0;
            return (
              <div key={stat.profile.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-40 truncate">
                  {stat.profile.name}
                </span>
                <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden relative">
                  <div
                    className={`h-full rounded ${fitBarColor(stat.profile.fitWeight)} opacity-60`}
                    style={{ width: `${pipelinePct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-mono font-bold text-foreground">
                    {fmt(stat.totalACV)} ({stat.deals.length})
                  </span>
                </div>
                <span
                  className={`text-xs font-mono font-bold w-8 text-right ${fitColor(stat.profile.fitWeight)}`}
                >
                  {Math.round(stat.profile.fitWeight * 100)}
                </span>
              </div>
            );
          })}
      </div>

      {/* ICP detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <ICPCard key={stat.profile.id} stat={stat} />
        ))}
      </div>

      {/* ICP Success Gap Analysis */}
      <ICPSuccessGapAnalysis stats={stats} />

      {/* Fit signals legend */}
      <div className="border-t border-border/30 pt-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
          ICP Fit Weight Guide
        </div>
        <div className="flex gap-4 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-grade-a" /> 90-100 (Tier 1)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-grade-b" /> 75-89 (Tier 2)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-grade-c" /> 60-74 (Mid)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-grade-d" /> &lt;60 (Low)
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ICP Success Gap Analysis — What winning deals have vs what's missing
// ---------------------------------------------------------------------------

interface SuccessGap {
  icpName: string;
  icpId: string;
  historicalWinRate: number;
  currentWinProbAvg: number;
  totalDeals: number;
  atRiskDeals: number;
  gapItems: {
    type: 'persona' | 'activity' | 'fit-signal';
    label: string;
    dealsAffected: number;
    pctAffected: number;
    severity: 'high' | 'medium' | 'low';
  }[];
}

function analyzeSuccessGaps(stats: ICPGroupStats[]): SuccessGap[] {
  return stats
    .filter((s) => s.deals.length > 0)
    .map((stat) => {
      const gapItems: SuccessGap['gapItems'] = [];

      // 1. Persona gaps — check which required personas are missing per stage
      const personaCounts: Record<string, number> = {};
      stat.deals.forEach((deal) => {
        const stagePlaybook = SALES_PLAYBOOK.find((s) => s.stage === deal.stage);
        if (!stagePlaybook) return;
        stagePlaybook.requiredPersonas.forEach((personaRole) => {
          const persona = BUYER_PERSONAS.find((p) => p.role === personaRole);
          if (
            persona &&
            deal.personaGaps.some(
              (g) => g.includes(personaRole) || g.includes(persona.title.split(' / ')[0])
            )
          ) {
            personaCounts[personaRole] = (personaCounts[personaRole] || 0) + 1;
          }
        });
      });

      Object.entries(personaCounts).forEach(([persona, count]) => {
        const pct = Math.round((count / stat.deals.length) * 100);
        if (pct >= 15) {
          gapItems.push({
            type: 'persona',
            label: `${persona} not engaged`,
            dealsAffected: count,
            pctAffected: pct,
            severity: pct >= 50 ? 'high' : pct >= 30 ? 'medium' : 'low',
          });
        }
      });

      // 2. Activity gaps — check missing steps against stage requirements
      const activityCounts: Record<string, number> = {};
      stat.deals.forEach((deal) => {
        deal.missingSteps.forEach((step) => {
          activityCounts[step] = (activityCounts[step] || 0) + 1;
        });
      });

      Object.entries(activityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([activity, count]) => {
          const pct = Math.round((count / stat.deals.length) * 100);
          if (pct >= 20) {
            gapItems.push({
              type: 'activity',
              label: activity,
              dealsAffected: count,
              pctAffected: pct,
              severity: pct >= 50 ? 'high' : pct >= 30 ? 'medium' : 'low',
            });
          }
        });

      // 3. Fit signal alignment — check deals against ICP disqualifiers
      const disqualifiedCount = stat.deals.filter((deal) => {
        // Low ICP score is a proxy for poor fit signal alignment
        return deal.icpScore < 40;
      }).length;

      if (disqualifiedCount > 0) {
        const pct = Math.round((disqualifiedCount / stat.deals.length) * 100);
        gapItems.push({
          type: 'fit-signal',
          label: `Low ICP fit score (<40)`,
          dealsAffected: disqualifiedCount,
          pctAffected: pct,
          severity: pct >= 40 ? 'high' : pct >= 20 ? 'medium' : 'low',
        });
      }

      // Sort by severity then pct
      gapItems.sort((a, b) => {
        const sev = { high: 0, medium: 1, low: 2 };
        return sev[a.severity] - sev[b.severity] || b.pctAffected - a.pctAffected;
      });

      return {
        icpName: stat.profile.name,
        icpId: stat.profile.id,
        historicalWinRate: stat.profile.historicalWinRate,
        currentWinProbAvg: stat.winProbAvg,
        totalDeals: stat.deals.length,
        atRiskDeals: stat.atRisk,
        gapItems,
      };
    })
    .filter((g) => g.gapItems.length > 0);
}

function ICPSuccessGapAnalysis({ stats }: { stats: ICPGroupStats[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const gaps = useMemo(() => analyzeSuccessGaps(stats), [stats]);

  if (gaps.length === 0) return null;

  const totalGaps = gaps.reduce(
    (s, g) => s + g.gapItems.filter((i) => i.severity === 'high').length,
    0
  );

  return (
    <div className="border-t border-border/30 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-grade-c" />
          <Term term="ICP Fit">ICP Success Gap Analysis</Term>
        </div>
        <div className="flex items-center gap-2">
          {totalGaps > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-grade-d/10 text-grade-d border border-grade-d/20">
              {totalGaps} critical gaps
            </span>
          )}
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground mb-2">
        Compares current deals against historical success patterns per ICP. Shows what winning deals
        typically have that your current pipeline is missing.
      </div>
      <div className="space-y-2">
        {gaps.map((gap) => {
          const isExpanded = expanded === gap.icpId;
          const winRateDelta = gap.currentWinProbAvg - Math.round(gap.historicalWinRate * 100);
          return (
            <div
              key={gap.icpId}
              className="rounded-lg border border-border/30 hover:border-border/50 transition-colors"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : gap.icpId)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-foreground">{gap.icpName}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {gap.totalDeals} deals · {gap.atRiskDeals} at risk
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[9px] text-muted-foreground">Win Rate vs Historical</div>
                    <div
                      className={`text-xs font-mono font-bold ${winRateDelta >= 0 ? 'text-grade-a' : 'text-grade-f'}`}
                    >
                      {gap.currentWinProbAvg}% vs {Math.round(gap.historicalWinRate * 100)}%
                      <span className="ml-1 text-[9px]">
                        ({winRateDelta >= 0 ? '+' : ''}
                        {winRateDelta}pp)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {gap.gapItems.filter((i) => i.severity === 'high').length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-grade-f" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-border/20 pt-2">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                    What winning deals have that yours are missing
                  </div>
                  {gap.gapItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.severity === 'high'
                              ? 'bg-grade-f'
                              : item.severity === 'medium'
                                ? 'bg-grade-d'
                                : 'bg-grade-c'
                          }`}
                        />
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${
                            item.type === 'persona'
                              ? 'bg-primary/10 text-primary'
                              : item.type === 'activity'
                                ? 'bg-grade-b/10 text-grade-b'
                                : 'bg-grade-c/10 text-grade-c'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-foreground">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-mono">
                        <span>{item.dealsAffected} deals</span>
                        <span
                          className={`font-bold ${
                            item.severity === 'high'
                              ? 'text-grade-f'
                              : item.severity === 'medium'
                                ? 'text-grade-d'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {item.pctAffected}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ICPCard({ stat }: { stat: ICPGroupStats }) {
  const p = stat.profile;
  return (
    <div className="rounded-lg border border-border/30 p-3 hover:border-border/50 transition-colors space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-foreground">{p.name}</div>
          <div className="text-[9px] font-mono text-muted-foreground">
            {p.segment} · {p.industry}
          </div>
        </div>
        <div className={`text-lg font-mono font-bold ${fitColor(p.fitWeight)}`}>
          {Math.round(p.fitWeight * 100)}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{stat.deals.length}</div>
          <div className="text-[8px] text-muted-foreground">deals</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{fmt(stat.totalACV)}</div>
          <div className="text-[8px] text-muted-foreground">pipeline</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-mono font-bold text-foreground">{stat.winProbAvg}%</div>
          <div className="text-[8px] text-muted-foreground">win prob</div>
        </div>
      </div>

      {/* Historical win rate */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">Historical Win Rate</span>
        <span className="font-mono font-bold text-foreground">
          {Math.round(p.historicalWinRate * 100)}%
        </span>
      </div>

      {/* Fit signals */}
      <div className="flex flex-wrap gap-1">
        {p.fitSignals.slice(0, 2).map((s) => (
          <span
            key={s}
            className="text-[8px] px-1.5 py-0.5 rounded bg-[hsl(var(--grade-a)/.06)] text-grade-a truncate max-w-full"
          >
            <CheckCircle className="w-2 h-2 inline mr-0.5" />
            {s.length > 40 ? s.slice(0, 40) + '…' : s}
          </span>
        ))}
      </div>

      {/* Disqualifiers */}
      {p.disqualifiers.length > 0 && stat.deals.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.disqualifiers.slice(0, 1).map((d) => (
            <span
              key={d}
              className="text-[8px] px-1.5 py-0.5 rounded bg-[hsl(var(--grade-d)/.06)] text-grade-d truncate max-w-full"
            >
              <AlertTriangle className="w-2 h-2 inline mr-0.5" />
              {d.length > 40 ? d.slice(0, 40) + '…' : d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
