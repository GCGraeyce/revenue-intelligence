/**
 * Demo data generation for Evercam Revenue Intelligence OS
 *
 * Generates realistic pipeline data for Evercam selling construction
 * cameras, AI analytics, and site monitoring to construction companies,
 * property developers, and infrastructure firms.
 *
 * Data reflects Zoho CRM field structure and Evercam's actual market:
 * - Companies: Real construction/property/infrastructure firms
 * - Products: Evercam camera hardware + software bundles
 * - Personas: Project Manager, Safety Officer, CFO, IT Director, CEO
 * - Sales stages: Discovery → Qualification → Proposal → Negotiation
 * - ACV ranges: SMB €8K-50K, Mid-Market €35K-180K, Enterprise €120K-500K
 *
 * Stage-aware generation: persona gaps, missing steps, and days in stage
 * are mapped to Evercam's actual sales playbook (evercam-context.ts).
 */

// ---------------------------------------------------------------------------
// Company Universe — Construction, Property & Infrastructure
// ---------------------------------------------------------------------------

const COMPANIES = [
  // Enterprise — Tier 1 Contractors & Developers (Ireland/UK/EU/AUS)
  'BAM Ireland', 'John Sisk & Son', 'Mercury Engineering', 'Jones Engineering',
  'Cairn Homes', 'Glenveagh Properties', 'Multiplex', 'Laing O\'Rourke',
  'Skanska', 'VINCI Construction', 'Bouygues', 'Strabag',
  // Mid-Market — Regional Builders & Specialty
  'Bennett Construction', 'John Paul Construction', 'Walls Construction',
  'McAleer & Rushe', 'Collen Construction', 'Stewart Construction',
  'Clancy Construction', 'Duggan Brothers', 'Priority Construction',
  'Ardmac', 'Designer Group', 'Suir Engineering',
  // SMB — Smaller Builders & Fit-Out
  'Casey Construction', 'Townmore Construction', 'Conack Construction',
  'Vision Contracting', 'Carey Building', 'Modubuild',
  'Ethos Engineering', 'Kirby Group Engineering', 'PM Group',
  'Winthrop Engineering',
];

// ---------------------------------------------------------------------------
// Evercam Sales Team
// ---------------------------------------------------------------------------

const REPS = [
  'Conor Murphy', 'Aoife Kelly', 'James O\'Sullivan', 'Siobhan Walsh',
  'Cian Brennan', 'Niamh Doyle', 'Marco Rossi', 'Emma Hughes',
  'Liam McCarthy', 'Sophie Chen',
];

// ---------------------------------------------------------------------------
// Sales Process (aligned with evercam-context.ts playbook)
// ---------------------------------------------------------------------------

const ACTIVE_STAGES = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
const SEGMENTS = ['SMB', 'Mid-Market', 'Enterprise'] as const;
const SOURCES = ['Inbound', 'Outbound', 'Partner', 'Expansion'] as const;
const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;

export type Grade = typeof GRADES[number];
export type Segment = typeof SEGMENTS[number];
export type Source = typeof SOURCES[number];

// ---------------------------------------------------------------------------
// Deal Interface
// ---------------------------------------------------------------------------

export type ForecastCategory = 'Commit' | 'Best Case' | 'Pipeline' | 'Omit';
export type DealStatus = 'active' | 'won' | 'lost' | 'on-hold' | 'archived';
export type LossReason = 'budget' | 'timing' | 'competitor' | 'no-decision' | 'champion-left' | 'feature-gap' | null;
export type ContractType = 'annual' | 'multi-year' | 'project' | 'pilot';
export type ImplementationStatus = 'not-started' | 'in-progress' | 'live' | 'at-risk';

export interface DealActivity {
  meetings: number;
  emails: number;
  calls: number;
  lastActivityDate: string;
  lastActivityType: string;
}

export interface TimelineEvent {
  date: string;
  type: 'stage-change' | 'score-change' | 'action' | 'activity' | 'note';
  description: string;
  detail?: string;
  actor?: string;
}

export interface StageHistoryEntry {
  stage: string;
  enteredAt: string;
  exitedAt: string | null;
  daysInStage: number;
  movedBy: string;
}

export interface MEDDICScore {
  metrics: number;         // 0-100
  economicBuyer: number;   // 0-100
  decisionCriteria: number; // 0-100
  decisionProcess: number; // 0-100
  identifyPain: number;    // 0-100
  champion: number;        // 0-100
  overall: number;         // computed average
}

export interface CompetitiveIntel {
  competitor: string;
  theirPrice: number | null;
  ourAdvantage: string;
  theirAdvantage: string;
}

export interface Deal {
  id: string;
  company: string;
  rep: string;
  acv: number;
  stage: string;
  segment: Segment;
  source: Source;
  pqScore: number;
  grade: Grade;
  probabilities: { win: number; loss: number; noDecision: number; slip: number };
  confidence: { band: 'High' | 'Medium' | 'Low'; volatility: number; completeness: number };
  icpScore: number;
  personaGaps: string[];
  missingSteps: string[];
  priceRisk: number;
  daysInStage: number;
  closeDate: string;
  nextActions: string[];
  productBundle: string;
  cameraCount: number;
  projectType: string;
  competitor: string | null;
  /** Date the deal was created/entered pipeline */
  createdDate: string;
  /** Forecast category: Commit (rep confident), Best Case (upside), Pipeline (early), Omit (dead) */
  forecastCategory: ForecastCategory;
  /** Activity counts for engagement signals */
  activities: DealActivity;
  /** Deal timeline - stage changes, score changes, actions taken */
  timeline: TimelineEvent[];
  /** Country code from company-repository */
  country: string;
  /** Deal type ID from company-repository */
  dealType: string;
  /** Channel partner ID (if partner-sourced) */
  channelPartner: string | null;
  // -- Status & Lifecycle --
  status: DealStatus;
  lossReason: LossReason;
  currencyCode: string;
  // -- Commercial --
  discountPct: number;
  discountApprover: string | null;
  discountApprovalDate: string | null;
  contractType: ContractType;
  contractLength: number; // months
  renewalProbability: number; // 0-1
  implementationStatus: ImplementationStatus;
  // -- Methodology --
  meddic: MEDDICScore;
  // -- Entity Links --
  accountId: string | null;
  primaryContactId: string | null;
  // -- Audit --
  createdBy: string;
  lastModifiedBy: string;
  updatedAt: string;
  // -- Soft Delete --
  isDeleted: boolean;
  deletedAt: string | null;
  // -- History --
  stageHistory: StageHistoryEntry[];
  competitiveIntel: CompetitiveIntel | null;
}

// ---------------------------------------------------------------------------
// Stage-Aware Persona Gaps (from evercam-context.ts playbook)
// ---------------------------------------------------------------------------

/** Persona gaps appropriate for each stage — reflects who SHOULD be engaged by that stage */
const STAGE_PERSONA_GAPS: Record<string, string[]> = {
  'Discovery': [
    'Project Manager / Site Manager',
    'Safety Officer (EHS)',
  ],
  'Qualification': [
    'Technical Evaluator (IT/Digital Construction)',
    'Project Manager / Site Manager',
    'Safety Officer (EHS)',
  ],
  'Proposal': [
    'Economic Buyer (CFO/Finance Director)',
    'Technical Evaluator (IT/Digital Construction)',
    'Champion / Executive Sponsor',
  ],
  'Negotiation': [
    'Champion / Executive Sponsor',
    'Economic Buyer (CFO/Finance Director)',
  ],
};

// ---------------------------------------------------------------------------
// Stage-Aware Missing Steps (from evercam-context.ts requiredActivities)
// ---------------------------------------------------------------------------

/** Missing process steps relevant to each stage */
const STAGE_MISSING_STEPS: Record<string, string[]> = {
  'Discovery': [
    'Initial discovery call',
    'Site conditions questionnaire',
    'Stakeholder mapping',
    'ICP fit assessment',
  ],
  'Qualification': [
    'Technical requirements review',
    'Site survey (virtual or in-person)',
    'Champion identified and validated',
    'Competitive assessment',
    'Demo scheduled with decision maker',
  ],
  'Proposal': [
    'Solution design (camera placement)',
    'Proposal document sent',
    'ROI calculator walkthrough with CFO',
    'Reference customer call',
    'Security documentation shared',
  ],
  'Negotiation': [
    'Commercial negotiation meeting',
    'Discount approval (if needed)',
    'Contract redline and sign-off',
    'Deployment planning session',
    'Success criteria for first 90 days',
  ],
};

// ---------------------------------------------------------------------------
// Stage-Aware Duration Ranges (from evercam-context.ts typicalDuration)
// ---------------------------------------------------------------------------

const STAGE_DURATION: Record<string, { min: number; max: number }> = {
  'Discovery': { min: 3, max: 14 },
  'Qualification': { min: 7, max: 21 },
  'Proposal': { min: 7, max: 30 },
  'Negotiation': { min: 5, max: 21 },
};

// ---------------------------------------------------------------------------
// Stage-Aware Next Actions
// ---------------------------------------------------------------------------

