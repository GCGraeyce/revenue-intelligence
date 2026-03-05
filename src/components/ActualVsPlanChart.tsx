import { useMemo } from 'react';
import { getActualVsPlan } from '@/data/demo-data';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts';
import { fmt } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

export function ActualVsPlanChart() {
  const data = useMemo(() => getActualVsPlan(), []);

  const annualTarget = data[data.length - 1]?.planCumulative || 0;
  const currentMonth = data.find((d) => d.monthIndex === 2); // Mar 26
  const attainmentPct =
    currentMonth && currentMonth.planCumulative > 0
      ? Math.round((currentMonth.actualCumulative / currentMonth.planCumulative) * 100)
      : 0;

  // Transform data for the chart
  const chartData = data.map((d) => ({
    month: d.month.replace(' 26', ''),
    plan: d.planCumulative,
    actual: d.actualCumulative > 0 ? d.actualCumulative : null,
    forecast: d.forecastCumulative,
    bookings: d.actualMonthly > 0 ? d.actualMonthly : null,
    isCurrent: d.monthIndex === 2,
  }));

  const planStatus =
    attainmentPct >= 100 ? 'grade-a' : attainmentPct >= 85 ? 'grade-b' : attainmentPct >= 70 ? 'grade-c' : 'grade-f';

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="metric-label">Bookings: Actual vs Plan</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
              YTD Attainment
            </div>
            <div className={`text-lg font-mono font-bold text-[hsl(var(--${planStatus}))]`}>
              {attainmentPct}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Annual Target
            </div>
            <div className="text-lg font-mono font-bold text-foreground">{fmt(annualTarget)}</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span className="text-[10px] font-mono text-muted-foreground">Actual (cumulative)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-muted-foreground" style={{ borderTop: '2px dashed' }} />
          <span className="text-[10px] font-mono text-muted-foreground">Plan (cumulative)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <span className="text-[10px] font-mono text-muted-foreground">Forecast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-grade-a/40" />
          <span className="text-[10px] font-mono text-muted-foreground">Monthly bookings</span>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => fmt(v)}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              formatter={(value: unknown, name: string) => {
                const v = value as number;
                if (v === null || v === 0) return ['-', name];
                const labels: Record<string, string> = {
                  actual: 'Actual (cumulative)',
                  plan: 'Plan (cumulative)',
                  forecast: 'Forecast (cumulative)',
                  bookings: 'Monthly bookings',
                };
                return [fmt(v), labels[name] || name];
              }}
            />

            {/* Current month marker */}
            <ReferenceLine
              x="Mar"
              stroke="hsl(var(--primary))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{
                value: 'Today',
                position: 'top',
                fontSize: 9,
                fill: 'hsl(var(--primary))',
              }}
            />

            {/* Monthly bookings as bars */}
            <Bar
              dataKey="bookings"
              fill="hsl(var(--grade-a))"
              opacity={0.4}
              radius={[3, 3, 0, 0]}
              barSize={20}
            />

            {/* Forecast area (shaded) */}
            <Area
              dataKey="forecast"
              fill="hsl(var(--primary))"
              fillOpacity={0.08}
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              strokeOpacity={0.5}
              connectNulls={false}
            />

            {/* Plan line (dashed) */}
            <Line
              dataKey="plan"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
            />

            {/* Actual line (solid) */}
            <Line
              dataKey="actual"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'hsl(var(--primary))' }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Quarterly summary */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-border/20">
        {['Q1', 'Q2', 'Q3', 'Q4'].map((q, qi) => {
          const qMonths = data.filter((d) => Math.floor(d.monthIndex / 3) === qi);
          const qPlan = qMonths.reduce((s, d) => s + d.planMonthly, 0);
          const qActual = qMonths.reduce((s, d) => s + d.actualMonthly, 0);
          const qPct = qPlan > 0 ? Math.round((qActual / qPlan) * 100) : 0;
          const isFuture = qi > 0;
          return (
            <div key={q} className="text-center">
              <div className="text-[10px] text-muted-foreground font-mono">{q} 2026</div>
              <div className={`text-sm font-mono font-bold ${isFuture ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                {qActual > 0 ? fmt(qActual) : '—'}
              </div>
              <div className="text-[9px] text-muted-foreground">
                {qActual > 0 ? `${qPct}% of ${fmt(qPlan)}` : fmt(qPlan) + ' plan'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
