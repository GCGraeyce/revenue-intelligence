/**
 * Deep Rep Profiles — quotas, territories, performance history, ramp status
 *
 * Every rep has a full profile you can drill into: performance by quarter,
 * win/loss patterns, activity metrics, coaching history, and ramp progress.
 */

import { pipelineDeals, SALES_MANAGERS, DEFAULT_REP_TARGETS, type Deal } from './demo-data.js';

// ---------------------------------------------------------------------------
// Rep Profile Entity
// ---------------------------------------------------------------------------

export interface RepQuota {
  annual: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

export interface QuarterlyPerformance {
  quarter: string;         // e.g. 'Q1 FY25'
  target: number;
  closed: number;
  attainmentPct: number;
  dealsWon: number;
  dealsLost: number;
  avgDealSize: number;
  avgCycleLength: number;  // days
  winRate: number;          // 0-1
  pipelineGenerated: number;
}

export interface RepActivity {
  totalMeetings: number;
  totalEmails: number;
  totalCalls: number;
  totalDemos: number;
  avgMeetingsPerWeek: number;
  avgCallsPerWeek: number;
  conversionRateLeadToOpp: number;
  conversionRateOppToWin: number;
}

export interface RepCoaching {
  lastOneOnOneDate: string;
  lastCoachingNote: string;
  strengths: string[];
  developmentAreas: string[];
  certifications: string[];
  trainingCompleted: number;  // 0-100%
  simulationScore: number;    // 0-100
}

// -- Rep Enums --
export type RepStatus = 'active' | 'on-leave' | 'pip' | 'departed';
export type CompensationPlan = 'full-commission' | 'base-plus-commission' | 'salary';
export type PIPStatus = 'none' | 'active' | 'completed' | 'extended';

export interface RepProfile {
  id: string;
  name: string;
  email: string;
  title: string;
  team: string;
  managerId: string;
  managerName: string;
  territory: string;
  region: string;
  segment: 'SMB' | 'Mid-Market' | 'Enterprise' | 'All';
  hireDate: string;
  tenureMonths: number;
  rampStatus: 'ramping' | 'ramped' | 'veteran';
  rampProgress: number;      // 0-100% (for ramping reps)
  avatar: string;             // initials
  quota: RepQuota;
  currentQuarterPerformance: QuarterlyPerformance;
  historicalPerformance: QuarterlyPerformance[];
  activityMetrics: RepActivity;
  coaching: RepCoaching;
  // -- Status & Employment --
  status: RepStatus;
  compensationPlan: CompensationPlan;
  overtimeEligible: boolean;
  directReports: string[];      // rep IDs for managers
  peerMentorId: string | null;  // buddy for ramping reps
  lastPIPDate: string | null;
  pipStatus: PIPStatus;
  // Live pipeline metrics (computed from deals)
  activeDealCount: number;
  totalPipelineACV: number;
  weightedPipeline: number;
  avgPQS: number;
  atRiskDeals: number;
  commitDeals: number;
  commitACV: number;
  // -- Audit --
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // -- Soft Delete --
  isDeleted: boolean;
  deletedAt: string | null;
}

// ---------------------------------------------------------------------------
// Rep Data
// ---------------------------------------------------------------------------

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max)); }
function daysAgo(d: number) { return new Date(Date.now() - d * 86400000).toISOString().slice(0, 10); }

interface RepSeed {
  name: string; title: string; territory: string; region: string;
  segment: 'SMB' | 'Mid-Market' | 'Enterprise' | 'All';
  hireDate: string; rampStatus: 'ramping' | 'ramped' | 'veteran';
  strengths: string[]; developmentAreas: string[];
}

