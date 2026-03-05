import { useMemo } from 'react';
import { useRole, Role } from '@/contexts/RoleContext';
import { useSalesTargets } from '@/contexts/SalesTargetContext';
import {
  pipelineDeals,
  getPipelineSummary,
  SALES_MANAGERS,
  getManagerTargetSummary,
  DEFAULT_REP_TARGETS,
} from '@/data/demo-data';
import { useProductFilter } from '@/contexts/ProductFilterContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, fmt } from '@/lib/utils';

interface OKR {
  label: string;
  value: string;
  target?: string;
  progress: number; // 0-100
  trend: 'up' | 'down' | 'flat';
  status: 'on-track' | 'at-risk' | 'behind';
  detail: string;
}

function getRepOKRs(
  repName: string,
  targets: Record<string, number>,
  deals: typeof pipelineDeals
): OKR[] {
  const myDeals = deals.filter((d) => d.rep === repName);
  const weighted = myDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const target = targets[repName] || DEFAULT_REP_TARGETS[repName] || 0;
  const attPct = target > 0 ? Math.round((weighted / target) * 100) : 0;
  const avgPQS = myDeals.length
    ? Math.round(myDeals.reduce((s, d) => s + d.pqScore, 0) / myDeals.length)
    : 0;
  const closeableThisMonth = myDeals.filter(
    (d) => d.stage === 'Negotiation' && d.probabilities.win > 0.4
  ).length;
  const overdueActions = myDeals.filter(
    (d) => d.daysInStage > 14 && d.nextActions.length > 0
  ).length;

  return [
    {
      label: 'Quota Attainment',
      value: fmt(weighted),
      target: fmt(target),
      progress: Math.min(attPct, 100),
      trend: attPct >= 80 ? 'up' : attPct >= 50 ? 'flat' : 'down',
      status: attPct >= 80 ? 'on-track' : attPct >= 50 ? 'at-risk' : 'behind',
      detail: `${attPct}% of ${fmt(target)} annual target`,
    },
    {
      label: 'Deals Ready to Close',
      value: `${closeableThisMonth}`,
      progress: Math.min(closeableThisMonth * 20, 100),
      trend: closeableThisMonth >= 3 ? 'up' : 'flat',
      status: closeableThisMonth >= 3 ? 'on-track' : closeableThisMonth >= 1 ? 'at-risk' : 'behind',
      detail: `${closeableThisMonth} in Negotiation with >40% win prob`,
    },
    {
      label: 'Avg Deal Quality',
      value: `${avgPQS}`,
      progress: avgPQS,
      trend: avgPQS >= 55 ? 'up' : 'flat',
      status: avgPQS >= 65 ? 'on-track' : avgPQS >= 50 ? 'at-risk' : 'behind',
      detail: `PQS ${avgPQS}/100 across ${myDeals.length} deals`,
    },
    {
      label: 'Deals Needing Action',
      value: `${overdueActions}`,
      progress: Math.max(0, 100 - overdueActions * 15),
      trend: overdueActions <= 2 ? 'up' : 'down',
      status: overdueActions <= 2 ? 'on-track' : overdueActions <= 5 ? 'at-risk' : 'behind',
      detail: `${overdueActions} deals stalled >14 days with pending actions`,
    },
  ];
}

