import { useMemo, useState } from 'react';
import { pipelineDeals, type Deal } from '@/data/demo-data';
import { useProductFilter } from '@/contexts/ProductFilterContext';
import { DealDrawer } from './DealDrawer';
import { GradeBadge } from './GradeBadge';
import { cn, fmt } from '@/lib/utils';
import { TrendSparkline, generateTrendData } from './TrendSparkline';
import { ArrowRight, Clock, TrendingUp, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface StageMetrics {
  stage: string;
  count: number;
  totalACV: number;
  avgDaysInStage: number;
  avgPQS: number;
  conversionRate: number; // estimated % advancing to next stage
  stalled: number; // deals beyond max expected duration
}

function computeVelocityMetrics(deals: Deal[]): {
  stages: StageMetrics[];
  avgCycleTime: number;
  velocityScore: number;
  totalPipelineValue: number;
  weeklyCreated: number;
  weeklyAdvanced: number;
} {
  const stageOrder = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
  const maxDays: Record<string, number> = {
    Discovery: 14,
    Qualification: 21,
    Proposal: 30,
    Negotiation: 21,
  };

  const stages: StageMetrics[] = stageOrder.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    const count = stageDeals.length;
    const totalACV = stageDeals.reduce((s, d) => s + d.acv, 0);
    const avgDaysInStage =
      count > 0 ? Math.round(stageDeals.reduce((s, d) => s + d.daysInStage, 0) / count) : 0;
    const avgPQS =
      count > 0 ? Math.round(stageDeals.reduce((s, d) => s + d.pqScore, 0) / count) : 0;
    const stalled = stageDeals.filter((d) => d.daysInStage > (maxDays[stage] || 30)).length;

    // Estimate conversion rate from deal quality distribution
    const goodDeals = stageDeals.filter((d) => d.pqScore >= 50).length;
    const conversionRate = count > 0 ? Math.round((goodDeals / count) * 100) : 0;

    return { stage, count, totalACV, avgDaysInStage, avgPQS, conversionRate, stalled };
  });

  // Avg cycle time estimate (sum of avg days across stages)
  const avgCycleTime = stages.reduce((s, st) => s + st.avgDaysInStage, 0);

  // Velocity score: higher is better (deals moving fast with good quality)
  const totalDeals = deals.length;
  const totalStalled = stages.reduce((s, st) => s + st.stalled, 0);
  const avgPQS = totalDeals > 0 ? deals.reduce((s, d) => s + d.pqScore, 0) / totalDeals : 0;
  const stalledPct = totalDeals > 0 ? totalStalled / totalDeals : 0;
  const velocityScore = Math.round(Math.max(0, Math.min(100, avgPQS * (1 - stalledPct))));

  // Simulate weekly created/advanced from deal creation dates
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weeklyCreated = deals.filter((d) => d.createdDate >= oneWeekAgo).length;
  const weeklyAdvanced = deals.filter((d) => {
    const recent = d.timeline.filter((e) => e.type === 'stage-change' && e.date >= oneWeekAgo);
    return recent.length > 0;
  }).length;

  return {
    stages,
    avgCycleTime,
    velocityScore,
    totalPipelineValue: deals.reduce((s, d) => s + d.acv, 0),
    weeklyCreated,
    weeklyAdvanced,
  };
}

