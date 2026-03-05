import { pipelineDeals, getRepSummary } from '@/data/demo-data';
import { getRepByName, type RepProfile } from '@/data/deep-reps';
import { useMemo, useState } from 'react';
import { GradeBadge } from '@/components/GradeBadge';
import { ManagerPipelineView } from '@/components/ManagerPipelineView';
import { OneOnOnePrep } from '@/components/OneOnOnePrep';
import { TeamHeatmap } from '@/components/TeamHeatmap';
import { useRole } from '@/contexts/RoleContext';
import { Grade } from '@/data/demo-data';
import { cn, fmt } from '@/lib/utils';
import {
  Users,
  Target,
  Calendar,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Zap,
  BookOpen,
  Star,
  BarChart2,
  GitCompare,
} from 'lucide-react';
import { RepBenchmark } from '@/components/RepBenchmark';

function scoreToGrade(s: number): Grade {
  if (s >= 80) return 'A';
  if (s >= 65) return 'B';
  if (s >= 50) return 'C';
  if (s >= 35) return 'D';
  return 'F';
}

function RepDetailPanel({ profile }: { profile: RepProfile }) {
  const perf = profile.currentQuarterPerformance;
  const attColor =
    perf.attainmentPct >= 100
      ? 'grade-a'
      : perf.attainmentPct >= 75
        ? 'grade-b'
        : perf.attainmentPct >= 50
          ? 'grade-c'
          : 'grade-f';

  return (
    <div className="p-4 bg-secondary/20 border-t border-border/20 space-y-4 animate-fade-in">
      {/* Top row: quota attainment + status badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={cn(
            'text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold',
            profile.status === 'active'
              ? 'bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]'
              : profile.status === 'on-leave'
                ? 'bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]'
                : profile.status === 'pip'
                  ? 'bg-[hsl(var(--grade-f)/.1)] text-[hsl(var(--grade-f))]'
                  : 'bg-muted text-muted-foreground'
          )}
        >
          {profile.status.toUpperCase()}
        </span>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {profile.rampStatus === 'veteran'
            ? 'Veteran'
            : profile.rampStatus === 'ramped'
              ? 'Ramped'
              : `Ramping ${profile.rampProgress}%`}
        </span>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {profile.territory}
        </span>
        {profile.pipStatus !== 'none' && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[hsl(var(--grade-f)/.1)] text-[hsl(var(--grade-f))]">
            PIP: {profile.pipStatus}
          </span>
        )}
        {profile.compensationPlan !== 'salary' && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {profile.compensationPlan}
          </span>
        )}
      </div>

      {/* Quota attainment */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card/80 rounded-lg p-3 border border-border/20">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
            Quota Attainment
          </div>
          <div className={cn('font-mono text-xl font-bold', `text-[hsl(var(--${attColor}))]`)}>
            {perf.attainmentPct}%
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {fmt(perf.closed)} / {fmt(perf.target)}
          </div>
        </div>
        <div className="bg-card/80 rounded-lg p-3 border border-border/20">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Win Rate</div>
          <div className="font-mono text-xl font-bold text-foreground">
            {Math.round(perf.winRate * 100)}%
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {perf.dealsWon}W / {perf.dealsLost}L
          </div>
        </div>
        <div className="bg-card/80 rounded-lg p-3 border border-border/20">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
            Avg Deal Size
          </div>
          <div className="font-mono text-xl font-bold text-foreground">{fmt(perf.avgDealSize)}</div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {perf.avgCycleLength}d avg cycle
          </div>
        </div>
        <div className="bg-card/80 rounded-lg p-3 border border-border/20">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
            Pipeline Gen
          </div>
          <div className="font-mono text-xl font-bold text-foreground">
            {fmt(perf.pipelineGenerated)}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {profile.activeDealCount} active deals
          </div>
        </div>
      </div>

      {/* Activity metrics */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Activity Metrics
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Meetings/wk', value: profile.activityMetrics.avgMeetingsPerWeek },
            { label: 'Calls/wk', value: profile.activityMetrics.avgCallsPerWeek },
            {
              label: 'Lead→Opp',
              value: `${Math.round(+profile.activityMetrics.conversionRateLeadToOpp * 100)}%`,
            },
            {
              label: 'Opp→Win',
              value: `${Math.round(+profile.activityMetrics.conversionRateOppToWin * 100)}%`,
            },
          ].map((m) => (
            <div
              key={m.label}
              className="text-center bg-card/60 rounded p-2 border border-border/10"
            >
              <div className="font-mono text-sm font-bold text-foreground">{m.value}</div>
              <div className="text-[9px] text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Coaching & Development */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Coaching
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last 1:1</span>
              <span className="font-mono text-foreground">{profile.coaching.lastOneOnOneDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Training</span>
              <span className="font-mono text-foreground">
                {profile.coaching.trainingCompleted}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sim Score</span>
              <span className="font-mono text-foreground">{profile.coaching.simulationScore}</span>
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground bg-card/60 rounded p-2 border border-border/10">
              {profile.coaching.lastCoachingNote}
            </div>
          </div>
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
            <Star className="w-3 h-3" /> Strengths & Development
          </div>
          <div className="space-y-1.5">
            {profile.coaching.strengths.map((s) => (
              <div key={s} className="text-[11px] flex items-start gap-1">
                <span className="text-[hsl(var(--grade-a))]">+</span>
                <span className="text-foreground">{s}</span>
              </div>
            ))}
            {profile.coaching.developmentAreas.map((d) => (
              <div key={d} className="text-[11px] flex items-start gap-1">
                <span className="text-[hsl(var(--grade-c))]">△</span>
                <span className="text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
          {profile.coaching.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.coaching.certifications.map((c) => (
                <span
                  key={c}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quarterly performance history */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Quarterly History
        </div>
        <div className="grid grid-cols-4 gap-2">
          {profile.historicalPerformance.map((q) => {
            const qColor =
              q.attainmentPct >= 100
                ? 'grade-a'
                : q.attainmentPct >= 75
                  ? 'grade-b'
                  : q.attainmentPct >= 50
                    ? 'grade-c'
                    : 'grade-f';
            return (
              <div
                key={q.quarter}
                className="bg-card/60 rounded p-2 border border-border/10 text-center"
              >
                <div className="text-[9px] font-mono text-muted-foreground">{q.quarter}</div>
                <div className={cn('font-mono text-sm font-bold', `text-[hsl(var(--${qColor}))]`)}>
                  {q.attainmentPct}%
                </div>
                <div className="text-[9px] text-muted-foreground">{fmt(q.closed)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RepComparisonView() {
  const reps = useMemo(() => getRepSummary(pipelineDeals), []);
  const repNames = reps.map((r) => r.rep);
  const [repA, setRepA] = useState<string>(repNames[0] || '');
  const [repB, setRepB] = useState<string>(repNames[1] || '');

  const profileA = repA ? getRepByName(repA) : null;
  const profileB = repB ? getRepByName(repB) : null;
  const summaryA = reps.find((r) => r.rep === repA);
  const summaryB = reps.find((r) => r.rep === repB);

  const metrics =
    profileA && profileB
      ? [
          {
            label: 'Quota Attainment',
            a: profileA.currentQuarterPerformance.attainmentPct,
            b: profileB.currentQuarterPerformance.attainmentPct,
            unit: '%',
            higherIsBetter: true,
          },
          {
            label: 'Win Rate',
            a: Math.round(profileA.currentQuarterPerformance.winRate * 100),
            b: Math.round(profileB.currentQuarterPerformance.winRate * 100),
            unit: '%',
            higherIsBetter: true,
          },
          {
            label: 'Avg Deal Size',
            a: profileA.currentQuarterPerformance.avgDealSize,
            b: profileB.currentQuarterPerformance.avgDealSize,
            unit: '€',
            higherIsBetter: true,
            isCurrency: true,
          },
          {
            label: 'Pipeline Generated',
            a: profileA.currentQuarterPerformance.pipelineGenerated,
            b: profileB.currentQuarterPerformance.pipelineGenerated,
            unit: '€',
            higherIsBetter: true,
            isCurrency: true,
          },
          {
            label: 'Avg Cycle Length',
            a: profileA.currentQuarterPerformance.avgCycleLength,
            b: profileB.currentQuarterPerformance.avgCycleLength,
            unit: 'd',
            higherIsBetter: false,
          },
          {
            label: 'Avg PQS',
            a: summaryA?.avgPQS ?? 0,
            b: summaryB?.avgPQS ?? 0,
            unit: '',
            higherIsBetter: true,
          },
          {
            label: 'Meetings/wk',
            a: profileA.activityMetrics.avgMeetingsPerWeek,
            b: profileB.activityMetrics.avgMeetingsPerWeek,
            unit: '',
            higherIsBetter: true,
          },
          {
            label: 'Training',
            a: profileA.coaching.trainingCompleted,
            b: profileB.coaching.trainingCompleted,
            unit: '%',
            higherIsBetter: true,
          },
        ]
      : [];

  const max = (a: number, b: number) => Math.max(a, b, 1);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Rep selectors */}
      <div className="glass-card p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Select two reps to compare
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Rep A', value: repA, onChange: setRepA, color: 'primary' },
            { label: 'Rep B', value: repB, onChange: setRepB, color: 'grade-c' },
          ].map((sel) => (
            <div key={sel.label}>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">
                {sel.label}
              </label>
              <select
                value={sel.value}
                onChange={(e) => sel.onChange(e.target.value)}
                className="w-full text-sm bg-secondary/50 border border-border/40 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {repNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {profileA && profileB ? (
        <>
          {/* Header cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                profile: profileA,
                summary: summaryA,
                side: 'A',
                colorClass: 'text-primary border-primary/30 bg-primary/5',
              },
              {
                profile: profileB,
                summary: summaryB,
                side: 'B',
                colorClass:
                  'text-[hsl(var(--grade-c))] border-[hsl(var(--grade-c))/.3] bg-[hsl(var(--grade-c))/.05]',
              },
            ].map(({ profile, summary, side, colorClass }) => {
              const att = profile.currentQuarterPerformance.attainmentPct;
              const attColor =
                att >= 100 ? 'grade-a' : att >= 75 ? 'grade-b' : att >= 50 ? 'grade-c' : 'grade-f';
              return (
                <div key={side} className={cn('glass-card p-4 border', colorClass)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                      {profile.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{profile.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {profile.title} · {profile.territory}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div className="text-muted-foreground">Attainment</div>
                      <div className={cn('font-mono font-bold', `text-[hsl(var(--${attColor}))]`)}>
                        {att}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Active Deals</div>
                      <div className="font-mono font-bold">{summary?.dealCount ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pipeline</div>
                      <div className="font-mono font-bold">{fmt(summary?.totalACV ?? 0)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">At Risk</div>
                      <div className="font-mono font-bold text-grade-d">{summary?.atRisk ?? 0}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metric comparison bars */}
          <div className="glass-card p-5 space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Side-by-side metrics
            </div>
            {metrics.map((m) => {
              const aWins = m.higherIsBetter ? m.a >= m.b : m.a <= m.b;
              const bWins = m.higherIsBetter ? m.b > m.a : m.b < m.a;
              const maxVal = max(m.a, m.b);
              return (
                <div key={m.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span
                      className={cn(
                        'font-mono font-bold',
                        aWins ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {m.isCurrency ? fmt(m.a) : `${m.a}${m.unit}`}
                    </span>
                    <span className="uppercase tracking-wider">{m.label}</span>
                    <span
                      className={cn(
                        'font-mono font-bold',
                        bWins ? 'text-[hsl(var(--grade-c))]' : 'text-foreground'
                      )}
                    >
                      {m.isCurrency ? fmt(m.b) : `${m.b}${m.unit}`}
                    </span>
                  </div>
                  <div className="flex gap-0.5 h-2">
                    <div className="flex-1 flex justify-end">
                      <div
                        className="h-full rounded-l-full bg-primary/70"
                        style={{ width: `${(m.a / maxVal) * 100}%` }}
                      />
                    </div>
                    <div className="w-px bg-border/60" />
                    <div className="flex-1">
                      <div
                        className="h-full rounded-r-full bg-[hsl(var(--grade-c))/.7]"
                        style={{ width: `${(m.b / maxVal) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coaching notes */}
          <div className="grid grid-cols-2 gap-4">
            {[profileA, profileB].map((profile) => (
              <div key={profile.id} className="glass-card p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  {profile.name} — Coaching
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {profile.coaching.strengths.slice(0, 2).map((s) => (
                    <div key={s} className="flex items-start gap-1.5">
                      <span className="text-[hsl(var(--grade-a))]">+</span>
                      <span className="text-foreground">{s}</span>
                    </div>
                  ))}
                  {profile.coaching.developmentAreas.slice(0, 2).map((d) => (
                    <div key={d} className="flex items-start gap-1.5">
                      <span className="text-[hsl(var(--grade-c))]">△</span>
                      <span className="text-muted-foreground">{d}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-border/20 text-muted-foreground">
                    Last 1:1:{' '}
                    <span className="font-mono text-foreground">
                      {profile.coaching.lastOneOnOneDate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card py-16 text-center text-muted-foreground">
          Select two different reps to compare
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const { role } = useRole();
  const reps = useMemo(() => getRepSummary(pipelineDeals), []);
  const [view, setView] = useState<
    'targets' | 'reps' | '1on1' | 'heatmap' | 'benchmarks' | 'compare'
  >(role === 'manager' || role === 'exec' ? 'targets' : 'reps');
  const [expandedRep, setExpandedRep] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Team Performance</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {reps.length} reps · 3 managers
          </p>
        </div>
        <div className="flex bg-secondary/50 rounded-lg p-0.5">
          <button
            onClick={() => setView('targets')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
              view === 'targets'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="w-3 h-3" /> Targets
          </button>
          <button
            onClick={() => setView('reps')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
              view === 'reps'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3 h-3" /> Rep Table
          </button>
          <button
            onClick={() => setView('heatmap')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
              view === 'heatmap'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3X3 className="w-3 h-3" /> Heatmap
          </button>
          {(role === 'manager' || role === 'exec') && (
            <button
              onClick={() => setView('1on1')}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                view === '1on1'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-3 h-3" /> 1:1 Prep
            </button>
          )}
          {role !== 'rep' && (
            <button
              onClick={() => setView('benchmarks')}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                view === 'benchmarks'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart2 className="w-3 h-3" /> Benchmarks
            </button>
          )}
          {role !== 'rep' && (
            <button
              onClick={() => setView('compare')}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                view === 'compare'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GitCompare className="w-3 h-3" /> Compare
            </button>
          )}
        </div>
      </div>

      {view === 'targets' && <ManagerPipelineView />}

      {view === '1on1' && <OneOnOnePrep />}

      {view === 'heatmap' && <TeamHeatmap />}

      {view === 'benchmarks' && <RepBenchmark />}

      {view === 'compare' && <RepComparisonView />}

      {view === 'reps' && (
        <div className="glass-card overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                {[
                  'Rep',
                  'Status',
                  'Deals',
                  'Pipeline',
                  'Weighted',
                  'Quota %',
                  'Avg PQS',
                  'Grade',
                  'At Risk',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reps.map((r) => {
                const profile = getRepByName(r.rep);
                const isExpanded = expandedRep === r.rep;
                const attainment = profile?.currentQuarterPerformance.attainmentPct || 0;
                const attColor =
                  attainment >= 100
                    ? 'grade-a'
                    : attainment >= 75
                      ? 'grade-b'
                      : attainment >= 50
                        ? 'grade-c'
                        : 'grade-f';

                return (
                  <>
                    <tr
                      key={r.rep}
                      className={cn(
                        'border-b border-border/30 hover:bg-accent/30 transition-colors cursor-pointer',
                        isExpanded && 'bg-accent/20'
                      )}
                      onClick={() => setExpandedRep(isExpanded ? null : r.rep)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {profile?.avatar ||
                              r.rep
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{r.rep}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {profile?.title || 'Account Executive'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            'text-[9px] font-mono px-1.5 py-0.5 rounded',
                            profile?.rampStatus === 'veteran'
                              ? 'bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]'
                              : profile?.rampStatus === 'ramping'
                                ? 'bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]'
                                : 'bg-primary/10 text-primary'
                          )}
                        >
                          {profile?.rampStatus || 'active'}
                        </span>
                      </td>
                      <td className="p-3 data-cell">{r.dealCount}</td>
                      <td className="p-3 data-cell">{fmt(r.totalACV)}</td>
                      <td className="p-3 data-cell">{fmt(profile?.weightedPipeline || 0)}</td>
                      <td className="p-3">
                        <span
                          className={cn('font-mono font-bold', `text-[hsl(var(--${attColor}))]`)}
                        >
                          {attainment}%
                        </span>
                      </td>
                      <td className="p-3 data-cell">{r.avgPQS}</td>
                      <td className="p-3">
                        <GradeBadge grade={scoreToGrade(r.avgPQS)} />
                      </td>
                      <td className="p-3 data-cell text-grade-d">{r.atRisk}</td>
                      <td className="p-3">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && profile && (
                      <tr key={`${r.rep}-detail`}>
                        <td colSpan={10} className="p-0">
                          <RepDetailPanel profile={profile} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