const REP_SEEDS: RepSeed[] = [
  { name: 'Conor Murphy', title: 'Senior Enterprise AE', territory: 'Ireland & UK Enterprise', region: 'Europe', segment: 'Enterprise', hireDate: '2021-03-15', rampStatus: 'veteran', strengths: ['Complex deal orchestration', 'Executive relationships', 'Data center expertise'], developmentAreas: ['Documentation discipline', 'CRM hygiene'] },
  { name: 'Aoife Kelly', title: 'Enterprise Account Executive', territory: 'Ireland Property & Development', region: 'Europe', segment: 'Enterprise', hireDate: '2022-01-10', rampStatus: 'ramped', strengths: ['Property sector knowledge', 'Time-lapse storytelling', 'Multi-threading'], developmentAreas: ['Negotiation tactics', 'Competitive positioning'] },
  { name: "James O'Sullivan", title: 'Enterprise AE - EMEA', territory: 'EMEA Enterprise', region: 'Europe', segment: 'Enterprise', hireDate: '2022-06-01', rampStatus: 'ramped', strengths: ['Technical depth', 'Solution architecture', 'Pharma vertical'], developmentAreas: ['Closing urgency', 'Forecast accuracy'] },
  { name: 'Siobhan Walsh', title: 'Mid-Market Account Executive', territory: 'Ireland Mid-Market', region: 'Europe', segment: 'Mid-Market', hireDate: '2023-02-15', rampStatus: 'ramped', strengths: ['Safety compliance selling', 'Rapid qualification', 'Customer empathy'], developmentAreas: ['Deal size growth', 'Executive access'] },
  { name: 'Cian Brennan', title: 'Growth Account Executive', territory: 'Ireland SMB & Growth', region: 'Europe', segment: 'SMB', hireDate: '2023-09-01', rampStatus: 'ramped', strengths: ['High velocity selling', 'Product demos', 'Outbound prospecting'], developmentAreas: ['Strategic selling', 'Multi-stakeholder deals'] },
  { name: 'Niamh Doyle', title: 'Mid-Market AE - UK', territory: 'UK Mid-Market', region: 'Europe', segment: 'Mid-Market', hireDate: '2023-04-20', rampStatus: 'ramped', strengths: ['UK market knowledge', 'Partner channel', 'Proposal quality'], developmentAreas: ['Pipeline generation', 'Deal velocity'] },
  { name: 'Marco Rossi', title: 'Mid-Market AE - Southern Europe', territory: 'Southern Europe', region: 'Europe', segment: 'Mid-Market', hireDate: '2024-01-15', rampStatus: 'ramped', strengths: ['Multi-lingual selling', 'Cultural sensitivity', 'BIM integration'], developmentAreas: ['Enterprise upsell', 'MEDDIC adoption'] },
  { name: 'Emma Hughes', title: 'Account Executive', territory: 'Ireland General', region: 'Europe', segment: 'All', hireDate: '2024-03-01', rampStatus: 'ramped', strengths: ['Consultative approach', 'Healthcare vertical', 'Customer success handoff'], developmentAreas: ['Pipeline coverage', 'Competitive win rate'] },
  { name: 'Liam McCarthy', title: 'Enterprise AE - Infrastructure', territory: 'EMEA Infrastructure', region: 'Europe', segment: 'Enterprise', hireDate: '2022-09-12', rampStatus: 'veteran', strengths: ['Infrastructure expertise', 'Government procurement', 'Long-cycle deals'], developmentAreas: ['SMB velocity', 'Digital selling'] },
  { name: 'Sophie Chen', title: 'Growth AE - APAC', territory: 'APAC & Emerging Markets', region: 'APAC', segment: 'SMB', hireDate: '2025-06-01', rampStatus: 'ramping', strengths: ['APAC market knowledge', 'Digital-first selling', 'Speed'], developmentAreas: ['Construction industry depth', 'Enterprise selling', 'Persona mapping'] },
];

