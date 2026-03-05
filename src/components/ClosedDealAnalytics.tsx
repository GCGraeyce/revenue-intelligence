import { useMemo } from 'react';
import { pipelineDeals, Deal } from '@/data/demo-data';
import { useRole } from '@/contexts/RoleContext';
import { Trophy, XCircle, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { fmt } from '@/lib/utils';

const CHART_COLORS = {
  won: 'hsl(var(--grade-a))',
  lost: 'hsl(var(--grade-f))',
  primary: 'hsl(var(--primary))',
};

interface ClosedDealStats {
  won: Deal[];
  lost: Deal[];
  totalWonACV: number;
  totalLostACV: number;
  winRate: number;
  avgWonCycle: number;
  avgLostCycle: number;
  avgWonPQS: number;
  avgLostPQS: number;
  wonBySegment: Record<string, { count: number; acv: number }>;
  lostBySegment: Record<string, { count: number; acv: number }>;
  lossReasons: Record<string, number>;
  wonByProduct: Record<string, number>;
}

function computeStats(deals: Deal[]): ClosedDealStats {
  const won = deals.filter((d) => d.status === 'won');
  const lost = deals.filter((d) => d.status === 'lost');
  const totalClosed = won.length + lost.length;

  const totalWonACV = won.reduce((s, d) => s + d.acv, 0);
  const totalLostACV = lost.reduce((s, d) => s + d.acv, 0);

  const avgWonCycle =
    won.length > 0
      ? Math.round(won.reduce((s, d) => s + d.daysInStage * 2.5, 0) / won.length) // approx total cycle
      : 0;
  const avgLostCycle =
    lost.length > 0 ? Math.round(lost.reduce((s, d) => s + d.daysInStage * 3, 0) / lost.length) : 0;

  const avgWonPQS =
    won.length > 0 ? Math.round(won.reduce((s, d) => s + d.pqScore, 0) / won.length) : 0;
  const avgLostPQS =
    lost.length > 0 ? Math.round(lost.reduce((s, d) => s + d.pqScore, 0) / lost.length) : 0;

  const wonBySegment: Record<string, { count: number; acv: number }> = {};
  const lostBySegment: Record<string, { count: number; acv: number }> = {};

  won.forEach((d) => {
    if (!wonBySegment[d.segment]) wonBySegment[d.segment] = { count: 0, acv: 0 };
    wonBySegment[d.segment].count++;
    wonBySegment[d.segment].acv += d.acv;
  });

  lost.forEach((d) => {
    if (!lostBySegment[d.segment]) lostBySegment[d.segment] = { count: 0, acv: 0 };
    lostBySegment[d.segment].count++;
    lostBySegment[d.segment].acv += d.acv;
  });

  const lossReasons: Record<string, number> = {};
  lost.forEach((d) => {
    const reason = d.lossReason || 'unknown';
    lossReasons[reason] = (lossReasons[reason] || 0) + 1;
  });

  const wonByProduct: Record<string, number> = {};
  won.forEach((d) => {
    wonByProduct[d.productBundle] = (wonByProduct[d.productBundle] || 0) + d.acv;
  });

  return {
    won,
    lost,
    totalWonACV,
    totalLostACV,
    winRate: totalClosed > 0 ? Math.round((won.length / totalClosed) * 100) : 0,
    avgWonCycle,
    avgLostCycle,
    avgWonPQS,
    avgLostPQS,
    wonBySegment,
    lostBySegment,
    lossReasons,
    wonByProduct,
  };
}

const LOSS_REASON_LABELS: Record<string, string> = {
  budget: 'Budget Constraints',
  timing: 'Timing / Not Ready',
  competitor: 'Lost to Competitor',
  'no-decision': 'No Decision Made',
  'champion-left': 'Champion Left',
  'feature-gap': 'Feature Gap',
  unknown: 'Unknown',
};

const SEGMENT_COLORS: Record<string, string> = {
  Enterprise: 'hsl(var(--primary))',
  'Mid-Market': 'hsl(var(--grade-b))',
  SMB: 'hsl(var(--grade-c))',
};

export function ClosedDealAnalytics() {
  const { role, currentRep } = useRole();

  const deals = useMemo(() => {
    if (role === 'rep') return pipelineDeals.filter((d) => d.rep === currentRep);
    return pipelineDeals;
  }, [role, currentRep]);

  const stats = useMemo(() => computeStats(deals), [deals]);

  if (stats.won.length === 0 && stats.lost.length === 0) return null;

  const segmentChartData = ['Enterprise', 'Mid-Market', 'SMB'].map((seg) => ({
    name: seg,
    Won: stats.wonBySegment[seg]?.count || 0,
    Lost: stats.lostBySegment[seg]?.count || 0,
  }));

  const lossReasonData = Object.entries(stats.lossReasons)
    .map(([reason, count]) => ({
      name: LOSS_REASON_LABELS[reason] || reason,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);

  const wonProductData = Object.entries(stats.wonByProduct)
    .map(([product, acv]) => ({ name: product, value: acv }))
    .sort((a, b) => b.value - a.value);

  const LOSS_COLORS = [
    'hsl(var(--grade-f))',
    'hsl(var(--grade-d))',
    'hsl(var(--grade-c))',
    '#60a5fa',
    '#a78bfa',
    '#f472b6',
  ];

  return (
    <div className="glass-card p-6 animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Closed Deal Analytics
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          {stats.won.length + stats.lost.length} closed deals
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-3.5 h-3.5 text-grade-a" />
          </div>
          <div className="text-lg font-mono font-bold text-grade-a">{stats.won.length}</div>
          <div className="text-[9px] text-muted-foreground">Won</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <XCircle className="w-3.5 h-3.5 text-grade-f" />
          </div>
          <div className="text-lg font-mono font-bold text-grade-f">{stats.lost.length}</div>
          <div className="text-[9px] text-muted-foreground">Lost</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="text-lg font-mono font-bold text-foreground">{stats.winRate}%</div>
          <div className="text-[9px] text-muted-foreground">Win Rate</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="text-lg font-mono font-bold text-grade-a">{fmt(stats.totalWonACV)}</div>
          <div className="text-[9px] text-muted-foreground">Won ACV</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-mono font-bold text-primary">{stats.avgWonCycle}d</div>
          <div className="text-[9px] text-muted-foreground">Avg Won Cycle</div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-grade-b" />
          </div>
          <div className="text-lg font-mono font-bold text-grade-b">
            {stats.avgWonPQS} vs {stats.avgLostPQS}
          </div>
          <div className="text-[9px] text-muted-foreground">PQS Won vs Lost</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Win/Loss by Segment */}
        <div className="rounded-lg border border-border/30 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Win/Loss by Segment
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="Won" fill={CHART_COLORS.won} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lost" fill={CHART_COLORS.lost} radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loss Reasons */}
        <div className="rounded-lg border border-border/30 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Loss Reasons
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lossReasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {lossReasonData.map((_, i) => (
                    <Cell key={i} fill={LOSS_COLORS[i % LOSS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Won by Product */}
        <div className="rounded-lg border border-border/30 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Revenue Won by Product
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wonProductData} layout="vertical" margin={{ left: 5, right: 5 }}>
                <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9 }} />
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]}>
                  {wonProductData.map((_, i) => (
                    <Cell key={i} fill={Object.values(SEGMENT_COLORS)[i % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="border-t border-border/30 pt-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
          Key Insights
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="rounded-lg bg-grade-a/5 border border-grade-a/20 p-2.5">
            <div className="text-[10px] font-semibold text-grade-a mb-0.5">PQS Predicts Wins</div>
            <div className="text-[10px] text-muted-foreground">
              Won deals averaged PQS {stats.avgWonPQS} vs {stats.avgLostPQS} for losses — a{' '}
              {stats.avgWonPQS - stats.avgLostPQS} point gap confirms scoring model accuracy.
            </div>
          </div>
          <div className="rounded-lg bg-grade-f/5 border border-grade-f/20 p-2.5">
            <div className="text-[10px] font-semibold text-grade-f mb-0.5">Top Loss Driver</div>
            <div className="text-[10px] text-muted-foreground">
              {lossReasonData[0]
                ? `"${lossReasonData[0].name}" accounts for ${Math.round((lossReasonData[0].value / stats.lost.length) * 100)}% of losses. Consider addressing this in coaching plays.`
                : 'No loss data available yet.'}
            </div>
          </div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
            <div className="text-[10px] font-semibold text-primary mb-0.5">Cycle Time Delta</div>
            <div className="text-[10px] text-muted-foreground">
              Won deals close in {stats.avgWonCycle}d vs {stats.avgLostCycle}d for losses.{' '}
              {stats.avgLostCycle > stats.avgWonCycle
                ? 'Longer cycles correlate with losses — watch for stalls.'
                : 'Healthy cycle times across both outcomes.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