function StageCard({
  metrics,
  deals,
  onSelectDeal,
}: {
  metrics: StageMetrics;
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const stalledPct = metrics.count > 0 ? Math.round((metrics.stalled / metrics.count) * 100) : 0;
  const stalledStatus = stalledPct > 30 ? 'grade-f' : stalledPct > 15 ? 'grade-c' : 'grade-a';
  const stageDeals = deals.filter((d) => d.stage === metrics.stage).sort((a, b) => b.acv - a.acv);

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {metrics.stage}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-foreground">{metrics.count} deals</span>
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="text-lg font-mono font-bold text-foreground mb-1">
        {fmt(metrics.totalACV)}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg days</span>
          <span className="font-mono text-foreground">{metrics.avgDaysInStage}d</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg PQS</span>
          <span className="font-mono text-foreground">{metrics.avgPQS}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Conversion</span>
          <span className="font-mono text-foreground">{metrics.conversionRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Stalled</span>
          <span className={cn('font-mono', `text-[hsl(var(--${stalledStatus}))]`)}>
            {metrics.stalled} ({stalledPct}%)
          </span>
        </div>
      </div>

      {/* Stage health bar */}
      <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', `bg-[hsl(var(--${stalledStatus}))]`)}
          style={{ width: `${metrics.conversionRate}%` }}
        />
      </div>

      {/* Expanded deal list */}
      {expanded && stageDeals.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/20 space-y-1 animate-fade-in">
          {stageDeals.slice(0, 5).map((deal) => (
            <div
              key={deal.id}
              className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDeal(deal);
              }}
            >
              <GradeBadge grade={deal.grade} />
              <span className="text-[11px] text-foreground truncate flex-1">{deal.company}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{fmt(deal.acv)}</span>
            </div>
          ))}
          {stageDeals.length > 5 && (
            <div className="text-[9px] text-muted-foreground text-center font-mono">
              +{stageDeals.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PipelineVelocity() {
  const { filteredDeals, isFiltered } = useProductFilter();
  const deals = isFiltered ? filteredDeals : pipelineDeals;
  const metrics = useMemo(() => computeVelocityMetrics(deals), [deals]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        Pipeline Velocity
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-3 text-center">
          <Zap className="w-4 h-4 mx-auto mb-1 text-primary" />
          <div className="flex items-center justify-center gap-1.5">
            <div className="text-xl font-mono font-bold text-foreground">
              {metrics.velocityScore}
            </div>
            <TrendSparkline
              data={generateTrendData(metrics.velocityScore, 8, 0.1)}
              width={40}
              height={14}
              color="primary"
            />
          </div>
          <div className="text-[10px] text-muted-foreground">Velocity Score</div>
        </div>
        <div className="glass-card p-3 text-center">
          <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <div className="flex items-center justify-center gap-1.5">
            <div className="text-xl font-mono font-bold text-foreground">
              {metrics.avgCycleTime}d
            </div>
            <TrendSparkline
              data={generateTrendData(metrics.avgCycleTime, 8, 0.08)}
              width={40}
              height={14}
              color="grade-c"
            />
          </div>
          <div className="text-[10px] text-muted-foreground">Avg Cycle Time</div>
        </div>
        <div className="glass-card p-3 text-center">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-[hsl(var(--grade-a))]" />
          <div className="flex items-center justify-center gap-1.5">
            <div className="text-xl font-mono font-bold text-foreground">
              {metrics.weeklyCreated}
            </div>
            <TrendSparkline
              data={generateTrendData(metrics.weeklyCreated, 8, 0.2)}
              width={40}
              height={14}
              color="grade-a"
            />
          </div>
          <div className="text-[10px] text-muted-foreground">Created This Week</div>
        </div>
        <div className="glass-card p-3 text-center">
          <ArrowRight className="w-4 h-4 mx-auto mb-1 text-[hsl(var(--grade-b))]" />
          <div className="flex items-center justify-center gap-1.5">
            <div className="text-xl font-mono font-bold text-foreground">
              {metrics.weeklyAdvanced}
            </div>
            <TrendSparkline
              data={generateTrendData(metrics.weeklyAdvanced, 8, 0.2)}
              width={40}
              height={14}
              color="grade-b"
            />
          </div>
          <div className="text-[10px] text-muted-foreground">Advanced This Week</div>
        </div>
      </div>

      {/* Stage Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {metrics.stages.map((stage, i) => (
          <div key={stage.stage} className="flex items-center gap-1">
            <div className="flex-1">
              <StageCard metrics={stage} deals={deals} onSelectDeal={setSelectedDeal} />
            </div>
            {i < metrics.stages.length - 1 && (
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 hidden md:block" />
            )}
          </div>
        ))}
      </div>

      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
