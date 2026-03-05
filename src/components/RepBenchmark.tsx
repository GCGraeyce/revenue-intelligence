import { useMemo, useState } from 'react';
import { pipelineDeals, SALES_MANAGERS, type Deal } from '@/data/demo-data';
import { repProfiles, type RepProfile } from '@/data/deep-reps';
import { useRole } from '@/contexts/RoleContext';
import {
  BarChart2,
  Trophy,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  Package,
  Layers,
  Award,
  Crown,
  Gauge,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { fmt } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BenchmarkMetric {
  key: string;
  label: string;
  you: number;
  avg: number;
  top10Avg: number;
  leader: number;
  leaderName: string;
  unit: string;
  higherIsBetter: boolean;
  category: 'performance' | 'activity' | 'quality' | 'velocity';
}

type CompareMode = 'leader' | 'top10';

// ---------------------------------------------------------------------------
// World-class SaaS benchmarks (industry data)
// ---------------------------------------------------------------------------

const WORLD_CLASS_BENCHMARKS: Record<
  string,
  { p50: number; p75: number; p90: number; unit: string; label: string }
> = {
  winRate: { p50: 0.2, p75: 0.28, p90: 0.35, unit: '%', label: 'Win Rate' },
  avgCycle: { p50: 65, p75: 45, p90: 30, unit: 'days', label: 'Avg Sales Cycle' },
  pipelineCoverage: { p50: 2.5, p75: 3.5, p90: 4.5, unit: 'x', label: 'Pipeline Coverage' },
  meetingsPerDeal: { p50: 4, p75: 6, p90: 9, unit: '', label: 'Avg Meetings / Deal' },
  multiThread: { p50: 2.0, p75: 3.0, p90: 4.2, unit: '', label: 'Avg Stakeholders / Deal' },
  discoveryToProposal: {
    p50: 0.35,
    p75: 0.5,
    p90: 0.65,
    unit: '%',
    label: 'Disco→Proposal Conversion',
  },
  proposalToClose: {
    p50: 0.25,
    p75: 0.38,
    p90: 0.52,
    unit: '%',
    label: 'Proposal→Close Conversion',
  },
  dealExpansion: { p50: 0.08, p75: 0.15, p90: 0.25, unit: '%', label: 'Deal Expansion Rate' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtMetric(value: number, unit: string): string {
  if (unit === '€') return fmt(value);
  if (unit === '%') return `${Math.round(value * 100)}%`;
  if (unit === '%attain') return `${Math.round(value)}%`;
  if (unit === 'days') return `${Math.round(value)}d`;
  if (unit === '/wk') return `${value.toFixed(1)}/wk`;
  if (unit === 'x') return `${value.toFixed(1)}x`;
  return `${Math.round(value * 10) / 10}`;
}

function getDelta(you: number, ref: number, higherIsBetter: boolean): 'better' | 'worse' | 'same' {
  const threshold = Math.abs(ref) * 0.05;
  const diff = you - ref;
  if (Math.abs(diff) < threshold) return 'same';
  if (higherIsBetter) return diff > 0 ? 'better' : 'worse';
  return diff < 0 ? 'better' : 'worse';
}

// ---------------------------------------------------------------------------
// Compute benchmarks for a given rep against peers
// ---------------------------------------------------------------------------

function computeBenchmarks(
  repName: string,
  allProfiles: RepProfile[],
  allDeals: Deal[]
): BenchmarkMetric[] {
  const you = allProfiles.find((r) => r.name === repName);
  if (!you || allProfiles.length < 2) return [];

  const activeProfiles = allProfiles.filter((r) => r.status === 'active');
  if (activeProfiles.length === 0) return [];

  const yourDeals = allDeals.filter((d) => d.rep === repName);

  // Top 10% threshold (at least 1 rep)
  const top10Count = Math.max(1, Math.ceil(activeProfiles.length * 0.1));

  function topN<T>(arr: T[], sortFn: (a: T, b: T) => number, n: number): T[] {
    return [...arr].sort(sortFn).slice(0, n);
  }

  const metrics: BenchmarkMetric[] = [];

  // ── PERFORMANCE METRICS ──

  // 1. Active Deals
  const dealCounts = activeProfiles.map((r) => r.activeDealCount);
  const dealsSorted = topN(
    activeProfiles,
    (a, b) => b.activeDealCount - a.activeDealCount,
    top10Count
  );
  const dealLeader = dealsSorted[0];
  metrics.push({
    key: 'dealCount',
    label: 'Active Deals',
    you: you.activeDealCount,
    avg: dealCounts.reduce((s, v) => s + v, 0) / dealCounts.length,
    top10Avg: dealsSorted.reduce((s, r) => s + r.activeDealCount, 0) / dealsSorted.length,
    leader: dealLeader.activeDealCount,
    leaderName: dealLeader.name,
    unit: '',
    higherIsBetter: true,
    category: 'performance',
  });

  // 2. Pipeline Value
  const pipelineValues = activeProfiles.map((r) => r.totalPipelineACV);
  const pipelineSorted = topN(
    activeProfiles,
    (a, b) => b.totalPipelineACV - a.totalPipelineACV,
    top10Count
  );
  metrics.push({
    key: 'pipeline',
    label: 'Pipeline Value',
    you: you.totalPipelineACV,
    avg: pipelineValues.reduce((s, v) => s + v, 0) / pipelineValues.length,
    top10Avg: pipelineSorted.reduce((s, r) => s + r.totalPipelineACV, 0) / pipelineSorted.length,
    leader: pipelineSorted[0].totalPipelineACV,
    leaderName: pipelineSorted[0].name,
    unit: '€',
    higherIsBetter: true,
    category: 'performance',
  });

  // 3. Weighted Pipeline
  const weightedValues = activeProfiles.map((r) => r.weightedPipeline);
  const weightedSorted = topN(
    activeProfiles,
    (a, b) => b.weightedPipeline - a.weightedPipeline,
    top10Count
  );
  metrics.push({
    key: 'weighted',
    label: 'Weighted Pipeline',
    you: you.weightedPipeline,
    avg: weightedValues.reduce((s, v) => s + v, 0) / weightedValues.length,
    top10Avg: weightedSorted.reduce((s, r) => s + r.weightedPipeline, 0) / weightedSorted.length,
    leader: weightedSorted[0].weightedPipeline,
    leaderName: weightedSorted[0].name,
    unit: '€',
    higherIsBetter: true,
    category: 'performance',
  });

  // 4. Quota Attainment
  const attainments = activeProfiles.map((r) => r.currentQuarterPerformance.attainmentPct);
  const attSorted = topN(
    activeProfiles,
    (a, b) => b.currentQuarterPerformance.attainmentPct - a.currentQuarterPerformance.attainmentPct,
    top10Count
  );
  metrics.push({
    key: 'attainment',
    label: 'Quota Attainment',
    you: you.currentQuarterPerformance.attainmentPct,
    avg: attainments.reduce((s, v) => s + v, 0) / attainments.length,
    top10Avg:
      attSorted.reduce((s, r) => s + r.currentQuarterPerformance.attainmentPct, 0) /
      attSorted.length,
    leader: attSorted[0].currentQuarterPerformance.attainmentPct,
    leaderName: attSorted[0].name,
    unit: '%attain',
    higherIsBetter: true,
    category: 'performance',
  });

  // 5. Win Rate
  const winRates = activeProfiles.map((r) => r.currentQuarterPerformance.winRate);
  const wrSorted = topN(
    activeProfiles,
    (a, b) => b.currentQuarterPerformance.winRate - a.currentQuarterPerformance.winRate,
    top10Count
  );
  metrics.push({
    key: 'winRate',
    label: 'Win Rate',
    you: you.currentQuarterPerformance.winRate,
    avg: winRates.reduce((s, v) => s + v, 0) / winRates.length,
    top10Avg:
      wrSorted.reduce((s, r) => s + r.currentQuarterPerformance.winRate, 0) / wrSorted.length,
    leader: wrSorted[0].currentQuarterPerformance.winRate,
    leaderName: wrSorted[0].name,
    unit: '%',
    higherIsBetter: true,
    category: 'performance',
  });

  // 6. Avg Deal Size
  const dealSizes = activeProfiles.map((r) => r.currentQuarterPerformance.avgDealSize);
  const dsSorted = topN(
    activeProfiles,
    (a, b) => b.currentQuarterPerformance.avgDealSize - a.currentQuarterPerformance.avgDealSize,
    top10Count
  );
  metrics.push({
    key: 'dealSize',
    label: 'Avg Deal Size',
    you: you.currentQuarterPerformance.avgDealSize,
    avg: dealSizes.reduce((s, v) => s + v, 0) / dealSizes.length,
    top10Avg:
      dsSorted.reduce((s, r) => s + r.currentQuarterPerformance.avgDealSize, 0) / dsSorted.length,
    leader: dsSorted[0].currentQuarterPerformance.avgDealSize,
    leaderName: dsSorted[0].name,
    unit: '€',
    higherIsBetter: true,
    category: 'performance',
  });

  // ── VELOCITY METRICS ──

  // 7. Avg Cycle Length (lower is better)
  const cycleLengths = activeProfiles.map((r) => r.currentQuarterPerformance.avgCycleLength);
  const clSorted = topN(
    activeProfiles,
    (a, b) =>
      a.currentQuarterPerformance.avgCycleLength - b.currentQuarterPerformance.avgCycleLength,
    top10Count
  );
  metrics.push({
    key: 'cycleLength',
    label: 'Avg Deal Cycle',
    you: you.currentQuarterPerformance.avgCycleLength,
    avg: cycleLengths.reduce((s, v) => s + v, 0) / cycleLengths.length,
    top10Avg:
      clSorted.reduce((s, r) => s + r.currentQuarterPerformance.avgCycleLength, 0) /
      clSorted.length,
    leader: clSorted[0].currentQuarterPerformance.avgCycleLength,
    leaderName: clSorted[0].name,
    unit: 'days',
    higherIsBetter: false,
    category: 'velocity',
  });

  // 8. Pipeline Coverage (pipeline / quarterly target)
  function pipelineCoverage(r: RepProfile): number {
    const qTarget = r.quota.annual / 4;
    return qTarget > 0 ? r.totalPipelineACV / qTarget : 0;
  }
  const coverages = activeProfiles.map((r) => pipelineCoverage(r));
  const covSorted = topN(
    activeProfiles,
    (a, b) => pipelineCoverage(b) - pipelineCoverage(a),
    top10Count
  );
  metrics.push({
    key: 'coverage',
    label: 'Pipeline Coverage',
    you: pipelineCoverage(you),
    avg: coverages.reduce((s, v) => s + v, 0) / coverages.length,
    top10Avg: covSorted.reduce((s, r) => s + pipelineCoverage(r), 0) / covSorted.length,
    leader: pipelineCoverage(covSorted[0]),
    leaderName: covSorted[0].name,
    unit: 'x',
    higherIsBetter: true,
    category: 'velocity',
  });

  // ── ACTIVITY METRICS ──

  // 9. Meetings per Week
  const meetingRates = activeProfiles.map((r) => r.activityMetrics.avgMeetingsPerWeek);
  const mtSorted = topN(
    activeProfiles,
    (a, b) => b.activityMetrics.avgMeetingsPerWeek - a.activityMetrics.avgMeetingsPerWeek,
    top10Count
  );
  metrics.push({
    key: 'meetings',
    label: 'Meetings / Week',
    you: you.activityMetrics.avgMeetingsPerWeek,
    avg: meetingRates.reduce((s, v) => s + v, 0) / meetingRates.length,
    top10Avg:
      mtSorted.reduce((s, r) => s + r.activityMetrics.avgMeetingsPerWeek, 0) / mtSorted.length,
    leader: mtSorted[0].activityMetrics.avgMeetingsPerWeek,
    leaderName: mtSorted[0].name,
    unit: '/wk',
    higherIsBetter: true,
    category: 'activity',
  });

  // 10. Calls per Week
  const callRates = activeProfiles.map((r) => r.activityMetrics.avgCallsPerWeek);
  const caSorted = topN(
    activeProfiles,
    (a, b) => b.activityMetrics.avgCallsPerWeek - a.activityMetrics.avgCallsPerWeek,
    top10Count
  );
  metrics.push({
    key: 'calls',
    label: 'Calls / Week',
    you: you.activityMetrics.avgCallsPerWeek,
    avg: callRates.reduce((s, v) => s + v, 0) / callRates.length,
    top10Avg: caSorted.reduce((s, r) => s + r.activityMetrics.avgCallsPerWeek, 0) / caSorted.length,
    leader: caSorted[0].activityMetrics.avgCallsPerWeek,
    leaderName: caSorted[0].name,
    unit: '/wk',
    higherIsBetter: true,
    category: 'activity',
  });

  // ── QUALITY METRICS ──

  // 11. Avg Stakeholders per Deal (5 - persona gaps)
  function avgStakeholders(deals: Deal[]): number {
    if (deals.length === 0) return 0;
    const avgGaps = deals.reduce((s, d) => s + d.personaGaps.length, 0) / deals.length;
    return Math.max(0, 5 - avgGaps);
  }
  const allStakeholders = activeProfiles.map((r) => {
    const rd = allDeals.filter((d) => d.rep === r.name);
    return { name: r.name, val: avgStakeholders(rd) };
  });
  const stSorted = [...allStakeholders].sort((a, b) => b.val - a.val).slice(0, top10Count);
  const stakeholderLeader = allStakeholders.reduce((a, b) => (a.val > b.val ? a : b));
  metrics.push({
    key: 'stakeholders',
    label: 'Avg Stakeholders / Deal',
    you: avgStakeholders(yourDeals),
    avg: allStakeholders.reduce((s, v) => s + v.val, 0) / allStakeholders.length,
    top10Avg: stSorted.reduce((s, v) => s + v.val, 0) / stSorted.length,
    leader: stakeholderLeader.val,
    leaderName: stakeholderLeader.name,
    unit: '',
    higherIsBetter: true,
    category: 'quality',
  });

  // 12. Product Mix Breadth
  function productCount(deals: Deal[]): number {
    return new Set(deals.map((d) => d.productBundle)).size;
  }
  const allProdCounts = activeProfiles.map((r) => {
    const rd = allDeals.filter((d) => d.rep === r.name);
    return { name: r.name, val: productCount(rd) };
  });
  const prSorted = [...allProdCounts].sort((a, b) => b.val - a.val).slice(0, top10Count);
  const prodLeader = allProdCounts.reduce((a, b) => (a.val > b.val ? a : b));
  metrics.push({
    key: 'products',
    label: 'Product Mix Breadth',
    you: productCount(yourDeals),
    avg: allProdCounts.reduce((s, v) => s + v.val, 0) / allProdCounts.length,
    top10Avg: prSorted.reduce((s, v) => s + v.val, 0) / prSorted.length,
    leader: prodLeader.val,
    leaderName: prodLeader.name,
    unit: '',
    higherIsBetter: true,
    category: 'quality',
  });

  // 13. Avg PQS
  const pqsValues = activeProfiles.map((r) => r.avgPQS);
  const pqsSorted = topN(activeProfiles, (a, b) => b.avgPQS - a.avgPQS, top10Count);
  metrics.push({
    key: 'avgPQS',
    label: 'Avg PQS',
    you: you.avgPQS,
    avg: pqsValues.reduce((s, v) => s + v, 0) / pqsValues.length,
    top10Avg: pqsSorted.reduce((s, r) => s + r.avgPQS, 0) / pqsSorted.length,
    leader: pqsSorted[0].avgPQS,
    leaderName: pqsSorted[0].name,
    unit: '',
    higherIsBetter: true,
    category: 'quality',
  });

  return metrics;
}

// ---------------------------------------------------------------------------
// Stage Mix comparison
// ---------------------------------------------------------------------------

function computeStageMix(
  repName: string,
  allDeals: Deal[],
  allProfiles: RepProfile[],
  top10Count: number
) {
  const stages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
  const yourDeals = allDeals.filter((d) => d.rep === repName);
  const yourTotal = yourDeals.length || 1;

  // Top 10% performers by weighted pipeline
  const activeNames = allProfiles
    .filter((r) => r.status === 'active')
    .sort((a, b) => b.weightedPipeline - a.weightedPipeline)
    .slice(0, top10Count)
    .map((r) => r.name);
  const topDeals = allDeals.filter((d) => activeNames.includes(d.rep));
  const topTotal = topDeals.length || 1;
  const allTotal = allDeals.length || 1;

  return stages.map((stage) => ({
    stage,
    you: Math.round((yourDeals.filter((d) => d.stage === stage).length / yourTotal) * 100),
    avg: Math.round((allDeals.filter((d) => d.stage === stage).length / allTotal) * 100),
    top10: Math.round((topDeals.filter((d) => d.stage === stage).length / topTotal) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RepBenchmark() {
  const { role, currentRep } = useRole();
  const [expanded, setExpanded] = useState(true);
  const [selectedRep, setSelectedRep] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>('leader');
  const [showWorldClass, setShowWorldClass] = useState(role === 'rep');

  const { profiles, deals, viewRep } = useMemo(() => {
    let profiles: RepProfile[];
    let deals: Deal[];

    if (role === 'rep') {
      profiles = repProfiles.filter((r) => r.status === 'active');
      deals = pipelineDeals;
    } else if (role === 'manager') {
      const manager = SALES_MANAGERS.find((m) => m.team.includes(currentRep));
      if (manager) {
        const teamSet = new Set(manager.team);
        profiles = repProfiles.filter((r) => teamSet.has(r.name));
        deals = pipelineDeals.filter((d) => teamSet.has(d.rep));
      } else {
        profiles = repProfiles;
        deals = pipelineDeals;
      }
    } else {
      profiles = repProfiles.filter((r) => r.status === 'active');
      deals = pipelineDeals;
    }

    const viewRep = role === 'rep' ? currentRep : selectedRep || profiles[0]?.name || currentRep;
    return { profiles, deals, viewRep };
  }, [role, currentRep, selectedRep]);

  const benchmarks = useMemo(
    () => computeBenchmarks(viewRep, profiles, deals),
    [viewRep, profiles, deals]
  );

  const top10Count = Math.max(
    1,
    Math.ceil(profiles.filter((r) => r.status === 'active').length * 0.1)
  );

  const stageMix = useMemo(
    () => computeStageMix(viewRep, deals, profiles, top10Count),
    [viewRep, deals, profiles, top10Count]
  );

  // Radar chart data (normalized to 0-100 scale)
  const radarData = useMemo(() => {
    const radarKeys = ['winRate', 'meetings', 'stakeholders', 'dealSize', 'coverage', 'attainment'];
    return benchmarks
      .filter((m) => radarKeys.includes(m.key))
      .map((m) => {
        const refVal = compareMode === 'leader' ? m.leader : m.top10Avg;
        const maxVal = Math.max(m.you, m.avg, refVal) || 1;
        return {
          metric: m.label
            .replace(' / Week', '')
            .replace('Avg ', '')
            .replace('Quota ', '')
            .replace('Pipeline ', ''),
          You: Math.round((m.you / maxVal) * 100),
          Average: Math.round((m.avg / maxVal) * 100),
          [compareMode === 'leader' ? 'Leader' : 'Top 10%']: Math.round((refVal / maxVal) * 100),
        };
      });
  }, [benchmarks, compareMode]);

  // Leader insights — top gaps
  const leaderInsights = useMemo(() => {
    return benchmarks
      .filter((m) => {
        const refVal = compareMode === 'leader' ? m.leader : m.top10Avg;
        return getDelta(m.you, refVal, m.higherIsBetter) === 'worse';
      })
      .map((m) => {
        const refVal = compareMode === 'leader' ? m.leader : m.top10Avg;
        const gap = m.higherIsBetter ? refVal - m.you : m.you - refVal;
        const gapPct = refVal !== 0 ? Math.round((gap / refVal) * 100) : 0;
        return { ...m, gap, gapPct, refVal };
      })
      .sort((a, b) => b.gapPct - a.gapPct)
      .slice(0, 4);
  }, [benchmarks, compareMode]);

  // World-class positioning
  const worldClassData = useMemo(() => {
    const you = profiles.find((r) => r.name === viewRep);
    if (!you) return [];

    const yourDeals = deals.filter((d) => d.rep === viewRep);
    const qTarget = you.quota.annual / 4;

    const metrics: {
      key: string;
      label: string;
      you: number;
      p50: number;
      p75: number;
      p90: number;
      unit: string;
      percentile: number;
    }[] = [];

    // Win Rate
    const wr = you.currentQuarterPerformance.winRate;
    const wrBench = WORLD_CLASS_BENCHMARKS.winRate;
    metrics.push({
      key: 'winRate',
      label: wrBench.label,
      you: wr,
      p50: wrBench.p50,
      p75: wrBench.p75,
      p90: wrBench.p90,
      unit: wrBench.unit,
      percentile: wr >= wrBench.p90 ? 95 : wr >= wrBench.p75 ? 80 : wr >= wrBench.p50 ? 55 : 30,
    });

    // Avg Sales Cycle
    const cycle = you.currentQuarterPerformance.avgCycleLength;
    const cycleBench = WORLD_CLASS_BENCHMARKS.avgCycle;
    metrics.push({
      key: 'avgCycle',
      label: cycleBench.label,
      you: cycle,
      p50: cycleBench.p50,
      p75: cycleBench.p75,
      p90: cycleBench.p90,
      unit: cycleBench.unit,
      percentile:
        cycle <= cycleBench.p90
          ? 95
          : cycle <= cycleBench.p75
            ? 80
            : cycle <= cycleBench.p50
              ? 55
              : 30,
    });

    // Pipeline Coverage
    const cov = qTarget > 0 ? you.totalPipelineACV / qTarget : 0;
    const covBench = WORLD_CLASS_BENCHMARKS.pipelineCoverage;
    metrics.push({
      key: 'pipelineCoverage',
      label: covBench.label,
      you: cov,
      p50: covBench.p50,
      p75: covBench.p75,
      p90: covBench.p90,
      unit: covBench.unit,
      percentile:
        cov >= covBench.p90 ? 95 : cov >= covBench.p75 ? 80 : cov >= covBench.p50 ? 55 : 30,
    });

    // Multi-threading
    const avgGaps =
      yourDeals.length > 0
        ? yourDeals.reduce((s, d) => s + d.personaGaps.length, 0) / yourDeals.length
        : 3;
    const stakeholders = Math.max(0, 5 - avgGaps);
    const mtBench = WORLD_CLASS_BENCHMARKS.multiThread;
    metrics.push({
      key: 'multiThread',
      label: mtBench.label,
      you: stakeholders,
      p50: mtBench.p50,
      p75: mtBench.p75,
      p90: mtBench.p90,
      unit: mtBench.unit,
      percentile:
        stakeholders >= mtBench.p90
          ? 95
          : stakeholders >= mtBench.p75
            ? 80
            : stakeholders >= mtBench.p50
              ? 55
              : 30,
    });

    // Meetings per deal
    const totalMeetings = yourDeals.reduce((s, d) => s + d.activities.meetings, 0);
    const meetingsPerDeal = yourDeals.length > 0 ? totalMeetings / yourDeals.length : 0;
    const mpBench = WORLD_CLASS_BENCHMARKS.meetingsPerDeal;
    metrics.push({
      key: 'meetingsPerDeal',
      label: mpBench.label,
      you: meetingsPerDeal,
      p50: mpBench.p50,
      p75: mpBench.p75,
      p90: mpBench.p90,
      unit: mpBench.unit,
      percentile:
        meetingsPerDeal >= mpBench.p90
          ? 95
          : meetingsPerDeal >= mpBench.p75
            ? 80
            : meetingsPerDeal >= mpBench.p50
              ? 55
              : 30,
    });

    // Disco → Proposal conversion
    const discoDeals = yourDeals.filter(
      (d) =>
        d.stage === 'Discovery' ||
        d.stage === 'Qualification' ||
        d.stage === 'Proposal' ||
        d.stage === 'Negotiation'
    ).length;
    const proposalPlus = yourDeals.filter(
      (d) => d.stage === 'Proposal' || d.stage === 'Negotiation'
    ).length;
    const d2p = discoDeals > 0 ? proposalPlus / discoDeals : 0;
    const dpBench = WORLD_CLASS_BENCHMARKS.discoveryToProposal;
    metrics.push({
      key: 'discoveryToProposal',
      label: dpBench.label,
      you: d2p,
      p50: dpBench.p50,
      p75: dpBench.p75,
      p90: dpBench.p90,
      unit: dpBench.unit,
      percentile: d2p >= dpBench.p90 ? 95 : d2p >= dpBench.p75 ? 80 : d2p >= dpBench.p50 ? 55 : 30,
    });

    return metrics;
  }, [viewRep, profiles, deals]);

  // Overall percentile score
  const overallPercentile = useMemo(() => {
    if (worldClassData.length === 0) return 0;
    return Math.round(worldClassData.reduce((s, m) => s + m.percentile, 0) / worldClassData.length);
  }, [worldClassData]);

  if (benchmarks.length === 0) return null;

  const refLabel = compareMode === 'leader' ? 'Leader' : 'Top 10%';

  return (
    <div className="glass-card animate-fade-in">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Performance Benchmark
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            vs {profiles.filter((r) => r.status === 'active').length - 1} peers
          </span>
        </div>
        <div className="flex items-center gap-2">
          {role !== 'rep' && (
            <select
              value={viewRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] font-mono bg-secondary/50 border border-border/30 rounded px-2 py-1 text-foreground"
            >
              {profiles.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Compare Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCompareMode('leader')}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                  compareMode === 'leader'
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground border border-border/30 hover:text-foreground'
                }`}
              >
                <Crown className="w-3 h-3" /> vs Leader
              </button>
              <button
                onClick={() => setCompareMode('top10')}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                  compareMode === 'top10'
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-muted-foreground border border-border/30 hover:text-foreground'
                }`}
              >
                <Award className="w-3 h-3" /> vs Top 10% Avg
              </button>
            </div>
            <button
              onClick={() => setShowWorldClass(!showWorldClass)}
              className={`text-[10px] font-mono px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                showWorldClass
                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                  : 'text-muted-foreground border border-border/30 hover:text-foreground'
              }`}
            >
              <Gauge className="w-3 h-3" /> SaaS Benchmark
            </button>
          </div>

          {/* World-Class SaaS Benchmark Panel */}
          {showWorldClass && (
            <div className="bg-gradient-to-br from-amber-500/5 to-primary/5 rounded-lg p-4 border border-amber-400/20 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    SaaS Industry Benchmark
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-muted-foreground">
                    Overall Percentile:
                  </span>
                  <span
                    className={`text-lg font-mono font-bold ${
                      overallPercentile >= 75
                        ? 'text-grade-a'
                        : overallPercentile >= 50
                          ? 'text-grade-b'
                          : overallPercentile >= 25
                            ? 'text-grade-c'
                            : 'text-grade-f'
                    }`}
                  >
                    P{overallPercentile}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {worldClassData.map((m) => (
                  <div key={m.key} className="bg-card/60 rounded-lg p-3 border border-border/10">
                    <div className="text-[9px] text-muted-foreground mb-1">{m.label}</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono font-bold text-foreground">
                        {fmtMetric(m.you, m.unit)}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                          m.percentile >= 75
                            ? 'bg-grade-a/10 text-grade-a'
                            : m.percentile >= 50
                              ? 'bg-grade-b/10 text-grade-b'
                              : m.percentile >= 25
                                ? 'bg-grade-c/10 text-grade-c'
                                : 'bg-grade-f/10 text-grade-f'
                        }`}
                      >
                        P{m.percentile}
                      </span>
                    </div>
                    {/* Percentile bar */}
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden relative">
                        {/* P50/P75/P90 markers */}
                        <div className="absolute left-[50%] top-0 w-px h-full bg-muted-foreground/20" />
                        <div className="absolute left-[75%] top-0 w-px h-full bg-muted-foreground/20" />
                        <div className="absolute left-[90%] top-0 w-px h-full bg-muted-foreground/20" />
                        <div
                          className={`h-full rounded-full ${
                            m.percentile >= 75
                              ? 'bg-grade-a'
                              : m.percentile >= 50
                                ? 'bg-grade-b'
                                : m.percentile >= 25
                                  ? 'bg-grade-c'
                                  : 'bg-grade-f'
                          }`}
                          style={{ width: `${m.percentile}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[8px] font-mono text-muted-foreground/50">
                      <span>P50: {fmtMetric(m.p50, m.unit)}</span>
                      <span>P90: {fmtMetric(m.p90, m.unit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Radar Chart + Leader Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Radar Chart */}
            <div className="bg-secondary/20 rounded-lg p-4 border border-border/20">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" /> Performance Profile
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar
                      name="You"
                      dataKey="You"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Average"
                      dataKey="Average"
                      stroke="hsl(var(--muted-foreground))"
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.05}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <Radar
                      name={refLabel}
                      dataKey={refLabel}
                      stroke="hsl(var(--grade-a))"
                      fill="hsl(var(--grade-a))"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* What Leaders Do Differently */}
            <div className="bg-secondary/20 rounded-lg p-4 border border-border/20">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                {compareMode === 'leader'
                  ? 'What the Leader Does Differently'
                  : 'What Top 10% Do Differently'}
              </div>
              {leaderInsights.length === 0 ? (
                <div className="text-[11px] text-grade-a font-mono py-8 text-center">
                  You're at or above the {compareMode === 'leader' ? 'leader' : 'top 10%'} across
                  all metrics!
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderInsights.map((insight) => (
                    <div
                      key={insight.key}
                      className="bg-card/60 rounded-lg p-3 border border-border/10"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-foreground">
                          {insight.label}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-grade-f/10 text-grade-f">
                          {insight.gapPct}% gap
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono">
                        <div>
                          <span className="text-muted-foreground">You: </span>
                          <span className="text-foreground">
                            {fmtMetric(insight.you, insight.unit)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{refLabel}: </span>
                          <span className="text-grade-a">
                            {fmtMetric(insight.refVal, insight.unit)}
                          </span>
                        </div>
                      </div>
                      {compareMode === 'leader' && (
                        <div className="text-[9px] text-muted-foreground/70 mt-1">
                          {role === 'rep' ? 'Top performer' : insight.leaderName} leads this metric
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Stage Mix */}
          <div className="bg-secondary/20 rounded-lg p-4 border border-border/20">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Pipeline Stage Distribution (% of deals)
            </div>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageMix} margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="you" name="You" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="avg"
                    name="Avg"
                    fill="hsl(var(--muted-foreground))"
                    radius={[4, 4, 0, 0]}
                    opacity={0.4}
                  />
                  <Bar
                    dataKey="top10"
                    name="Top 10%"
                    fill="hsl(var(--grade-a))"
                    radius={[4, 4, 0, 0]}
                    opacity={0.7}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full Metrics Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-2 text-muted-foreground font-normal">Metric</th>
                  <th className="text-right py-2 px-2 text-primary font-semibold">You</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-normal">Avg</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-normal">
                    Top 10%
                  </th>
                  <th className="text-right py-2 px-2 text-grade-a font-normal">
                    {role === 'rep' ? 'Best' : 'Leader'}
                  </th>
                  {role !== 'rep' && (
                    <th className="text-left py-2 px-2 text-muted-foreground font-normal" />
                  )}
                  <th className="text-center py-2 px-2 text-muted-foreground font-normal">
                    vs {refLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(['performance', 'velocity', 'activity', 'quality'] as const).map((cat) => {
                  const catMetrics = benchmarks.filter((m) => m.category === cat);
                  if (catMetrics.length === 0) return null;

                  const catLabels = {
                    performance: 'Performance',
                    velocity: 'Velocity',
                    activity: 'Activity',
                    quality: 'Deal Quality',
                  };

                  return (
                    <>
                      <tr key={cat}>
                        <td colSpan={7} className="pt-3 pb-1 px-2">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                            {catLabels[cat]}
                          </span>
                        </td>
                      </tr>
                      {catMetrics.map((m) => {
                        const refVal = compareMode === 'leader' ? m.leader : m.top10Avg;
                        const delta = getDelta(m.you, refVal, m.higherIsBetter);

                        return (
                          <tr key={m.key} className="border-b border-border/10 hover:bg-muted/10">
                            <td className="py-2 px-2 text-foreground">{m.label}</td>
                            <td className="text-right py-2 px-2 text-primary font-semibold">
                              {fmtMetric(m.you, m.unit)}
                            </td>
                            <td className="text-right py-2 px-2 text-muted-foreground">
                              {fmtMetric(m.avg, m.unit)}
                            </td>
                            <td className="text-right py-2 px-2 text-muted-foreground">
                              {fmtMetric(m.top10Avg, m.unit)}
                            </td>
                            <td className="text-right py-2 px-2 text-grade-a">
                              {fmtMetric(m.leader, m.unit)}
                            </td>
                            {role !== 'rep' && (
                              <td className="py-2 px-2 text-muted-foreground/60 text-[9px]">
                                {m.leaderName.split(' ')[0]}
                              </td>
                            )}
                            <td className="text-center py-2 px-2">
                              <span
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  delta === 'better'
                                    ? 'bg-grade-a/10 text-grade-a'
                                    : delta === 'worse'
                                      ? 'bg-grade-f/10 text-grade-f'
                                      : 'bg-muted/30 text-muted-foreground'
                                }`}
                              >
                                {delta === 'better' ? (
                                  <ArrowUp className="w-2.5 h-2.5" />
                                ) : delta === 'worse' ? (
                                  <ArrowDown className="w-2.5 h-2.5" />
                                ) : (
                                  <Minus className="w-2.5 h-2.5" />
                                )}
                                {delta === 'better' ? 'Above' : delta === 'worse' ? 'Below' : 'At'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Product Mix Comparison */}
          <ProductMixComparison repName={viewRep} allProfiles={profiles} allDeals={deals} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Mix Sub-Component
// ---------------------------------------------------------------------------

function ProductMixComparison({
  repName,
  allDeals,
}: {
  repName: string;
  allProfiles: RepProfile[];
  allDeals: Deal[];
}) {
  const [viewMode, setViewMode] = useState<'deals' | 'acv'>('deals');

  const { dealData, acvData } = useMemo(() => {
    const yourDeals = allDeals.filter((d) => d.rep === repName);
    const otherDeals = allDeals.filter((d) => d.rep !== repName);
    const yourTotalACV = yourDeals.reduce((s, d) => s + d.acv, 0) || 1;
    const otherTotalACV = otherDeals.reduce((s, d) => s + d.acv, 0) || 1;

    const bundles = [...new Set(allDeals.map((d) => d.productBundle))].sort();

    const dealData = bundles.map((bundle) => {
      const yourCount = yourDeals.filter((d) => d.productBundle === bundle).length;
      const yourPct = yourDeals.length > 0 ? Math.round((yourCount / yourDeals.length) * 100) : 0;
      const otherCount = otherDeals.filter((d) => d.productBundle === bundle).length;
      const otherPct =
        otherDeals.length > 0 ? Math.round((otherCount / otherDeals.length) * 100) : 0;

      return {
        name: bundle,
        You: yourPct,
        Peers: otherPct,
        yourCount,
        otherCount,
      };
    });

    const acvData = bundles.map((bundle) => {
      const yourACV = yourDeals
        .filter((d) => d.productBundle === bundle)
        .reduce((s, d) => s + d.acv, 0);
      const yourPct = Math.round((yourACV / yourTotalACV) * 100);
      const otherACV = otherDeals
        .filter((d) => d.productBundle === bundle)
        .reduce((s, d) => s + d.acv, 0);
      const otherPct = Math.round((otherACV / otherTotalACV) * 100);

      return {
        name: bundle,
        You: yourPct,
        Peers: otherPct,
        yourACV,
        otherACV,
      };
    });

    return { dealData, acvData };
  }, [repName, allDeals]);

  const chartData = viewMode === 'deals' ? dealData : acvData;

  return (
    <div className="bg-secondary/20 rounded-lg p-4 border border-border/20">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
          <Package className="w-3 h-3" /> Product Distribution — You vs Peers
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('deals')}
            className={`text-[9px] font-mono px-2 py-1 rounded transition-colors ${
              viewMode === 'deals'
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground border border-border/30 hover:text-foreground'
            }`}
          >
            By Deal Count
          </button>
          <button
            onClick={() => setViewMode('acv')}
            className={`text-[9px] font-mono px-2 py-1 rounded transition-colors ${
              viewMode === 'acv'
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground border border-border/30 hover:text-foreground'
            }`}
          >
            By ACV Weight
          </button>
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 5, left: 5, bottom: 20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value: number, name: string) => [`${value}%`, name]}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
              }}
            />
            <Bar dataKey="You" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="Peers"
              fill="hsl(var(--muted-foreground))"
              radius={[4, 4, 0, 0]}
              opacity={0.4}
            />
            <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Summary table below chart */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {chartData.map((item) => (
          <div key={item.name} className="bg-card/60 rounded p-2 border border-border/10">
            <div className="text-[9px] text-muted-foreground truncate">{item.name}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-mono font-semibold text-primary">{item.You}%</span>
              <span className="text-[10px] font-mono text-muted-foreground">{item.Peers}%</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div
                className="h-1 rounded-full bg-primary"
                style={{ width: `${Math.max(item.You, 2)}%` }}
              />
              <div
                className="h-1 rounded-full bg-muted-foreground/40"
                style={{ width: `${Math.max(item.Peers, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
