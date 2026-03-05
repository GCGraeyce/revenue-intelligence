import { useScoringConfig, DEFAULT_CONFIG } from '@/contexts/ScoringConfigContext';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';
import { Settings, RotateCcw, Sparkles, Lock, Info } from 'lucide-react';

function WeightRow({
  label,
  description,
  value,
  defaultValue,
  proposedValue,
  rationale,
  onChange,
  readOnly,
  min = 0,
  max = 100,
  step = 1,
  suffix = 'pts',
}: {
  label: string;
  description: string;
  value: number;
  defaultValue: number;
  proposedValue?: number;
  rationale?: string;
  onChange: (v: number) => void;
  readOnly: boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const isModified = value !== defaultValue;
  const isProposed = proposedValue !== undefined && proposedValue !== defaultValue;

  return (
    <div className="py-3 border-b border-border/20 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          {isModified && (
            <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              MODIFIED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isProposed && !readOnly && (
            <button
              onClick={() => onChange(proposedValue)}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))] hover:bg-[hsl(var(--grade-a)/.2)] transition-colors"
              title="Apply AI-proposed value"
            >
              PROPOSED: {proposedValue}{suffix}
            </button>
          )}
          <div className="flex items-center gap-1">
            {readOnly ? (
              <span className="text-sm font-mono text-foreground">{value}{suffix}</span>
            ) : (
              <input
                type="number"
                value={value}
                onChange={e => onChange(+e.target.value)}
                min={min}
                max={max}
                step={step}
                className="w-20 text-sm font-mono text-right bg-background border border-border/40 rounded px-2 py-1 focus:outline-none focus:border-primary/50"
              />
            )}
            <span className="text-[10px] text-muted-foreground font-mono">{suffix}</span>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
      {rationale && (
        <div className="mt-1 flex items-start gap-1.5 text-[10px] text-primary/80 bg-primary/5 rounded px-2 py-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{rationale}</span>
        </div>
      )}
    </div>
  );
}

