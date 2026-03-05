import { useMemo } from 'react';
import { getSaaSMetrics } from '@/data/demo-data';
import { Calculator, DollarSign, Clock, Zap, BarChart3, Target } from 'lucide-react';
import { cn, fmt } from '@/lib/utils';

function Gauge({ value, target, label, unit, icon: Icon }: {
  value: number;
  target: number;
  label: string;
  unit: string;
  icon: React.ElementType;
}) {
  const pct = Math.min((value / target) * 100, 100);
  const isHealthy = value >= target;
  const color = isHealthy ? 'grade-a' : value >= target * 0.75 ? 'grade-c' : 'grade-f';

  return (
    <div className="bg-secondary/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-3.5 h-3.5', `text-[hsl(var(--${color}))]`)} />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <div className={cn('text-2xl font-mono font-bold mb-1', `text-[hsl(var(--${color}))]`)}>
        {unit === '€' ? fmt(value) : unit === 'x' ? `${value}x` : unit === '%' ? `${value}%` : `${value}${unit}`}
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-1">
        <div
          className={cn('h-full rounded-full transition-all', `bg-[hsl(var(--${color}))]`)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[9px] text-muted-foreground font-mono">
        Target: {unit === '€' ? fmt(target) : unit === 'x' ? `${target}x` : unit === '%' ? `${target}%` : `${target}${unit}`}
      </div>
    </div>
  );
}

export function UnitEconomics() {
  const metrics = useMemo(() => getSaaSMetrics(), []);

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <span className="metric-label">Unit Economics & Sales Efficiency</span>
        </div>
      </div>

      {/* Primary unit economics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <Gauge value={metrics.ltvCacRatio} target={3} label="LTV:CAC" unit="x" icon={Target} />
        <Gauge value={metrics.cac} target={20000} label="CAC" unit="€" icon={DollarSign} />
        <Gauge value={metrics.ltv} target={400000} label="Avg LTV" unit="€" icon={BarChart3} />
        <Gauge value={metrics.paybackMonths} target={18} label="Payback" unit=" mo" icon={Clock} />
        <Gauge value={metrics.magicNumber} target={0.75} label="Magic Number" unit="x" icon={Zap} />
        <Gauge value={metrics.costOfSale} target={30} label="Cost of Sale" unit="%" icon={Calculator} />
      </div>

      {/* Sales Efficiency Metrics */}
      <div className="rounded-lg border border-border/30 p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          Sales Efficiency
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Revenue per Rep</div>
            <div className="text-lg font-mono font-bold text-foreground">
              {fmt(metrics.revenuePerRep)}
            </div>
            <div className="text-[9px] text-muted-foreground">Annual target / headcount</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Win Rate</div>
            <div className={cn(
              'text-lg font-mono font-bold',
              metrics.winRate >= 30 ? 'text-grade-a' : metrics.winRate >= 20 ? 'text-grade-c' : 'text-grade-f'
            )}>
              {metrics.winRate}%
            </div>
            <div className="text-[9px] text-muted-foreground">Closed-won / total closed</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Avg Deal Cycle</div>
            <div className="text-lg font-mono font-bold text-foreground">
              {metrics.avgDealCycle}d
            </div>
            <div className="text-[9px] text-muted-foreground">Won deals avg</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Pipeline Creation</div>
            <div className="text-lg font-mono font-bold text-foreground">
              {fmt(metrics.pipelineCreationRate)}
            </div>
            <div className="text-[9px] text-muted-foreground">New $ / month</div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 pt-3 border-t border-border/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="rounded-lg bg-grade-a/5 border border-grade-a/20 p-2.5">
            <div className="text-[10px] font-semibold text-grade-a mb-0.5">Healthy LTV:CAC</div>
            <div className="text-[10px] text-muted-foreground">
              At {metrics.ltvCacRatio}x, unit economics are strong. Every €1 in S&M spend
              generates €{metrics.ltvCacRatio.toFixed(1)} in lifetime value.
            </div>
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
            <div className="text-[10px] font-semibold text-primary mb-0.5">Magic Number Healthy</div>
            <div className="text-[10px] text-muted-foreground">
              {metrics.magicNumber}x magic number indicates efficient growth.
              {metrics.magicNumber >= 0.75
                ? ' Above 0.75 — safe to invest more in S&M.'
                : ' Below 0.75 — consider improving efficiency before scaling.'}
            </div>
          </div>
          <div className="rounded-lg bg-grade-b/5 border border-grade-b/20 p-2.5">
            <div className="text-[10px] font-semibold text-grade-b mb-0.5">
              {metrics.paybackMonths}mo Payback
            </div>
            <div className="text-[10px] text-muted-foreground">
              CAC recovery in {metrics.paybackMonths} months is{' '}
              {metrics.paybackMonths <= 12
                ? 'excellent — well under the 18-month SaaS benchmark.'
                : metrics.paybackMonths <= 18
                  ? 'healthy — within the 18-month SaaS benchmark.'
                  : 'above benchmark — optimise onboarding to accelerate time to value.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
