/**
 * Analytics Engine — Pipeline velocity, conversion rates, cohort analysis,
 * rep benchmarking, trend analysis, and forecasting.
 *
 * This is the "nice analytics" layer that turns flat deal data into
 * actionable intelligence with drill-down capability.
 */

import { pipelineDeals, type Deal, type Segment, type ForecastCategory } from './demo-data.js';
import { repProfiles, type RepProfile } from './deep-reps.js';
import { accounts } from './deep-accounts.js';

// ---------------------------------------------------------------------------
// Pipeline Velocity
// ---------------------------------------------------------------------------

export interface StageVelocity {
  stage: string;
  dealCount: number;
  totalACV: number;
  avgDaysInStage: number;
  medianDaysInStage: number;
  conversionRate: number;      // % that advance to next stage
  avgACVPerDeal: number;
  atRiskCount: number;         // stalled beyond benchmark
  benchmark: number;           // expected days in stage
}

export function getPipelineVelocity(deals: Deal[] = pipelineDeals): StageVelocity[] {
  const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
  const benchmarks: Record<string, number> = { Discovery: 10, Qualification: 14, Proposal: 21, Negotiation: 14 };

  return stages.map((stage, idx) => {
    const stageDeals = deals.filter(d => d.stage === stage);
    const days = stageDeals.map(d => d.daysInStage).sort((a, b) => a - b);
    const avgDays = days.length ? Math.round(days.reduce((s, d) => s + d, 0) / days.length) : 0;
    const median = days.length ? days[Math.floor(days.length / 2)] : 0;
    const benchmark = benchmarks[stage] || 14;

    // Conversion = deals in next stage / (deals in this stage + deals in next stage)
    const nextStage = stages[idx + 1];
    const nextCount = nextStage ? deals.filter(d => d.stage === nextStage).length : 0;
    const conversionRate = stageDeals.length + nextCount > 0
      ? +(nextCount / (stageDeals.length + nextCount) * 100).toFixed(1)
      : 0;

    return {
      stage,
      dealCount: stageDeals.length,
      totalACV: stageDeals.reduce((s, d) => s + d.acv, 0),
      avgDaysInStage: avgDays,
      medianDaysInStage: median,
      conversionRate,
      avgACVPerDeal: stageDeals.length ? Math.round(stageDeals.reduce((s, d) => s + d.acv, 0) / stageDeals.length) : 0,
      atRiskCount: stageDeals.filter(d => d.daysInStage > benchmark * 1.5).length,
      benchmark,
    };
  });
}

// ---------------------------------------------------------------------------
// Win/Loss Analysis
// ---------------------------------------------------------------------------

export interface WinLossPattern {
  factor: string;
  winRate: number;
  dealCount: number;
  avgACV: number;
  insight: string;
}