function generateQuarterlyPerf(target: number, quarter: string, bias: number): QuarterlyPerformance {
  const attainment = Math.max(0.3, Math.min(1.6, bias + rand(-0.2, 0.2)));
  const closed = Math.round(target * attainment);
  const dealsWon = Math.max(1, Math.round(closed / randInt(30000, 120000)));
  const dealsLost = Math.round(dealsWon * rand(0.3, 1.2));
  return {
    quarter, target, closed, attainmentPct: Math.round(attainment * 100),
    dealsWon, dealsLost, avgDealSize: dealsWon > 0 ? Math.round(closed / dealsWon) : 0,
    avgCycleLength: randInt(25, 90), winRate: +(dealsWon / Math.max(dealsWon + dealsLost, 1)).toFixed(2),
    pipelineGenerated: Math.round(target * rand(2, 4)),
  };
}

function buildRepProfile(seed: RepSeed, index: number): RepProfile {
  const manager = SALES_MANAGERS.find(m => m.team.includes(seed.name));
  const annualTarget = DEFAULT_REP_TARGETS[seed.name] || 1500000;
  const quarterlyTarget = Math.round(annualTarget / 4);
  const repDeals = pipelineDeals.filter(d => d.rep === seed.name);

  const hireDate = new Date(seed.hireDate);
  const tenureMonths = Math.round((Date.now() - hireDate.getTime()) / (30.44 * 86400000));
  const performanceBias = seed.rampStatus === 'veteran' ? rand(0.85, 1.15)
    : seed.rampStatus === 'ramped' ? rand(0.65, 1.05)
    : rand(0.3, 0.65);

  const quarters = ['Q1 FY25', 'Q2 FY25', 'Q3 FY25', 'Q4 FY25', 'Q1 FY26'];
  const historical = quarters.slice(0, -1).map(q => generateQuarterlyPerf(quarterlyTarget, q, performanceBias));
  const current = generateQuarterlyPerf(quarterlyTarget, quarters[quarters.length - 1], performanceBias);

  const commitDeals = repDeals.filter(d => d.forecastCategory === 'Commit');

  return {
    id: `REP-${String(index + 1).padStart(3, '0')}`,
    name: seed.name,
    email: `${seed.name.toLowerCase().replace(/['\s]/g, '.').replace('..', '.')}@evercam.com`,
    title: seed.title,
    team: manager?.title || 'Sales',
    managerId: manager?.id || 'mgr-1',
    managerName: manager?.name || 'Sarah Kavanagh',
    territory: seed.territory,
    region: seed.region,
    segment: seed.segment,
    hireDate: seed.hireDate,
    tenureMonths,
    rampStatus: seed.rampStatus,
    rampProgress: seed.rampStatus === 'ramping' ? randInt(25, 75) : 100,
    avatar: seed.name.split(' ').map(n => n[0]).join(''),
    quota: {
      annual: annualTarget,
      q1: quarterlyTarget, q2: quarterlyTarget, q3: quarterlyTarget, q4: quarterlyTarget,
    },
    currentQuarterPerformance: current,
    historicalPerformance: historical,
    activityMetrics: {
      totalMeetings: randInt(40, 200), totalEmails: randInt(200, 1200),
      totalCalls: randInt(80, 500), totalDemos: randInt(10, 60),
      avgMeetingsPerWeek: +(rand(3, 12)).toFixed(1),
      avgCallsPerWeek: +(rand(5, 25)).toFixed(1),
      conversionRateLeadToOpp: +(rand(0.08, 0.25)).toFixed(2),
      conversionRateOppToWin: +(rand(0.15, 0.45)).toFixed(2),
    },
    coaching: {
      lastOneOnOneDate: daysAgo(randInt(1, 14)),
      lastCoachingNote: seed.rampStatus === 'ramping'
        ? 'Focus on construction industry fundamentals and persona mapping. Good progress on APAC pipeline generation.'
        : seed.rampStatus === 'veteran'
        ? 'Strong performance. Discuss expansion into new verticals and mentoring new reps.'
        : 'Solid execution. Work on advancing deals faster through qualification stage.',
      strengths: seed.strengths,
      developmentAreas: seed.developmentAreas,
      certifications: seed.rampStatus === 'veteran'
        ? ['MEDDIC Certified', 'Solution Selling', 'Evercam Product Expert']
        : seed.rampStatus === 'ramped'
        ? ['MEDDIC Certified', 'Evercam Product Expert']
        : ['Evercam Onboarding'],
      trainingCompleted: seed.rampStatus === 'veteran' ? 100 : seed.rampStatus === 'ramped' ? randInt(75, 100) : randInt(30, 70),
      simulationScore: seed.rampStatus === 'veteran' ? randInt(85, 98) : seed.rampStatus === 'ramped' ? randInt(65, 90) : randInt(40, 70),
    },
    // Status & Employment
    status: seed.name === 'Sophie Chen' ? 'active' as RepStatus // ramping
      : index === 7 ? 'on-leave' as RepStatus // Emma Hughes on leave edge case
      : 'active' as RepStatus,
    compensationPlan: seed.rampStatus === 'veteran' ? 'base-plus-commission'
      : seed.rampStatus === 'ramped' ? 'base-plus-commission'
      : 'salary',
    overtimeEligible: seed.rampStatus !== 'veteran',
    directReports: index === 0 ? ['REP-005', 'REP-010'] : [], // Conor mentors juniors
    peerMentorId: seed.rampStatus === 'ramping' ? 'REP-001' : null, // Sophie mentored by Conor
    lastPIPDate: index === 4 ? daysAgo(90) : null, // Cian had a PIP 90 days ago (edge case)
    pipStatus: index === 4 ? 'completed' as PIPStatus : 'none' as PIPStatus,
    // Pipeline metrics
    activeDealCount: repDeals.length,
    totalPipelineACV: repDeals.reduce((s, d) => s + d.acv, 0),
    weightedPipeline: Math.round(repDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0)),
    avgPQS: repDeals.length ? Math.round(repDeals.reduce((s, d) => s + d.pqScore, 0) / repDeals.length) : 0,
    atRiskDeals: repDeals.filter(d => d.pqScore < 40).length,
    commitDeals: commitDeals.length,
    commitACV: commitDeals.reduce((s, d) => s + d.acv, 0),
    // Audit
    createdAt: seed.hireDate,
    updatedAt: daysAgo(randInt(0, 7)),
    createdBy: 'hr@evercam.com',
    // Soft Delete
    isDeleted: false,
    deletedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Generate & Export
// ---------------------------------------------------------------------------

export const repProfiles: RepProfile[] = REP_SEEDS.map((s, i) => buildRepProfile(s, i));

export function getRepByName(name: string): RepProfile | undefined {
  return repProfiles.find(r => r.name === name);
}

export function getRepById(id: string): RepProfile | undefined {
  return repProfiles.find(r => r.id === id);
}

export function getRepsForManager(managerName: string): RepProfile[] {
  return repProfiles.filter(r => r.managerName === managerName);
}

export function getRepDeals(repName: string): Deal[] {
  return pipelineDeals.filter(d => d.rep === repName);
}

/** Rep leaderboard sorted by weighted pipeline */
export function getRepLeaderboard() {
  return [...repProfiles].sort((a, b) => b.weightedPipeline - a.weightedPipeline).map((r, i) => ({
    rank: i + 1, ...r,
  }));
}

/** Rep comparison for manager view */
export function getRepComparison(repNames: string[]) {
  return repNames.map(name => {
    const rep = getRepByName(name);
    if (!rep) return null;
    return {
      name: rep.name,
      pipeline: rep.totalPipelineACV,
      weighted: rep.weightedPipeline,
      deals: rep.activeDealCount,
      avgPQS: rep.avgPQS,
      atRisk: rep.atRiskDeals,
      winRate: rep.currentQuarterPerformance.winRate,
      attainment: rep.currentQuarterPerformance.attainmentPct,
      avgCycle: rep.currentQuarterPerformance.avgCycleLength,
      meetings: rep.activityMetrics.avgMeetingsPerWeek,
    };
  }).filter(Boolean);
}
