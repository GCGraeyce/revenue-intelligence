import { useMemo, useState } from 'react';
import { pipelineDeals, type Deal, type ForecastCategory } from '@/data/demo-data';
import { useProductFilter } from '@/contexts/ProductFilterContext';
import { DEFAULT_REP_TARGETS } from '@/data/demo-data';
import { DealDrawer } from './DealDrawer';
import { GradeBadge } from './GradeBadge';
import { TrendSparkline, generateTrendData } from './TrendSparkline';
import { cn, fmt } from '@/lib/utils';
import { Target, TrendingUp, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface CategorySummary {
  category: ForecastCategory;
  dealCount: number;
  totalACV: number;
  weightedACV: number;
  avgPQS: number;
  avgWinProb: number;
}

const categoryConfig: Record<
  ForecastCategory,
  { icon: React.ElementType; color: string; description: string }
> = {
  Commit: {
    icon: Target,
    color: 'grade-a',
    description: 'Rep-confident deals in Negotiation with high win probability',
  },
  'Best Case': {
    icon: TrendingUp,
    color: 'grade-b',
    description: 'Upside deals at Proposal/Negotiation with moderate-high win rates',
  },
  Pipeline: {
    icon: AlertTriangle,
    color: 'grade-c',
    description: 'Active pipeline — Discovery and Qualification stage deals',
  },
  Omit: {
    icon: XCircle,
    color: 'grade-f',
    description: 'Low probability or stalled — excluded from forecast',
  },
};

function computeForecastSummary(deals: Deal[]): {
  categories: CategorySummary[];
  bottomUp: number;
  topDown: number;
  gap: number;
  gapPct: number;
  coverageRatio: number;
} {
  const cats: ForecastCategory[] = ['Commit', 'Best Case', 'Pipeline', 'Omit'];
  const categories: CategorySummary[] = cats.map((cat) => {
    const catDeals = deals.filter((d) => d.forecastCategory === cat);
    return {
      category: cat,
      dealCount: catDeals.length,
      totalACV: catDeals.reduce((s, d) => s + d.acv, 0),
      weightedACV: Math.round(catDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0)),
      avgPQS:
        catDeals.length > 0
          ? Math.round(catDeals.reduce((s, d) => s + d.pqScore, 0) / catDeals.length)
          : 0,
      avgWinProb:
        catDeals.length > 0
          ? Math.round(
              (catDeals.reduce((s, d) => s + d.probabilities.win, 0) / catDeals.length) * 100
            )
          : 0,
    };
  });

  // Bottom-up: Commit (100%) + Best Case (weighted) + Pipeline (weighted at 50%)
  const commit = categories.find((c) => c.category === 'Commit');
  const bestCase = categories.find((c) => c.category === 'Best Case');
  const pipeline = categories.find((c) => c.category === 'Pipeline');
  const bottomUp =
    (commit?.totalACV || 0) +
    (bestCase?.weightedACV || 0) +
    Math.round((pipeline?.weightedACV || 0) * 0.5);

  // Top-down: total target
  const topDown = Object.values(DEFAULT_REP_TARGETS).reduce((s, t) => s + t, 0);

  const gap = topDown - bottomUp;
  const gapPct = topDown > 0 ? Math.round((gap / topDown) * 100) : 0;

  const totalPipeline = deals.reduce((s, d) => s + d.acv, 0);
  const coverageRatio = topDown > 0 ? +(totalPipeline / topDown).toFixed(1) : 0;

  return { categories, bottomUp, topDown, gap, gapPct, coverageRatio };
}

