import { useMemo, useState } from 'react';
import { pipelineDeals, SALES_MANAGERS, DEFAULT_REP_TARGETS, type Deal } from '@/data/demo-data';
import { useSalesTargets } from '@/contexts/SalesTargetContext';
import { DealDrawer } from './DealDrawer';
import { cn, fmt } from '@/lib/utils';
import { Users, MessageSquare, Calendar } from 'lucide-react';

interface RepCoachingBrief {
  rep: string;
  deals: Deal[];
  totalACV: number;
  weightedPipeline: number;
  target: number;
  attainmentPct: number;
  gap: number;
  avgPQS: number;
  atRiskDeals: Deal[];
  stalledDeals: Deal[];
  closeable: Deal[];
  ebGapDeals: Deal[];
  talkingPoints: string[];
  priority: 'high' | 'medium' | 'low';
}

function buildCoachingBrief(rep: string, deals: Deal[], target: number): RepCoachingBrief {
  const repDeals = deals.filter((d) => d.rep === rep);
  const totalACV = repDeals.reduce((s, d) => s + d.acv, 0);
  const weightedPipeline = repDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const attainmentPct = target > 0 ? Math.round((weightedPipeline / target) * 100) : 0;
  const avgPQS =
    repDeals.length > 0
      ? Math.round(repDeals.reduce((s, d) => s + d.pqScore, 0) / repDeals.length)
      : 0;
  const atRiskDeals = repDeals.filter((d) => d.pqScore < 40).sort((a, b) => b.acv - a.acv);
  const stalledDeals = repDeals.filter((d) => d.daysInStage > 20).sort((a, b) => b.acv - a.acv);
  const closeable = repDeals
    .filter((d) => d.stage === 'Negotiation' && d.probabilities.win > 0.4)
    .sort((a, b) => b.acv - a.acv);
  const ebGapDeals = repDeals.filter(
    (d) =>
      (d.stage === 'Proposal' || d.stage === 'Negotiation') &&
      d.personaGaps.some((g) => g.includes('Economic Buyer'))
  );

  const talkingPoints: string[] = [];

  if (closeable.length > 0) {
    talkingPoints.push(
      `${closeable.length} deals ready to close (${fmt(closeable.reduce((s, d) => s + d.acv, 0))}). What's needed to get commitment this week?`
    );
  }

  if (atRiskDeals.length > 0) {
    const top = atRiskDeals[0];
    talkingPoints.push(
      `${top.company} (${fmt(top.acv)}) is at-risk with PQS ${top.pqScore}. What's blocking progress? ${top.personaGaps.length > 0 ? `Missing: ${top.personaGaps[0]}.` : ''}`
    );
  }

  if (ebGapDeals.length > 0) {
    talkingPoints.push(
      `${ebGapDeals.length} late-stage deals missing Economic Buyer. Can we map a path to CFO meetings this week?`
    );
  }

  if (stalledDeals.length > 2) {
    talkingPoints.push(
      `${stalledDeals.length} deals stalled 20+ days. Let's triage: which do we double-down on vs. disqualify?`
    );
  }

  if (attainmentPct < 60) {
    talkingPoints.push(
      `At ${attainmentPct}% attainment — what deals could move to Proposal this month to close the gap?`
    );
  } else if (attainmentPct > 100) {
    talkingPoints.push(
      `Strong position at ${attainmentPct}% attainment. Let's discuss expansion opportunities and skill development.`
    );
  }

  const pipeline = repDeals.filter((d) => d.stage === 'Discovery' || d.stage === 'Qualification');
  if (pipeline.length < 5) {
    talkingPoints.push(
      `Only ${pipeline.length} early-stage deals. Need more pipeline generation — review outbound strategy.`
    );
  }

  const priority =
    attainmentPct < 50 || atRiskDeals.length > 5
      ? 'high'
      : attainmentPct < 80 || atRiskDeals.length > 2
        ? 'medium'
        : 'low';

  return {
    rep,
    deals: repDeals,
    totalACV,
    weightedPipeline,
    target,
    attainmentPct,
    gap: Math.round(target - weightedPipeline),
    avgPQS,
    atRiskDeals,
    stalledDeals,
    closeable,
    ebGapDeals,
    talkingPoints,
    priority,
  };
}

