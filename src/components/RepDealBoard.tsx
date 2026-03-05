import { useState, useMemo } from 'react';
import { Deal } from '@/data/demo-data';
import { GradeBadge } from '@/components/GradeBadge';
import { DealDrawer } from '@/components/DealDrawer';
import { AlertTriangle, Clock, TrendingUp, ChevronRight, Calendar, Users, Zap } from 'lucide-react';
import { fmt } from '@/lib/utils';

type DealBucket = 'attention' | 'closing' | 'healthy' | 'early';

interface BucketedDeal {
  deal: Deal;
  bucket: DealBucket;
  signal: string;
}

function bucketDeals(deals: Deal[]): BucketedDeal[] {
  return deals
    .map((deal): BucketedDeal => {
      // At risk (PQS < 40) or stalled (>14 days in stage for late stages)
      const isAtRisk = deal.pqScore < 40;
      const isStalled =
        (deal.stage === 'Proposal' && deal.daysInStage > 14) ||
        (deal.stage === 'Negotiation' && deal.daysInStage > 10) ||
        (deal.stage === 'Qualification' && deal.daysInStage > 21);

      if (isAtRisk || isStalled) {
        const signals: string[] = [];
        if (isAtRisk) signals.push(`PQS ${deal.pqScore} — below threshold`);
        if (isStalled) signals.push(`${deal.daysInStage}d in ${deal.stage}`);
        if (deal.personaGaps.length > 0) signals.push(`Missing: ${deal.personaGaps[0]}`);
        return { deal, bucket: 'attention', signal: signals[0] };
      }

      // Closing soon (Negotiation stage or close date within 30 days)
      const daysToClose = Math.round((new Date(deal.closeDate).getTime() - Date.now()) / 86400000);
      if (deal.stage === 'Negotiation' || daysToClose <= 30) {
        return {
          deal,
          bucket: 'closing',
          signal: daysToClose <= 0 ? 'Past close date' : `Closes in ${daysToClose}d`,
        };
      }

      // Healthy — mid-funnel with good scores
      if (deal.stage === 'Proposal' || deal.stage === 'Qualification') {
        return {
          deal,
          bucket: 'healthy',
          signal: deal.nextActions[0] || `${deal.stage} — on track`,
        };
      }

      // Early — Discovery
      return {
        deal,
        bucket: 'early',
        signal: deal.nextActions[0] || 'Early stage',
      };
    })
    .sort((a, b) => {
      const order: Record<DealBucket, number> = { attention: 0, closing: 1, healthy: 2, early: 3 };
      if (order[a.bucket] !== order[b.bucket]) return order[a.bucket] - order[b.bucket];
      return b.deal.acv - a.deal.acv;
    });
}

const BUCKET_CONFIG: Record<
  DealBucket,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  attention: {
    label: 'Needs Attention',
    icon: AlertTriangle,
    color: 'text-grade-f',
    bgColor: 'bg-grade-f/5 border-grade-f/20',
  },
  closing: {
    label: 'Closing Soon',
    icon: Clock,
    color: 'text-primary',
    bgColor: 'bg-primary/5 border-primary/20',
  },
  healthy: {
    label: 'On Track',
    icon: TrendingUp,
    color: 'text-grade-a',
    bgColor: 'bg-grade-a/5 border-grade-a/20',
  },
  early: {
    label: 'Early Stage',
    icon: Zap,
    color: 'text-grade-c',
    bgColor: 'bg-grade-c/5 border-grade-c/20',
  },
};

type FilterTab = 'all' | DealBucket;

export function RepDealBoard({ deals }: { deals: Deal[] }) {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const bucketed = useMemo(() => bucketDeals(deals), [deals]);

  const bucketCounts = useMemo(() => {
    const counts: Record<DealBucket, number> = { attention: 0, closing: 0, healthy: 0, early: 0 };
    bucketed.forEach((b) => counts[b.bucket]++);
    return counts;
  }, [bucketed]);

  const visible = useMemo(
    () => (activeTab === 'all' ? bucketed : bucketed.filter((b) => b.bucket === activeTab)),
    [bucketed, activeTab]
  );

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: deals.length },
    { key: 'attention', label: 'Needs Attention', count: bucketCounts.attention },
    { key: 'closing', label: 'Closing', count: bucketCounts.closing },
    { key: 'healthy', label: 'On Track', count: bucketCounts.healthy },
    { key: 'early', label: 'Early', count: bucketCounts.early },
  ];

  let currentBucket: DealBucket | null = null;

  return (
    <>
      <div className="space-y-3 animate-fade-in">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Deal cards */}
        <div className="space-y-2">
          {visible.map((item) => {
            const showHeader = activeTab === 'all' && item.bucket !== currentBucket;
            if (activeTab === 'all') currentBucket = item.bucket;
            const cfg = BUCKET_CONFIG[item.bucket];
            const Icon = cfg.icon;
            const d = item.deal;
            const daysToClose = Math.round(
              (new Date(d.closeDate).getTime() - Date.now()) / 86400000
            );

            return (
              <div key={d.id}>
                {/* Bucket section header */}
                {showHeader && (
                  <div className="flex items-center gap-2 pt-3 pb-1.5">
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      ({bucketCounts[item.bucket]})
                    </span>
                    <div className="flex-1 h-px bg-border/30" />
                  </div>
                )}

                {/* Deal card */}
                <button
                  onClick={() => setSelectedDeal(d)}
                  className={`w-full text-left glass-card p-3.5 hover:bg-muted/30 transition-all group border ${cfg.bgColor}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: deal info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <GradeBadge grade={d.grade} />
                        <span className="font-semibold text-sm text-foreground truncate">
                          {d.company}
                        </span>
                        <span className="text-xs font-mono font-semibold text-foreground">
                          {fmt(d.acv)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                          {d.stage}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {daysToClose <= 0
                            ? 'Overdue'
                            : daysToClose <= 30
                              ? `${daysToClose}d to close`
                              : d.closeDate}
                        </span>
                        <span>{d.daysInStage}d in stage</span>
                        {d.personaGaps.length > 0 && (
                          <span className="flex items-center gap-1 text-grade-d">
                            <Users className="w-3 h-3" />
                            {d.personaGaps.length} gap{d.personaGaps.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Signal / next action */}
                      <div className="mt-1.5 text-xs text-muted-foreground">
                        {item.bucket === 'attention' ? (
                          <span className="text-grade-f font-medium">{item.signal}</span>
                        ) : (
                          <span>{d.nextActions[0] || item.signal}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: PQS + win prob + arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-foreground">
                          PQS {d.pqScore}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {Math.round(d.probabilities.win * 100)}% win
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </button>
              </div>
            );
          })}

          {visible.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground font-mono">
              No deals in this category
            </div>
          )}
        </div>
      </div>

      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </>
  );
}
