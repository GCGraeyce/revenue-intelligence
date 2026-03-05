import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { MetricCard } from '@/components/MetricCard';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BarChart3,
  TrendingDown,
  GitBranch,
  RefreshCw,
} from 'lucide-react';

/* ─── Mock data ─── */
interface CalibrationBucket {
  range: string;
  predicted: number;
  actual: number;
  count: number;
}

interface DriftSegment {
  segment: string;
  metric: string;
  baseline: number;
  current: number;
  delta: number;
  rootCauses: Array<{ factor: string; weight: number }>;
  recommendation: string;
}

interface RetrainingEntry {
  version: string;
  date: string;
  trigger: string;
  changes: Array<{ dimension: string; oldWeight: number; newWeight: number; reason: string }>;
}

const calibrationBuckets: CalibrationBucket[] = [
  { range: '0-10%', predicted: 5, actual: 4.2, count: 42 },
  { range: '10-20%', predicted: 15, actual: 13.8, count: 67 },
  { range: '20-30%', predicted: 25, actual: 27.1, count: 89 },
  { range: '30-40%', predicted: 35, actual: 33.5, count: 104 },
  { range: '40-50%', predicted: 45, actual: 42.8, count: 118 },
  { range: '50-60%', predicted: 55, actual: 56.3, count: 95 },
  { range: '60-70%', predicted: 65, actual: 63.1, count: 82 },
  { range: '70-80%', predicted: 75, actual: 78.4, count: 71 },
  { range: '80-90%', predicted: 85, actual: 82.9, count: 53 },
  { range: '90-100%', predicted: 95, actual: 93.1, count: 29 },
];

const driftSegments: DriftSegment[] = [
  {
    segment: 'Mid-Market',
    metric: 'Win Rate',
    baseline: 34.2,
    current: 31.0,
    delta: -3.2,
    rootCauses: [
      { factor: 'Increased competitor activity (Vendor X launch)', weight: 0.45 },
      { factor: 'Longer sales cycles (+8d average)', weight: 0.35 },
      { factor: 'Reduced champion engagement', weight: 0.2 },
    ],
    recommendation:
      'Consider recalibrating Mid-Market win probability baseline and updating competitive battlecards.',
  },
  {
    segment: 'Enterprise',
    metric: 'Avg Discount',
    baseline: 12.5,
    current: 14.8,
    delta: 2.3,
    rootCauses: [
      { factor: 'Q4 budget pressure driving earlier discounting', weight: 0.55 },
      { factor: 'New pricing tier confusion', weight: 0.3 },
      { factor: 'Champion-less deals requesting concessions', weight: 0.15 },
    ],
    recommendation:
      'Review pricing guidance for Enterprise segment. Consider value-selling reinforcement coaching play.',
  },
  {
    segment: 'Partner Channel',
    metric: 'Win Rate',
    baseline: 28.7,
    current: 24.6,
    delta: -4.1,
    rootCauses: [
      { factor: 'Two underperforming partners (Acme, CoreVault)', weight: 0.6 },
      { factor: 'Lead quality degradation from partner portal', weight: 0.4 },
    ],
    recommendation:
      'Flag underperforming partners for QBR. Tighten lead acceptance criteria from partner portal.',
  },
];

const retrainingLog: RetrainingEntry[] = [
  {
    version: 'v2.4.1',
    date: 'Feb 23, 2026',
    trigger: 'Scheduled weekly retrain',
    changes: [
      {
        dimension: 'Outcome Probability',
        oldWeight: 0.3,
        newWeight: 0.3,
        reason: 'No change — stable',
      },
      {
        dimension: 'ICP Fit',
        oldWeight: 0.21,
        newWeight: 0.2,
        reason: 'Slight empirical decrease in predictive power',
      },
      {
        dimension: 'Engagement Velocity',
        oldWeight: 0.09,
        newWeight: 0.1,
        reason: 'Increased correlation with close rates',
      },
    ],
  },
  {
    version: 'v2.4.0',
    date: 'Feb 16, 2026',
    trigger: 'Drift threshold exceeded (Mid-Market segment)',
    changes: [
      {
        dimension: 'Persona Coverage',
        oldWeight: 0.14,
        newWeight: 0.15,
        reason: 'Multi-threading now stronger predictor',
      },
      {
        dimension: 'Price Risk',
        oldWeight: 0.06,
        newWeight: 0.05,
        reason: 'Reduced impact after pricing simplification',
      },
    ],
  },
  {
    version: 'v2.3.2',
    date: 'Feb 9, 2026',
    trigger: 'Scheduled weekly retrain',
    changes: [
      {
        dimension: 'Process Adherence',
        oldWeight: 0.14,
        newWeight: 0.15,
        reason: 'Security review step now mandatory',
      },
    ],
  },
  {
    version: 'v2.3.0',
    date: 'Jan 30, 2026',
    trigger: 'Manual retrain (new data source: product usage)',
    changes: [
      {
        dimension: 'Engagement Velocity',
        oldWeight: 0.08,
        newWeight: 0.09,
        reason: 'Product usage signals added',
      },
      {
        dimension: 'ICP Fit',
        oldWeight: 0.22,
        newWeight: 0.21,
        reason: 'Firmographic data enrichment reduced ICP signal noise',
      },
      {
        dimension: 'Stage Progression',
        oldWeight: 0.06,
        newWeight: 0.05,
        reason: 'Slight decrease after stage naming cleanup',
      },
    ],
  },
];