export function getWinLossPatterns(deals: Deal[] = pipelineDeals): WinLossPattern[] {
  const patterns: WinLossPattern[] = [];

  // By segment
  const segments: Segment[] = ['Enterprise', 'Mid-Market', 'SMB'];
  segments.forEach(seg => {
    const segDeals = deals.filter(d => d.segment === seg);
    const avgWin = segDeals.length ? +(segDeals.reduce((s, d) => s + d.probabilities.win, 0) / segDeals.length).toFixed(2) : 0;
    patterns.push({
      factor: `${seg} segment`,
      winRate: avgWin,
      dealCount: segDeals.length,
      avgACV: segDeals.length ? Math.round(segDeals.reduce((s, d) => s + d.acv, 0) / segDeals.length) : 0,
      insight: seg === 'Enterprise' ? 'Longer cycles but higher ACV. Champion engagement critical.'
        : seg === 'Mid-Market' ? 'Sweet spot for velocity + value balance.'
        : 'Fast cycles but watch for churn risk.',
    });
  });

  // By source
  const sources = ['Inbound', 'Outbound', 'Partner', 'Expansion'] as const;
  sources.forEach(src => {
    const srcDeals = deals.filter(d => d.source === src);
    const avgWin = srcDeals.length ? +(srcDeals.reduce((s, d) => s + d.probabilities.win, 0) / srcDeals.length).toFixed(2) : 0;
    patterns.push({
      factor: `${src} source`,
      winRate: avgWin,
      dealCount: srcDeals.length,
      avgACV: srcDeals.length ? Math.round(srcDeals.reduce((s, d) => s + d.acv, 0) / srcDeals.length) : 0,
      insight: src === 'Expansion' ? 'Highest win rate — existing customers convert fast.'
        : src === 'Partner' ? 'Partner deals have built-in trust. Leverage for new logos.'
        : src === 'Inbound' ? 'Strong intent signal. Speed to lead matters.'
        : 'Requires more nurturing. Focus on ICP-fit prospects.',
    });
  });

  // With vs without competitor
  const withComp = deals.filter(d => d.competitor !== null);
  const noComp = deals.filter(d => d.competitor === null);
  patterns.push({
    factor: 'Competitive deal',
    winRate: withComp.length ? +(withComp.reduce((s, d) => s + d.probabilities.win, 0) / withComp.length).toFixed(2) : 0,
    dealCount: withComp.length,
    avgACV: withComp.length ? Math.round(withComp.reduce((s, d) => s + d.acv, 0) / withComp.length) : 0,
    insight: 'Use competitive battlecards. Focus on differentiation in safety AI and time-lapse.',
  });
  patterns.push({
    factor: 'No competitor',
    winRate: noComp.length ? +(noComp.reduce((s, d) => s + d.probabilities.win, 0) / noComp.length).toFixed(2) : 0,
    dealCount: noComp.length,
    avgACV: noComp.length ? Math.round(noComp.reduce((s, d) => s + d.acv, 0) / noComp.length) : 0,
    insight: 'Greenfield opportunity. Educate on category value, not just product.',
  });

  // Champion coverage
  const withChamp = deals.filter(d => !d.personaGaps.some(g => g.includes('Champion')));
  const noChamp = deals.filter(d => d.personaGaps.some(g => g.includes('Champion')));
  patterns.push({
    factor: 'Champion identified',
    winRate: withChamp.length ? +(withChamp.reduce((s, d) => s + d.probabilities.win, 0) / withChamp.length).toFixed(2) : 0,
    dealCount: withChamp.length,
    avgACV: withChamp.length ? Math.round(withChamp.reduce((s, d) => s + d.acv, 0) / withChamp.length) : 0,
    insight: 'Champion presence increases win rate by ~35%. Prioritise champion development.',
  });
  patterns.push({
    factor: 'No champion',
    winRate: noChamp.length ? +(noChamp.reduce((s, d) => s + d.probabilities.win, 0) / noChamp.length).toFixed(2) : 0,
    dealCount: noChamp.length,
    avgACV: noChamp.length ? Math.round(noChamp.reduce((s, d) => s + d.acv, 0) / noChamp.length) : 0,
    insight: 'High risk without internal champion. Coach reps to identify and develop one.',
  });

  return patterns.sort((a, b) => b.winRate - a.winRate);
}

// ---------------------------------------------------------------------------
// Forecast Analysis
// ---------------------------------------------------------------------------

export interface ForecastAnalysis {
  category: ForecastCategory;
  dealCount: number;
  totalACV: number;
  weightedACV: number;
  avgWinProb: number;
  avgPQS: number;
  riskDeals: number;          // deals with PQS < 40
  topDeals: Array<{ company: string; acv: number; pqs: number; rep: string }>;
}

export function getForecastAnalysis(deals: Deal[] = pipelineDeals): ForecastAnalysis[] {
  const categories: ForecastCategory[] = ['Commit', 'Best Case', 'Pipeline', 'Omit'];
  return categories.map(cat => {
    const catDeals = deals.filter(d => d.forecastCategory === cat);
    return {
      category: cat,
      dealCount: catDeals.length,
      totalACV: catDeals.reduce((s, d) => s + d.acv, 0),
      weightedACV: Math.round(catDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0)),
      avgWinProb: catDeals.length ? +(catDeals.reduce((s, d) => s + d.probabilities.win, 0) / catDeals.length).toFixed(2) : 0,
      avgPQS: catDeals.length ? Math.round(catDeals.reduce((s, d) => s + d.pqScore, 0) / catDeals.length) : 0,
      riskDeals: catDeals.filter(d => d.pqScore < 40).length,
      topDeals: [...catDeals].sort((a, b) => b.acv - a.acv).slice(0, 5).map(d => ({
        company: d.company, acv: d.acv, pqs: d.pqScore, rep: d.rep,
      })),
    };
  });
}