const STAGE_ACTIONS: Record<string, string[]> = {
  'Discovery': [
    'Schedule site survey visit',
    'Send introductory Evercam overview deck',
    'Complete ICP fit assessment',
    'Map key stakeholders on the project',
    'Identify current monitoring approach',
    'Qualify project timeline and budget range',
  ],
  'Qualification': [
    'Book AI analytics demo for safety officer',
    'Demo live PTZ camera on their project photos',
    'Complete technical requirements review',
    'Arrange virtual or on-site survey',
    'Identify and validate internal champion',
    'Review competitive landscape (OxBlue, EarthCam)',
  ],
  'Proposal': [
    'Send ROI calculator with dispute avoidance data',
    'Share BAM Ireland case study',
    'Arrange reference call with Cairn Homes',
    'Address CCTV vs construction camera objection',
    'Send security documentation (ISO 27001/SOC 2)',
    'Walk through time-lapse marketing examples',
    'Schedule BIM integration workshop',
  ],
  'Negotiation': [
    'Escalate pricing to sales manager',
    'Review competitive quote against OxBlue',
    'Propose 2-week pilot on next project',
    'Send solar camera spec for remote site',
    'Finalise contract terms and deployment date',
    'Schedule onboarding kick-off session',
    'Agree success criteria for first 90 days',
  ],
};

// ---------------------------------------------------------------------------
// Evercam-Specific Pools
// ---------------------------------------------------------------------------

/** Project types Evercam monitors */
const PROJECT_TYPES = [
  'Commercial Office', 'Residential Estate', 'Hospital PPP', 'Data Center',
  'Mixed-Use Development', 'Infrastructure (Road/Bridge)', 'Pharmaceutical Plant',
  'Retail/Shopping Centre', 'University Campus', 'Social Housing',
  'Airport Terminal', 'Railway Station', 'Warehouse/Logistics',
  'Hotel/Hospitality', 'Renewable Energy (Wind/Solar)',
];

/** Competitors in deals */
const COMPETITORS = ['OxBlue', 'EarthCam', 'TrueLook', 'Sensera', 'DIY/CCTV', null, null, null];

/** Country pools for deal enrichment — 20 countries across Evercam's global footprint */
const COUNTRY_POOLS: Record<string, string[]> = {
  'Enterprise': ['IE', 'GB', 'DE', 'AU', 'FR', 'NL', 'SE', 'CH', 'AT', 'BE', 'DK', 'NO', 'SG', 'AE', 'US', 'CA'],
  'Mid-Market': ['IE', 'GB', 'DE', 'AU', 'NZ', 'US', 'FR', 'NL', 'BE', 'IT', 'ES', 'PL', 'AE', 'SA', 'CA'],
  'SMB': ['IE', 'GB', 'US', 'AE', 'AU', 'NZ', 'DE', 'NL', 'CA', 'SG'],
};

/** Human-readable country names for display */
export const COUNTRY_NAMES: Record<string, string> = {
  IE: 'Ireland', GB: 'United Kingdom', DE: 'Germany', AU: 'Australia',
  FR: 'France', NL: 'Netherlands', SE: 'Sweden', CH: 'Switzerland',
  AT: 'Austria', BE: 'Belgium', DK: 'Denmark', NO: 'Norway',
  SG: 'Singapore', AE: 'UAE', US: 'United States', CA: 'Canada',
  NZ: 'New Zealand', IT: 'Italy', ES: 'Spain', PL: 'Poland', SA: 'Saudi Arabia',
};

/** Region groupings for geo visualization */
export const GEO_REGIONS: Record<string, string[]> = {
  'Europe — West': ['IE', 'GB', 'FR', 'NL', 'BE'],
  'Europe — DACH': ['DE', 'CH', 'AT'],
  'Europe — Nordics': ['SE', 'DK', 'NO'],
  'Europe — South & East': ['IT', 'ES', 'PL'],
  'Middle East': ['AE', 'SA'],
  'Asia Pacific': ['AU', 'NZ', 'SG'],
  'North America': ['US', 'CA'],
};

/** All product bundles available */
export const PRODUCT_BUNDLES = ['Enterprise Visibility', 'Project Pro', 'Site Starter', 'Safety & Compliance'] as const;
export type ProductBundle = typeof PRODUCT_BUNDLES[number];

/** Deal type pools based on source */
const DEAL_TYPE_POOLS: Record<string, string[]> = {
  'Inbound': ['new-logo', 'project-based'],
  'Outbound': ['new-logo', 'project-based'],
  'Partner': ['partner-referred', 'new-logo'],
  'Expansion': ['expansion', 'renewal', 'upgrade'],
};

/** Channel partners for partner-sourced deals */
const PARTNER_IDS = ['CP-001', 'CP-002', 'CP-003', 'CP-004', 'CP-005', 'CP-006'];

/** CRM users for audit trail */
const CRM_USERS = ['conor.murphy@evercam.com', 'aoife.kelly@evercam.com', 'sarah.kavanagh@evercam.com', 'system@evercam.com', 'james.osullivan@evercam.com'] as const;

/** Competitive advantage pools */
const OUR_ADVANTAGES = ['AI-powered analytics', 'Solar-powered cameras', 'BIM integration', 'Time-lapse marketing', 'Safety compliance automation', 'Edge processing / low latency', 'Multi-site dashboard', 'Irish-based support'];
const THEIR_ADVANTAGES = ['Lower price point', 'Established brand', 'Local reseller network', 'Existing relationship', 'Basic CCTV integration', 'Longer track record', 'Bundled with other tools'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max)); }
function pick<T>(arr: readonly T[]): T { return arr[randInt(0, arr.length)]; }

function scoreToGrade(score: number): Grade {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

/** Non-linear PQS: critical gap penalties weighted by stage × deal size */
function computeNonLinearPQS(
  baseScore: number,
  stage: string,
  segment: Segment,
  personaGaps: string[],
  missingSteps: string[],
  daysInStage: number,
): number {
  let score = baseScore;

  // Critical persona gap penalty — EB missing in Proposal/Negotiation is a deal killer
  const hasEBGap = personaGaps.some(g => g.includes('Economic Buyer'));
  const hasChampionGap = personaGaps.some(g => g.includes('Champion'));

  if (hasEBGap && (stage === 'Proposal' || stage === 'Negotiation')) {
    const sizeMult = segment === 'Enterprise' ? 1.5 : segment === 'Mid-Market' ? 1.2 : 1.0;
    score -= 20 * sizeMult; // Enterprise EB gap at Proposal = -30pts
  }
  if (hasChampionGap && stage === 'Negotiation') {
    score -= 15;
  }

  // Each additional persona gap has diminishing but real impact
  const otherGaps = personaGaps.filter(g => !g.includes('Economic Buyer') && !g.includes('Champion'));
  score -= otherGaps.length * 8;

  // Missing critical steps at late stages hurt more
  const lateStage = stage === 'Proposal' || stage === 'Negotiation';
  score -= missingSteps.length * (lateStage ? 10 : 5);

  // Time decay — deals stalled too long lose points
  const maxDays = STAGE_DURATION[stage]?.max || 30;
  if (daysInStage > maxDays) {
    const overduePct = (daysInStage - maxDays) / maxDays;
    score -= Math.min(20, Math.round(overduePct * 15));
  }

  return Math.round(Math.max(5, Math.min(98, score)));
}

/** Win probability decoupled from PQS — based on separate engagement signals */
function computeProbabilities(
  pqScore: number,
  stage: string,
  personaGaps: string[],
  daysInStage: number,
) {
  // Stage-based base win rate (historical conversion rates)
  const stageBase: Record<string, number> = {
    'Discovery': 0.15, 'Qualification': 0.25, 'Proposal': 0.40, 'Negotiation': 0.65,
  };
  let winProb = stageBase[stage] || 0.20;

  // PQS modulates (not dominates) — higher PQS = better within stage
  const pqsMod = (pqScore - 50) / 200; // ±0.25 range
  winProb += pqsMod;

  // Persona coverage bonus/penalty
  if (personaGaps.length === 0) winProb += 0.08;
  else winProb -= personaGaps.length * 0.05;

  // Stall penalty
  const maxDays = STAGE_DURATION[stage]?.max || 30;
  if (daysInStage > maxDays) winProb -= 0.10;

  // Randomize slightly
  winProb += rand(-0.05, 0.05);
  winProb = Math.min(0.95, Math.max(0.05, winProb));

  const remaining = 1 - winProb;
  const lossProb = remaining * rand(0.2, 0.5);
  const slipProb = remaining * rand(0.15, 0.4);
  const noDecisionProb = Math.max(0.02, 1 - winProb - lossProb - slipProb);
  return {
    win: +winProb.toFixed(2),
    loss: +lossProb.toFixed(2),
    noDecision: +noDecisionProb.toFixed(2),
    slip: +slipProb.toFixed(2),
  };
}

/** Derive forecast category from stage + win probability */
function deriveForecastCategory(stage: string, winProb: number, daysInStage: number): ForecastCategory {
  if (stage === 'Negotiation' && winProb > 0.55) return 'Commit';
  if (stage === 'Negotiation' || (stage === 'Proposal' && winProb > 0.45)) return 'Best Case';
  if (winProb < 0.10 || daysInStage > 45) return 'Omit';
  return 'Pipeline';
}

/** Generate realistic activity counts based on stage progression */
function generateActivities(stage: string, daysInStage: number, _rep: string): DealActivity {
  const stageActivities: Record<string, { meetings: [number, number]; emails: [number, number]; calls: [number, number] }> = {
    'Discovery': { meetings: [1, 3], emails: [3, 8], calls: [2, 6] },
    'Qualification': { meetings: [2, 5], emails: [5, 15], calls: [3, 10] },
    'Proposal': { meetings: [3, 8], emails: [8, 25], calls: [4, 12] },
    'Negotiation': { meetings: [4, 10], emails: [10, 30], calls: [5, 15] },
  };
  const ranges = stageActivities[stage] || { meetings: [1, 5], emails: [3, 15], calls: [2, 8] };
  const lastTypes = ['Email sent', 'Meeting held', 'Call completed', 'Proposal viewed', 'Document shared'];
  const daysAgo = Math.max(0, randInt(0, Math.min(daysInStage, 7)));

  return {
    meetings: randInt(ranges.meetings[0], ranges.meetings[1]),
    emails: randInt(ranges.emails[0], ranges.emails[1]),
    calls: randInt(ranges.calls[0], ranges.calls[1]),
    lastActivityDate: new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10),
    lastActivityType: pick(lastTypes),
  };
}

