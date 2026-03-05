import { useMemo } from 'react';
import { pipelineDeals, Deal } from '@/data/demo-data';
import { SALES_PLAYBOOK } from '@/data/evercam-context';
import { AlertTriangle, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { Term } from './Glossary';
import { fmt } from '@/lib/utils';

/* ─── Types ─── */
interface StageValidation {
  deal: Deal;
  currentStage: string;
  suggestedStage: string;
  direction: 'advance' | 'regress' | 'correct';
  confidence: number;
  reasons: string[];
  severity: 'critical' | 'warning' | 'info';
}

/* ─── Stage validation logic ─── */
function validateDealStage(deal: Deal): StageValidation | null {
  const stageIndex = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'].indexOf(deal.stage);
  if (stageIndex === -1) return null;

  const playbookStage = SALES_PLAYBOOK.find((s) => s.stage === deal.stage);
  if (!playbookStage) return null;

  const reasons: string[] = [];
  let suggestedStage = deal.stage;
  let direction: 'advance' | 'regress' | 'correct' = 'correct';

  // Check if deal should ADVANCE — has signals of later stage
  if (deal.stage === 'Discovery') {
    const hasQualSignals =
      deal.personaGaps.length <= 2 &&
      !deal.personaGaps.some((g) => g.includes('Project Manager')) &&
      deal.daysInStage > 10;
    if (hasQualSignals) {
      const missingStepsForQual = deal.missingSteps.filter(
        (s) => s.includes('Demo') || s.includes('Technical') || s.includes('Competitive')
      );
      if (missingStepsForQual.length === 0) {
        suggestedStage = 'Qualification';
        direction = 'advance';
        reasons.push('Project Manager engaged, technical requirements likely discussed');
        reasons.push('No outstanding Discovery activities detected');
        reasons.push(
          `In stage for ${deal.daysInStage} days — exceeds typical ${playbookStage.typicalDuration.maxDays}d max`
        );
      }
    }
  }

  if (deal.stage === 'Qualification') {
    const hasProposalSignals =
      !deal.personaGaps.some((g) => g.includes('Economic Buyer')) &&
      !deal.missingSteps.some((s) => s.includes('Demo')) &&
      deal.pqScore >= 50 &&
      deal.daysInStage > 14;
    if (hasProposalSignals) {
      suggestedStage = 'Proposal';
      direction = 'advance';
      reasons.push('Economic Buyer already engaged');
      reasons.push('Demo completed, technical requirements reviewed');
      reasons.push('PQS suggests deal maturity beyond Qualification');
    }
  }

  // Check if deal should REGRESS — missing critical prerequisites
  if (deal.stage === 'Proposal') {
    const missingCritical = [];
    if (deal.personaGaps.some((g) => g.includes('Technical Evaluator'))) {
      missingCritical.push('Technical Evaluator not yet engaged');
    }
    if (deal.missingSteps.some((s) => s.includes('Demo') || s.includes('demo'))) {
      missingCritical.push('Demo not completed — required before Proposal');
    }
    if (deal.personaGaps.some((g) => g.includes('Project Manager'))) {
      missingCritical.push('Primary stakeholder (Project Manager) not mapped');
    }
    if (missingCritical.length >= 2) {
      suggestedStage = 'Qualification';
      direction = 'regress';
      reasons.push(...missingCritical);
      reasons.push('Deal may have been prematurely advanced to Proposal stage');
    }
  }

  if (deal.stage === 'Negotiation') {
    const missingCritical = [];
    if (deal.personaGaps.some((g) => g.includes('Economic Buyer'))) {
      missingCritical.push(
        'No Economic Buyer engagement — cannot negotiate without budget authority'
      );
    }
    if (deal.personaGaps.some((g) => g.includes('Champion'))) {
      missingCritical.push('No Champion / Executive Sponsor identified');
    }
    if (deal.missingSteps.some((s) => s.includes('ROI'))) {
      missingCritical.push('ROI business case not presented');
    }
    if (deal.missingSteps.some((s) => s.includes('Proposal'))) {
      missingCritical.push('Formal proposal not yet delivered');
    }
    if (missingCritical.length >= 1) {
      suggestedStage = 'Proposal';
      direction = 'regress';
      reasons.push(...missingCritical);
      reasons.push(
        'Negotiation requires budget authority and commercial terms agreed in principle'
      );
    }
  }

  if (suggestedStage === deal.stage) return null;

  return {
    deal,
    currentStage: deal.stage,
    suggestedStage,
    direction,
    confidence:
      direction === 'regress'
        ? 70 + Math.min(reasons.length * 8, 25)
        : 55 + Math.min(reasons.length * 10, 30),
    reasons,
    severity: direction === 'regress' ? 'critical' : reasons.length >= 3 ? 'warning' : 'info',
  };
}

/* ─── Main Component ─── */
export function DealStageValidator({ deals }: { deals?: Deal[] }) {
  const targetDeals = deals || pipelineDeals;
  const validations = useMemo(
    () =>
      targetDeals
        .map(validateDealStage)
        .filter((v): v is StageValidation => v !== null)
        .sort((a, b) => {
          // Critical first, then by ACV
          if (a.severity !== b.severity) {
            const order = { critical: 0, warning: 1, info: 2 };
            return order[a.severity] - order[b.severity];
          }
          return b.deal.acv - a.deal.acv;
        }),
    [targetDeals]
  );

  const regressions = validations.filter((v) => v.direction === 'regress');
  const advances = validations.filter((v) => v.direction === 'advance');
  const totalMisstagedACV = validations.reduce((s, v) => s + v.deal.acv, 0);

  if (validations.length === 0) {
    return (
      <div className="glass-card p-5 animate-fade-in">
        <div className="metric-label flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-grade-a" />
          Stage Validation
        </div>
        <div className="text-xs text-grade-a flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-grade-a/10 flex items-center justify-center">
            ✓
          </span>
          All deals are at appropriate stages based on stakeholder engagement and activity signals.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-grade-d" />
          <Term term="Stage Progression">Stage Misalignment Detector</Term>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-lg font-mono font-bold text-grade-d">{validations.length}</div>
            <div className="text-[9px] font-mono text-muted-foreground">misstaged</div>
          </div>
          <div>
            <div className="text-lg font-mono font-bold text-grade-f">{fmt(totalMisstagedACV)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">ACV affected</div>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3">
        {regressions.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-grade-f bg-grade-f/5 px-2.5 py-1.5 rounded-lg border border-grade-f/15">
            <ArrowDown className="w-3 h-3" />
            {regressions.length} should move back
          </div>
        )}
        {advances.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-grade-a bg-grade-a/5 px-2.5 py-1.5 rounded-lg border border-grade-a/15">
            <ArrowUp className="w-3 h-3" />
            {advances.length} ready to advance
          </div>
        )}
      </div>

      {/* Validation cards */}
      <div className="space-y-2">
        {validations.slice(0, 10).map((v) => (
          <div
            key={v.deal.id}
            className={`rounded-lg border p-3 space-y-2 ${
              v.severity === 'critical'
                ? 'border-grade-f/30 bg-grade-f/[0.02]'
                : v.severity === 'warning'
                  ? 'border-grade-d/30 bg-grade-d/[0.02]'
                  : 'border-border/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {v.direction === 'regress' ? (
                  <ArrowDown className="w-3.5 h-3.5 text-grade-f" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5 text-grade-a" />
                )}
                <span className="text-sm font-medium text-foreground">{v.deal.company}</span>
                <span className="text-[9px] font-mono text-muted-foreground">
                  {v.deal.rep} · {fmt(v.deal.acv)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-grade-d/10 text-grade-d">
                  {v.currentStage}
                </span>
                <span className="text-muted-foreground">→</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    v.direction === 'advance'
                      ? 'bg-grade-a/10 text-grade-a'
                      : 'bg-grade-f/10 text-grade-f'
                  }`}
                >
                  {v.suggestedStage}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    v.confidence >= 80
                      ? 'text-grade-a'
                      : v.confidence >= 65
                        ? 'text-grade-c'
                        : 'text-muted-foreground'
                  }`}
                >
                  {v.confidence}%
                </span>
              </div>
            </div>
            <div className="ml-5 space-y-0.5">
              {v.reasons.map((r, i) => (
                <div key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-muted-foreground/40 mt-0.5">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