export function ScoringConfig() {
  const { role } = useRole();
  const {
    config, proposedValues, updateWeights, updateStageBaseRates,
    updateForecastThresholds, updateGradeThresholds,
    resetToDefaults, applyProposed, hasChanges,
  } = useScoringConfig();

  const readOnly = role !== 'revops' && role !== 'exec';
  const canEdit = role === 'revops';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Scoring Configuration</h2>
          {readOnly && (
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
              <Lock className="w-3 h-3" /> VIEW ONLY
            </span>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={applyProposed}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply AI Proposed
            </button>
            {hasChanges && (
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* PQS Scoring Weights */}
      <div className="glass-card p-5">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          PQS Scoring Weights
        </h3>
        <WeightRow
          label="Economic Buyer Missing Penalty"
          description="Points deducted when EB is not engaged at Proposal or Negotiation stage. Critical for Enterprise deals."
          value={config.weights.ebMissingPenalty}
          defaultValue={DEFAULT_CONFIG.weights.ebMissingPenalty}
          proposedValue={proposedValues.weights.ebMissingPenalty}
          rationale={proposedValues.rationale.ebMissingPenalty}
          onChange={v => updateWeights({ ebMissingPenalty: v })}
          readOnly={!canEdit}
        />
        <WeightRow
          label="Enterprise EB Multiplier"
          description="Multiplier applied to EB penalty for Enterprise-segment deals."
          value={config.weights.ebEnterpriseMult}
          defaultValue={DEFAULT_CONFIG.weights.ebEnterpriseMult}
          onChange={v => updateWeights({ ebEnterpriseMult: v })}
          readOnly={!canEdit}
          min={1} max={3} step={0.1} suffix="x"
        />
        <WeightRow
          label="Mid-Market EB Multiplier"
          description="Multiplier applied to EB penalty for Mid-Market-segment deals."
          value={config.weights.ebMidMarketMult}
          defaultValue={DEFAULT_CONFIG.weights.ebMidMarketMult}
          onChange={v => updateWeights({ ebMidMarketMult: v })}
          readOnly={!canEdit}
          min={1} max={3} step={0.1} suffix="x"
        />
        <WeightRow
          label="Champion Missing Penalty"
          description="Points deducted when Champion/Executive Sponsor is missing at Negotiation."
          value={config.weights.championMissingPenalty}
          defaultValue={DEFAULT_CONFIG.weights.championMissingPenalty}
          proposedValue={proposedValues.weights.championMissingPenalty}
          rationale={proposedValues.rationale.championMissingPenalty}
          onChange={v => updateWeights({ championMissingPenalty: v })}
          readOnly={!canEdit}
        />
        <WeightRow
          label="Other Persona Gap Penalty"
          description="Points deducted per additional persona gap beyond EB and Champion."
          value={config.weights.otherGapPenalty}
          defaultValue={DEFAULT_CONFIG.weights.otherGapPenalty}
          onChange={v => updateWeights({ otherGapPenalty: v })}
          readOnly={!canEdit}
        />
        <WeightRow
          label="Late-Stage Step Penalty"
          description="Points per missing process step at Proposal/Negotiation stages."
          value={config.weights.lateStageStepPenalty}
          defaultValue={DEFAULT_CONFIG.weights.lateStageStepPenalty}
          onChange={v => updateWeights({ lateStageStepPenalty: v })}
          readOnly={!canEdit}
        />
        <WeightRow
          label="Early-Stage Step Penalty"
          description="Points per missing process step at Discovery/Qualification stages."
          value={config.weights.earlyStageStepPenalty}
          defaultValue={DEFAULT_CONFIG.weights.earlyStageStepPenalty}
          onChange={v => updateWeights({ earlyStageStepPenalty: v })}
          readOnly={!canEdit}
        />
        <WeightRow
          label="Max Time Decay Penalty"
          description="Maximum points that can be deducted for deals exceeding typical stage duration."
          value={config.weights.maxTimeDecayPenalty}
          defaultValue={DEFAULT_CONFIG.weights.maxTimeDecayPenalty}
          onChange={v => updateWeights({ maxTimeDecayPenalty: v })}
          readOnly={!canEdit}
        />
      </div>

      {/* Stage Base Win Rates */}
      <div className="glass-card p-5">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          Stage Base Win Rates
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Historical conversion rates by stage. PQS modulates win probability around these base rates.
        </p>
        {(['Discovery', 'Qualification', 'Proposal', 'Negotiation'] as const).map(stage => (
          <WeightRow
            key={stage}
            label={stage}
            description={`Base win probability for deals in ${stage} stage.`}
            value={config.stageBaseRates[stage]}
            defaultValue={DEFAULT_CONFIG.stageBaseRates[stage]}
            proposedValue={proposedValues.stageBaseRates[stage]}
            rationale={proposedValues.rationale[`stageRate_${stage}`]}
            onChange={v => updateStageBaseRates({ [stage]: v })}
            readOnly={!canEdit}
            min={0.01} max={0.99} step={0.01} suffix=""
          />
        ))}
      </div>

      {/* Forecast Category Thresholds */}
      <div className="glass-card p-5">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          Forecast Category Thresholds
        </h3>
        <WeightRow
          label="Commit Win Probability"
          description="Minimum win probability for Negotiation-stage deals to be categorised as Commit."
          value={config.forecastThresholds.commitWinProb}
          defaultValue={DEFAULT_CONFIG.forecastThresholds.commitWinProb}
          onChange={v => updateForecastThresholds({ commitWinProb: v })}
          readOnly={!canEdit}
          min={0.01} max={0.99} step={0.01} suffix=""
        />
        <WeightRow
          label="Best Case Win Probability"
          description="Minimum win probability for Proposal-stage deals to qualify as Best Case."
          value={config.forecastThresholds.bestCaseWinProb}
          defaultValue={DEFAULT_CONFIG.forecastThresholds.bestCaseWinProb}
          onChange={v => updateForecastThresholds({ bestCaseWinProb: v })}
          readOnly={!canEdit}
          min={0.01} max={0.99} step={0.01} suffix=""
        />
        <WeightRow
          label="Omit Win Probability"
          description="Deals below this win probability are categorised as Omit (excluded from forecast)."
          value={config.forecastThresholds.omitWinProb}
          defaultValue={DEFAULT_CONFIG.forecastThresholds.omitWinProb}
          onChange={v => updateForecastThresholds({ omitWinProb: v })}
          readOnly={!canEdit}
          min={0.01} max={0.5} step={0.01} suffix=""
        />
        <WeightRow
          label="Omit Stalled Days"
          description="Deals stalled longer than this are categorised as Omit regardless of win probability."
          value={config.forecastThresholds.omitStalledDays}
          defaultValue={DEFAULT_CONFIG.forecastThresholds.omitStalledDays}
          onChange={v => updateForecastThresholds({ omitStalledDays: v })}
          readOnly={!canEdit}
          min={14} max={90} step={1} suffix="d"
        />
      </div>

      {/* Grade Thresholds */}
      <div className="glass-card p-5">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          Grade Thresholds
        </h3>
        {(['A', 'B', 'C', 'D'] as const).map(grade => (
          <WeightRow
            key={grade}
            label={`Grade ${grade} Threshold`}
            description={`PQS score at or above this value earns Grade ${grade}.`}
            value={config.gradeThresholds[grade]}
            defaultValue={DEFAULT_CONFIG.gradeThresholds[grade]}
            onChange={v => updateGradeThresholds({ [grade]: v })}
            readOnly={!canEdit}
            min={0} max={100} step={1} suffix=""
          />
        ))}
      </div>

      {/* Pipeline Data Insights */}
      <div className={cn('glass-card p-5', 'bg-primary/[0.02]')}>
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          AI-Proposed Adjustments Rationale
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Based on analysis of {750} pipeline deals, the AI recommends these weight adjustments.
          {canEdit ? ' Click "Apply AI Proposed" to accept all recommendations.' : ' Contact RevOps to apply changes.'}
        </p>
        <div className="space-y-2">
          {Object.entries(proposedValues.rationale).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2 text-[11px]">
              <span className="text-primary/60 font-mono flex-shrink-0">{key.replace(/_/g, ' ')}</span>
              <span className="text-muted-foreground">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