/** Generate MEDDIC scores based on stage, persona gaps, and score */
function generateMEDDIC(stage: string, personaGaps: string[], pqScore: number): MEDDICScore {
  const stageBonus: Record<string, number> = { Discovery: 0, Qualification: 15, Proposal: 30, Negotiation: 45 };
  const bonus = stageBonus[stage] || 0;
  const hasEB = !personaGaps.some(g => g.includes('Economic Buyer'));
  const hasChampion = !personaGaps.some(g => g.includes('Champion'));

  const metrics = Math.round(Math.max(5, Math.min(100, rand(20, 60) + bonus + (pqScore > 60 ? 15 : 0))));
  const economicBuyer = hasEB ? Math.round(Math.max(20, Math.min(100, rand(40, 80) + bonus * 0.5))) : randInt(5, 30);
  const decisionCriteria = Math.round(Math.max(5, Math.min(100, rand(15, 55) + bonus)));
  const decisionProcess = Math.round(Math.max(5, Math.min(100, rand(10, 50) + bonus)));
  const identifyPain = Math.round(Math.max(10, Math.min(100, rand(30, 70) + bonus * 0.7)));
  const champion = hasChampion ? Math.round(Math.max(20, Math.min(100, rand(35, 75) + bonus * 0.6))) : randInt(5, 25);
  const overall = Math.round((metrics + economicBuyer + decisionCriteria + decisionProcess + identifyPain + champion) / 6);

  return { metrics, economicBuyer, decisionCriteria, decisionProcess, identifyPain, champion, overall };
}

/** Generate stage history for a deal showing progression through pipeline */
function generateStageHistory(stage: string, daysInStage: number, createdDate: string, rep: string): StageHistoryEntry[] {
  const stageOrder = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
  const currentIdx = stageOrder.indexOf(stage);
  const entries: StageHistoryEntry[] = [];
  const created = new Date(createdDate);
  let dayOffset = 0;

  for (let i = 0; i <= currentIdx; i++) {
    const enteredAt = new Date(created.getTime() + dayOffset * 86400000).toISOString().slice(0, 10);
    const stageDays = i < currentIdx ? randInt(5, 20) : daysInStage;
    dayOffset += stageDays;
    const exitedAt = i < currentIdx
      ? new Date(created.getTime() + dayOffset * 86400000).toISOString().slice(0, 10)
      : null;

    entries.push({
      stage: stageOrder[i],
      enteredAt,
      exitedAt,
      daysInStage: stageDays,
      movedBy: rep,
    });
  }
  return entries;
}

/** Generate competitive intelligence for a deal */
function generateCompetitiveIntel(competitor: string | null, acv: number): CompetitiveIntel | null {
  if (!competitor || competitor === 'DIY/CCTV') return competitor === 'DIY/CCTV'
    ? { competitor: 'DIY/CCTV', theirPrice: Math.round(acv * rand(0.2, 0.4)), ourAdvantage: 'AI-powered analytics, construction-specific features, professional support', theirAdvantage: 'Much lower cost, existing hardware' }
    : null;
  return {
    competitor,
    theirPrice: Math.round(acv * rand(0.7, 1.3)),
    ourAdvantage: pick(OUR_ADVANTAGES) + ', ' + pick(OUR_ADVANTAGES),
    theirAdvantage: pick(THEIR_ADVANTAGES),
  };
}