// ---------------------------------------------------------------------------
// Rep Benchmarking
// ---------------------------------------------------------------------------

export interface RepBenchmark {
  metric: string;
  teamAvg: number;
  teamMedian: number;
  topPerformer: { name: string; value: number };
  bottomPerformer: { name: string; value: number };
  unit: string;
}

export function getRepBenchmarks(): RepBenchmark[] {
  const reps = repProfiles;
  if (reps.length === 0) return [];

  function benchmark(metric: string, getValue: (r: RepProfile) => number, unit: string): RepBenchmark {
    const values = reps.map(r => ({ name: r.name, value: getValue(r) }));
    const sorted = [...values].sort((a, b) => b.value - a.value);
    const nums = values.map(v => v.value).sort((a, b) => a - b);
    return {
      metric,
      teamAvg: Math.round(nums.reduce((s, n) => s + n, 0) / nums.length),
      teamMedian: nums[Math.floor(nums.length / 2)],
      topPerformer: sorted[0],
      bottomPerformer: sorted[sorted.length - 1],
      unit,
    };
  }

  return [
    benchmark('Pipeline ACV', r => r.totalPipelineACV, '€'),
    benchmark('Weighted Pipeline', r => r.weightedPipeline, '€'),
    benchmark('Avg PQS', r => r.avgPQS, 'pts'),
    benchmark('Active Deals', r => r.activeDealCount, 'deals'),
    benchmark('At-Risk Deals', r => r.atRiskDeals, 'deals'),
    benchmark('Win Rate', r => r.currentQuarterPerformance.winRate * 100, '%'),
    benchmark('Avg Deal Size', r => r.currentQuarterPerformance.avgDealSize, '€'),
    benchmark('Avg Cycle (days)', r => r.currentQuarterPerformance.avgCycleLength, 'days'),
    benchmark('Meetings/Week', r => r.activityMetrics.avgMeetingsPerWeek, '/wk'),
    benchmark('Q Attainment', r => r.currentQuarterPerformance.attainmentPct, '%'),
  ];
}

// ---------------------------------------------------------------------------
// Cohort Analysis
// ---------------------------------------------------------------------------

export interface CohortData {
  cohort: string;
  dealCount: number;
  totalACV: number;
  avgPQS: number;
  avgWinProb: number;
  avgDaysInPipeline: number;
  topStage: string;
  riskPct: number;
}

export function getCohortAnalysis(deals: Deal[] = pipelineDeals): {
  bySegment: CohortData[];
  bySource: CohortData[];
  byProduct: CohortData[];
  byCountry: CohortData[];
} {
  function buildCohort(label: string, cohortDeals: Deal[]): CohortData {
    if (cohortDeals.length === 0) return { cohort: label, dealCount: 0, totalACV: 0, avgPQS: 0, avgWinProb: 0, avgDaysInPipeline: 0, topStage: '-', riskPct: 0 };
    const stageCount: Record<string, number> = {};
    cohortDeals.forEach(d => { stageCount[d.stage] = (stageCount[d.stage] || 0) + 1; });
    const topStage = Object.entries(stageCount).sort((a, b) => b[1] - a[1])[0][0];
    return {
      cohort: label,
      dealCount: cohortDeals.length,
      totalACV: cohortDeals.reduce((s, d) => s + d.acv, 0),
      avgPQS: Math.round(cohortDeals.reduce((s, d) => s + d.pqScore, 0) / cohortDeals.length),
      avgWinProb: +(cohortDeals.reduce((s, d) => s + d.probabilities.win, 0) / cohortDeals.length).toFixed(2),
      avgDaysInPipeline: Math.round(cohortDeals.reduce((s, d) => s + d.daysInStage, 0) / cohortDeals.length),
      topStage,
      riskPct: Math.round(cohortDeals.filter(d => d.pqScore < 40).length / cohortDeals.length * 100),
    };
  }

  return {
    bySegment: ['Enterprise', 'Mid-Market', 'SMB'].map(s => buildCohort(s, deals.filter(d => d.segment === s))),
    bySource: ['Inbound', 'Outbound', 'Partner', 'Expansion'].map(s => buildCohort(s, deals.filter(d => d.source === s))),
    byProduct: ['Enterprise Visibility', 'Project Pro', 'Safety & Compliance', 'Site Starter'].map(b => buildCohort(b, deals.filter(d => d.productBundle === b))),
    byCountry: ['IE', 'GB', 'DE', 'AU', 'US', 'FR'].map(c => buildCohort(c, deals.filter(d => d.country === c))),
  };
}

