import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { pipelineDeals } from '@/data/demo-data';

// ---------------------------------------------------------------------------
// Scoring Weight Configuration
// ---------------------------------------------------------------------------

export interface ScoringWeights {
  /** Penalty when Economic Buyer is missing at Proposal/Negotiation (base pts) */
  ebMissingPenalty: number;
  /** Size multiplier for Enterprise EB gap */
  ebEnterpriseMult: number;
  /** Size multiplier for Mid-Market EB gap */
  ebMidMarketMult: number;
  /** Penalty when Champion is missing at Negotiation */
  championMissingPenalty: number;
  /** Per-gap penalty for other persona gaps */
  otherGapPenalty: number;
  /** Missing step penalty for late-stage deals (Proposal/Negotiation) */
  lateStageStepPenalty: number;
  /** Missing step penalty for early-stage deals (Discovery/Qualification) */
  earlyStageStepPenalty: number;
  /** Max points deducted for time decay */
  maxTimeDecayPenalty: number;
  /** Time decay rate (pts per % overdue) */
  timeDecayRate: number;
}

export interface StageBaseRates {
  Discovery: number;
  Qualification: number;
  Proposal: number;
  Negotiation: number;
}

export interface ForecastThresholds {
  /** Win prob threshold for Commit (Negotiation stage) */
  commitWinProb: number;
  /** Win prob threshold for Best Case (Proposal stage) */
  bestCaseWinProb: number;
  /** Win prob below which deal is Omit */
  omitWinProb: number;
  /** Days stalled above which deal is Omit */
  omitStalledDays: number;
}

export interface GradeThresholds {
  A: number; // >= this = A
  B: number;
  C: number;
  D: number;
  // below D = F
}

export interface FullScoringConfig {
  weights: ScoringWeights;
  stageBaseRates: StageBaseRates;
  forecastThresholds: ForecastThresholds;
  gradeThresholds: GradeThresholds;
}

// ---------------------------------------------------------------------------
// Defaults — these are the current production values
// ---------------------------------------------------------------------------

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  ebMissingPenalty: 20,
  ebEnterpriseMult: 1.5,
  ebMidMarketMult: 1.2,
  championMissingPenalty: 15,
  otherGapPenalty: 8,
  lateStageStepPenalty: 10,
  earlyStageStepPenalty: 5,
  maxTimeDecayPenalty: 20,
  timeDecayRate: 15,
};

export const DEFAULT_STAGE_BASE_RATES: StageBaseRates = {
  Discovery: 0.15,
  Qualification: 0.25,
  Proposal: 0.40,
  Negotiation: 0.65,
};

export const DEFAULT_FORECAST_THRESHOLDS: ForecastThresholds = {
  commitWinProb: 0.55,
  bestCaseWinProb: 0.45,
  omitWinProb: 0.10,
  omitStalledDays: 45,
};

export const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  A: 80,
  B: 65,
  C: 50,
  D: 35,
};

export const DEFAULT_CONFIG: FullScoringConfig = {
  weights: DEFAULT_SCORING_WEIGHTS,
  stageBaseRates: DEFAULT_STAGE_BASE_RATES,
  forecastThresholds: DEFAULT_FORECAST_THRESHOLDS,
  gradeThresholds: DEFAULT_GRADE_THRESHOLDS,
};

// ---------------------------------------------------------------------------
// Proposed Values — derived from historical pipeline analysis
// ---------------------------------------------------------------------------

export interface ProposedValues {
  weights: Partial<ScoringWeights>;
  stageBaseRates: Partial<StageBaseRates>;
  rationale: Record<string, string>;
}

