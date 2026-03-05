import { Deal, Grade } from '@/data/demo-data';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';
import { Zap, ArrowRight, Brain } from 'lucide-react';

/* ─── P2 types (mock) ─── */
interface CounterfactualItem {
  rank: number;
  action: string;
  dimension: string;
  dimensionGrade: 'a' | 'b' | 'c' | 'd' | 'f';
  impact: number;
  currentScore: number;
  projectedScore: number;
  currentGrade: Grade;
  projectedGrade: Grade;
  effort: 'Low' | 'Medium' | 'High';
}

export interface CounterfactualResult {
  items: CounterfactualItem[];
}

/* ─── Mock data generator ─── */
function scoreToGrade(score: number): Grade {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function mockCounterfactuals(deal: Deal): CounterfactualResult {
  const items: CounterfactualItem[] = [];
  let rank = 1;

  if (deal.personaGaps.includes('Economic Buyer')) {
    const projected = Math.min(98, deal.pqScore + 12);
    items.push({
      rank: rank++, action: 'Add Economic Buyer contact', dimension: 'Persona Coverage',
      dimensionGrade: 'd', impact: 12, currentScore: deal.pqScore, projectedScore: projected,
      currentGrade: deal.grade, projectedGrade: scoreToGrade(projected), effort: 'Medium',
    });
  }
  if (deal.personaGaps.includes('Champion')) {
    const projected = Math.min(98, deal.pqScore + 10);
    items.push({
      rank: rank++, action: 'Identify and engage Champion', dimension: 'Persona Coverage',
      dimensionGrade: 'd', impact: 10, currentScore: deal.pqScore, projectedScore: projected,
      currentGrade: deal.grade, projectedGrade: scoreToGrade(projected), effort: 'High',
    });
  }
  if (deal.missingSteps.includes('Technical Validation')) {
    const projected = Math.min(98, deal.pqScore + 8);
    items.push({
      rank: rank++, action: 'Complete Technical Validation', dimension: 'Process Adherence',
      dimensionGrade: 'c', impact: 8, currentScore: deal.pqScore, projectedScore: projected,
      currentGrade: deal.grade, projectedGrade: scoreToGrade(projected), effort: 'Medium',
    });
  }
  if (deal.missingSteps.includes('Business Case')) {
    const projected = Math.min(98, deal.pqScore + 7);
    items.push({
      rank: rank++, action: 'Build Business Case document', dimension: 'Process Adherence',
      dimensionGrade: 'c', impact: 7, currentScore: deal.pqScore, projectedScore: projected,
      currentGrade: deal.grade, projectedGrade: scoreToGrade(projected), effort: 'Medium',
    });
  }
  if (deal.priceRisk > 0.5) {
    const projected = Math.min(98, deal.pqScore + 5);
    items.push({
      rank: rank++, action: 'Address pricing objections with ROI analysis', dimension: 'Price Risk',
      dimensionGrade: 'f', impact: 5, currentScore: deal.pqScore, projectedScore: projected,
      currentGrade: deal.grade, projectedGrade: scoreToGrade(projected), effort: 'Low',
    });
  }
  if (deal.icpScore < 60) {
    const projected = Math.min(98, deal.pqScore + 6);
    items.push({
      rank: rank++, action: 'Re-qualify ICP fit with updated firmographic data', dimension: 'ICP Fit',
      dimensionGrade: 'c', impact: 6, currentScore: deal.pqScore, projectedScore: projected,
      currentGrade: deal.grade, projectedGrade: scoreToGrade(projected), effort: 'Low',
    });
  }
  if (deal.daysInStage > 20) {
    const projected = Math.min(98, deal.pqScore + 4);
    items.push({
      rank: rank++, action: 'Schedule exec sponsor meeting to break stall', dimension: 'Engagement Velocity',
      dimensionGrade: 'd', impact: 4, currentScore: deal.pqScore, projectedScore: projected,
      currentGrade: deal.grade, projectedGrade: scoreToGrade(projected), effort: 'Medium',
    });
  }
  // Always add a fallback if no items
  if (items.length === 0) {
    const projected = Math.min(98, deal.pqScore + 3);
    items.push({
      rank: 1, action: 'Update CRM fields with latest engagement data', dimension: 'Data Quality',
      dimensionGrade: 'b', impact: 3, currentScore: deal.pqScore, projectedScore: projected,
      currentGrade: deal.grade, projectedGrade: scoreToGrade(projected), effort: 'Low',
    });
  }

  return { items: items.sort((a, b) => b.impact - a.impact).map((it, i) => ({ ...it, rank: i + 1 })) };
}

/* ─── Effort badge ─── */
function EffortBadge({ effort }: { effort: 'Low' | 'Medium' | 'High' }) {
  const styles = {
    Low: 'bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]',
    Medium: 'bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]',
    High: 'bg-[hsl(var(--grade-f)/.1)] text-[hsl(var(--grade-f))]',
  };
  return <span className={cn('text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded', styles[effort])}>{effort}</span>;
}

/* ─── Main Component ─── */
export function CounterfactualPanel({ deal, counterfactuals: externalCFs }: { deal: Deal; counterfactuals?: CounterfactualResult }) {
  const { role, coachingMode } = useRole();
  const result = externalCFs ?? mockCounterfactuals(deal);
  const isRepView = role === 'rep';
  const visibleItems = isRepView ? result.items.slice(0, 3) : result.items;

  return (
    <div className="glass-card p-5 animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <Zap className="w-3 h-3 text-primary" />
        </div>
        <span className="metric-label">Improvement Opportunities</span>
      </div>

      {/* Agentic auto-execute banner */}
      {coachingMode === 'agentic' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--grade-a)/.06)] border border-[hsl(var(--grade-a)/.2)]">
          <Brain className="w-3.5 h-3.5 text-[hsl(var(--grade-a))]" />
          <span className="text-[10px] font-mono text-[hsl(var(--grade-a))]">Auto-executing top recommendation</span>
        </div>
      )}

      {/* Ranked improvements */}
      <div className="space-y-2">
        {visibleItems.map(item => (
          <div
            key={item.rank}
            className="p-3 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              {/* Rank */}
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold flex items-center justify-center">
                {item.rank}
              </span>

              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Action + dimension badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">{item.action}</span>
                  <EffortBadge effort={item.effort} />
                </div>

                {/* Dimension tag */}
                <span className={cn(
                  'inline-block text-[9px] font-mono px-1.5 py-0.5 rounded',
                  `bg-[hsl(var(--grade-${item.dimensionGrade})/.1)] text-[hsl(var(--grade-${item.dimensionGrade}))]`
                )}>
                  {item.dimension}
                </span>

                {/* Impact row */}
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="font-bold text-[hsl(var(--grade-a))]">+{item.impact} PQS</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    {item.currentScore}
                    <ArrowRight className="w-2.5 h-2.5" />
                    {item.projectedScore}
                  </span>
                  <span className="text-muted-foreground">
                    (Grade {item.currentGrade} → Grade {item.projectedGrade})
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rep view: hidden count */}
      {isRepView && result.items.length > 3 && (
        <div className="text-[10px] text-muted-foreground text-center font-mono">
          +{result.items.length - 3} more opportunities visible to managers
        </div>
      )}
    </div>
  );
}
