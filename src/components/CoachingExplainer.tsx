import { useState } from 'react';
import { Deal } from '@/data/demo-data';
import { cn } from '@/lib/utils';
import {
  ChevronDown, ChevronRight, UserPlus, FileText, Phone,
  Target, BarChart3, CheckCircle, Undo2, Clock
} from 'lucide-react';

/* ─── Types ─── */
export interface CoachingAction {
  id: string;
  name: string;
  icon: 'user-plus' | 'file-text' | 'phone' | 'target' | 'bar-chart';
  triggerRules: string[];
  confidence: number;
  historicalSuccess: number;
  successTimeframe: string;
  executedAt?: string;
}

/* ─── Icon map ─── */
const iconMap = {
  'user-plus': UserPlus,
  'file-text': FileText,
  'phone': Phone,
  'target': Target,
  'bar-chart': BarChart3,
};

/* ─── Mock data generator ─── */
function mockActions(deal: Deal): CoachingAction[] {
  const actions: CoachingAction[] = [];

  if (deal.personaGaps.some(g => g.includes('Economic Buyer'))) {
    actions.push({
      id: 'eb-recovery',
      name: 'EB Recovery Play',
      icon: 'user-plus',
      triggerRules: [
        'Economic Buyer missing',
        `ACV > €${Math.round(deal.acv / 1000)}K`,
        `stage = ${deal.stage}`,
      ],
      confidence: 82,
      historicalSuccess: 73,
      successTimeframe: '14 days',
      executedAt: '2:34 PM today',
    });
  }

  if (deal.daysInStage > 20) {
    actions.push({
      id: 'stall-breaker',
      name: 'Stall Breaker',
      icon: 'phone',
      triggerRules: [
        `daysInStage > 20 (current: ${deal.daysInStage}d)`,
        `stage = ${deal.stage}`,
        'no activity in last 7 days',
      ],
      confidence: 68,
      historicalSuccess: 61,
      successTimeframe: '10 days',
      executedAt: '11:15 AM today',
    });
  }

  if (deal.personaGaps.length >= 2) {
    actions.push({
      id: 'multi-thread',
      name: 'Multi-Thread Campaign',
      icon: 'target',
      triggerRules: [
        `personaGaps >= 2 (current: ${deal.personaGaps.length})`,
        `segment = ${deal.segment}`,
      ],
      confidence: 75,
      historicalSuccess: 67,
      successTimeframe: '21 days',
    });
  }

  if (deal.missingSteps.some(s => s.includes('ROI calculator'))) {
    actions.push({
      id: 'biz-case',
      name: 'ROI Business Case Assist',
      icon: 'file-text',
      triggerRules: [
        'ROI calculator walkthrough not completed',
        `stage = ${deal.stage}`,
        `ACV > €50K`,
      ],
      confidence: 71,
      historicalSuccess: 58,
      successTimeframe: '7 days',
    });
  }

  if (deal.priceRisk > 0.5) {
    actions.push({
      id: 'value-sell',
      name: 'Value Selling Reinforcement',
      icon: 'bar-chart',
      triggerRules: [
        `priceRisk > 0.5 (current: ${(deal.priceRisk * 100).toFixed(0)}%)`,
        'discount request detected',
      ],
      confidence: 64,
      historicalSuccess: 52,
      successTimeframe: '14 days',
    });
  }

  // Fallback
  if (actions.length === 0) {
    actions.push({
      id: 'general-followup',
      name: 'Proactive Follow-Up',
      icon: 'phone',
      triggerRules: ['Routine check-in scheduled', `stage = ${deal.stage}`],
      confidence: 55,
      historicalSuccess: 44,
      successTimeframe: '7 days',
    });
  }

  return actions;
}

/* ─── Confidence bar ─── */
function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 75 ? 'bg-[hsl(var(--grade-a))]' :
    value >= 55 ? 'bg-[hsl(var(--grade-c))]' :
    'bg-[hsl(var(--grade-f))]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