/** Compute proposed scoring adjustments from actual pipeline data */
function computeProposedValues(deals: typeof pipelineDeals): ProposedValues {
  const rationale: Record<string, string> = {};

  // Analyze EB gap impact: compare avg win% with/without EB at Proposal+
  const lateDeals = deals.filter(d => d.stage === 'Proposal' || d.stage === 'Negotiation');
  const withEB = lateDeals.filter(d => !d.personaGaps.some(g => g.includes('Economic Buyer')));
  const withoutEB = lateDeals.filter(d => d.personaGaps.some(g => g.includes('Economic Buyer')));
  const ebWinWith = withEB.length > 0 ? withEB.reduce((s, d) => s + d.probabilities.win, 0) / withEB.length : 0;
  const ebWinWithout = withoutEB.length > 0 ? withoutEB.reduce((s, d) => s + d.probabilities.win, 0) / withoutEB.length : 0;
  const ebImpact = Math.round((ebWinWith - ebWinWithout) * 100);

  let proposedEBPenalty = DEFAULT_SCORING_WEIGHTS.ebMissingPenalty;
  if (ebImpact > 25) {
    proposedEBPenalty = Math.min(30, Math.round(ebImpact * 0.9));
    rationale.ebMissingPenalty = `EB presence correlates with +${ebImpact}pp win rate at Proposal/Negotiation. Recommend increasing penalty to ${proposedEBPenalty}.`;
  } else if (ebImpact < 10) {
    proposedEBPenalty = Math.max(10, Math.round(ebImpact * 1.5));
    rationale.ebMissingPenalty = `EB impact is modest (+${ebImpact}pp). Consider reducing penalty to ${proposedEBPenalty}.`;
  }

  // Analyze stage conversion rates from pipeline distribution
  const byStage: Record<string, number> = {};
  deals.forEach(d => { byStage[d.stage] = (byStage[d.stage] || 0) + 1; });
  const total = deals.length;
  const stageRates: Partial<StageBaseRates> = {};

  const stageOrder = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'] as const;
  for (let i = 0; i < stageOrder.length; i++) {
    const stage = stageOrder[i];
    const stageDeals = deals.filter(d => d.stage === stage);
    const avgWin = stageDeals.length > 0
      ? stageDeals.reduce((s, d) => s + d.probabilities.win, 0) / stageDeals.length
      : DEFAULT_STAGE_BASE_RATES[stage];
    stageRates[stage] = +avgWin.toFixed(2);

    const pct = Math.round((byStage[stage] || 0) / total * 100);
    rationale[`stageRate_${stage}`] = `${pct}% of pipeline in ${stage} with avg win rate ${(avgWin * 100).toFixed(0)}%.`;
  }

  // Analyze champion impact at Negotiation
  const negDeals = deals.filter(d => d.stage === 'Negotiation');
  const withChamp = negDeals.filter(d => !d.personaGaps.some(g => g.includes('Champion')));
  const withoutChamp = negDeals.filter(d => d.personaGaps.some(g => g.includes('Champion')));
  const champWinWith = withChamp.length > 0 ? withChamp.reduce((s, d) => s + d.probabilities.win, 0) / withChamp.length : 0;
  const champWinWithout = withoutChamp.length > 0 ? withoutChamp.reduce((s, d) => s + d.probabilities.win, 0) / withoutChamp.length : 0;
  const champImpact = Math.round((champWinWith - champWinWithout) * 100);

  let proposedChampPenalty = DEFAULT_SCORING_WEIGHTS.championMissingPenalty;
  if (champImpact > 20) {
    proposedChampPenalty = Math.min(25, Math.round(champImpact * 0.8));
    rationale.championMissingPenalty = `Champion presence adds +${champImpact}pp win rate at Negotiation. Recommend ${proposedChampPenalty}pt penalty.`;
  }

  // Analyze stall impact
  const stalledDeals = deals.filter(d => d.daysInStage > 20);
  const activeDealz = deals.filter(d => d.daysInStage <= 20);
  const stallWin = stalledDeals.length > 0 ? stalledDeals.reduce((s, d) => s + d.probabilities.win, 0) / stalledDeals.length : 0;
  const activeWin = activeDealz.length > 0 ? activeDealz.reduce((s, d) => s + d.probabilities.win, 0) / activeDealz.length : 0;
  const stallImpact = Math.round((activeWin - stallWin) * 100);
  rationale.timeDecay = `Stalled deals (>20d) have ${stallImpact}pp lower win rate than active deals. Current decay rate captures ${stallImpact > 15 ? 'most' : 'some'} of this effect.`;

  return {
    weights: {
      ebMissingPenalty: proposedEBPenalty,
      championMissingPenalty: proposedChampPenalty,
    },
    stageBaseRates: stageRates,
    rationale,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ScoringConfigContextValue {
  config: FullScoringConfig;
  proposedValues: ProposedValues;
  updateWeights: (updates: Partial<ScoringWeights>) => void;
  updateStageBaseRates: (updates: Partial<StageBaseRates>) => void;
  updateForecastThresholds: (updates: Partial<ForecastThresholds>) => void;
  updateGradeThresholds: (updates: Partial<GradeThresholds>) => void;
  resetToDefaults: () => void;
  applyProposed: () => void;
  hasChanges: boolean;
}

const ScoringConfigContext = createContext<ScoringConfigContextValue | null>(null);

export function ScoringConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<FullScoringConfig>(DEFAULT_CONFIG);

  const proposedValues = useMemo(() => computeProposedValues(pipelineDeals), []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(DEFAULT_CONFIG);
  }, [config]);

  const updateWeights = (updates: Partial<ScoringWeights>) => {
    setConfig(prev => ({ ...prev, weights: { ...prev.weights, ...updates } }));
  };

  const updateStageBaseRates = (updates: Partial<StageBaseRates>) => {
    setConfig(prev => ({ ...prev, stageBaseRates: { ...prev.stageBaseRates, ...updates } }));
  };

  const updateForecastThresholds = (updates: Partial<ForecastThresholds>) => {
    setConfig(prev => ({ ...prev, forecastThresholds: { ...prev.forecastThresholds, ...updates } }));
  };

  const updateGradeThresholds = (updates: Partial<GradeThresholds>) => {
    setConfig(prev => ({ ...prev, gradeThresholds: { ...prev.gradeThresholds, ...updates } }));
  };

  const resetToDefaults = () => setConfig(DEFAULT_CONFIG);

  const applyProposed = () => {
    setConfig(prev => ({
      ...prev,
      weights: { ...prev.weights, ...proposedValues.weights },
      stageBaseRates: { ...prev.stageBaseRates, ...proposedValues.stageBaseRates },
    }));
  };

  return (
    <ScoringConfigContext.Provider value={{
      config, proposedValues, updateWeights, updateStageBaseRates,
      updateForecastThresholds, updateGradeThresholds,
      resetToDefaults, applyProposed, hasChanges,
    }}>
      {children}
    </ScoringConfigContext.Provider>
  );
}

export function useScoringConfig() {
  const ctx = useContext(ScoringConfigContext);
  if (!ctx) throw new Error('useScoringConfig must be used within ScoringConfigProvider');
  return ctx;
}