// ---------------------------------------------------------------------------
// Trend Analysis (Simulated Historical)
// ---------------------------------------------------------------------------

export interface TrendPoint {
  period: string;
  pipeline: number;
  weighted: number;
  newDeals: number;
  wonDeals: number;
  lostDeals: number;
  avgPQS: number;
  winRate: number;
}

export function getPipelineTrends(): TrendPoint[] {
  // Generate 12 months of simulated historical data
  const months = ['Mar 25', 'Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26'];
  let basePipeline = 65_000_000;
  const r = (min: number, max: number) => Math.random() * (max - min) + min;

  return months.map((month, i) => {
    const growth = 1 + r(-0.05, 0.08);
    basePipeline = Math.round(basePipeline * growth);
    const weighted = Math.round(basePipeline * r(0.25, 0.40));
    const newDeals = Math.round(40 + r(-10, 20) + i * 2);
    const wonDeals = Math.round(15 + r(-5, 10));
    const lostDeals = Math.round(8 + r(-3, 5));
    const avgPQS = Math.round(48 + r(-5, 10) + i * 0.5);
    const winRate = +(r(0.22, 0.38) + i * 0.005).toFixed(2);

    return { period: month, pipeline: basePipeline, weighted, newDeals, wonDeals, lostDeals, avgPQS, winRate };
  });
}

// ---------------------------------------------------------------------------
// Account Analytics
// ---------------------------------------------------------------------------

export interface AccountAnalytics {
  totalAccounts: number;
  byTier: Record<string, number>;
  bySegment: Record<string, number>;
  avgHealthScore: number;
  atRiskAccounts: number;
  expansionReady: number;
  totalLTV: number;
  avgLTV: number;
  topAccountsByPipeline: Array<{ name: string; pipelineACV: number; dealCount: number; healthScore: number }>;
}

export function getAccountAnalytics(): AccountAnalytics {
  const accs = accounts;
  const byTier: Record<string, number> = {};
  const bySegment: Record<string, number> = {};
  accs.forEach(a => {
    byTier[a.tier] = (byTier[a.tier] || 0) + 1;
    bySegment[a.segment] = (bySegment[a.segment] || 0) + 1;
  });

  const topByPipeline = accs.map(a => {
    const aDeals = pipelineDeals.filter(d => d.company.startsWith(a.name));
    return {
      name: a.name,
      pipelineACV: aDeals.reduce((s, d) => s + d.acv, 0),
      dealCount: aDeals.length,
      healthScore: a.engagement.healthScore,
    };
  }).sort((a, b) => b.pipelineACV - a.pipelineACV).slice(0, 10);

  return {
    totalAccounts: accs.length,
    byTier, bySegment,
    avgHealthScore: Math.round(accs.reduce((s, a) => s + a.engagement.healthScore, 0) / accs.length),
    atRiskAccounts: accs.filter(a => a.engagement.churnRisk === 'high').length,
    expansionReady: accs.filter(a => a.engagement.expansionPotential === 'high').length,
    totalLTV: accs.reduce((s, a) => s + a.engagement.lifetimeValue, 0),
    avgLTV: Math.round(accs.reduce((s, a) => s + a.engagement.lifetimeValue, 0) / accs.length),
    topAccountsByPipeline: topByPipeline,
  };
}

// ---------------------------------------------------------------------------
// Summary Dashboard Data
// ---------------------------------------------------------------------------

export function getAnalyticsSummary(deals: Deal[] = pipelineDeals) {
  return {
    velocity: getPipelineVelocity(deals),
    forecast: getForecastAnalysis(deals),
    winLoss: getWinLossPatterns(deals),
    cohorts: getCohortAnalysis(deals),
    trends: getPipelineTrends(),
    repBenchmarks: getRepBenchmarks(),
    accountAnalytics: getAccountAnalytics(),
  };
}