function RepBriefCard({
  brief,
  onSelectDeal,
}: {
  brief: RepCoachingBrief;
  onSelectDeal: (deal: Deal) => void;
}) {
  const priorityColor =
    brief.priority === 'high' ? 'grade-f' : brief.priority === 'medium' ? 'grade-c' : 'grade-a';
  const attColor =
    brief.attainmentPct >= 80 ? 'grade-a' : brief.attainmentPct >= 50 ? 'grade-c' : 'grade-f';

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{brief.rep}</div>
            <div className="text-[10px] font-mono text-muted-foreground">
              {brief.deals.length} deals · {fmt(brief.totalACV)} pipeline
            </div>
          </div>
        </div>
        <span
          className={cn(
            'text-[9px] font-mono px-2 py-0.5 rounded',
            `bg-[hsl(var(--${priorityColor})/.1)] text-[hsl(var(--${priorityColor}))]`
          )}
        >
          {brief.priority.toUpperCase()} PRIORITY
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <div className={cn('text-lg font-mono font-bold', `text-[hsl(var(--${attColor}))]`)}>
            {brief.attainmentPct}%
          </div>
          <div className="text-[9px] text-muted-foreground">Attainment</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-mono font-bold text-foreground">{brief.avgPQS}</div>
          <div className="text-[9px] text-muted-foreground">Avg PQS</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-mono font-bold text-foreground">
            {brief.closeable.length}
          </div>
          <div className="text-[9px] text-muted-foreground">Closeable</div>
        </div>
        <div className="text-center">
          <div
            className={cn(
              'text-lg font-mono font-bold',
              brief.atRiskDeals.length > 3 ? 'text-[hsl(var(--grade-f))]' : 'text-foreground'
            )}
          >
            {brief.atRiskDeals.length}
          </div>
          <div className="text-[9px] text-muted-foreground">At Risk</div>
        </div>
      </div>

      {/* Attainment bar */}
      <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden mb-3">
        <div
          className={cn('h-full rounded-full', `bg-[hsl(var(--${attColor}))]`)}
          style={{ width: `${Math.min(brief.attainmentPct, 100)}%` }}
        />
      </div>

      {/* Talking Points */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          Talking Points
        </div>
        {brief.talkingPoints.slice(0, 4).map((point, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-[11px] text-foreground leading-relaxed"
          >
            <span className="text-primary/60 font-mono flex-shrink-0">{i + 1}.</span>
            <span>{point}</span>
          </div>
        ))}
      </div>

      {/* Key deals to discuss */}
      {(brief.closeable.length > 0 || brief.atRiskDeals.length > 0) && (
        <div className="mt-3 pt-3 border-t border-border/20">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
            Deals to Discuss
          </div>
          <div className="space-y-1">
            {[...brief.closeable.slice(0, 2), ...brief.atRiskDeals.slice(0, 2)]
              .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i)
              .slice(0, 3)
              .map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between text-[11px] cursor-pointer hover:bg-muted/30 rounded p-1 -mx-1 transition-colors"
                  onClick={() => onSelectDeal(deal)}
                >
                  <span className="text-foreground truncate">{deal.company}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-muted-foreground">{fmt(deal.acv)}</span>
                    <span
                      className={cn(
                        'font-mono text-[10px] px-1 rounded',
                        deal.pqScore >= 65
                          ? 'text-[hsl(var(--grade-a))]'
                          : deal.pqScore >= 40
                            ? 'text-[hsl(var(--grade-c))]'
                            : 'text-[hsl(var(--grade-f))]'
                      )}
                    >
                      PQS {deal.pqScore}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OneOnOnePrep({ managerId }: { managerId?: string }) {
  const { targets } = useSalesTargets();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const briefs = useMemo(() => {
    const managers = managerId ? SALES_MANAGERS.filter((m) => m.id === managerId) : SALES_MANAGERS;

    const allBriefs: RepCoachingBrief[] = [];
    for (const mgr of managers) {
      for (const rep of mgr.team) {
        const target = targets[rep] || DEFAULT_REP_TARGETS[rep] || 0;
        allBriefs.push(buildCoachingBrief(rep, pipelineDeals, target));
      }
    }

    return allBriefs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.attainmentPct - b.attainmentPct;
    });
  }, [managerId, targets]);

  const highPriority = briefs.filter((b) => b.priority === 'high').length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            1:1 Meeting Prep
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-muted-foreground">{briefs.length} reps</span>
          {highPriority > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-[hsl(var(--grade-f)/.1)] text-[hsl(var(--grade-f))]">
              {highPriority} high priority
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {briefs.map((brief) => (
          <RepBriefCard key={brief.rep} brief={brief} onSelectDeal={setSelectedDeal} />
        ))}
      </div>

      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
