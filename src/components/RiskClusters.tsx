import { useState } from 'react';
import { Deal } from '@/data/demo-data';
import { DealDrawer } from './DealDrawer';
import { GradeBadge } from './GradeBadge';
import { cn, fmt } from '@/lib/utils';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface ClusterDef {
  name: string;
  description: string;
  deals: Deal[];
  color: string;
  bg: string;
}

export function RiskClusters({ deals }: { deals: Deal[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const singleThreaded = deals.filter(
    (d) => d.segment === 'Enterprise' && d.personaGaps.length >= 2
  );
  const postProposalStalls = deals.filter((d) => d.stage === 'Proposal' && d.daysInStage > 20);
  const weakICP = deals.filter((d) => d.icpScore < 40 && d.source === 'Outbound');
  const priceRisk = deals.filter((d) => d.priceRisk > 0.7);

  const clusters: ClusterDef[] = [
    {
      name: 'Single-Stakeholder Enterprise',
      description:
        'Enterprise deals with only one buyer contact — high risk of stalling without multi-threading',
      deals: singleThreaded,
      color: 'text-grade-f',
      bg: 'bg-[hsl(var(--grade-f)/.06)]',
    },
    {
      name: 'Stalled After Proposal',
      description:
        'Deals stuck 20+ days at Proposal stage — likely missing Economic Buyer or ROI case',
      deals: postProposalStalls,
      color: 'text-grade-d',
      bg: 'bg-[hsl(var(--grade-d)/.06)]',
    },
    {
      name: 'Low-Fit Outbound Prospects',
      description:
        'Cold outreach to companies with low ICP fit — consider re-qualifying or deprioritising',
      deals: weakICP,
      color: 'text-grade-c',
      bg: 'bg-[hsl(var(--grade-c)/.06)]',
    },
    {
      name: 'Discount Risk Deals',
      description:
        'Deals with 70%+ probability of price negotiation — protect margins with value-based selling',
      deals: priceRisk,
      color: 'text-grade-d',
      bg: 'bg-[hsl(var(--grade-d)/.06)]',
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
        {clusters.map((c, idx) => (
          <div key={c.name} className="rounded-lg overflow-hidden">
            <div
              className={cn(
                'flex items-center justify-between p-3 cursor-pointer transition-colors hover:opacity-80',
                c.bg
              )}
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            >
              <div className="flex-1">
                <div className={`text-sm font-semibold ${c.color}`}>{c.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{c.description}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {c.deals.length} deals · {fmt(c.deals.reduce((s, d) => s + d.acv, 0))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-sm font-mono font-bold ${c.color} bg-card px-2.5 py-1 rounded-lg shadow-sm border border-border/40`}
                >
                  {c.deals.length}
                </span>
                {expandedIdx === idx ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {expandedIdx === idx && c.deals.length > 0 && (
              <div className="border-t border-border/20 bg-secondary/20 p-2 space-y-1 animate-fade-in">
                {c.deals.slice(0, 8).map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDeal(deal);
                    }}
                  >
                    <GradeBadge grade={deal.grade} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {deal.company}
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground">
                        {deal.rep} · {deal.stage} · {deal.daysInStage}d
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono font-bold text-foreground">
                        {fmt(deal.acv)}
                      </div>
                      <div
                        className={cn(
                          'text-[9px] font-mono',
                          deal.pqScore >= 50
                            ? 'text-[hsl(var(--grade-c))]'
                            : 'text-[hsl(var(--grade-f))]'
                        )}
                      >
                        PQS {deal.pqScore}
                      </div>
                    </div>
                  </div>
                ))}
                {c.deals.length > 8 && (
                  <div className="text-[10px] text-muted-foreground text-center py-1 font-mono">
                    +{c.deals.length - 8} more deals
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
