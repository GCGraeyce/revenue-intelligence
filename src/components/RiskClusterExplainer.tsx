import { useState } from 'react';
import { Deal } from '@/data/demo-data';
import { GradeBadge } from '@/components/GradeBadge';
import { useRole } from '@/contexts/RoleContext';
import { cn, fmt } from '@/lib/utils';
import { AlertTriangle, ChevronDown, ChevronRight, Settings } from 'lucide-react';

/* ─── Types ─── */
interface ClusterRule {
  field: string;
  operator: string;
  value: string;
}

interface ClusterDef {
  name: string;
  deals: Deal[];
  color: string;
  bg: string;
  rules: ClusterRule[];
  historicalImpact: string;
}

/* ─── Rule Badge ─── */
function RuleBadge({ rule }: { rule: ClusterRule }) {
  return (
    <span className="inline-flex items-center text-[10px] font-mono px-2 py-1 rounded-md bg-secondary/80 text-foreground border border-border/30">
      {rule.field} {rule.operator} {rule.value}
    </span>
  );
}

function AndConnector() {
  return <span className="text-[9px] font-mono font-bold text-primary px-1">AND</span>;
}

/* ─── Cluster Row ─── */
function ClusterRow({ cluster }: { cluster: ClusterDef }) {
  const [expanded, setExpanded] = useState(false);
  const { role } = useRole();
  const preview = cluster.deals.sort((a, b) => b.acv - a.acv).slice(0, 3);

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg transition-colors hover:opacity-80 cursor-pointer',
          cluster.bg,
          expanded && 'rounded-b-none'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          <div>
            <div className={`text-sm font-semibold ${cluster.color}`}>{cluster.name}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {cluster.deals.length} deals · {fmt(cluster.deals.reduce((s, d) => s + d.acv, 0))}
            </div>
          </div>
        </div>
        <span
          className={`text-sm font-mono font-bold ${cluster.color} bg-card px-2.5 py-1 rounded-lg shadow-sm border border-border/40`}
        >
          {cluster.deals.length}
        </span>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div
          className={cn(
            'px-4 pb-4 pt-3 rounded-b-lg border-t border-border/20 animate-fade-in space-y-3',
            cluster.bg
          )}
        >
          {/* Membership Rules */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
              Membership Rules
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {cluster.rules.map((rule, i) => (
                <span key={i} className="flex items-center gap-1">
                  <RuleBadge rule={rule} />
                  {i < cluster.rules.length - 1 && <AndConnector />}
                </span>
              ))}
            </div>
          </div>

          {/* Historical Impact */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
              Historical Impact
            </div>
            <div className="text-xs text-foreground font-mono">{cluster.historicalImpact}</div>
          </div>

          {/* Deal list preview */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
              Top Deals
            </div>
            <div className="space-y-1">
              {preview.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-card/50 border border-border/20"
                >
                  <GradeBadge grade={d.grade} />
                  <span className="text-xs text-foreground font-medium flex-1 truncate">
                    {d.company}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{fmt(d.acv)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RevOps edit button */}
          {role === 'revops' && (
            <button
              disabled
              className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground px-3 py-1.5 rounded-lg border border-border/40 bg-card/50 opacity-50 cursor-not-allowed"
            >
              <Settings className="w-3 h-3" />
              Edit Rules (Coming Soon)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export function RiskClusterExplainer({ deals }: { deals: Deal[] }) {
  const singleThreaded = deals.filter(
    (d) => d.segment === 'Enterprise' && d.personaGaps.length >= 2
  );
  const postProposalStalls = deals.filter((d) => d.stage === 'Proposal' && d.daysInStage > 20);
  const weakICP = deals.filter((d) => d.icpScore < 40 && d.source === 'Outbound');
  const priceRisk = deals.filter((d) => d.priceRisk > 0.7);

  const clusters: ClusterDef[] = [
    {
      name: 'Single-Stakeholder Enterprise',
      deals: singleThreaded,
      color: 'text-grade-f',
      bg: 'bg-[hsl(var(--grade-f)/.06)]',
      rules: [
        { field: 'segment', operator: '=', value: 'Enterprise' },
        { field: 'personaGaps', operator: '>=', value: '2' },
      ],
      historicalImpact:
        'Deals with only one buyer contact close 31% slower and are 2.4x more likely to be lost',
    },
    {
      name: 'Stalled After Proposal',
      deals: postProposalStalls,
      color: 'text-grade-d',
      bg: 'bg-[hsl(var(--grade-d)/.06)]',
      rules: [
        { field: 'stage', operator: '=', value: 'Proposal' },
        { field: 'daysInStage', operator: '>', value: '20' },
      ],
      historicalImpact: '45% of deals that stall after proposal end in no-decision',
    },
    {
      name: 'Low-Fit Outbound Prospects',
      deals: weakICP,
      color: 'text-grade-c',
      bg: 'bg-[hsl(var(--grade-c)/.06)]',
      rules: [
        { field: 'icpScore', operator: '<', value: '40' },
        { field: 'source', operator: '=', value: 'Outbound' },
      ],
      historicalImpact: 'Low-fit outbound deals close at 12% vs 34% for on-profile deals',
    },
    {
      name: 'Discount Risk Deals',
      deals: priceRisk,
      color: 'text-grade-d',
      bg: 'bg-[hsl(var(--grade-d)/.06)]',
      rules: [{ field: 'priceRisk', operator: '>', value: '0.7' }],
      historicalImpact: 'Deals with pricing pressure average 22% deeper discounts',
    },
  ];

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="metric-label mb-4 flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-3 h-3 text-destructive" />
        </div>
        Risk Clusters
      </div>
      <div className="space-y-2">
        {clusters.map((c) => (
          <ClusterRow key={c.name} cluster={c} />
        ))}
      </div>
    </div>
  );
}