/* ─── Calibration Chart ─── */
function CalibrationChart() {
  const overallError = (
    calibrationBuckets.reduce((s, b) => s + Math.abs(b.predicted - b.actual), 0) /
    calibrationBuckets.length
  ).toFixed(1);
  const withinTolerance = parseFloat(overallError) <= 5;

  return (
    <div className="glass-card p-5 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-3 h-3 text-primary" />
          </div>
          Calibration Chart
        </div>
        <span
          className={cn(
            'text-xs font-mono px-2 py-1 rounded-md',
            withinTolerance
              ? 'bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]'
              : 'bg-[hsl(var(--grade-f)/.1)] text-[hsl(var(--grade-f))]'
          )}
        >
          Calibration Error: {overallError}%{' '}
          {withinTolerance ? '(within 5% tolerance)' : '(exceeds 5% tolerance)'}
        </span>
      </div>

      {/* Bar chart */}
      <div className="space-y-1.5">
        {calibrationBuckets.map((bucket) => {
          const error = Math.abs(bucket.predicted - bucket.actual);
          const isHighError = error > 5;
          return (
            <div key={bucket.range} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground w-14 text-right flex-shrink-0">
                {bucket.range}
              </span>
              <div className="flex-1 flex items-center gap-1 h-5">
                {/* Predicted bar */}
                <div className="relative flex-1 h-full">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/30 rounded-sm"
                    style={{ width: `${(bucket.predicted / 100) * 100}%` }}
                  />
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-sm',
                      isHighError ? 'bg-[hsl(var(--grade-c)/.6)]' : 'bg-[hsl(var(--grade-a)/.6)]'
                    )}
                    style={{ width: `${(bucket.actual / 100) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground w-16 flex-shrink-0">
                P:{bucket.predicted}% A:{bucket.actual}%
              </span>
              {isHighError && (
                <span className="text-[9px] font-mono text-[hsl(var(--grade-c))] flex-shrink-0">
                  {error.toFixed(1)}% err
                </span>
              )}
              <span className="text-[9px] font-mono text-muted-foreground w-8 text-right flex-shrink-0">
                n={bucket.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[9px] text-muted-foreground pt-1 border-t border-border/30">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-primary/30 inline-block" /> Predicted
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-[hsl(var(--grade-a)/.6)] inline-block" /> Actual
          (within tolerance)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-[hsl(var(--grade-c)/.6)] inline-block" /> Actual
          (over 5% error)
        </span>
      </div>
    </div>
  );
}

/* ─── Drift Monitor ─── */
function DriftMonitor() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="glass-card p-5 animate-fade-in space-y-4">
      <div className="metric-label flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-[hsl(var(--grade-c)/.1)] flex items-center justify-center">
          <TrendingDown className="w-3 h-3 text-[hsl(var(--grade-c))]" />
        </div>
        Drift Monitor
      </div>

      <div className="space-y-2">
        {driftSegments.map((seg, idx) => {
          const isExpanded = expandedIdx === idx;
          const isDrift = Math.abs(seg.delta) > 2;
          return (
            <div
              key={seg.segment + seg.metric}
              className="rounded-lg border border-border/30 overflow-hidden"
            >
              <div
                className={cn(
                  'flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors',
                  isDrift ? 'bg-[hsl(var(--grade-c)/.04)]' : 'bg-secondary/20'
                )}
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                <div className="flex items-center gap-2.5">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-foreground">{seg.segment}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{seg.metric}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-muted-foreground">Baseline</div>
                    <div className="text-sm font-mono font-bold text-foreground">
                      {seg.baseline}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-muted-foreground">Current</div>
                    <div className="text-sm font-mono font-bold text-foreground">
                      {seg.current}%
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-mono font-bold px-2 py-0.5 rounded-md',
                      seg.delta < 0
                        ? 'text-[hsl(var(--grade-f))] bg-[hsl(var(--grade-f)/.08)]'
                        : 'text-[hsl(var(--grade-c))] bg-[hsl(var(--grade-c)/.08)]'
                    )}
                  >
                    {seg.delta > 0 ? '+' : ''}
                    {seg.delta}pp
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-3 border-t border-border/20 space-y-3 animate-fade-in">
                  {/* Root cause analysis */}
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                      Root Cause Analysis
                    </div>
                    <div className="space-y-2">
                      {seg.rootCauses.map((cause, ci) => (
                        <div key={ci} className="flex items-center gap-2">
                          <div className="flex-1 h-4 bg-secondary/50 rounded overflow-hidden relative">
                            <div
                              className="h-full bg-primary/40 rounded"
                              style={{ width: `${cause.weight * 100}%` }}
                            />
                            <span className="absolute inset-y-0 left-2 flex items-center text-[9px] font-mono text-foreground">
                              {cause.factor}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground w-8 text-right flex-shrink-0">
                            {Math.round(cause.weight * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-1">
                      Recommendation
                    </div>
                    <div className="text-xs text-foreground">{seg.recommendation}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Retraining Log ─── */
function RetrainingLog() {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  return (
    <div className="glass-card p-5 animate-fade-in space-y-4">
      <div className="metric-label flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <GitBranch className="w-3 h-3 text-primary" />
        </div>
        Retraining Log
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border/40" />

        <div className="space-y-3">
          {retrainingLog.map((entry) => {
            const isExpanded = expandedVersion === entry.version;
            return (
              <div key={entry.version} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-1.5 top-3.5 w-3 h-3 rounded-full border-2 border-card',
                    entry === retrainingLog[0] ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />

                <div
                  className="rounded-lg border border-border/30 overflow-hidden cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedVersion(isExpanded ? null : entry.version)}
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      )}
                      <div>
                        <div className="text-sm font-mono font-bold text-foreground">
                          {entry.version}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{entry.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-secondary/50">
                        {entry.trigger}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-border/20 pt-2 animate-fade-in">
                      <div className="space-y-1.5">
                        {entry.changes.map((change, ci) => (
                          <div
                            key={ci}
                            className="flex items-center gap-2 p-2 rounded bg-secondary/20"
                          >
                            <span className="text-[10px] text-foreground font-medium w-32 flex-shrink-0">
                              {change.dimension}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground w-12 text-right flex-shrink-0">
                              {Math.round(change.oldWeight * 100)}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span
                              className={cn(
                                'text-[10px] font-mono font-bold w-12 flex-shrink-0',
                                change.newWeight > change.oldWeight
                                  ? 'text-[hsl(var(--grade-a))]'
                                  : change.newWeight < change.oldWeight
                                    ? 'text-[hsl(var(--grade-f))]'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {Math.round(change.newWeight * 100)}%
                            </span>
                            <span className="text-[9px] text-muted-foreground flex-1 truncate">
                              {change.reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ModelHealth() {
  const { role } = useRole();

  if (role === 'rep' || role === 'manager') {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="glass-card p-8 text-center animate-fade-in">
          <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">Model Health</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Model governance and drift monitoring is available to Revenue Operations and Executives.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Model Health</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          Governance & drift monitoring
        </p>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Calibration"
          value="4.2%"
          subValue="Within 5% tolerance"
          icon={<CheckCircle className="w-4 h-4" />}
          variant="success"
        />
        <MetricCard
          label="Data Completeness"
          value="94.2%"
          subValue="Avg across pipeline"
          icon={<Activity className="w-4 h-4" />}
          variant="success"
        />
        <MetricCard
          label="Segment Drift"
          value="3 alerts"
          subValue="Mid-Market win rate shifted -3.2pp"
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="warning"
        />
        <MetricCard
          label="Model Version"
          value="v2.4.1"
          subValue="Last trained 3d ago"
          icon={<RefreshCw className="w-4 h-4" />}
          variant="primary"
        />
      </div>

      {/* Calibration chart */}
      <CalibrationChart />

      {/* Drift monitor */}
      <DriftMonitor />

      {/* Retraining log */}
      <RetrainingLog />
    </div>
  );
}