function getManagerOKRs(targets: Record<string, number>, deals: typeof pipelineDeals): OKR[] {
  const allSummaries = SALES_MANAGERS.map((m) => getManagerTargetSummary(deals, m, targets));
  const totalWeighted = allSummaries.reduce((s, m) => s + m.weightedPipeline, 0);
  const totalTarget = allSummaries.reduce((s, m) => s + m.teamTarget, 0);
  const orgAtt = totalTarget > 0 ? Math.round((totalWeighted / totalTarget) * 100) : 0;
  const repsOnTrack = allSummaries
    .flatMap((m) => m.repSummaries)
    .filter((r) => r.attainmentPct >= 70).length;
  const totalReps = allSummaries.flatMap((m) => m.repSummaries).length;
  const avgPQS = Math.round(allSummaries.reduce((s, m) => s + m.avgPQS, 0) / allSummaries.length);
  const totalAtRisk = allSummaries.reduce((s, m) => s + m.atRisk, 0);

  return [
    {
      label: 'Team Quota Attainment',
      value: fmt(totalWeighted),
      target: fmt(totalTarget),
      progress: Math.min(orgAtt, 100),
      trend: orgAtt >= 75 ? 'up' : orgAtt >= 50 ? 'flat' : 'down',
      status: orgAtt >= 75 ? 'on-track' : orgAtt >= 50 ? 'at-risk' : 'behind',
      detail: `${orgAtt}% weighted pipeline vs ${fmt(totalTarget)} target`,
    },
    {
      label: 'Reps On Track',
      value: `${repsOnTrack}/${totalReps}`,
      progress: Math.round((repsOnTrack / totalReps) * 100),
      trend: repsOnTrack >= totalReps * 0.7 ? 'up' : 'flat',
      status:
        repsOnTrack >= totalReps * 0.7
          ? 'on-track'
          : repsOnTrack >= totalReps * 0.5
            ? 'at-risk'
            : 'behind',
      detail: `${repsOnTrack} of ${totalReps} reps at ≥70% attainment`,
    },
    {
      label: 'Team Deal Quality',
      value: `${avgPQS}`,
      progress: avgPQS,
      trend: avgPQS >= 55 ? 'up' : 'flat',
      status: avgPQS >= 60 ? 'on-track' : avgPQS >= 45 ? 'at-risk' : 'behind',
      detail: `Avg PQS ${avgPQS}/100 across all teams`,
    },
    {
      label: 'At-Risk Deals',
      value: `${totalAtRisk}`,
      progress: Math.max(0, 100 - totalAtRisk * 3),
      trend: totalAtRisk <= 10 ? 'up' : 'down',
      status: totalAtRisk <= 10 ? 'on-track' : totalAtRisk <= 20 ? 'at-risk' : 'behind',
      detail: `${totalAtRisk} deals scoring below PQS 40`,
    },
  ];
}

function getExecOKRs(targets: Record<string, number>, deals: typeof pipelineDeals): OKR[] {
  const summary = getPipelineSummary(deals);
  const totalTarget =
    Object.values(targets).reduce((s, t) => s + t, 0) ||
    Object.values(DEFAULT_REP_TARGETS).reduce((s, t) => s + t, 0);
  const orgAtt = totalTarget > 0 ? Math.round((summary.qualityAdjusted / totalTarget) * 100) : 0;
  const coverageRatio = totalTarget > 0 ? summary.totalACV / totalTarget : 0;
  const winRate =
    deals.length > 0
      ? Math.round((deals.reduce((s, d) => s + d.probabilities.win, 0) / deals.length) * 100)
      : 0;

  return [
    {
      label: 'Revenue vs Plan',
      value: fmt(summary.qualityAdjusted),
      target: fmt(totalTarget),
      progress: Math.min(orgAtt, 100),
      trend: orgAtt >= 80 ? 'up' : orgAtt >= 60 ? 'flat' : 'down',
      status: orgAtt >= 80 ? 'on-track' : orgAtt >= 60 ? 'at-risk' : 'behind',
      detail: `${orgAtt}% quality-adjusted vs ${fmt(totalTarget)} plan`,
    },
    {
      label: 'Pipeline Coverage',
      value: `${coverageRatio.toFixed(1)}x`,
      target: '3.0x',
      progress: Math.min(Math.round((coverageRatio / 3) * 100), 100),
      trend: coverageRatio >= 3 ? 'up' : coverageRatio >= 2 ? 'flat' : 'down',
      status: coverageRatio >= 3 ? 'on-track' : coverageRatio >= 2 ? 'at-risk' : 'behind',
      detail: `${fmt(summary.totalACV)} pipeline / ${fmt(totalTarget)} target`,
    },
    {
      label: 'Avg Win Rate',
      value: `${winRate}%`,
      progress: winRate,
      trend: winRate >= 35 ? 'up' : winRate >= 25 ? 'flat' : 'down',
      status: winRate >= 35 ? 'on-track' : winRate >= 25 ? 'at-risk' : 'behind',
      detail: `${winRate}% weighted avg across ${deals.length} deals`,
    },
    {
      label: 'Forecast Confidence',
      value: `${fmt(summary.confidenceBand.low)} – ${fmt(summary.confidenceBand.high)}`,
      progress: Math.min(Math.round(summary.avgPQS * 1.2), 100),
      trend: summary.avgPQS >= 55 ? 'up' : 'flat',
      status: summary.avgPQS >= 60 ? 'on-track' : summary.avgPQS >= 45 ? 'at-risk' : 'behind',
      detail: `80% confidence band · Avg PQS ${summary.avgPQS}`,
    },
  ];
}