/** Generate a realistic deal timeline based on current stage */
function generateTimeline(
  company: string, rep: string, stage: string, _daysInStage: number, pqScore: number, createdDate: string,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const created = new Date(createdDate);
  const stageOrder = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
  const currentIdx = stageOrder.indexOf(stage);

  // Creation event
  events.push({
    date: createdDate,
    type: 'activity',
    description: 'Deal created',
    detail: `${company} added to pipeline by ${rep}`,
    actor: rep,
  });

  // Stage progression events
  let dayOffset = 0;
  for (let i = 0; i <= currentIdx; i++) {
    if (i > 0) {
      dayOffset += randInt(5, 20);
      const eventDate = new Date(created.getTime() + dayOffset * 86400000).toISOString().slice(0, 10);
      events.push({
        date: eventDate,
        type: 'stage-change',
        description: `Moved to ${stageOrder[i]}`,
        detail: `Advanced from ${stageOrder[i - 1]} after ${randInt(5, 20)} days`,
        actor: rep,
      });
    }

    // Score change mid-stage
    if (Math.random() > 0.4) {
      dayOffset += randInt(2, 8);
      const scoreDate = new Date(created.getTime() + dayOffset * 86400000).toISOString().slice(0, 10);
      const oldScore = Math.max(15, pqScore + randInt(-15, 15));
      events.push({
        date: scoreDate,
        type: 'score-change',
        description: `PQS ${oldScore} → ${pqScore}`,
        detail: i === currentIdx ? 'Latest score from model v2.4.1' : 'Score updated after stage activity',
      });
    }

    // Activity events
    if (Math.random() > 0.3) {
      dayOffset += randInt(1, 5);
      const activityDate = new Date(created.getTime() + dayOffset * 86400000).toISOString().slice(0, 10);
      const activityOptions = [
        'Discovery call completed', 'Demo delivered', 'Proposal sent', 'ROI walkthrough held',
        'Site survey scheduled', 'Reference call arranged', 'Contract draft sent',
        'Stakeholder meeting held', 'Technical review completed', 'Follow-up email sent',
      ];
      events.push({
        date: activityDate,
        type: 'activity',
        description: pick(activityOptions),
        actor: rep,
      });
    }
  }

  // Recent action event
  const recentDate = new Date(Date.now() - randInt(0, 3) * 86400000).toISOString().slice(0, 10);
  events.push({
    date: recentDate,
    type: 'action',
    description: 'AI coaching action suggested',
    detail: stage === 'Proposal' ? 'Engage Economic Buyer for ROI discussion' : 'Progress deal to next stage',
  });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// Hero Deals — 25 hand-crafted, stage-appropriate showcase deals
// ---------------------------------------------------------------------------

interface HeroDealTemplate {
  company: string;
  rep: string;
  stage: string;
  segment: Segment;
  source: Source;
  acv: number;
  productBundle: string;
  cameraCount: number;
  projectType: string;
  competitor: string | null;
  pqScore: number;
  personaGaps: string[];
  missingSteps: string[];
  daysInStage: number;
  nextActions: string[];
}

const HERO_DEALS: HeroDealTemplate[] = [
  // ── DISCOVERY (5 deals) ──
  {
    company: 'Skanska (Airport Terminal)',
    rep: 'Conor Murphy',
    stage: 'Discovery',
    segment: 'Enterprise',
    source: 'Inbound',
    acv: 280000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 15,
    projectType: 'Airport Terminal',
    competitor: null,
    pqScore: 42,
    personaGaps: ['Safety Officer (EHS)', 'Economic Buyer (CFO/Finance Director)'],
    missingSteps: ['Site conditions questionnaire', 'Stakeholder mapping'],
    daysInStage: 5,
    nextActions: ['Schedule site survey visit', 'Map key stakeholders on the project'],
  },
  {
    company: 'Walls Construction (Residential Estate)',
    rep: 'Aoife Kelly',
    stage: 'Discovery',
    segment: 'Mid-Market',
    source: 'Outbound',
    acv: 65000,
    productBundle: 'Project Pro',
    cameraCount: 4,
    projectType: 'Residential Estate',
    competitor: null,
    pqScore: 35,
    personaGaps: ['Project Manager / Site Manager'],
    missingSteps: ['Initial discovery call', 'ICP fit assessment'],
    daysInStage: 8,
    nextActions: ['Schedule site survey visit', 'Complete ICP fit assessment'],
  },
  {
    company: 'Casey Construction (Hotel/Hospitality)',
    rep: 'Marco Rossi',
    stage: 'Discovery',
    segment: 'SMB',
    source: 'Partner',
    acv: 18000,
    productBundle: 'Site Starter',
    cameraCount: 2,
    projectType: 'Hotel/Hospitality',
    competitor: null,
    pqScore: 55,
    personaGaps: [],
    missingSteps: ['Site conditions questionnaire'],
    daysInStage: 3,
    nextActions: ['Send introductory Evercam overview deck', 'Qualify project timeline and budget range'],
  },
  {
    company: 'Strabag (Infrastructure Road/Bridge)',
    rep: 'Liam McCarthy',
    stage: 'Discovery',
    segment: 'Enterprise',
    source: 'Outbound',
    acv: 350000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 20,
    projectType: 'Infrastructure (Road/Bridge)',
    competitor: 'EarthCam',
    pqScore: 28,
    personaGaps: ['Project Manager / Site Manager', 'Safety Officer (EHS)'],
    missingSteps: ['Initial discovery call', 'Stakeholder mapping', 'ICP fit assessment'],
    daysInStage: 12,
    nextActions: ['Schedule site survey visit', 'Map key stakeholders on the project', 'Identify current monitoring approach'],
  },
  {
    company: 'Modubuild (Commercial Office)',
    rep: 'Sophie Chen',
    stage: 'Discovery',
    segment: 'SMB',
    source: 'Inbound',
    acv: 12000,
    productBundle: 'Site Starter',
    cameraCount: 1,
    projectType: 'Commercial Office',
    competitor: 'DIY/CCTV',
    pqScore: 60,
    personaGaps: [],
    missingSteps: ['ICP fit assessment'],
    daysInStage: 4,
    nextActions: ['Complete ICP fit assessment', 'Qualify project timeline and budget range'],
  },

  // ── QUALIFICATION (7 deals) ──
  {
    company: 'BAM Ireland (Hospital PPP)',
    rep: 'Conor Murphy',
    stage: 'Qualification',
    segment: 'Enterprise',
    source: 'Inbound',
    acv: 420000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 18,
    projectType: 'Hospital PPP',
    competitor: 'EarthCam',
    pqScore: 62,
    personaGaps: ['Technical Evaluator (IT/Digital Construction)'],
    missingSteps: ['Demo scheduled with decision maker', 'Competitive assessment'],
    daysInStage: 14,
    nextActions: ['Demo live PTZ camera on their project photos', 'Review competitive landscape (OxBlue, EarthCam)'],
  },
  {
    company: 'McAleer & Rushe (Data Center)',
    rep: 'Siobhan Walsh',
    stage: 'Qualification',
    segment: 'Mid-Market',
    source: 'Inbound',
    acv: 95000,
    productBundle: 'Safety & Compliance',
    cameraCount: 6,
    projectType: 'Data Center',
    competitor: null,
    pqScore: 72,
    personaGaps: [],
    missingSteps: ['Site survey (virtual or in-person)'],
    daysInStage: 10,
    nextActions: ['Arrange virtual or on-site survey', 'Book AI analytics demo for safety officer'],
  },
  {
    company: 'Glenveagh Properties (Social Housing)',
    rep: 'Aoife Kelly',
    stage: 'Qualification',
    segment: 'Enterprise',
    source: 'Expansion',
    acv: 180000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 10,
    projectType: 'Social Housing',
    competitor: null,
    pqScore: 85,
    personaGaps: [],
    missingSteps: [],
    daysInStage: 7,
    nextActions: ['Identify and validate internal champion', 'Complete technical requirements review'],
  },
  {
    company: 'Ardmac (Pharmaceutical Plant)',
    rep: 'James O\'Sullivan',
    stage: 'Qualification',
    segment: 'Mid-Market',
    source: 'Partner',
    acv: 78000,
    productBundle: 'Project Pro',
    cameraCount: 5,
    projectType: 'Pharmaceutical Plant',
    competitor: 'TrueLook',
    pqScore: 48,
    personaGaps: ['Technical Evaluator (IT/Digital Construction)', 'Safety Officer (EHS)'],
    missingSteps: ['Technical requirements review', 'Champion identified and validated'],
    daysInStage: 18,
    nextActions: ['Complete technical requirements review', 'Book AI analytics demo for safety officer'],
  },
  {
    company: 'Ethos Engineering (Data Center)',
    rep: 'Cian Brennan',
    stage: 'Qualification',
    segment: 'SMB',
    source: 'Inbound',
    acv: 28000,
    productBundle: 'Site Starter',
    cameraCount: 2,
    projectType: 'Data Center',
    competitor: null,
    pqScore: 68,
    personaGaps: [],
    missingSteps: ['Demo scheduled with decision maker'],
    daysInStage: 9,
    nextActions: ['Demo live PTZ camera on their project photos'],
  },
  {
    company: 'Bouygues (Railway Station)',
    rep: 'Niamh Doyle',
    stage: 'Qualification',
    segment: 'Enterprise',
    source: 'Outbound',
    acv: 310000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 14,
    projectType: 'Railway Station',
    competitor: 'OxBlue',
    pqScore: 38,
    personaGaps: ['Technical Evaluator (IT/Digital Construction)', 'Project Manager / Site Manager'],
    missingSteps: ['Site survey (virtual or in-person)', 'Competitive assessment', 'Champion identified and validated'],
    daysInStage: 20,
    nextActions: ['Arrange virtual or on-site survey', 'Review competitive landscape (OxBlue, EarthCam)', 'Identify and validate internal champion'],
  },
  {
    company: 'Clancy Construction (University Campus)',
    rep: 'Emma Hughes',
    stage: 'Qualification',
    segment: 'Mid-Market',
    source: 'Inbound',
    acv: 52000,
    productBundle: 'Project Pro',
    cameraCount: 3,
    projectType: 'University Campus',
    competitor: 'Sensera',
    pqScore: 55,
    personaGaps: ['Safety Officer (EHS)'],
    missingSteps: ['Competitive assessment'],
    daysInStage: 12,
    nextActions: ['Book AI analytics demo for safety officer', 'Review competitive landscape (OxBlue, EarthCam)'],
  },

  // ── PROPOSAL (8 deals) ──
  {
    company: 'Mercury Engineering (Data Center)',
    rep: 'Conor Murphy',
    stage: 'Proposal',
    segment: 'Enterprise',
    source: 'Expansion',
    acv: 480000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 22,
    projectType: 'Data Center',
    competitor: null,
    pqScore: 88,
    personaGaps: [],
    missingSteps: [],
    daysInStage: 5,
    nextActions: ['Send ROI calculator with dispute avoidance data'],
  },
  {
    company: 'Multiplex (Mixed-Use Development)',
    rep: 'James O\'Sullivan',
    stage: 'Proposal',
    segment: 'Enterprise',
    source: 'Inbound',
    acv: 340000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 12,
    projectType: 'Mixed-Use Development',
    competitor: 'EarthCam',
    pqScore: 58,
    personaGaps: ['Economic Buyer (CFO/Finance Director)'],
    missingSteps: ['ROI calculator walkthrough with CFO', 'Reference customer call'],
    daysInStage: 22,
    nextActions: ['Send ROI calculator with dispute avoidance data', 'Arrange reference call with Cairn Homes'],
  },
  {
    company: 'John Sisk & Son (Commercial Office)',
    rep: 'Aoife Kelly',
    stage: 'Proposal',
    segment: 'Enterprise',
    source: 'Inbound',
    acv: 260000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 10,
    projectType: 'Commercial Office',
    competitor: 'OxBlue',
    pqScore: 65,
    personaGaps: ['Champion / Executive Sponsor'],
    missingSteps: ['Security documentation shared'],
    daysInStage: 15,
    nextActions: ['Send security documentation (ISO 27001/SOC 2)', 'Walk through time-lapse marketing examples'],
  },
  {
    company: 'Bennett Construction (Retail/Shopping Centre)',
    rep: 'Siobhan Walsh',
    stage: 'Proposal',
    segment: 'Mid-Market',
    source: 'Inbound',
    acv: 72000,
    productBundle: 'Project Pro',
    cameraCount: 4,
    projectType: 'Retail/Shopping Centre',
    competitor: null,
    pqScore: 70,
    personaGaps: [],
    missingSteps: ['Reference customer call'],
    daysInStage: 10,
    nextActions: ['Arrange reference call with Cairn Homes', 'Share BAM Ireland case study'],
  },
  {
    company: 'Collen Construction (Warehouse/Logistics)',
    rep: 'Cian Brennan',
    stage: 'Proposal',
    segment: 'Mid-Market',
    source: 'Outbound',
    acv: 48000,
    productBundle: 'Safety & Compliance',
    cameraCount: 3,
    projectType: 'Warehouse/Logistics',
    competitor: 'Sensera',
    pqScore: 40,
    personaGaps: ['Economic Buyer (CFO/Finance Director)', 'Champion / Executive Sponsor'],
    missingSteps: ['ROI calculator walkthrough with CFO', 'Proposal document sent'],
    daysInStage: 28,
    nextActions: ['Send ROI calculator with dispute avoidance data', 'Address CCTV vs construction camera objection'],
  },
  {
    company: 'Townmore Construction (Social Housing)',
    rep: 'Niamh Doyle',
    stage: 'Proposal',
    segment: 'SMB',
    source: 'Partner',
    acv: 22000,
    productBundle: 'Site Starter',
    cameraCount: 2,
    projectType: 'Social Housing',
    competitor: 'DIY/CCTV',
    pqScore: 52,
    personaGaps: ['Economic Buyer (CFO/Finance Director)'],
    missingSteps: ['ROI calculator walkthrough with CFO'],
    daysInStage: 12,
    nextActions: ['Send ROI calculator with dispute avoidance data', 'Walk through time-lapse marketing examples'],
  },
  {
    company: 'Designer Group (Commercial Office)',
    rep: 'Marco Rossi',
    stage: 'Proposal',
    segment: 'Mid-Market',
    source: 'Inbound',
    acv: 85000,
    productBundle: 'Project Pro',
    cameraCount: 5,
    projectType: 'Commercial Office',
    competitor: 'TrueLook',
    pqScore: 46,
    personaGaps: ['Economic Buyer (CFO/Finance Director)', 'Technical Evaluator (IT/Digital Construction)'],
    missingSteps: ['Solution design (camera placement)', 'ROI calculator walkthrough with CFO'],
    daysInStage: 25,
    nextActions: ['Send ROI calculator with dispute avoidance data', 'Schedule BIM integration workshop'],
  },
  {
    company: 'Kirby Group Engineering (Renewable Energy)',
    rep: 'Liam McCarthy',
    stage: 'Proposal',
    segment: 'Mid-Market',
    source: 'Expansion',
    acv: 110000,
    productBundle: 'Safety & Compliance',
    cameraCount: 7,
    projectType: 'Renewable Energy (Wind/Solar)',
    competitor: null,
    pqScore: 78,
    personaGaps: [],
    missingSteps: [],
    daysInStage: 8,
    nextActions: ['Send solar camera spec for remote site'],
  },

  // ── NEGOTIATION (5 deals) ──
  {
    company: 'Cairn Homes (Residential Estate)',
    rep: 'Aoife Kelly',
    stage: 'Negotiation',
    segment: 'Enterprise',
    source: 'Expansion',
    acv: 220000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 8,
    projectType: 'Residential Estate',
    competitor: null,
    pqScore: 92,
    personaGaps: [],
    missingSteps: [],
    daysInStage: 6,
    nextActions: ['Finalise contract terms and deployment date', 'Schedule onboarding kick-off session'],
  },
  {
    company: 'Laing O\'Rourke (Airport Terminal)',
    rep: 'Conor Murphy',
    stage: 'Negotiation',
    segment: 'Enterprise',
    source: 'Inbound',
    acv: 390000,
    productBundle: 'Enterprise Visibility',
    cameraCount: 16,
    projectType: 'Airport Terminal',
    competitor: 'EarthCam',
    pqScore: 62,
    personaGaps: ['Champion / Executive Sponsor'],
    missingSteps: ['Deployment planning session', 'Success criteria for first 90 days'],
    daysInStage: 18,
    nextActions: ['Escalate pricing to sales manager', 'Agree success criteria for first 90 days'],
  },
  {
    company: 'John Paul Construction (Hospital PPP)',
    rep: 'Emma Hughes',
    stage: 'Negotiation',
    segment: 'Mid-Market',
    source: 'Inbound',
    acv: 130000,
    productBundle: 'Project Pro',
    cameraCount: 6,
    projectType: 'Hospital PPP',
    competitor: 'OxBlue',
    pqScore: 55,
    personaGaps: ['Economic Buyer (CFO/Finance Director)'],
    missingSteps: ['Contract redline and sign-off', 'Discount approval (if needed)'],
    daysInStage: 15,
    nextActions: ['Escalate pricing to sales manager', 'Review competitive quote against OxBlue'],
  },
  {
    company: 'Stewart Construction (University Campus)',
    rep: 'Siobhan Walsh',
    stage: 'Negotiation',
    segment: 'Mid-Market',
    source: 'Partner',
    acv: 68000,
    productBundle: 'Project Pro',
    cameraCount: 4,
    projectType: 'University Campus',
    competitor: null,
    pqScore: 75,
    personaGaps: [],
    missingSteps: ['Deployment planning session'],
    daysInStage: 8,
    nextActions: ['Finalise contract terms and deployment date', 'Schedule onboarding kick-off session'],
  },
  {
    company: 'Conack Construction (Warehouse/Logistics)',
    rep: 'Cian Brennan',
    stage: 'Negotiation',
    segment: 'SMB',
    source: 'Inbound',
    acv: 32000,
    productBundle: 'Site Starter',
    cameraCount: 2,
    projectType: 'Warehouse/Logistics',
    competitor: 'DIY/CCTV',
    pqScore: 70,
    personaGaps: [],
    missingSteps: ['Contract redline and sign-off'],
    daysInStage: 10,
    nextActions: ['Propose 2-week pilot on next project', 'Finalise contract terms and deployment date'],
  },
];

// ---------------------------------------------------------------------------
// Convert Hero Template to Full Deal
// ---------------------------------------------------------------------------

function heroToDeal(template: HeroDealTemplate, index: number): Deal {
  const pqScore = computeNonLinearPQS(
    template.pqScore, template.stage, template.segment,
    template.personaGaps, template.missingSteps, template.daysInStage,
  );
  const grade = scoreToGrade(pqScore);
  const probs = computeProbabilities(pqScore, template.stage, template.personaGaps, template.daysInStage);
  const daysOffset = template.segment === 'Enterprise' ? randInt(30, 120) : randInt(14, 75);
  const icpBase = template.segment === 'Enterprise' ? rand(60, 98) : template.segment === 'Mid-Market' ? rand(45, 90) : rand(30, 75);
  const closeDate = new Date(Date.now() + daysOffset * 86400000).toISOString().slice(0, 10);
  const createdDaysAgo = template.daysInStage + randInt(10, 60);
  const createdDate = new Date(Date.now() - createdDaysAgo * 86400000).toISOString().slice(0, 10);
  const country = pick(COUNTRY_POOLS[template.segment] || ['IE']);
  const dealType = pick(DEAL_TYPE_POOLS[template.source] || ['new-logo']);
  const channelPartner = template.source === 'Partner' ? pick(PARTNER_IDS) : null;

  return {
    id: `EC-${String(index).padStart(4, '0')}`,
    company: template.company,
    rep: template.rep,
    acv: template.acv,
    stage: template.stage,
    segment: template.segment,
    source: template.source,
    pqScore,
    grade,
    probabilities: probs,
    confidence: {
      band: pqScore > 70 ? 'High' : pqScore > 45 ? 'Medium' : 'Low',
      volatility: +(rand(0.05, 0.3)).toFixed(2),
      completeness: +(rand(0.6, 1)).toFixed(2),
    },
    icpScore: Math.round(icpBase),
    personaGaps: template.personaGaps,
    missingSteps: template.missingSteps,
    priceRisk: +(rand(0, 0.8)).toFixed(2),
    daysInStage: template.daysInStage,
    closeDate,
    nextActions: template.nextActions,
    productBundle: template.productBundle,
    cameraCount: template.cameraCount,
    projectType: template.projectType,
    competitor: template.competitor,
    createdDate,
    forecastCategory: deriveForecastCategory(template.stage, probs.win, template.daysInStage),
    activities: generateActivities(template.stage, template.daysInStage, template.rep),
    timeline: generateTimeline(template.company, template.rep, template.stage, template.daysInStage, pqScore, createdDate),
    country,
    dealType,
    channelPartner,
    // -- Status & Lifecycle --
    status: 'active',
    lossReason: null,
    currencyCode: country === 'GB' ? 'GBP' : country === 'SE' ? 'SEK' : 'EUR',
    // -- Commercial --
    discountPct: template.stage === 'Negotiation' ? +(rand(0, 20)).toFixed(1) : 0,
    discountApprover: template.stage === 'Negotiation' && Math.random() > 0.5 ? 'Sarah Kavanagh' : null,
    discountApprovalDate: template.stage === 'Negotiation' && Math.random() > 0.5 ? new Date(Date.now() - randInt(1, 7) * 86400000).toISOString().slice(0, 10) : null,
    contractType: template.segment === 'Enterprise' ? 'multi-year' : template.segment === 'Mid-Market' ? 'annual' : pick(['annual', 'project'] as const),
    contractLength: template.segment === 'Enterprise' ? pick([24, 36] as const) : template.segment === 'Mid-Market' ? 12 : pick([6, 12] as const),
    renewalProbability: +(rand(0.5, 0.95)).toFixed(2),
    implementationStatus: 'not-started',
    // -- Methodology --
    meddic: generateMEDDIC(template.stage, template.personaGaps, pqScore),
    // -- Entity Links --
    accountId: null,  // linked post-generation via deep-accounts
    primaryContactId: null,
    // -- Audit --
    createdBy: pick(CRM_USERS),
    lastModifiedBy: pick(CRM_USERS),
    updatedAt: new Date(Date.now() - randInt(0, 7) * 86400000).toISOString().slice(0, 10),
    // -- Soft Delete --
    isDeleted: false,
    deletedAt: null,
    // -- History --
    stageHistory: generateStageHistory(template.stage, template.daysInStage, createdDate, template.rep),
    competitiveIntel: generateCompetitiveIntel(template.competitor, template.acv),
  };
}

// ---------------------------------------------------------------------------
// Stage-Aware Random Deal Generator
// ---------------------------------------------------------------------------

function generateDeal(index: number): Deal {
  const segment = pick(SEGMENTS);
  const source = pick(SOURCES);
  const stage = pick(ACTIVE_STAGES);

  // ACV ranges based on Evercam's actual pricing tiers
  const acvRange = segment === 'Enterprise'
    ? [120000, 500000]
    : segment === 'Mid-Market'
      ? [35000, 180000]
      : [8000, 50000];
  const acv = randInt(acvRange[0], acvRange[1]);

  // Camera count correlates with segment
  const cameraRange = segment === 'Enterprise'
    ? [5, 25]
    : segment === 'Mid-Market'
      ? [3, 8]
      : [1, 3];
  const cameraCount = randInt(cameraRange[0], cameraRange[1]);

  // Product bundle correlates with segment
  const productBundle = segment === 'Enterprise'
    ? 'Enterprise Visibility'
    : segment === 'Mid-Market'
      ? pick(['Project Pro', 'Safety & Compliance'] as const)
      : 'Site Starter';

  // Score biases
  let baseScore = rand(20, 95);
  if (source === 'Inbound' && segment === 'SMB') baseScore = Math.min(baseScore + 15, 98);
  if (source === 'Outbound' && segment === 'Enterprise') baseScore = Math.max(baseScore - 10, 12);
  if (source === 'Partner') baseScore = Math.min(baseScore + 8, 95);
  if (source === 'Expansion') baseScore = Math.min(baseScore + 20, 98);

  // Use preliminary grade for gap/step counts (before non-linear adjustment)
  const prelimGrade = scoreToGrade(Math.round(baseScore));

  // Stage-aware persona gaps
  const stageGaps = STAGE_PERSONA_GAPS[stage] || [];
  const gapCount = prelimGrade === 'A' ? 0 : prelimGrade === 'B' ? randInt(0, 2) : randInt(1, Math.min(4, stageGaps.length + 1));
  const personaGaps: string[] = [];
  const gapPool = [...stageGaps];
  for (let i = 0; i < gapCount && gapPool.length; i++) {
    const idx = randInt(0, gapPool.length);
    personaGaps.push(gapPool.splice(idx, 1)[0]);
  }

  // Stage-aware missing steps
  const stageSteps = STAGE_MISSING_STEPS[stage] || [];
  const stepCount = prelimGrade === 'A' ? 0 : prelimGrade === 'B' ? randInt(0, 2) : randInt(1, Math.min(4, stageSteps.length + 1));
  const missingSteps: string[] = [];
  const stepPool = [...stageSteps];
  for (let i = 0; i < stepCount && stepPool.length; i++) {
    const idx = randInt(0, stepPool.length);
    missingSteps.push(stepPool.splice(idx, 1)[0]);
  }

  // Stage-aware days in stage (20% of deals overdue for risk)
  const duration = STAGE_DURATION[stage] || { min: 2, max: 45 };
  const overdue = Math.random() < 0.2;
  const daysInStage = overdue
    ? randInt(duration.max, Math.round(duration.max * 1.8))
    : randInt(duration.min, duration.max);

  // NOW compute non-linear PQS with persona gaps, missing steps, and stage context
  const pqScore = computeNonLinearPQS(baseScore, stage, segment, personaGaps, missingSteps, daysInStage);
  const grade = scoreToGrade(pqScore);
  const probs = computeProbabilities(pqScore, stage, personaGaps, daysInStage);

  // Stage-aware next actions
  const stageActions = STAGE_ACTIONS[stage] || [];
  const actions: string[] = [];
  const actionPool = [...stageActions];
  for (let i = 0; i < randInt(1, 4) && actionPool.length; i++) {
    const idx = randInt(0, actionPool.length);
    actions.push(actionPool.splice(idx, 1)[0]);
  }

  // Close dates: construction deals have longer cycles
  const daysOffset = segment === 'Enterprise' ? randInt(30, 120) : randInt(14, 75);
  const closeDate = new Date(Date.now() + daysOffset * 86400000).toISOString().slice(0, 10);

  // Created date: deal was created before current stage
  const createdDaysAgo = daysInStage + randInt(10, 60);
  const createdDate = new Date(Date.now() - createdDaysAgo * 86400000).toISOString().slice(0, 10);

  // ICP score biased by segment
  const icpBase = segment === 'Enterprise' ? rand(55, 98) : segment === 'Mid-Market' ? rand(40, 90) : rand(25, 75);

  // Competitor presence — Enterprise deals more likely to have one
  const competitor = segment === 'Enterprise'
    ? pick(COMPETITORS)
    : Math.random() > 0.6 ? pick(COMPETITORS) : null;

  // Enrichment fields
  const rep = pick(REPS);
  const company = pick(COMPANIES) + (index > 30 ? ` (${pick(PROJECT_TYPES)})` : '');
  const projectType = pick(PROJECT_TYPES);
  const country = pick(COUNTRY_POOLS[segment] || ['IE']);
  const dealType = pick(DEAL_TYPE_POOLS[source] || ['new-logo']);
  const channelPartner = source === 'Partner' ? pick(PARTNER_IDS) : null;

  return {
    id: `EC-${String(index).padStart(4, '0')}`,
    company,
    rep,
    acv,
    stage,
    segment,
    source,
    pqScore,
    grade,
    probabilities: probs,
    confidence: {
      band: pqScore > 70 ? 'High' : pqScore > 45 ? 'Medium' : 'Low',
      volatility: +(rand(0.05, 0.4)).toFixed(2),
      completeness: +(rand(0.5, 1)).toFixed(2),
    },
    icpScore: Math.round(icpBase),
    personaGaps,
    missingSteps,
    priceRisk: +(rand(0, 1)).toFixed(2),
    daysInStage,
    closeDate,
    nextActions: actions,
    productBundle,
    cameraCount,
    projectType,
    competitor,
    createdDate,
    forecastCategory: deriveForecastCategory(stage, probs.win, daysInStage),
    activities: generateActivities(stage, daysInStage, rep),
    timeline: generateTimeline(company, rep, stage, daysInStage, pqScore, createdDate),
    country,
    dealType,
    channelPartner,
    // -- Status & Lifecycle --
    status: Math.random() > 0.92 ? pick(['on-hold', 'lost', 'won'] as const) : 'active' as DealStatus,
    lossReason: null, // set below if lost
    currencyCode: country === 'GB' ? 'GBP' : country === 'SE' ? 'SEK' : 'EUR',
    // -- Commercial --
    discountPct: stage === 'Negotiation' ? +(rand(0, 25)).toFixed(1) : stage === 'Proposal' ? +(rand(0, 10)).toFixed(1) : 0,
    discountApprover: stage === 'Negotiation' && Math.random() > 0.4 ? pick(['Sarah Kavanagh', 'David Walsh', 'system@evercam.com'] as const) : null,
    discountApprovalDate: stage === 'Negotiation' && Math.random() > 0.4 ? new Date(Date.now() - randInt(1, 14) * 86400000).toISOString().slice(0, 10) : null,
    contractType: segment === 'Enterprise' ? pick(['multi-year', 'annual'] as const) : segment === 'Mid-Market' ? pick(['annual', 'project'] as const) : pick(['annual', 'project', 'pilot'] as const),
    contractLength: segment === 'Enterprise' ? pick([12, 24, 36] as const) : segment === 'Mid-Market' ? pick([6, 12] as const) : pick([3, 6, 12] as const),
    renewalProbability: +(rand(0.3, 0.95)).toFixed(2),
    implementationStatus: 'not-started' as ImplementationStatus,
    // -- Methodology --
    meddic: generateMEDDIC(stage, personaGaps, pqScore),
    // -- Entity Links --
    accountId: null,
    primaryContactId: null,
    // -- Audit --
    createdBy: pick(CRM_USERS),
    lastModifiedBy: pick(CRM_USERS),
    updatedAt: new Date(Date.now() - randInt(0, 14) * 86400000).toISOString().slice(0, 10),
    // -- Soft Delete --
    isDeleted: false,
    deletedAt: null,
    // -- History --
    stageHistory: generateStageHistory(stage, daysInStage, createdDate, rep),
    competitiveIntel: generateCompetitiveIntel(competitor, acv),
  };
}

// ---------------------------------------------------------------------------
// Post-Generation: Set loss reasons for lost deals
// ---------------------------------------------------------------------------

function postProcessDeals(deals: Deal[]): Deal[] {
  const lossReasons: LossReason[] = ['budget', 'timing', 'competitor', 'no-decision', 'champion-left', 'feature-gap'];
  return deals.map(d => {
    if (d.status === 'lost') {
      d.lossReason = pick(lossReasons);
      d.forecastCategory = 'Omit';
    }
    if (d.status === 'on-hold') {
      d.implementationStatus = 'at-risk';
    }
    if (d.status === 'won') {
      d.implementationStatus = pick(['in-progress', 'live'] as const);
      d.forecastCategory = 'Commit';
    }
    return d;
  });
}

// ---------------------------------------------------------------------------
// Generate Pipeline
// ---------------------------------------------------------------------------

const heroDeals: Deal[] = HERO_DEALS.map((h, i) => heroToDeal(h, i + 1));
const randomDeals: Deal[] = Array.from({ length: 750 - heroDeals.length }, (_, i) =>
  generateDeal(heroDeals.length + i + 1)
);

/** 750 active pipeline deals for Evercam (25 hero + 725 random stage-aware) */
export const pipelineDeals: Deal[] = postProcessDeals([...heroDeals, ...randomDeals]);

// ---------------------------------------------------------------------------
// Computed Summaries
// ---------------------------------------------------------------------------

export function getPipelineSummary(deals: Deal[]) {
  const totalACV = deals.reduce((s, d) => s + d.acv, 0);
  const qualityAdjusted = deals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const avgPQS = deals.reduce((s, d) => s + d.pqScore, 0) / deals.length;

  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  deals.forEach(d => gradeDistribution[d.grade]++);

  const atRisk = deals.filter(d => d.pqScore < 40).length;
  const slipRisk = deals.filter(d => d.probabilities.slip > 0.25).reduce((s, d) => s + d.acv, 0);

  const bySegment = SEGMENTS.map(seg => {
    const segDeals = deals.filter(d => d.segment === seg);
    return {
      segment: seg,
      count: segDeals.length,
      acv: segDeals.reduce((s, d) => s + d.acv, 0),
      avgPQS: segDeals.length ? Math.round(segDeals.reduce((s, d) => s + d.pqScore, 0) / segDeals.length) : 0,
    };
  });

  const totalCameras = deals.reduce((s, d) => s + d.cameraCount, 0);

  const confidenceLow = Math.round(qualityAdjusted * 0.85);
  const confidenceHigh = Math.round(qualityAdjusted * 1.15);

  return {
    totalACV,
    qualityAdjusted: Math.round(qualityAdjusted),
    confidenceBand: { low: confidenceLow, high: confidenceHigh },
    avgPQS: Math.round(avgPQS),
    gradeDistribution,
    atRisk,
    slipRiskACV: Math.round(slipRisk),
    dealCount: deals.length,
    bySegment,
    totalCameras,
  };
}

export function getRepSummary(deals: Deal[]) {
  const reps = [...new Set(deals.map(d => d.rep))];
  return reps.map(rep => {
    const repDeals = deals.filter(d => d.rep === rep);
    return {
      rep,
      dealCount: repDeals.length,
      totalACV: repDeals.reduce((s, d) => s + d.acv, 0),
      avgPQS: Math.round(repDeals.reduce((s, d) => s + d.pqScore, 0) / repDeals.length),
      atRisk: repDeals.filter(d => d.pqScore < 40).length,
      totalCameras: repDeals.reduce((s, d) => s + d.cameraCount, 0),
    };
  }).sort((a, b) => b.totalACV - a.totalACV);
}

// ---------------------------------------------------------------------------
// Team Structure — Managers & Rep Assignments
// ---------------------------------------------------------------------------

export interface SalesManager {
  id: string;
  name: string;
  title: string;
  team: string[];
}

export const SALES_MANAGERS: SalesManager[] = [
  {
    id: 'mgr-1',
    name: 'Sarah Kavanagh',
    title: 'Enterprise Sales Manager',
    team: ['Conor Murphy', 'James O\'Sullivan', 'Liam McCarthy'],
  },
  {
    id: 'mgr-2',
    name: 'Ronan Fitzgerald',
    title: 'Growth Sales Manager',
    team: ['Aoife Kelly', 'Niamh Doyle', 'Cian Brennan', 'Sophie Chen'],
  },
  {
    id: 'mgr-3',
    name: 'Orla Byrne',
    title: 'Mid-Market Sales Manager',
    team: ['Siobhan Walsh', 'Marco Rossi', 'Emma Hughes'],
  },
];

/** Default annual sales targets per rep (EUR) */
export const DEFAULT_REP_TARGETS: Record<string, number> = {
  'Conor Murphy': 3200000,
  'Aoife Kelly': 2800000,
  'James O\'Sullivan': 2400000,
  'Siobhan Walsh': 2000000,
  'Cian Brennan': 1600000,
  'Niamh Doyle': 2000000,
  'Marco Rossi': 1800000,
  'Emma Hughes': 1500000,
  'Liam McCarthy': 2200000,
  'Sophie Chen': 1200000,
};

export function getManagerForRep(repName: string): SalesManager | undefined {
  return SALES_MANAGERS.find(m => m.team.includes(repName));
}

export interface RepTargetSummary {
  rep: string;
  dealCount: number;
  totalACV: number;
  weightedPipeline: number;
  target: number;
  attainmentPct: number;
  gap: number;
  avgPQS: number;
  atRisk: number;
  byStage: Record<string, number>;
}

export interface ManagerTargetSummary {
  manager: SalesManager;
  totalDeals: number;
  totalACV: number;
  weightedPipeline: number;
  teamTarget: number;
  attainmentPct: number;
  gap: number;
  avgPQS: number;
  atRisk: number;
  repSummaries: RepTargetSummary[];
}

export function getManagerTargetSummary(
  deals: Deal[],
  manager: SalesManager,
  targets: Record<string, number>,
): ManagerTargetSummary {
  const teamDeals = deals.filter(d => manager.team.includes(d.rep));
  const totalACV = teamDeals.reduce((s, d) => s + d.acv, 0);
  const weightedPipeline = teamDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const teamTarget = manager.team.reduce((s, rep) => s + (targets[rep] || 0), 0);

  const repSummaries: RepTargetSummary[] = manager.team.map(rep => {
    const repDeals = teamDeals.filter(d => d.rep === rep);
    const repACV = repDeals.reduce((s, d) => s + d.acv, 0);
    const repWeighted = repDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
    const repTarget = targets[rep] || 0;
    return {
      rep,
      dealCount: repDeals.length,
      totalACV: repACV,
      weightedPipeline: Math.round(repWeighted),
      target: repTarget,
      attainmentPct: repTarget > 0 ? Math.round((repWeighted / repTarget) * 100) : 0,
      gap: Math.round(repTarget - repWeighted),
      avgPQS: repDeals.length ? Math.round(repDeals.reduce((s, d) => s + d.pqScore, 0) / repDeals.length) : 0,
      atRisk: repDeals.filter(d => d.pqScore < 40).length,
      byStage: {
        Discovery: repDeals.filter(d => d.stage === 'Discovery').length,
        Qualification: repDeals.filter(d => d.stage === 'Qualification').length,
        Proposal: repDeals.filter(d => d.stage === 'Proposal').length,
        Negotiation: repDeals.filter(d => d.stage === 'Negotiation').length,
      },
    };
  });

  return {
    manager,
    totalDeals: teamDeals.length,
    totalACV,
    weightedPipeline: Math.round(weightedPipeline),
    teamTarget,
    attainmentPct: teamTarget > 0 ? Math.round((weightedPipeline / teamTarget) * 100) : 0,
    gap: Math.round(teamTarget - weightedPipeline),
    avgPQS: teamDeals.length ? Math.round(teamDeals.reduce((s, d) => s + d.pqScore, 0) / teamDeals.length) : 0,
    atRisk: teamDeals.filter(d => d.pqScore < 40).length,
    repSummaries,
  };
}

/** Generate AI recommendations for a manager to improve target attainment */
export function generateTargetRecommendations(
  deals: Deal[],
  summary: ManagerTargetSummary,
): string[] {
  const recommendations: string[] = [];
  const teamDeals = deals.filter(d => summary.manager.team.includes(d.rep));

  if (summary.gap > 0) {
    const gapFmt = summary.gap >= 1000000
      ? `€${(summary.gap / 1000000).toFixed(1)}M`
      : `€${(summary.gap / 1000).toFixed(0)}K`;
    recommendations.push(
      `Team is at ${summary.attainmentPct}% of target. Close the ${gapFmt} gap by focusing on late-stage deals with highest win probability.`
    );
  }

  const lateStageDeals = teamDeals
    .filter(d => (d.stage === 'Proposal' || d.stage === 'Negotiation') && d.pqScore < 65)
    .sort((a, b) => b.acv - a.acv)
    .slice(0, 3);
  if (lateStageDeals.length > 0) {
    const deal = lateStageDeals[0];
    const acvFmt = deal.acv >= 1000000
      ? `€${(deal.acv / 1000000).toFixed(1)}M`
      : `€${(deal.acv / 1000).toFixed(0)}K`;
    recommendations.push(
      `${deal.company} (${acvFmt}, ${deal.stage}) has PQS ${deal.pqScore} — improving deal quality could add significant weighted value. ${deal.personaGaps.length > 0 ? `Missing: ${deal.personaGaps[0]}.` : `Address: ${deal.missingSteps[0] || 'stalled engagement'}.`}`
    );
  }

  const ebGapDeals = teamDeals.filter(
    d => d.stage === 'Proposal' && d.personaGaps.some(g => g.includes('Economic Buyer'))
  );
  if (ebGapDeals.length > 0) {
    const totalEbACV = ebGapDeals.reduce((s, d) => s + d.acv, 0);
    const acvFmt = totalEbACV >= 1000000
      ? `€${(totalEbACV / 1000000).toFixed(1)}M`
      : `€${(totalEbACV / 1000).toFixed(0)}K`;
    recommendations.push(
      `${ebGapDeals.length} Proposal-stage deals (${acvFmt} total) missing Economic Buyer engagement — scheduling CFO meetings increases win rate by ~35%.`
    );
  }

  const stalledDeals = teamDeals.filter(d => d.daysInStage > 20 && d.stage !== 'Closed Won');
  if (stalledDeals.length > 0) {
    recommendations.push(
      `${stalledDeals.length} deals stalled 20+ days — prioritise next-step meetings this week to unblock pipeline velocity.`
    );
  }

  const earlyStage = teamDeals.filter(d => d.stage === 'Discovery' || d.stage === 'Qualification').length;
  const lateStage = teamDeals.filter(d => d.stage === 'Proposal' || d.stage === 'Negotiation').length;
  if (earlyStage > lateStage * 2.5 && summary.totalDeals > 10) {
    recommendations.push(
      `${Math.round((earlyStage / summary.totalDeals) * 100)}% of pipeline is in Discovery/Qualification — accelerate qualification on high-fit deals to move revenue into close-able stages this quarter.`
    );
  }

  const weakRep = summary.repSummaries
    .filter(r => r.attainmentPct < 50 && r.dealCount > 5)
    .sort((a, b) => a.attainmentPct - b.attainmentPct)[0];
  if (weakRep) {
    recommendations.push(
      `${weakRep.rep} is at ${weakRep.attainmentPct}% attainment with ${weakRep.atRisk} at-risk deals — schedule focused coaching session on deal qualification and MEDDIC completeness.`
    );
  }

  const multiThreadDeals = teamDeals.filter(d => d.personaGaps.length >= 2 && d.acv > 100000);
  if (multiThreadDeals.length > 0) {
    recommendations.push(
      `${multiThreadDeals.length} high-value deals have 2+ persona gaps — multi-threading these accounts could significantly improve win probability.`
    );
  }

  return recommendations.slice(0, 6);
}

/** Evercam-specific: competitor win/loss analysis */
export function getCompetitorSummary(deals: Deal[]) {
  const withCompetitor = deals.filter(d => d.competitor !== null);
  const competitors = [...new Set(withCompetitor.map(d => d.competitor!))];
  return competitors.map(comp => {
    const compDeals = withCompetitor.filter(d => d.competitor === comp);
    return {
      competitor: comp,
      dealCount: compDeals.length,
      totalACV: compDeals.reduce((s, d) => s + d.acv, 0),
      avgPQS: Math.round(compDeals.reduce((s, d) => s + d.pqScore, 0) / compDeals.length),
    };
  }).sort((a, b) => b.dealCount - a.dealCount);
}

/** Evercam-specific: product bundle distribution */
export function getBundleSummary(deals: Deal[]) {
  const bundles = [...new Set(deals.map(d => d.productBundle))];
  return bundles.map(bundle => {
    const bundleDeals = deals.filter(d => d.productBundle === bundle);
    return {
      bundle,
      dealCount: bundleDeals.length,
      totalACV: bundleDeals.reduce((s, d) => s + d.acv, 0),
      avgCameras: Math.round(bundleDeals.reduce((s, d) => s + d.cameraCount, 0) / bundleDeals.length),
      avgPQS: Math.round(bundleDeals.reduce((s, d) => s + d.pqScore, 0) / bundleDeals.length),
    };
  }).sort((a, b) => b.totalACV - a.totalACV);
}

// ---------------------------------------------------------------------------
// Actual vs Plan (Bookings) — Monthly Data
// ---------------------------------------------------------------------------

export interface MonthlyBookings {
  month: string;          // "Jan 26", "Feb 26", etc.
  monthIndex: number;     // 0-11
  planCumulative: number; // Cumulative quota/plan
  actualCumulative: number; // Cumulative closed-won bookings
  planMonthly: number;    // Monthly quota slice
  actualMonthly: number;  // Monthly bookings
  forecastCumulative: number | null; // null for past months, projected for future
}

export function getActualVsPlan(): MonthlyBookings[] {
  const annualTarget = Object.values(DEFAULT_REP_TARGETS).reduce((s, t) => s + t, 0);
  const monthlyPlan = Math.round(annualTarget / 12);

  // Simulated monthly bookings — realistic SaaS pattern: slow Q1, ramp Q2-Q3, hockey stick Q4
  const seasonality = [0.7, 0.75, 0.85, 0.9, 1.0, 1.05, 0.95, 1.1, 1.15, 1.2, 1.3, 1.5];
  const months = ['Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26',
                  'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26'];

  // Current month = Mar 2026 (index 2) — first 2 months are actuals, rest are forecast
  const currentMonthIdx = 2;
  const rng = (base: number, variance: number) =>
    Math.round(base * (1 + (Math.sin(base * 7.3) * variance)));

  let planCum = 0;
  let actualCum = 0;
  let lastActualCum = 0;

  return months.map((month, i) => {
    const planMonth = monthlyPlan;
    planCum += planMonth;

    let actualMonth: number;
    let forecastCum: number | null = null;

    if (i < currentMonthIdx) {
      // Past months — actual bookings with realistic variance
      actualMonth = rng(Math.round(monthlyPlan * seasonality[i]), 0.08);
      actualCum += actualMonth;
      lastActualCum = actualCum;
    } else if (i === currentMonthIdx) {
      // Current month — partial (60% through)
      actualMonth = Math.round(monthlyPlan * seasonality[i] * 0.6);
      actualCum += actualMonth;
      lastActualCum = actualCum;
      forecastCum = actualCum + Math.round(monthlyPlan * seasonality[i] * 0.4);
    } else {
      // Future months — forecast only (no actual)
      actualMonth = 0;
      let cum = lastActualCum;
      // Add current month remainder
      if (i === currentMonthIdx + 1) {
        cum += Math.round(monthlyPlan * seasonality[currentMonthIdx] * 0.4);
      }
      for (let j = Math.max(currentMonthIdx + 1, currentMonthIdx + 1); j <= i; j++) {
        cum += Math.round(monthlyPlan * seasonality[j] * 0.92);
      }
      forecastCum = cum;
    }

    return {
      month,
      monthIndex: i,
      planCumulative: planCum,
      actualCumulative: i <= currentMonthIdx ? actualCum : 0,
      planMonthly: planMonth,
      actualMonthly: actualMonth,
      forecastCumulative: i >= currentMonthIdx ? (forecastCum ?? actualCum) : null,
    };
  });
}

// ---------------------------------------------------------------------------
// SaaS Revenue Metrics (RevOps) — Churn, Retention, Unit Economics
// ---------------------------------------------------------------------------

export interface SaaSMetrics {
  // Retention
  nrr: number;             // Net Revenue Retention % (target: 110%+)
  grr: number;             // Gross Revenue Retention % (target: 85%+)
  logoChurnRate: number;   // % of customers lost
  revenueChurnRate: number;// % of revenue lost from churn + downgrades
  expansionRate: number;   // % revenue from upsell/cross-sell

  // Unit Economics
  cac: number;             // Customer Acquisition Cost
  ltv: number;             // Lifetime Value (avg)
  ltvCacRatio: number;     // LTV:CAC (target: 3x+)
  paybackMonths: number;   // Months to recover CAC
  magicNumber: number;     // Net new ARR / prior quarter S&M spend (target: >0.75)
  costOfSale: number;      // Sales cost as % of revenue

  // Sales Efficiency
  revenuePerRep: number;
  avgDealCycle: number;    // days
  pipelineCreationRate: number; // new $ entering pipeline per month
  winRate: number;

  // Churn by segment
  churnBySegment: Array<{
    segment: string;
    logoChurn: number;
    revenueChurn: number;
    nrr: number;
  }>;

  // Monthly NRR trend
  nrrTrend: Array<{
    month: string;
    nrr: number;
    grr: number;
    expansion: number;
    churn: number;
  }>;
}

export function getSaaSMetrics(): SaaSMetrics {
  const totalReps = Object.keys(DEFAULT_REP_TARGETS).length;
  const annualTarget = Object.values(DEFAULT_REP_TARGETS).reduce((s, t) => s + t, 0);
  const wonDeals = pipelineDeals.filter(d => d.status === 'won');
  const lostDeals = pipelineDeals.filter(d => d.status === 'lost');
  const allClosed = wonDeals.length + lostDeals.length;
  const totalWonACV = wonDeals.reduce((s, d) => s + d.acv, 0);
  const avgDealSize = wonDeals.length > 0 ? Math.round(totalWonACV / wonDeals.length) : 120000;

  // Realistic SaaS metrics derived from deal data
  const winRate = allClosed > 0 ? Math.round((wonDeals.length / allClosed) * 100) : 32;
  const avgCycle = wonDeals.length > 0
    ? Math.round(wonDeals.reduce((s, d) => s + d.daysInStage * 2.5, 0) / wonDeals.length)
    : 45;

  // Simulated S&M spend: ~38% of annual target as cost base
  const annualSMSpend = Math.round(annualTarget * 0.38);
  const quarterSMSpend = Math.round(annualSMSpend / 4);
  const newCustomersPerQuarter = Math.round(wonDeals.length * 0.7) || 12;
  const cac = Math.round(quarterSMSpend / newCustomersPerQuarter);
  const ltv = Math.round(avgDealSize * 4.2); // ~4.2 year average life
  const revenuePerRep = Math.round(annualTarget / totalReps);

  // Pipeline creation rate from current pipeline
  const totalPipeline = pipelineDeals.reduce((s, d) => s + d.acv, 0);
  const pipelineCreationRate = Math.round(totalPipeline / 6);

  return {
    nrr: 112,
    grr: 87,
    logoChurnRate: 8.2,
    revenueChurnRate: 5.4,
    expansionRate: 17.4,
    cac,
    ltv,
    ltvCacRatio: +(ltv / cac).toFixed(1),
    paybackMonths: Math.round((cac / (avgDealSize / 12))),
    magicNumber: 0.82,
    costOfSale: 28,
    revenuePerRep,
    avgDealCycle: avgCycle,
    pipelineCreationRate,
    winRate,
    churnBySegment: [
      { segment: 'Enterprise', logoChurn: 4.1, revenueChurn: 2.8, nrr: 118 },
      { segment: 'Mid-Market', logoChurn: 8.5, revenueChurn: 5.2, nrr: 112 },
      { segment: 'SMB', logoChurn: 14.3, revenueChurn: 10.1, nrr: 96 },
    ],
    nrrTrend: [
      { month: 'Sep 25', nrr: 108, grr: 85, expansion: 14.2, churn: 6.2 },
      { month: 'Oct 25', nrr: 109, grr: 86, expansion: 15.0, churn: 6.0 },
      { month: 'Nov 25', nrr: 110, grr: 86, expansion: 15.8, churn: 5.8 },
      { month: 'Dec 25', nrr: 111, grr: 87, expansion: 16.2, churn: 5.2 },
      { month: 'Jan 26', nrr: 111, grr: 87, expansion: 16.8, churn: 5.8 },
      { month: 'Feb 26', nrr: 112, grr: 87, expansion: 17.4, churn: 5.4 },
    ],
  };
}