/* ─── Single Action Card ─── */
function ActionCard({ action, mode }: { action: CoachingAction; mode: 'hitl' | 'agentic' }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = iconMap[action.icon];
  const isHitl = mode === 'hitl';

  const borderClass = isHitl
    ? 'border-[hsl(var(--grade-c)/.3)]'
    : 'border-[hsl(var(--grade-a)/.3)]';

  return (
    <div className={cn('rounded-lg border bg-card/50 overflow-hidden transition-all', borderClass)}>
      {/* Header - always visible */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0',
          isHitl ? 'bg-[hsl(var(--grade-c)/.1)]' : 'bg-[hsl(var(--grade-a)/.1)]'
        )}>
          <Icon className={cn('w-3.5 h-3.5', isHitl ? 'text-[hsl(var(--grade-c))]' : 'text-[hsl(var(--grade-a))]')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{action.name}</div>
          <div className="text-[10px] font-mono text-muted-foreground">
            Confidence: {action.confidence}%
          </div>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 animate-fade-in border-t border-border/20 pt-3">
          {/* Trigger Rule */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Trigger Rule</div>
            <div className="text-xs text-foreground font-mono bg-secondary/30 rounded-md px-2.5 py-2 leading-relaxed">
              Triggered because: {action.triggerRules.join(' AND ')}
            </div>
          </div>

          {/* Confidence bar */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Model Confidence</div>
            <ConfidenceBar value={action.confidence} />
          </div>

          {/* Historical success */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Historical Success</div>
            <div className="text-xs text-foreground font-mono">
              {action.historicalSuccess}% of reps who followed this advanced within {action.successTimeframe}
            </div>
          </div>

          {/* Mode indicator */}
          <div className={cn(
            'rounded-md px-3 py-2 flex items-center justify-between',
            isHitl
              ? 'bg-[hsl(var(--grade-c)/.06)] border border-[hsl(var(--grade-c)/.2)]'
              : 'bg-[hsl(var(--grade-a)/.06)] border border-[hsl(var(--grade-a)/.2)]'
          )}>
            {isHitl ? (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-[hsl(var(--grade-c))]" />
                  <span className="text-[10px] font-mono text-[hsl(var(--grade-c))]">Review reasoning before approving</span>
                </div>
                <button className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-md hover:bg-primary/30 transition-colors font-mono font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Approve
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-[hsl(var(--grade-a))]" />
                  <span className="text-[10px] font-mono text-[hsl(var(--grade-a))]">
                    Executed automatically{action.executedAt ? ` at ${action.executedAt}` : ''}
                  </span>
                </div>
                <button className="text-[10px] bg-muted text-muted-foreground px-3 py-1 rounded-md hover:bg-muted/80 transition-colors font-mono font-semibold flex items-center gap-1">
                  <Undo2 className="w-3 h-3" /> Undo
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export function CoachingExplainer({
  actions: externalActions,
  deal,
  mode,
}: {
  actions?: CoachingAction[];
  deal: Deal;
  mode: 'hitl' | 'agentic';
}) {
  const actions = externalActions ?? mockActions(deal);

  return (
    <div className="glass-card p-5 animate-fade-in space-y-3">
      <div className="metric-label flex items-center gap-2">
        <div className={cn(
          'w-5 h-5 rounded-md flex items-center justify-center',
          mode === 'hitl' ? 'bg-[hsl(var(--grade-c)/.1)]' : 'bg-[hsl(var(--grade-a)/.1)]'
        )}>
          <Target className={cn('w-3 h-3', mode === 'hitl' ? 'text-[hsl(var(--grade-c))]' : 'text-[hsl(var(--grade-a))]')} />
        </div>
        Coaching Actions
        <span className={cn(
          'text-[9px] font-mono px-1.5 py-0.5 rounded ml-1',
          mode === 'hitl'
            ? 'bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]'
            : 'bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]'
        )}>
          {mode === 'hitl' ? 'HITL' : 'AGENTIC'}
        </span>
      </div>

      <div className="space-y-2">
        {actions.map(action => (
          <ActionCard key={action.id} action={action} mode={mode} />
        ))}
      </div>
    </div>
  );
}