function getRevOpsOKRs(deals: typeof pipelineDeals): OKR[] {
  const summary = getPipelineSummary(deals);
  const withGaps = deals.filter(
    (d) => d.personaGaps.length > 0 || d.missingSteps.length > 0
  ).length;
  const completeness = Math.round(((deals.length - withGaps) / deals.length) * 100);
  const stageCompliance = Math.round(
    (deals.filter((d) => d.missingSteps.length === 0).length / deals.length) * 100
  );
  const multiThreaded = Math.round(
    (deals.filter((d) => d.personaGaps.length === 0).length / deals.length) * 100
  );

  return [
    {
      label: 'Model Accuracy (PQS)',
      value: `${summary.avgPQS}`,
      target: '60+',
      progress: Math.min(Math.round((summary.avgPQS / 60) * 100), 100),
      trend: summary.avgPQS >= 55 ? 'up' : 'flat',
      status: summary.avgPQS >= 60 ? 'on-track' : summary.avgPQS >= 45 ? 'at-risk' : 'behind',
      detail: `Avg PQS ${summary.avgPQS} against 60+ calibration target`,
    },
    {
      label: 'Data Completeness',
      value: `${completeness}%`,
      progress: completeness,
      trend: completeness >= 70 ? 'up' : 'flat',
      status: completeness >= 80 ? 'on-track' : completeness >= 60 ? 'at-risk' : 'behind',
      detail: `${deals.length - withGaps}/${deals.length} deals fully profiled`,
    },
    {
      label: 'Stage Compliance',
      value: `${stageCompliance}%`,
      progress: stageCompliance,
      trend: stageCompliance >= 60 ? 'up' : 'down',
      status: stageCompliance >= 70 ? 'on-track' : stageCompliance >= 50 ? 'at-risk' : 'behind',
      detail: `${stageCompliance}% of deals have all required steps complete`,
    },
    {
      label: 'Multi-Thread Coverage',
      value: `${multiThreaded}%`,
      progress: multiThreaded,
      trend: multiThreaded >= 50 ? 'up' : 'down',
      status: multiThreaded >= 60 ? 'on-track' : multiThreaded >= 40 ? 'at-risk' : 'behind',
      detail: `${multiThreaded}% of deals have full persona coverage`,
    },
  ];
}

function OKRCard({ okr }: { okr: OKR }) {
  const TrendIcon = okr.trend === 'up' ? TrendingUp : okr.trend === 'down' ? TrendingDown : Minus;
  const statusColor =
    okr.status === 'on-track' ? 'grade-a' : okr.status === 'at-risk' ? 'grade-c' : 'grade-f';

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-start justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
          {okr.label}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded',
            `bg-[hsl(var(--${statusColor})/.1)] text-[hsl(var(--${statusColor}))]`
          )}
        >
          <TrendIcon className="w-2.5 h-2.5" />
          {okr.status === 'on-track' ? 'On Track' : okr.status === 'at-risk' ? 'At Risk' : 'Behind'}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xl font-mono font-bold text-foreground">{okr.value}</span>
        {okr.target && (
          <span className="text-xs font-mono text-muted-foreground">/ {okr.target}</span>
        )}
      </div>
      <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden mb-2">
        <div
          className={cn('h-full rounded-full transition-all', `bg-[hsl(var(--${statusColor}))]`)}
          style={{ width: `${Math.min(okr.progress, 100)}%` }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground font-mono">{okr.detail}</div>
    </div>
  );
}

export function OKRTracker() {
  const { role, currentRep } = useRole();
  const { targets } = useSalesTargets();
  const { filteredDeals, isFiltered } = useProductFilter();
  const deals = isFiltered ? filteredDeals : pipelineDeals;

  const okrs = useMemo(() => {
    switch (role) {
      case 'rep':
        return getRepOKRs(currentRep, targets, deals);
      case 'manager':
        return getManagerOKRs(targets, deals);
      case 'exec':
      case 'admin':
        return getExecOKRs(targets, deals);
      case 'revops':
        return getRevOpsOKRs(deals);
    }
  }, [role, deals, targets]);

  const roleLabel: Record<Role, string> = {
    rep: 'My OKRs',
    manager: 'Team OKRs',
    exec: 'Revenue OKRs',
    revops: 'Operations OKRs',
    admin: 'System OKRs',
  };

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        {roleLabel[role]}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {okrs.map((okr) => (
          <OKRCard key={okr.label} okr={okr} />
        ))}
      </div>
    </div>
  );
}