function CategoryCard({
  summary,
  deals,
  onSelectDeal,
}: {
  summary: CategorySummary;
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = categoryConfig[summary.category];
  const Icon = cfg.icon;
  const catDeals = deals
    .filter((d) => d.forecastCategory === summary.category)
    .sort((a, b) => b.acv - a.acv);

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center',
              `bg-[hsl(var(--${cfg.color})/.1)]`
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', `text-[hsl(var(--${cfg.color}))]`)} />
          </div>
          <span className="text-sm font-semibold text-foreground">{summary.category}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground">
            {summary.dealCount} deals
          </span>
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xl font-mono font-bold text-foreground">{fmt(summary.totalACV)}</span>
        <span className="text-xs font-mono text-muted-foreground">raw</span>
        <TrendSparkline
          data={generateTrendData(summary.totalACV / 1000, 8, 0.1)}
          width={40}
          height={14}
          color={cfg.color as 'grade-a'}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <div className="text-muted-foreground">Weighted</div>
          <div className="font-mono font-medium text-foreground">{fmt(summary.weightedACV)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Avg PQS</div>
          <div className="font-mono font-medium text-foreground">{summary.avgPQS}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Avg Win%</div>
          <div className="font-mono font-medium text-foreground">{summary.avgWinProb}%</div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-2">{cfg.description}</p>

      {expanded && catDeals.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/20 space-y-1 animate-fade-in">
          {catDeals.slice(0, 6).map((deal) => (
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
          {catDeals.length > 6 && (
            <div className="text-[9px] text-muted-foreground text-center font-mono">
              +{catDeals.length - 6} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForecastView() {
  const { filteredDeals, isFiltered } = useProductFilter();
  const deals = isFiltered ? filteredDeals : pipelineDeals;
  const forecast = useMemo(() => computeForecastSummary(deals), [deals]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const gapStatus = forecast.gapPct > 30 ? 'grade-f' : forecast.gapPct > 15 ? 'grade-c' : 'grade-a';
  const coverageStatus =
    forecast.coverageRatio >= 3 ? 'grade-a' : forecast.coverageRatio >= 2 ? 'grade-c' : 'grade-f';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        Revenue Forecast
      </div>

      {/* Bottom-Up vs Top-Down Comparison */}
      <div className="glass-card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Bottom-Up Forecast
            </div>
            <div className="text-2xl font-mono font-bold text-foreground">
              {fmt(forecast.bottomUp)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Commit + weighted Best Case + 50% Pipeline
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Top-Down Target
            </div>
            <div className="text-2xl font-mono font-bold text-foreground">
              {fmt(forecast.topDown)}
            </div>
            <div className="text-[10px] text-muted-foreground">Sum of all rep annual targets</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Gap
            </div>
            <div className={cn('text-2xl font-mono font-bold', `text-[hsl(var(--${gapStatus}))]`)}>
              {forecast.gap > 0 ? `-${fmt(forecast.gap)}` : `+${fmt(Math.abs(forecast.gap))}`}
            </div>
            <div className="text-[10px] text-muted-foreground">{forecast.gapPct}% of target</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Coverage Ratio
            </div>
            <div
              className={cn('text-2xl font-mono font-bold', `text-[hsl(var(--${coverageStatus}))]`)}
            >
              {forecast.coverageRatio}x
            </div>
            <div className="text-[10px] text-muted-foreground">Target: 3.0x+ for confidence</div>
          </div>
        </div>

        {/* Visual comparison bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground w-16">Bottom-Up</span>
            <div className="flex-1 h-4 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/80 transition-all"
                style={{ width: `${Math.min(100, (forecast.bottomUp / forecast.topDown) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-foreground w-16 text-right">
              {fmt(forecast.bottomUp)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground w-16">Target</span>
            <div className="flex-1 h-4 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-muted-foreground/30"
                style={{ width: '100%' }}
              />
            </div>
            <span className="text-[10px] font-mono text-foreground w-16 text-right">
              {fmt(forecast.topDown)}
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {forecast.categories.map((cat) => (
          <CategoryCard
            key={cat.category}
            summary={cat}
            deals={deals}
            onSelectDeal={setSelectedDeal}
          />
        ))}
      </div>

      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
