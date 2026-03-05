import { useMemo } from 'react';
import { getSaaSMetrics } from '@/data/demo-data';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { ShieldCheck, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RetentionMetrics() {
  const metrics = useMemo(() => getSaaSMetrics(), []);

  const nrrStatus = metrics.nrr >= 110 ? 'grade-a' : metrics.nrr >= 100 ? 'grade-b' : 'grade-f';
  const grrStatus = metrics.grr >= 90 ? 'grade-a' : metrics.grr >= 85 ? 'grade-b' : 'grade-f';

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="metric-label">Revenue Retention & Churn</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">6-month trend</span>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-grade-a" />
          </div>
          <div className={cn('text-xl font-mono font-bold', `text-[hsl(var(--${nrrStatus}))]`)}>
            {metrics.nrr}%
          </div>
          <div className="text-[9px] text-muted-foreground">Net Revenue Retention</div>
          <div className="text-[8px] text-muted-foreground/60">Target: 110%+</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className={cn('text-xl font-mono font-bold', `text-[hsl(var(--${grrStatus}))]`)}>
            {metrics.grr}%
          </div>
          <div className="text-[9px] text-muted-foreground">Gross Revenue Retention</div>
          <div className="text-[8px] text-muted-foreground/60">Target: 85%+</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-grade-f" />
          </div>
          <div className="text-xl font-mono font-bold text-grade-f">{metrics.logoChurnRate}%</div>
          <div className="text-[9px] text-muted-foreground">Logo Churn</div>
          <div className="text-[8px] text-muted-foreground/60">Annual rate</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="text-xl font-mono font-bold text-grade-f">{metrics.revenueChurnRate}%</div>
          <div className="text-[9px] text-muted-foreground">Revenue Churn</div>
          <div className="text-[8px] text-muted-foreground/60">Annual rate</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3.5 h-3.5 text-grade-b" />
          </div>
          <div className="text-xl font-mono font-bold text-grade-b">{metrics.expansionRate}%</div>
          <div className="text-[9px] text-muted-foreground">Expansion Rate</div>
          <div className="text-[8px] text-muted-foreground/60">Upsell + cross-sell</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NRR/GRR Trend */}
        <div className="rounded-lg border border-border/30 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            NRR & GRR Trend
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.nrrTrend}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  domain={[80, 120]}
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === 'nrr' ? 'NRR' : 'GRR',
                  ]}
                />
                <ReferenceLine
                  y={100}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.3}
                />
                <Area
                  dataKey="nrr"
                  stroke="hsl(var(--grade-a))"
                  fill="hsl(var(--grade-a))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  dataKey="grr"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.05}
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn by Segment */}
        <div className="rounded-lg border border-border/30 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Churn & Retention by Segment
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.churnBySegment}>
                <XAxis
                  dataKey="segment"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      logoChurn: 'Logo Churn',
                      revenueChurn: 'Revenue Churn',
                      nrr: 'NRR',
                    };
                    return [`${value}%`, labels[name] || name];
                  }}
                />
                <Bar dataKey="logoChurn" fill="hsl(var(--grade-f))" radius={[3, 3, 0, 0]} barSize={16}>
                  {metrics.churnBySegment.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.logoChurn > 10
                          ? 'hsl(var(--grade-f))'
                          : entry.logoChurn > 6
                            ? 'hsl(var(--grade-c))'
                            : 'hsl(var(--grade-a))'
                      }
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="revenueChurn"
                  fill="hsl(var(--grade-f))"
                  opacity={0.5}
                  radius={[3, 3, 0, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Segment NRR labels */}
          <div className="flex justify-around mt-2">
            {metrics.churnBySegment.map((seg) => (
              <div key={seg.segment} className="text-center">
                <div
                  className={cn(
                    'text-xs font-mono font-bold',
                    seg.nrr >= 110
                      ? 'text-grade-a'
                      : seg.nrr >= 100
                        ? 'text-grade-b'
                        : 'text-grade-f'
                  )}
                >
                  {seg.nrr}% NRR
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 pt-3 border-t border-border/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-lg bg-grade-a/5 border border-grade-a/20 p-2.5">
            <div className="text-[10px] font-semibold text-grade-a mb-0.5">NRR Above Benchmark</div>
            <div className="text-[10px] text-muted-foreground">
              At {metrics.nrr}% NRR, expansion revenue ({metrics.expansionRate}%) more than
              offsets churn ({metrics.revenueChurnRate}%). Enterprise segment leads at 118% NRR.
            </div>
          </div>
          <div className="rounded-lg bg-grade-f/5 border border-grade-f/20 p-2.5">
            <div className="text-[10px] font-semibold text-grade-f mb-0.5">SMB Churn Needs Attention</div>
            <div className="text-[10px] text-muted-foreground">
              SMB segment shows 14.3% logo churn with NRR below 100% — consider onboarding
              improvements, health scoring triggers, or segment-specific retention plays.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
